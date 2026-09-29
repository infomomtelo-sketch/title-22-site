// Records the how-to clip "Add a staff member's documents" (docs.mp4): the
// real app, signed in to an invented home on an in-memory database
// (fakedb.js + seed.js), filmed at phone size, 1080x1920.
//
// Nothing here is a real person or a real record: Marigold House, Maria Lopez
// and her CPR card are invented, and the card says SAMPLE on its face. The
// scan answer is canned from the card this script draws, so the dates on
// screen are the dates on the card. No resident data exists in the fake
// database, and Lite never asks for any.
//
//   node record.js <voice dir> <out dir>
//     voice dir: the output of voice.py (one WAV per step + voice.json)
//     writes <out>/frames/*.jpg, <out>/frames.txt (ffmpeg concat list),
//            <out>/timeline.json (when each step started), <out>/docs.en.vtt
// Then build.sh turns those into docs.mp4 with the voice mixed in.
//
// Needs Playwright (PLAYWRIGHT=<path>, CHROME=<chromium>) and the app repo at
// APP_REPO (default /home/user/runp8-care), served here on port 8734.
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { buildFakeClient } = require('./fakedb');
const { seed } = require('./seed');
const SCRIPT = require('./script');

const ROOT = process.env.APP_REPO || '/home/user/runp8-care';
const [VOICE_DIR, OUT] = process.argv.slice(2);
if (!VOICE_DIR || !OUT) { console.error('usage: node record.js <voice dir> <out dir>'); process.exit(1); }
const VOICE = JSON.parse(fs.readFileSync(path.join(VOICE_DIR, 'voice.json'), 'utf8')).lengths;
// The app fills the top 1080x1620; build.sh puts the caption in its own band
// underneath, so a caption never covers a button the clip is about to tap.
const VW = 360, VH = 540, DSF = 3;           // 1080x1620
const PAD = 700;                              // quiet after each line, ms

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
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

// ── The invented CPR card the "camera" photographs ───────────────────────────
const CARD = { name: 'Maria Lopez', issued: '09/15/2026', expires: '09/15/2028',
  issuedIso: '2026-09-15', expiresIso: '2028-09-15' };
const CARD_HTML = `<!doctype html><html><body style="margin:0;background:#fff;font-family:Georgia,serif">
<div id="c" style="width:1200px;height:760px;box-sizing:border-box;border:14px solid #b3261e;padding:44px 56px;position:relative;background:#fffdf8">
 <div style="font:700 30px Arial,sans-serif;color:#b3261e;letter-spacing:.06em">CPR &amp; AED · ADULT, CHILD &amp; INFANT</div>
 <div style="font:400 26px Arial,sans-serif;color:#555;margin-top:6px">Course Completion Card</div>
 <div style="font:400 26px Arial,sans-serif;color:#444;margin-top:54px">This card certifies that</div>
 <div id="n" style="display:inline-block;font:700 64px Georgia,serif;color:#111;margin-top:8px">${CARD.name}</div>
 <div style="font:400 26px Arial,sans-serif;color:#444;margin-top:10px">completed the course above.</div>
 <div style="display:flex;gap:90px;margin-top:56px;font:400 26px Arial,sans-serif;color:#444">
  <div>Issued<br><b id="i" style="display:inline-block;font:700 44px Arial,sans-serif;color:#111">${CARD.issued}</b></div>
  <div>Expires<br><b id="e" style="display:inline-block;font:700 44px Arial,sans-serif;color:#111">${CARD.expires}</b></div>
 </div>
 <div style="position:absolute;left:56px;bottom:40px;font:400 22px Arial,sans-serif;color:#666">Instructor: J. Rivera · Valley Safety Training</div>
 <div style="position:absolute;right:40px;top:40px;font:700 26px Arial,sans-serif;color:#b3261e;border:3px solid #b3261e;padding:6px 14px;transform:rotate(6deg)">SAMPLE</div>
</div></body></html>`;

async function drawCard(browser) {
  const p = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  await p.setContent(CARD_HTML);
  const boxes = await p.evaluate(() => {
    const b = id => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left / 1200, r.top / 760, r.right / 1200, r.bottom / 760]; };
    return { n: b('n'), i: b('i'), e: b('e') };
  });
  const jpg = await p.locator('#c').screenshot({ type: 'jpeg', quality: 90 });
  await p.close();
  return { jpg, boxes };
}

