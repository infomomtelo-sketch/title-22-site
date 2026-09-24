// Records the 30-Day Proof video for /pilot/: the portfolio briefing, in the
// real app's sandbox, with captions and title cards burned into the picture.
//
// Everything between the title cards is the real app at /?demo=1&tour=0 —
// its own Tello tab, its own Portfolio briefing card, its own sandbox summary
// (computed from the table and labelled so, which is what the sandbox does;
// no AI reply is invented). The database is the tour's fixture set
// (../../tour/record/fixtures.js): one invented home, five invented staff, no
// resident data, and Lite never asks for any.
//
// Captions are part of the picture rather than a track, because the page
// autoplays muted and a track is off by default on most phones. Their text is
// also written to captions.txt so the page can carry a transcript.
//
//   node record.js          preview PNGs only, into shots/
//   node record.js video    the H.264 MP4, into out/
//
// Needs: playwright, h264-mp4-encoder and pngjs (NODE_PATH or MODULES=<dir>).
const path = require('path');
const fs = require('fs');
const http = require('http');
const MOD = process.env.MODULES ? p => require(path.join(process.env.MODULES, p)) : require;
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { rowsFor } = require('../../tour/record/fixtures');

const ROOT = process.env.APP_REPO || '/home/user/runp8-care';
const HERE = __dirname;
const WANT_VIDEO = process.argv[2] === 'video';
// With FFMPEG set (a full build with libx264, e.g. the ffmpeg-static npm
// package), the take is Chromium's own screen recording, re-encoded to a
// smooth 30fps H.264 — instead of ~12 screenshots a second laid onto 10fps,
// which reads as a slideshow. Without it, the screenshot path below is kept.
const FFMPEG = WANT_VIDEO ? process.env.FFMPEG : null;
const { execFileSync } = require('child_process');
// The full 1280 layout, because the portfolio table needs every column: at
// 960 its last three columns fall off the right edge, and at a 360 phone
// layout the table scrolls sideways and loses every number. Captions are
// large instead, and the page carries the transcript.
const VW = 1280, VH = 720, DSF = 1;
const W = 1280, H = 720, FPS = 10;
const NAME = 'title22-30-day-proof';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
function serve(port) {
  return http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';
    const file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    let st; try { st = fs.statSync(file); } catch (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': st.size });
    fs.createReadStream(file).pipe(res);
  }).listen(port);
}

// The overlay: a caption bar, a corner label, and a full-screen card for the
// opening and closing titles. Styled from title-22.com's palette.
const OVERLAY = `
(() => {
  const css = document.createElement('style');
  css.textContent = \`
    #v-cap{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:1120px;z-index:99999;
      background:rgba(20,60,49,.92);color:#fff;font:600 min(30px,4.6vw)/1.3 "Public Sans",-apple-system,"Segoe UI",sans-serif;
      padding:min(14px,2.4vw) min(26px,4vw);border-radius:12px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:opacity .3s}
    #v-cap:empty{opacity:0}
    #v-tag{position:fixed;top:14px;right:16px;max-width:70vw;z-index:99999;background:rgba(251,247,240,.95);color:#143c31;
      font:500 min(13px,2.8vw) "IBM Plex Mono",ui-monospace,monospace;padding:5px 12px;border-radius:20px;border:1px solid #d8e2dc}
    #v-card{position:fixed;inset:0;z-index:100000;background:#fbf7f0;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:18px;text-align:center;padding:40px;transition:opacity .45s}
    #v-card.off{opacity:0;pointer-events:none}
    #v-card h1{font:700 min(54px,9.5vw)/1.15 "Zilla Slab",Georgia,serif;color:#143c31;margin:0;max-width:980px}
    #v-card p{font:400 min(26px,5vw)/1.4 "Public Sans",-apple-system,sans-serif;color:#5b6a63;margin:0;max-width:900px}
    #v-card .brand{font:700 26px "Zilla Slab",Georgia,serif;color:#143c31}
    #v-card .brand span{color:#e8a33d}
    #v-card .url{font:500 min(24px,4.6vw) "IBM Plex Mono",ui-monospace,monospace;color:#1e5748;margin-top:6px}
    .v-hi td{background:#fdf3e0 !important;box-shadow:inset 0 2px 0 #e8a33d,inset 0 -2px 0 #e8a33d}
  \`;
  document.head.appendChild(css);
  const cap = document.createElement('div'); cap.id = 'v-cap'; document.body.appendChild(cap);
  const tag = document.createElement('div'); tag.id = 'v-tag';
  tag.textContent = 'Sandbox · invented staff · no resident data'; document.body.appendChild(tag);
  const card = document.createElement('div'); card.id = 'v-card'; card.className = 'off'; document.body.appendChild(card);
})();`;

