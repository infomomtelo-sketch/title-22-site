// Build the partner explainer video and its caption files from slides.js.
//
//   node make.js
//
// Renders each slide in Chromium at 1280x720, holds it for its own duration,
// and encodes H.264 with ffmpeg. The .vtt files are written in the same pass
// from the same durations, so the captions cannot drift from the picture.
//
// Needs: playwright-core (a Chromium at PW_CHROMIUM or /opt/pw-browsers/chromium)
//        and an ffmpeg with libx264 (FFMPEG_BIN, or ffmpeg-static, or PATH).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright-core');

const SLIDES = require('./slides.js');
const HERE = __dirname;
const OUT = path.resolve(HERE, '../../');            // videos/
const SHOTS = process.env.SHOTS_DIR || path.join(HERE, 'shots');
const W = 1280, H = 720, FPS = 30;

const CHROME = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
function ffmpeg() {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  try { return require('ffmpeg-static'); } catch (e) { return 'ffmpeg'; }
}

// ---------------------------------------------------------------- the slides

// The brand fonts, embedded as data URIs. Google Fonts is a network call and
// the frames are rendered offline, so without this the headings silently fall
// back to a system serif — and because the video is baked, that ships forever.
// Resolved from @fontsource/* if installed; if they are missing the build
// still works and says so, rather than quietly producing off-brand frames.
function fontFace(family, pkg, file, weight) {
  let buf;
  try {
    buf = fs.readFileSync(require.resolve(`${pkg}/files/${file}`));
  } catch (e) {
    try { buf = fs.readFileSync(path.join(HERE, 'fonts', file)); }
    catch (e2) { return null; }
  }
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;` +
         `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`;
}

const FONTS = [
  fontFace('Zilla Slab', '@fontsource/zilla-slab', 'zilla-slab-latin-700-normal.woff2', 700),
  fontFace('Zilla Slab', '@fontsource/zilla-slab', 'zilla-slab-latin-600-normal.woff2', 600),
  fontFace('Public Sans', '@fontsource/public-sans', 'public-sans-latin-400-normal.woff2', 400),
  fontFace('Public Sans', '@fontsource/public-sans', 'public-sans-latin-600-normal.woff2', 600),
  fontFace('Public Sans', '@fontsource/public-sans', 'public-sans-latin-700-normal.woff2', 700),
];
if (FONTS.some(f => f === null)) {
  console.warn('WARNING: brand fonts not found — frames will use a system fallback.\n' +
               '  npm i @fontsource/zilla-slab @fontsource/public-sans');
}

const CSS = FONTS.filter(Boolean).join('\n') + `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${W}px;height:${H}px;overflow:hidden}
  body{
    font-family:"Public Sans","DejaVu Sans",system-ui,sans-serif;
    background:#faf7f2;color:#1a1a18;
    display:flex;align-items:center;
    padding:64px 72px;
  }
  .side{position:absolute;left:0;top:0;bottom:0;width:10px;background:#2f5d50}
  .kicker{font-size:19px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
    color:#2f5d50;margin-bottom:20px}
  h1{font-family:"Zilla Slab","DejaVu Serif",Georgia,serif;font-weight:700;
    font-size:60px;line-height:1.08;letter-spacing:-.01em}
  h2{font-family:"Zilla Slab","DejaVu Serif",Georgia,serif;font-weight:700;
    font-size:46px;line-height:1.12;margin-bottom:34px}
  .sub{font-size:26px;line-height:1.45;color:#5b5b55;margin-top:26px;max-width:22ch}
  .full{width:100%}

  .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
  .card{background:#fff;border:1px solid #e3ded4;border-radius:16px;padding:28px 26px}
  .card .t{font-size:25px;font-weight:700;margin-bottom:12px;color:#2f5d50}
  .card .d{font-size:19px;line-height:1.5;color:#43433d}

  .split{display:grid;grid-template-columns:1fr 300px;gap:52px;align-items:center;width:100%}
  .split .body{font-size:27px;line-height:1.5;color:#43433d}
  .split .note{font-size:20px;line-height:1.5;color:#6d6d66;margin-top:22px;
    border-left:4px solid #e0a227;padding-left:16px}
  .phone{width:300px;border-radius:18px;border:1px solid #d9d3c8;
    box-shadow:0 16px 40px rgba(0,0,0,.14);display:block}

  .facts{border:1px solid #e3ded4;border-radius:16px;background:#fff;overflow:hidden}
  .facts .r{display:grid;grid-template-columns:230px 1fr;gap:26px;padding:20px 28px;
    font-size:22px;line-height:1.45}
  .facts .r + .r{border-top:1px solid #ece7dd}
  .facts .k{font-weight:700;color:#2f5d50}
  .facts .v{color:#43433d}

  .warn{display:grid;gap:22px}
  .warn .w{background:#fff;border:1px solid #e3ded4;border-left:6px solid #e0a227;
    border-radius:14px;padding:26px 30px}
  .warn .t{font-size:26px;font-weight:700;margin-bottom:10px}
  .warn .d{font-size:20px;line-height:1.5;color:#5b5b55}

  .quote{font-family:"Zilla Slab","DejaVu Serif",Georgia,serif;font-size:44px;
    line-height:1.3;color:#2f5d50;font-weight:600;max-width:24ch}
  .qnote{font-size:22px;line-height:1.5;color:#5b5b55;margin-top:30px;max-width:34ch}
`;

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

function body(s){
  if (s.kind === 'title')
    return `<div class="full"><div class="kicker">${esc(s.kicker)}</div>
      <h1>${esc(s.h)}</h1><p class="sub">${esc(s.sub)}</p></div>`;

  if (s.kind === 'three')
    return `<div class="full"><h2>${esc(s.h)}</h2><div class="cols">` +
      s.items.map(([t,d]) => `<div class="card"><div class="t">${esc(t)}</div><div class="d">${esc(d)}</div></div>`).join('') +
      `</div></div>`;

  if (s.kind === 'shot')
    return `<div class="split"><div><h2>${esc(s.h)}</h2>
      <div class="body">${s.body}</div><div class="note">${esc(s.note)}</div></div>
      <img class="phone" src="shot://${s.shot}" alt=""></div>`;

  if (s.kind === 'facts')
    return `<div class="full"><h2>${esc(s.h)}</h2><div class="facts">` +
      s.rows.map(([k,v]) => `<div class="r"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('') +
      `</div></div>`;

  if (s.kind === 'warn')
    return `<div class="full"><h2>${esc(s.h)}</h2><div class="warn">` +
      s.items.map(([t,d]) => `<div class="w"><div class="t">${esc(t)}</div><div class="d">${esc(d)}</div></div>`).join('') +
      `</div></div>`;

  if (s.kind === 'quote')
    return `<div class="full"><h2>${esc(s.h)}</h2>
      <p class="quote">${esc(s.quote)}</p><p class="qnote">${esc(s.note)}</p></div>`;

  throw new Error('unknown slide kind: ' + s.kind);
}

function page(s){
  return `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
    <div class="side"></div>${body(s)}`;
}

// ---------------------------------------------------------------- captions

function stamp(t){
  const h = Math.floor(t/3600), m = Math.floor(t%3600/60), s = t%60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' +
         s.toFixed(3).padStart(6,'0');
}

function vtt(lang, note){
  const key = lang === 'en' ? 'cap' : lang === 'es' ? 'capEs' : 'capFil';
  let t = 0;
  const cues = SLIDES.map(s => {
    const a = t, b = t + s.secs; t = b;
    const text = s[key];
    if (!text) throw new Error(`slide ${s.id} has no ${key}`);
    return `${stamp(a)} --> ${stamp(b)}\n${text}`;
  });
  return `WEBVTT\n\nNOTE\n${note}\n\n` + cues.join('\n\n') + '\n';
}

const NOTES = {
  en: `Captions for the Title22 partner explainer.\nGenerated by videos/partner/record/make.js from slides.js, in the same pass\nthat encodes the video, so the timings cannot drift from the picture. Edit\nslides.js and re-run make.js rather than editing this file.\n\nThe video has no narration and no audio track at all. The captions carry it,\nas they do on the guided tour. The page it sits on says so above the player,\nwhich is why no cue is spent repeating it.`,
  es: `Subtítulos en español del explicativo para socios de Title22.\nTraducción automática, NO revisada por un hablante nativo.\nGenerado por videos/partner/record/make.js a partir de slides.js.`,
  fil: `Mga subtitle sa Filipino ng Title22 partner explainer.\nGawa ng makina, HINDI pa nasusuri ng katutubong nagsasalita.\nGinawa ng videos/partner/record/make.js mula sa slides.js.`,
};

// ---------------------------------------------------------------- build

(async () => {
  const total = SLIDES.reduce((n, s) => n + s.secs, 0);
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'partner-vid-'));
  console.log(`${SLIDES.length} slides, ${total.toFixed(1)}s, frames in ${tmp}`);

  const b = await chromium.launch({ executablePath: CHROME });
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  // Serve the phone screenshots to the page without a web server.
  await pg.route('shot://**', route => {
    const f = path.join(SHOTS, path.basename(route.request().url()));
    route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(f) });
  });

  const list = [];
  for (let i = 0; i < SLIDES.length; i++) {
    const s = SLIDES[i];
    await pg.setContent(page(s), { waitUntil: 'load' });
    await pg.waitForTimeout(120);
    const png = path.join(tmp, `s${String(i).padStart(2,'0')}.png`);
    await pg.screenshot({ path: png });
    list.push(`file '${png}'`, `duration ${s.secs}`);
    console.log(`  ${s.id.padEnd(8)} ${s.secs}s`);
  }
  // concat demuxer ignores the last duration unless the file is repeated
  list.push(`file '${path.join(tmp, `s${String(SLIDES.length-1).padStart(2,'0')}.png`)}'`);
  const listFile = path.join(tmp, 'list.txt');
  fs.writeFileSync(listFile, list.join('\n') + '\n');
  await b.close();

  const mp4 = path.join(OUT, 'title22-partner-explainer.mp4');
  execFileSync(ffmpeg(), [
    '-hide_banner', '-v', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-vf', `fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1',
    '-preset', 'slow', '-crf', '23', '-movflags', '+faststart',
    mp4,
  ], { stdio: 'inherit' });

  fs.copyFileSync(path.join(tmp, 's00.png'),
                  path.join(OUT, 'title22-partner-explainer-poster.png'));

  for (const lang of ['en', 'es', 'fil']) {
    fs.writeFileSync(path.join(OUT, `title22-partner-explainer.${lang}.vtt`),
                     vtt(lang, NOTES[lang]));
  }

  console.log(`\n${mp4}  ${(fs.statSync(mp4).size/1048576).toFixed(2)} MB`);
  console.log(`captions: en, es, fil — ${SLIDES.length} cues each, ${total.toFixed(1)}s`);
})();