// A one-page PDF, so an Upload has a real file to hold. Never shown.
const PDF = Buffer.from('%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

// ── Overlay: captions, a tap marker, the camera and the title cards ──────────
const OVERLAY = `(() => {
  const css = document.createElement('style');
  css.textContent = \`
    #tello-dock-btn,#tello-dock{display:none!important}
    #v-cap{display:none!important;position:fixed;left:12px;right:12px;bottom:14px;z-index:2147483000;background:rgba(18,58,48,.94);color:#fff;
      font:600 17px/1.35 "Public Sans",-apple-system,"Segoe UI",sans-serif;padding:10px 14px;border-radius:12px;text-align:center;
      box-shadow:0 8px 24px rgba(0,0,0,.22);transition:opacity .25s;opacity:0}
    #v-cap.on{opacity:1}
    #v-tap{pointer-events:none;position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;z-index:2147483001;pointer-events:none;
      background:rgba(232,162,61,.35);border:3px solid #e8a23d;opacity:0;transform:scale(.6);transition:opacity .15s,transform .25s}
    #v-tap.on{opacity:1;transform:scale(1)} #v-tap.press{transform:scale(.75)}
    #v-cam{position:fixed;inset:0;z-index:2147482999;background:#0d0d0d;display:none;align-items:center;justify-content:center;flex-direction:column}
    #v-cam.on{display:flex} #v-cam img{width:86%;transform:rotate(-2deg);box-shadow:0 12px 40px rgba(0,0,0,.5);border-radius:6px}
    #v-cam .frame{position:absolute;inset:18% 5%;border:3px solid rgba(255,255,255,.7);border-radius:14px}
    #v-cam .shut{position:absolute;bottom:90px;width:64px;height:64px;border-radius:50%;border:5px solid #fff;background:rgba(255,255,255,.25)}
    #v-spot{position:fixed;z-index:2147482998;pointer-events:none;border:4px solid #e8a23d;border-radius:14px;
      box-shadow:0 0 0 3000px rgba(10,30,24,.55),0 0 24px rgba(232,162,61,.9);opacity:0;transition:opacity .3s,left .35s,top .35s,width .35s,height .35s}
    #v-spot.on{opacity:1}
    #v-spot b{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;background:#e8a23d;color:#123a30;
      font:800 17px/1 "Public Sans",-apple-system,sans-serif;padding:9px 16px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
    #v-spot.above b{bottom:calc(100% + 12px)} #v-spot.below b{top:calc(100% + 12px)}
    #v-flash{position:fixed;inset:0;background:#fff;z-index:2147483002;opacity:0;pointer-events:none;transition:opacity .35s}
    #v-card{position:fixed;inset:0;z-index:2147483003;background:#123a30;color:#f9f5ed;display:flex;flex-direction:column;
      align-items:center;justify-content:center;text-align:center;padding:32px;transition:opacity .5s;font-family:"Public Sans",-apple-system,sans-serif}
    #v-card.off{opacity:0;pointer-events:none}
    #v-card img{width:88px;height:88px;border-radius:50%;margin-bottom:22px}
    #v-card h1{font:700 32px/1.2 Georgia,serif;margin:0 0 14px}
    #v-card p{font-size:17px;line-height:1.5;margin:0;color:rgba(249,245,237,.85)}
    #v-card b{color:#e8a23d}
  \`;
  document.head.appendChild(css);
  const add = (id, html) => { const d = document.createElement('div'); d.id = id; if (html) d.innerHTML = html; document.body.appendChild(d); return d; };
  add('v-cap'); add('v-tap'); add('v-flash'); add('v-spot', '<b></b>');
  window.__spot = (sels, label) => {
    const sp = document.getElementById('v-spot');
    if (!sels) { sp.classList.remove('on'); return; }
    const rs = sels.map(q => document.querySelector(q)).filter(Boolean).map(e => e.getBoundingClientRect());
    const l = Math.min(...rs.map(r => r.left)) - 8, t = Math.min(...rs.map(r => r.top)) - 8;
    const r = Math.max(...rs.map(r => r.right)) + 8, b = Math.max(...rs.map(r => r.bottom)) + 8;
    Object.assign(sp.style, { left: l + 'px', top: t + 'px', width: (r - l) + 'px', height: (b - t) + 'px' });
    sp.querySelector('b').textContent = label;
    sp.className = 'on ' + (t > 90 ? 'above' : 'below');
  };
  add('v-cam', '<img id="v-cam-img" alt=""><div class="frame"></div><div class="shut"></div>');
  add('v-card');
  window.__cap = t => { const c = document.getElementById('v-cap'); if (!t) { c.classList.remove('on'); return; } c.textContent = t; c.classList.add('on'); };
  window.__tap = (x, y) => { const d = document.getElementById('v-tap'); d.style.left = x + 'px'; d.style.top = y + 'px'; d.classList.add('on');
    setTimeout(() => d.classList.add('press'), 250); setTimeout(() => d.classList.remove('press'), 420); setTimeout(() => d.classList.remove('on'), 900); };
  window.__card = html => { const c = document.getElementById('v-card'); if (html === null) { c.classList.add('off'); return; } c.innerHTML = html; c.classList.remove('off'); };
  window.__cam = src => { const c = document.getElementById('v-cam'); if (!src) { c.classList.remove('on'); return; } document.getElementById('v-cam-img').src = src; c.classList.add('on'); };
  window.__flash = () => { const f = document.getElementById('v-flash'); f.style.transition = 'none'; f.style.opacity = '1'; requestAnimationFrame(() => { f.style.transition = 'opacity .45s'; f.style.opacity = '0'; }); };
})();`;

(async () => {
  const server = serve(8734);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });

  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
  const card = await drawCard(browser);
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, locale: 'en-US', hasTouch: false });
  // Registered first: Playwright tries the LAST matching route first, so the
  // specific answers below must come after this catch-all.
  await ctx.route(/workers\.dev|supabase\.co|googletagmanager|google-analytics/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await ctx.route('**/vendor/supabase-js*', r => r.fulfill({ contentType: 'application/javascript', body: buildFakeClient(seed) }));
  // The scan answer: what the Worker returns for this card, CPR slot only.
  await ctx.route('**/mission-control.*/api/extract', async r => {
    const body = JSON.parse(r.request().postData() || '{}');
    if (body.docType !== 'cpr_card') return r.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"bad_request"}' });
    await new Promise(res => setTimeout(res, 1800));
    const f = (label, value, type, box, src) => ({ label, type, value, confidence: 'high', source_text: src || value, box });
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ formType: 'staff', docType: 'cpr_card', notes: 'A CPR course completion card.',
      remaining: 199, fields: {
        full_name: f('Name on the document', CARD.name, 'text', card.boxes.n),
        cpr_cert_date: f('CPR certified on', CARD.issuedIso, 'date', card.boxes.i, CARD.issued),
        cpr_cert_expiry: f('CPR expires', CARD.expiresIso, 'date', card.boxes.e, CARD.expires) } }) });
  });

  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto('http://127.0.0.1:8734/index.html', { waitUntil: 'load' });
  await page.evaluate(OVERLAY);
  await page.evaluate(() => window.__card('<img src="/tello-icon.svg" alt=""><h1>Scan to fill</h1><p>Add a staff member’s documents in about a minute. Photo in, dates filled.</p>'));
  await page.waitForSelector('#page-app', { state: 'visible', timeout: 20000 });
  await page.waitForTimeout(2500);   // the menu opens itself with "Start here" on Staff

  // ── frames ────────────────────────────────────────────────────────────────
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async f => {
    const n = String(frames.length).padStart(5, '0');
    fs.writeFileSync(path.join(OUT, 'frames', n + '.jpg'), Buffer.from(f.data, 'base64'));
    frames.push({ file: n + '.jpg', t: f.metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: VW * DSF, maxHeight: VH * DSF, everyNthFrame: 1 });
  // A heartbeat so a still screen still yields frames and the timing stays true.
  await page.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;z-index:2147483647;opacity:.01'; document.body.appendChild(d); setInterval(() => { d.style.background = d.style.background === 'red' ? 'blue' : 'red'; }, 100); });

  const T0 = Date.now() / 1000;
  const timeline = [];
  const tap = async (sel) => {
    const el = page.locator(sel).first();
    await el.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    await page.waitForTimeout(650);
    const bb = await el.boundingBox();
    await page.evaluate(({ x, y }) => window.__tap(x, y), { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 });
    await page.waitForTimeout(420);
    await el.click();
  };
  const scrollTo = async (sel) => { await page.locator(sel).first().evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' })); await page.waitForTimeout(800); };
  const typeInto = async (sel, text) => { await tap(sel); await page.locator(sel).pressSequentially(text, { delay: 70 }); };
  const setDate = async (sel, iso) => { await tap(sel); await page.locator(sel).fill(iso); await page.locator(sel).dispatchEvent('change'); await page.waitForTimeout(300); };

  const spot = async (sels, label, ms) => { await page.evaluate(([a, b]) => window.__spot(a, b), [sels, label]); if (ms) await page.waitForTimeout(ms); };
  const spotOff = () => page.evaluate(() => window.__spot(null));

  async function step(id, fn) {
    const line = SCRIPT.find(s => s.id === id);
    const start = Date.now();
    timeline.push({ id, t: start / 1000 - T0, say: line.say });
    await page.evaluate(t => window.__cap(t), line.say);
    if (fn) await fn();
    const need = VOICE[id] * 1000 + PAD - (Date.now() - start);
    if (need > 0) await page.waitForTimeout(need);
  }

  await step('intro', async () => { await page.waitForTimeout(VOICE.intro * 1000 - 300); await page.evaluate(() => window.__card(null)); });
  await step('menu', async () => { await page.waitForTimeout(500); await tap('#menu-staff'); });
  await step('add', async () => { await page.waitForTimeout(400); await tap('#staff-empty button'); await page.waitForTimeout(500); });
  await step('details', async () => {
    await typeInto('#staff-name', CARD.name);
    await setDate('#staff-hire-date', '2026-09-22');
  });
  await step('stf', async () => {
    await page.evaluate(() => window.__card('<img src="/tello-icon.svg" alt=""><h1>Scan to fill</h1><p>Take a photo of a certificate. Title22 reads the dates and fills them in. You check, then save.</p>'));
    await page.waitForTimeout(VOICE.stf * 1000 + 300);
    await scrollTo('#docslot-cpr_card');
    await page.evaluate(() => window.__card(null));
  });
  await step('scan', async () => {
    await scrollTo('#docslot-cpr_card');
    await spot(['#docslot-cpr_card [data-slot-actions] button'], 'Scan to fill', 1500);
    await spotOff();
    const chooser = page.waitForEvent('filechooser');
    await tap('#docslot-cpr_card [data-slot-actions] button:has-text("Scan")');
    const fc = await chooser;
    await page.evaluate(src => window.__cam(src), 'data:image/jpeg;base64,' + card.jpg.toString('base64'));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__flash());
    await page.waitForTimeout(250);
    await page.evaluate(() => window.__cam(null));
    await fc.setFiles({ name: 'cpr-card.jpg', mimeType: 'image/jpeg', buffer: card.jpg });
  });
  await step('review', async () => {
    await page.waitForSelector('#scan-rows .scan-row', { timeout: 15000 });
    await page.waitForTimeout(400);
    await page.locator('#scan-rows').evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    await page.waitForTimeout(700);
    await spot(['#scan-rows'], 'Read from the photo', VOICE.review * 1000 - 3300);
    await spot(['#scan-apply-btn'], 'Fill form', 1000);
    await spotOff();
    await tap('#scan-apply-btn');
  });
  await step('filled', async () => {
    await page.waitForTimeout(700); await scrollTo('#staff-cpr-date');
    await spot(['#staff-cpr-date', '#staff-cpr-expiry'], 'Filled in for you', VOICE.filled * 1000 - 600);
    await spotOff();
  });
  await step('tb', async () => {
    await scrollTo('#docslot-tb_test');
    await setDate('#staff-tb-date', '2026-09-18');
    await setDate('#staff-tb-due', '2027-09-18');
  });
  await step('tbfile', async () => {
    const chooser = page.waitForEvent('filechooser');
    await tap('#docslot-tb_test [data-slot-actions] button:has-text("Upload")');
    await (await chooser).setFiles({ name: 'tb-test-signed.pdf', mimeType: 'application/pdf', buffer: PDF });
  });
  await step('more', async () => {
    await scrollTo('#docslot-livescan');
    const chooser = page.waitForEvent('filechooser');
    await tap('#docslot-livescan [data-slot-actions] button:has-text("Upload")');
    await (await chooser).setFiles({ name: 'livescan-clearance.pdf', mimeType: 'application/pdf', buffer: PDF });
    await page.selectOption('#staff-livescan', 'true');
    await setDate('#staff-livescan-date', '2026-09-10');
  });
  await step('save', async () => { await tap('#staff-modal button:has-text("Save staff member")'); });
  await step('card', async () => { await page.waitForTimeout(500); await scrollTo('#staff-grid'); });
  await step('outro', async () => {
    await page.evaluate(() => window.__cap(null));
    await page.evaluate(() => window.__card('<img src="/tello-icon.svg" alt=""><h1>Try it free for 30 days</h1><p><b>title22.app</b><br>No card needed. Nothing to cancel.</p>'));
  });
  await page.waitForTimeout(600);
  const T1 = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await page.waitForTimeout(300);

  // ── concat list: each frame held until the next one ────────────────────────
  const kept = frames.filter(f => f.t >= T0 - 0.05).sort((a, b) => a.t - b.t);
  let list = '';
  kept.forEach((f, i) => {
    const next = i + 1 < kept.length ? kept[i + 1].t : T1;
    list += `file 'frames/${f.file}'\nduration ${Math.max(0.001, next - Math.max(f.t, T0)).toFixed(4)}\n`;
  });
  list += `file 'frames/${kept[kept.length - 1].file}'\n`;
  fs.writeFileSync(path.join(OUT, 'frames.txt'), list);
  const total = T1 - T0;
  fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify({ total, steps: timeline }, null, 1));

  // ── captions: the same lines, at the same times ────────────────────────────
  const vt = s => { const m = Math.floor(s / 60), x = s - m * 60; return String(m).padStart(2, '0') + ':' + (x < 10 ? '0' : '') + x.toFixed(3); };
  const vtt = 'WEBVTT\n\n' + timeline.map((s, i) => {
    const end = Math.min(i + 1 < timeline.length ? timeline[i + 1].t - 0.15 : total, s.t + VOICE[s.id] + 0.6);
    return vt(s.t + 0.1) + ' --> ' + vt(end) + '\n' + s.say + '\n';
  }).join('\n');
  fs.writeFileSync(path.join(OUT, 'docs.en.vtt'), vtt);
  // Caption bands, one per step, drawn here so they use the same fonts.
  const band = await browser.newPage({ viewport: { width: 1080, height: 300 } });
  for (const st of timeline) {
    await band.setContent('<body style="margin:0;background:#123a30;height:300px;display:flex;align-items:center;justify-content:center;padding:0 60px;box-sizing:border-box;font:600 50px/1.3 \'Public Sans\',Arial,sans-serif;color:#fff;text-align:center"><div>' + st.say.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div></body>');
    await band.screenshot({ path: path.join(OUT, 'band-' + st.id + '.png') });
  }
  await band.close();
  // A poster from the review sheet, the clip's most telling frame.
  const rv = timeline.find(s => s.id === 'review');
  const pf = kept.find(f => f.t - T0 >= rv.t + 2.5) || kept[Math.floor(kept.length / 2)];
  fs.copyFileSync(path.join(OUT, 'frames', pf.file), path.join(OUT, 'docs-poster.jpg'));

  console.log(kept.length + ' frames over ' + total.toFixed(1) + 's; errors: ' + JSON.stringify(errs));
  console.log('db: ' + (await page.evaluate(() => JSON.stringify({ staff: window.__fakeLog.filter(x => /staff|documents/.test(x) && !/^select/.test(x)) }))));
  await browser.close();
  server.close();
})();