(async () => {
  const server = serve(8734);
  const outDir = path.join(HERE, WANT_VIDEO ? 'out' : 'shots');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, locale: 'en-US',
    ...(FFMPEG ? { recordVideo: { dir: outDir, size: { width: W, height: H } } } : {}) });
  const tPage = Date.now();
  await ctx.route('**/nwlhsshvqmbhemhxcran.supabase.co/**', route => {
    const u = new URL(route.request().url());
    if (route.request().method() !== 'GET') return route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"read-only sandbox"}' });
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'Content-Range': '0-0/0', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(rowsFor(u.pathname, u.search)) });
  });
  // Nothing outside localhost and the stubbed database, fonts aside.
  await ctx.route(/^https:\/\/(?!nwlhsshvqmbhemhxcran\.supabase\.co|fonts\.(googleapis|gstatic)\.com)/, r => r.abort());

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await page.goto('http://127.0.0.1:8734/?demo=1&tour=0', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof currentFacility !== 'undefined' && currentFacility && document.getElementById('page-app').offsetParent !== null, null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.evaluate(OVERLAY);

  const setCap = t => page.evaluate(t => { document.getElementById('v-cap').textContent = t || ''; }, t);
  const card = (html) => page.evaluate(h => {
    const c = document.getElementById('v-card');
    if (h) { c.innerHTML = h; c.classList.remove('off'); } else c.classList.add('off');
  }, html);

  // Frames: screenshots taken back to back, each stamped with its time, then
  // laid onto a fixed 10fps grid at encode time.
  const frames = [];
  const captions = [];
  const t0 = Date.now();
  let shotN = 0;
  async function hold(ms, label) {
    const until = Date.now() + ms;
    let first = true;
    if (FFMPEG) {
      if (label === 'illustration') await page.waitForTimeout(800).then(async () => frames.push({ t: Date.now() - t0, buf: await page.screenshot({ type: 'png' }) }));
      const left = until - Date.now(); if (left > 0) await page.waitForTimeout(left);
      return;
    }
    while (Date.now() < until) {
      const buf = await page.screenshot({ type: 'png' });
      frames.push({ t: Date.now() - t0, buf });
      if (first && label && !WANT_VIDEO) fs.writeFileSync(path.join(outDir, String(++shotN).padStart(2, '0') + '-' + label + '.png'), buf);
      first = false;
    }
  }
  async function say(text, ms, label) {
    captions.push({ start: Date.now() - t0, text });
    await setCap(text);
    await hold(ms, label);
  }

  // ── 1. Opening card ─────────────────────────────────────────────────────
  await card('<h1>Which of your homes do you look at first?</h1><p>For operators who run more than one.</p>');
  await hold(3600, 'open');
  captions.push({ start: 0, text: '(title) Which of your homes do you look at first?' });

  // ── 2. The dashboard ───────────────────────────────────────────────────
  await card(null);
  await page.evaluate(() => switchTab('dashboard'));
  await say('Title22 runs beside what you already use. It holds no resident health information.', 5200, 'dashboard');

  // ── 3. Tello tab → the Portfolio briefing card ─────────────────────────
  await page.evaluate(() => switchTab('ai'));
  await page.waitForTimeout(300);
  await page.evaluate(() => { const c = document.getElementById('ai-portfolio'); if (c) window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 96); });
  await say('In the Tello tab, the portfolio briefing puts every home on one screen.', 4600, 'card');

  // ── 4. Press it ────────────────────────────────────────────────────────
  const btn = await page.$('#ai-portfolio button');
  if (!btn) throw new Error('no portfolio button — is the card shown in the sandbox?');
  await btn.click();
  await page.waitForFunction(() => /Illustration/.test(document.getElementById('ai-portfolio-out')?.innerText || ''), null, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const c = document.getElementById('ai-portfolio'); if (c) window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 96); });
  await say('One row per home, lowest first: checklist, overdue items, expired certifications, open clearances.', 6200, 'table');
  await say('Every number is counted by the app — not guessed by the AI.', 4200);

  // ── 5. The illustration row, said out loud ─────────────────────────────
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#ai-portfolio-out tr')];
    const r = rows.find(x => /Illustration/.test(x.innerText));
    if (r) r.classList.add('v-hi');
  });
  await say('In the sandbox, the second row is an illustration: the same home with every open item closed.', 6000, 'illustration');
  await page.evaluate(() => document.querySelectorAll('.v-hi').forEach(e => e.classList.remove('v-hi')));

  // ── 6. The summary ─────────────────────────────────────────────────────
  await say('Then a short summary, for someone who has a minute.', 4600, 'summary');

  // ── 7. How the Proof runs ──────────────────────────────────────────────
  await setCap('');
  await card('<h1>Two of your homes. Thirty days.</h1><p>Run it beside what you use today. Press the briefing on day 1 and again on day 30 — and compare.</p>');
  captions.push({ start: Date.now() - t0, text: '(title) Two of your homes. Thirty days. Press the briefing on day 1 and on day 30, and compare.' });
  await hold(5200, 'proof');

  // ── 8. Close ───────────────────────────────────────────────────────────
  await card('<div class="brand">title<span>-22</span>.com</div><h1>The 30-Day Proof</h1><p>No card. Nothing to cancel. No resident health information.</p><div class="url">hello@title-22.com</div>');
  captions.push({ start: Date.now() - t0, text: '(title) The 30-Day Proof. No card. Nothing to cancel. No resident health information. hello@title-22.com' });
  await hold(4200, 'close');

  const totalMs = Date.now() - t0;
  await ctx.close(); await browser.close(); server.close();

  fs.writeFileSync(path.join(outDir, 'captions.txt'), captions.map(c => (c.start / 1000).toFixed(1).padStart(5) + 's  ' + c.text).join('\n') + '\n');
  console.log(frames.length + ' screenshots over ' + (totalMs / 1000).toFixed(1) + 's (' + (frames.length / (totalMs / 1000)).toFixed(1) + '/s)');
  if (errs.length) { console.log('page errors:'); errs.forEach(e => console.log('  ' + e)); }
  if (!WANT_VIDEO) { console.log('previews: ' + outDir); return; }

  if (FFMPEG) {
    const webm = fs.readdirSync(outDir).find(f => f.endsWith('.webm'));
    const out = path.join(outDir, NAME + '.mp4');
    // Trim the page load off the front: the recording started when the page
    // was created, the take at t0.
    const skip = ((t0 - tPage) / 1000).toFixed(2);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', skip, '-i', path.join(outDir, webm), '-t', (totalMs / 1000).toFixed(2),
      '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'main', '-level', '4.0', '-crf', '21', '-preset', 'slow',
      '-movflags', '+faststart', '-an', out]);
    fs.unlinkSync(path.join(outDir, webm));
    if (frames[0]) fs.writeFileSync(path.join(outDir, NAME + '-poster.png'), frames[0].buf);
    console.log('wrote ' + out + '  ' + Math.round(fs.statSync(out).size / 1024) + ' KB  ' + (totalMs / 1000).toFixed(1) + 's @30fps');
    return;
  }

  // ── encode: nearest earlier screenshot for every 1/FPS tick ─────────────
  const { PNG } = MOD('pngjs');
  const HME = MOD('h264-mp4-encoder');
  const enc = await HME.createH264MP4Encoder();
  enc.width = W; enc.height = H; enc.frameRate = FPS;
  enc.quantizationParameter = 24; enc.speed = 5; enc.groupOfPictures = FPS * 2;
  enc.initialize();
  const ticks = Math.round(totalMs / 1000 * FPS);
  let fi = 0, lastBuf = null, lastRgba = null;
  for (let k = 0; k < ticks; k++) {
    const t = k * 1000 / FPS;
    while (fi + 1 < frames.length && frames[fi + 1].t <= t) fi++;
    if (frames[fi].buf !== lastBuf) { lastBuf = frames[fi].buf; lastRgba = PNG.sync.read(lastBuf).data; }
    enc.addFrameRgba(lastRgba);
  }
  enc.finalize();
  const out = path.join(outDir, NAME + '.mp4');
  fs.writeFileSync(out, Buffer.from(enc.FS.readFile(enc.outputFilename)));
  enc.delete();
  // Poster: the table with the illustration row marked.
  const poster = frames.find(f => f.t >= (captions.find(c => /illustration:/.test(c.text)) || {}).start + 800) || frames[Math.floor(frames.length / 2)];
  fs.writeFileSync(path.join(outDir, NAME + '-poster.png'), poster.buf);
  console.log('wrote ' + out + '  ' + Math.round(fs.statSync(out).size / 1024) + ' KB  ' + ticks + ' frames  ' + (ticks / FPS).toFixed(1) + 's');
})();
