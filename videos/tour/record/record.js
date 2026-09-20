// Records the app's own guided tour as a video, and writes a WebVTT track
// whose cue times are exact because this script controls the pacing.
//
// Everything on screen is the real app at /?demo=1&tour=1. The database is
// stubbed from fixtures.js because egress is blocked here; no resident data is
// served and Lite does not ask for any.
//
//   node record.js            screenshots only, into shots/
//   node record.js video      screenshots + video + captions, into out/
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { rowsFor } = require('./fixtures');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Where the app repo (runp8-care) is checked out. Override with APP_REPO.
const ROOT = process.env.APP_REPO || '/home/user/runp8-care';
const HERE = __dirname;
const WANT_VIDEO = process.argv[2] === 'video';
const W = 1280, H = 720;

// How long each step holds. Reading speed of roughly 16 characters a second
// with a floor, so a long bubble is not yanked away mid-sentence.
const READ_CPS = 15;
const MIN_HOLD = 4200;
const MAX_HOLD = 11000;
const LEAD_IN = 2600;    // dashboard visible before the first bubble
const TAIL = 3600;       // after the last step

// The tour's final step tells the viewer they can replay it "from Walkthrough
// in the menu". That is false right now: openWalkthrough() -- the only thing
// that opens the modal holding "Take the tour" -- has no call sites, and both
// Walkthrough buttons open the written page instead. A marketing video must
// not repeat it, so the recording stops at step 6 and dismisses the tour.
// Raise this to 7 once the menu button actually opens the tour.
const LAST_STEP = 6;

const TYPES = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon' };

function serve(port) {
  return http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';
    if (url.endsWith('/')) url += 'index.html';
    const file = path.join(ROOT, url);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    let st; try { st = fs.statSync(file); } catch (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': st.size });
    fs.createReadStream(file).pipe(res);
  }).listen(port);
}

const vttTime = ms => {
  const t = Math.max(0, ms) / 1000;
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' +
    (s < 10 ? '0' : '') + s.toFixed(3);
};

// Captions wrap at roughly 46 characters so no line runs off a phone.
function wrap(text, width) {
  const out = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= width) line += ' ' + word;
    else { out.push(line); line = word; }
  }
  if (line) out.push(line);
  return out;
}

(async () => {
  const server = serve(8733);
  const outDir = path.join(HERE, WANT_VIDEO ? 'out' : 'shots');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    locale: 'en-US',
    ...(WANT_VIDEO ? { recordVideo: { dir: outDir, size: { width: W, height: H } } } : {}),
  });

  await ctx.route('**/nwlhsshvqmbhemhxcran.supabase.co/**', route => {
    const u = new URL(route.request().url());
    const method = route.request().method();
    if (method !== 'GET') {
      // Nothing in a recording should write. The sandbox is read-only anyway.
      return route.fulfill({ status: 403, contentType: 'application/json',
        body: JSON.stringify({ message: 'read-only sandbox' }) });
    }
    route.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'Content-Range': '0-0/0', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(rowsFor(u.pathname, u.search)) });
  });
  // The AI worker is not part of this recording.
  await ctx.route('**/title22-ai**', route => route.fulfill({ status: 200,
    contentType: 'application/json', body: JSON.stringify({ reply: '' }) }));

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 300)));

  const t0 = Date.now();
  await page.goto('http://127.0.0.1:8733/?demo=1&tour=1', { waitUntil: 'load' });

  // The tour fires on a 900ms timer after initFacility.
  await page.waitForSelector('#tour-bubble', { state: 'visible', timeout: 30000 });
  await page.waitForTimeout(LEAD_IN);

  const cues = [];
  const seen = [];
  for (let i = 0; ; i++) {
    const step = await page.evaluate(() => ({
      title: document.getElementById('tour-title').textContent,
      body: document.getElementById('tour-body').textContent,
      count: document.getElementById('tour-count').textContent,
      next: document.getElementById('tour-next').textContent,
      tab: [...document.querySelectorAll('[id^="tab-"]')]
        .filter(t => t.style.display !== 'none' && t.offsetParent !== null)
        .map(t => t.id)[0] || null,
    }));
    const start = Date.now() - t0;
    const hold = Math.min(MAX_HOLD, Math.max(MIN_HOLD,
      Math.round((step.title.length + step.body.length) / READ_CPS * 1000)));

    seen.push({ ...step, start, hold });
    console.log('  ' + step.count + '  ' + step.tab + '  ' + step.title + '  (' + hold + 'ms)');
    await page.screenshot({ path: path.join(outDir, 'step-' + String(i + 1).padStart(2, '0') + '.png') });

    cues.push({ start, end: start + hold, title: step.title, body: step.body });
    await page.waitForTimeout(hold);

    const last = step.next === 'Finish' || (i + 1) >= LAST_STEP;
    if (last) {
      // Dismiss rather than advance, then finish on the dashboard -- the
      // screen the whole product is about.
      await page.click('text=Let me explore');
      await page.waitForTimeout(700);
      await page.click('#nav-dashboard');
      break;
    }
    await page.click('#tour-next');
    await page.waitForTimeout(1500); // tab switch, scroll, re-place the bubble
  }

  await page.waitForTimeout(TAIL);
  const totalMs = Date.now() - t0;

  // ---- captions ----
  // The text is the app's own tour copy, verbatim. Nothing is paraphrased, so
  // there is no claim here that the product does not already make about itself.
  const head = [
    'WEBVTT',
    'Kind: captions',
    'Language: en',
    '',
    'NOTE',
    'Generated with the recording, from the app\'s own TOUR_STEPS copy in',
    'index.html -- verbatim, not paraphrased. Cue times are exact: the script',
    'that drove the tour also wrote this file, so they cannot drift from the',
    'picture unless the video is re-cut.',
    '',
    'NOTE',
    'Every screen is the real app at /?demo=1&tour=1 with invented staff and a',
    'stubbed database. No resident data appears, because Lite does not have any',
    'to show.',
    '',
    '',
  ];
  const body = cues.map((c, i) => [
    String(i + 1),
    vttTime(c.start) + ' --> ' + vttTime(c.end),
    ...wrap(c.title + ' — ' + c.body, 46),
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(outDir, 'title22-guided-tour.en.vtt'), head.join('\n') + body.join('\n'));
  fs.writeFileSync(path.join(outDir, 'steps.json'), JSON.stringify({ totalMs, steps: seen }, null, 2));

  await ctx.close();   // flushes the video file
  await browser.close();
  server.close();

  if (WANT_VIDEO) {
    const vid = fs.readdirSync(outDir).find(f => f.endsWith('.webm'));
    if (vid) {
      fs.renameSync(path.join(outDir, vid), path.join(outDir, 'title22-guided-tour.webm'));
      const kb = Math.round(fs.statSync(path.join(outDir, 'title22-guided-tour.webm')).size / 1024);
      console.log('\nvideo: title22-guided-tour.webm  ' + kb + ' KB  ~' + Math.round(totalMs / 1000) + 's');
    } else console.log('\nNO VIDEO FILE PRODUCED');
  }
  console.log('captions: ' + cues.length + ' cues, ends at ' + vttTime(cues[cues.length - 1].end));
  if (errs.length) { console.log('\npage errors:'); errs.forEach(e => console.log('  ' + e)); }
  console.log('out: ' + outDir);
})();
