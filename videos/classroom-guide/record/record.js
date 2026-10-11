// Records the trainer guide "Your Classroom account" (classroom.mp4): the real
// app on an in-memory database (fakedb.js + seed.js), filmed at phone size.
//
// Four sittings, joined into one clip:
//   A  signed out: the sign-up screen
//   B  the trainer, on a Classroom (edu) account: practice home, lessons, invite
//   C  the invited student: opens a lesson and answers it
//   D  the trainer again: Results
// Each sitting starts on the title card the one before it ended on, and the
// time spent loading between them is cut out.
//
// Nobody here is real: Dana Whitfield, Jordan Ellis and the other students are
// invented, and so is everyone in the practice home. The practice home is the
// app's own sample facility; this script never opens its Residents,
// Medications or MAR screens.
//
//   node record.js <voice dir> <out dir>
// Needs PLAYWRIGHT=<path to playwright> and the app repo at APP_REPO.
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
const VW = 360, VH = 540, DSF = 3;           // 1080x1620; the caption band goes underneath
const PAD = 650;                              // quiet after each line, ms
const PORT = 8737;
const clone = o => JSON.parse(JSON.stringify(o));
const iso = n => new Date(Date.now() + n * 86400000).toISOString();

const TRAINER_EMAIL = seed.user.email;
const STUDENT = { id: '9a2b4c6d-1111-4222-8333-444455556666', email: 'jordan.ellis@example.com', name: 'Jordan Ellis' };
const CLASSMATES = [
  { id: '9a2b4c6d-1111-4222-8333-444455557777', email: 'sam.ortega@example.com', score: 4, mins: 52 },
  { id: '9a2b4c6d-1111-4222-8333-444455558888', email: 'priya.nair@example.com', score: 2, mins: 95 },
];

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

// ── Overlay: a tap marker, a spotlight and the title cards ───────────────────
const OVERLAY = `(() => {
  const css = document.createElement('style');
  css.textContent = \`
    #tello-dock-btn,#tello-dock{display:none!important}
    #v-tap{pointer-events:none;position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;z-index:2147483001;
      background:rgba(232,162,61,.35);border:3px solid #e8a23d;opacity:0;transform:scale(.6);transition:opacity .15s,transform .25s}
    #v-tap.on{opacity:1;transform:scale(1)} #v-tap.press{transform:scale(.75)}
    #v-spot{position:fixed;z-index:2147482998;pointer-events:none;border:4px solid #e8a23d;border-radius:14px;
      box-shadow:0 0 0 3000px rgba(10,30,24,.55),0 0 24px rgba(232,162,61,.9);opacity:0;transition:opacity .3s,left .35s,top .35s,width .35s,height .35s}
    #v-spot.on{opacity:1}
    #v-spot b{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;background:#e8a23d;color:#123a30;
      font:800 17px/1 "Public Sans",-apple-system,sans-serif;padding:9px 16px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.3)}
    #v-spot.above b{bottom:calc(100% + 12px)} #v-spot.below b{top:calc(100% + 12px)}
    #v-card{position:fixed;inset:0;z-index:2147483003;background:#123a30;color:#f9f5ed;display:flex;flex-direction:column;
      align-items:center;justify-content:center;text-align:center;padding:30px;transition:opacity .45s;font-family:"Public Sans",-apple-system,sans-serif}
    #v-card.off{opacity:0;pointer-events:none}
    #v-card img{width:84px;height:84px;border-radius:50%;margin-bottom:20px}
    #v-card h1{font:700 30px/1.2 Georgia,serif;margin:0 0 14px}
    #v-card p{font-size:17px;line-height:1.5;margin:0;color:rgba(249,245,237,.88)}
    #v-card b{color:#e8a23d}
    #v-card .who{font:700 13px/1 "Public Sans",-apple-system,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#e8a23d;margin-bottom:14px}
  \`;
  document.head.appendChild(css);
  const add = (id, html) => { const d = document.createElement('div'); d.id = id; if (html) d.innerHTML = html; document.body.appendChild(d); return d; };
  add('v-tap'); add('v-spot', '<b></b>'); add('v-card');
  window.__spot = (sels, label) => {
    const sp = document.getElementById('v-spot');
    if (!sels) { sp.classList.remove('on'); return; }
    const rs = sels.map(q => document.querySelector(q)).filter(Boolean).map(e => e.getBoundingClientRect());
    if (!rs.length) return;
    const l = Math.max(4, Math.min(...rs.map(r => r.left)) - 8), t = Math.min(...rs.map(r => r.top)) - 8;
    const r = Math.min(innerWidth - 4, Math.max(...rs.map(r => r.right)) + 8), b = Math.max(...rs.map(r => r.bottom)) + 8;
    Object.assign(sp.style, { left: l + 'px', top: t + 'px', width: (r - l) + 'px', height: (b - t) + 'px' });
    sp.querySelector('b').textContent = label || ''; sp.querySelector('b').style.display = label ? '' : 'none';
    sp.className = 'on ' + (t > 90 ? 'above' : 'below');
  };
  window.__tap = (x, y) => { const d = document.getElementById('v-tap'); d.style.left = x + 'px'; d.style.top = y + 'px'; d.classList.add('on');
    setTimeout(() => d.classList.add('press'), 250); setTimeout(() => d.classList.remove('press'), 420); setTimeout(() => d.classList.remove('on'), 900); };
  window.__card = html => { const c = document.getElementById('v-card'); if (html === null) { c.classList.add('off'); return; } c.innerHTML = html; c.classList.remove('off'); };
  // A heartbeat so a still screen still yields frames and the timing stays true.
  const hb = document.createElement('div'); hb.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;z-index:2147483647;opacity:.01'; document.body.appendChild(hb);
  setInterval(() => { hb.style.background = hb.style.background === 'rgb(0, 0, 0)' ? 'rgb(1, 1, 1)' : 'rgb(0, 0, 0)'; }, 40);
})();`;

const ICON = '<img src="/tello-icon.svg" alt="">';
const CARDS = {
  intro: ICON + '<h1>Your Classroom account</h1><p>Set it up, then bring your students in.</p>',
  grant: '<div class="who">Step 2</div><h1>Tell the Title22 team your email</h1><p>Write to <b>hello@title-22.com</b>.<br>They turn on your Classroom account.<br>Free. It does not expire.</p>',
  join: '<div class="who">Your student</div><h1>Same email, then your link</h1><p>They create an account at <b>title22.app</b> with the email you invited, then open the link you sent.</p>',
  back: '<div class="who">Back on your screen</div><h1>Results</h1><p>What your students submitted.</p>',
  outro: ICON + '<h1>Questions?</h1><p><b>hello@title-22.com</b><br>title-22.com/for-trainers</p>',
};

(async () => {
  const server = serve(PORT);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });
  const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });

  const frames = [];        // { file, t } with t on the joined clock
  const timeline = [];
  const errs = [], dialogs = [];
  let skipped = 0;          // wall seconds cut out between sittings
  let T0 = null, lastEnd = null;
  const now = () => Date.now() / 1000 - skipped;

  let page, cdp;
  async function sitting(seedObj, cardHtml, ready) {
    const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, locale: 'en-US', hasTouch: false });
    // Registered first: Playwright tries the LAST matching route first.
    await ctx.route(/workers\.dev|supabase\.co|googletagmanager|google-analytics/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await ctx.route('**/vendor/supabase-js*', r => r.fulfill({ contentType: 'application/javascript', body: buildFakeClient(seedObj) }));
    page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    // The app's own confirm and alert boxes are answered, and never filmed.
    page.on('dialog', async d => { dialogs.push(d.message().slice(0, 90)); await d.accept().catch(() => {}); });
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
    await page.evaluate(OVERLAY);
    await page.evaluate(h => window.__card(h), cardHtml);
    await ready();
    cdp = await ctx.newCDPSession(page);
    cdp.on('Page.screencastFrame', f => {
      const n = String(frames.length).padStart(5, '0');
      fs.writeFileSync(path.join(OUT, 'frames', n + '.jpg'), Buffer.from(f.data, 'base64'));
      frames.push({ file: n + '.jpg', t: f.metadata.timestamp - skipped });
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    // Whatever passed since the last sitting ended is loading time: cut it.
    if (lastEnd !== null) skipped += Date.now() / 1000 - lastEnd;
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: VW * DSF, maxHeight: VH * DSF, everyNthFrame: 1 });
    if (T0 === null) T0 = now();
    await page.waitForTimeout(250);
  }
  async function endSitting() {
    await page.waitForTimeout(200);
    await cdp.send('Page.stopScreencast');
    lastEnd = Date.now() / 1000;
    const db = await page.evaluate(() => JSON.parse(JSON.stringify(window.__db)));
    await page.context().close();
    return db;
  }

  const tap = async (sel, o) => {
    const el = page.locator(sel).first();
    await el.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    await page.waitForTimeout(650);
    const bb = await el.boundingBox();
    await page.evaluate(({ x, y }) => window.__tap(x, y), { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 });
    await page.waitForTimeout(420);
    if (!(o && o.noClick)) await el.click();
  };
  const scrollTo = async (sel, block) => { await page.locator(sel).first().evaluate((e, b) => e.scrollIntoView({ block: b || 'center', behavior: 'smooth' }), block); await page.waitForTimeout(800); };
  const typeInto = async (sel, text) => { await tap(sel); await page.locator(sel).pressSequentially(text, { delay: 55 }); };
  const spot = async (sels, label, ms) => { await page.evaluate(([a, b]) => window.__spot(a, b), [sels, label]); if (ms) await page.waitForTimeout(ms); };
  const spotOff = () => page.evaluate(() => window.__spot(null));
  const card = html => page.evaluate(h => window.__card(h), html);
  const wait = ms => page.waitForTimeout(ms);

  async function step(id, fn) {
    const line = SCRIPT.find(s => s.id === id);
    const start = Date.now();
    timeline.push({ id, t: now() - T0, say: line.cap || line.say });
    if (fn) await fn();
    const need = VOICE[id] * 1000 + PAD - (Date.now() - start);
    if (need > 0) await page.waitForTimeout(need);
  }
  const menuTo = async (id) => { await tap('#user-menu-btn'); await wait(700); await tap('#' + id); await wait(600); };

  // ── A: signed out ─────────────────────────────────────────────────────────
  await sitting({ ...clone(seed), signedOut: true }, CARDS.intro, async () => { await page.waitForSelector('#page-landing', { state: 'visible', timeout: 20000 }); await wait(800); });
  await step('intro', async () => { await wait(VOICE.intro * 1000 - 200); await card(null); });
  await step('signup', async () => {
    await wait(500);
    await tap('button:has-text("Create your account")');
    await page.waitForSelector('#signup-email', { state: 'visible', timeout: 10000 });
    await wait(500);
    await typeInto('#signup-email', TRAINER_EMAIL);
    await spot(['#signup-email'], 'The email you teach from', 1400);
    await spotOff();
  });
  await step('grant', async () => { await card(CARDS.grant); });
  await endSitting();

  // ── B: the trainer, Classroom account ─────────────────────────────────────
  await sitting(clone(seed), CARDS.grant, async () => { await page.waitForSelector('#page-onboard', { state: 'visible', timeout: 20000 }); await wait(800); });
  await step('around', async () => {
    await card(null); await wait(700);
    await spot(['.ob-path-btn'], 'Show me around', 900); await spotOff();
    await tap('button:has-text("Show me around")');
    await page.waitForFunction(() => typeof allFacilities !== 'undefined' && allFacilities.length > 0 && document.getElementById('page-app').offsetParent !== null, null, { timeout: 30000 });
  });
  await step('ready', async () => {
    await wait(900);
    await page.evaluate(() => { try { closeUserMenu(); } catch (e) {} window.scrollTo(0, 0); });
    await wait(500);
    await spot(['#user-menu-btn'], null, 10);
    await page.evaluate(() => window.__spot(null));
  });
  await step('lessons', async () => { await menuTo('menu-lessons'); });
  await step('starters', async () => {
    await page.waitForSelector('button:has-text("Load starter lessons")', { timeout: 10000 });
    await tap('button:has-text("Load starter lessons")');
    await page.waitForFunction(() => typeof lessonsRows !== 'undefined' && lessonsRows.length >= 8, null, { timeout: 30000 });
    await wait(600);
    await page.evaluate(() => window.scrollTo({ top: 520, behavior: 'smooth' })); await wait(1300);
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'smooth' })); await wait(1300);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await wait(700);
  });
  await step('edit', async () => {
    await tap('#lessons-view button:has-text("Edit")');
    await wait(1700);
    await page.evaluate(() => { const l = document.getElementById('lesson-active').closest('label'); l.id = 'v-show-label'; l.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
    await wait(1100);
    await spot(['#v-show-label'], 'Untick for a draft', 2800);
    await spotOff();
    await tap('#lesson-modal .modal-close');
  });
  await step('questions', async () => {
    await wait(300);
    await tap('#lessons-view button:has-text("Questions")');
    await wait(1200);
    await page.evaluate(() => window.scrollTo({ top: 330, behavior: 'smooth' }));
  });
  await step('team', async () => { await page.evaluate(() => window.scrollTo(0, 0)); await wait(300); await menuTo('menu-team'); });
  await step('invite', async () => {
    await tap('#tab-team .page-header button');
    await wait(600);
    await typeInto('#invite-email', STUDENT.email);
    await wait(300);
    await tap('#invite-role', { noClick: true });
    await page.selectOption('#invite-role', 'supervisor');
    await spot(['#invite-role'], 'Supervisor', 2200);
    await spotOff();
  });
  await step('link', async () => {
    await tap('#invite-modal button:has-text("Generate Invite Link")');
    await page.waitForSelector('#invite-link-result', { state: 'visible', timeout: 10000 });
    await wait(400);
    await spot(['#invite-link-result'], 'Send this to your student', 2600);
    await spotOff();
  });
  await step('join', async () => { await card(CARDS.join); });
  const dbB = await endSitting();

  // ── C: the student ────────────────────────────────────────────────────────
  const fac = dbB.facilities[0];
  const dbC = clone(dbB);
  dbC.profiles.push({ id: STUDENT.id, email: STUDENT.email, title22_plan: 'trial', title22_trial_ends_at: iso(89), title22_plan_expires_at: null, title22_subscription_id: null, created_at: iso(-1) });
  dbC.facility_members.push({ id: 'mem-jordan', facility_id: fac.id, user_id: STUDENT.id, role: 'supervisor', facilities: fac, profiles: { email: STUDENT.email } });
  dbC.facility_invites.forEach(i => { i.status = 'accepted'; });
  const studentUser = { id: STUDENT.id, aud: 'authenticated', role: 'authenticated', email: STUDENT.email, email_confirmed_at: iso(-1),
    user_metadata: { full_name: STUDENT.name }, app_metadata: { provider: 'email' }, created_at: iso(-1) };
  await sitting({ user: studentUser, tables: dbC, rpc: { title22_member_entitlement: [{ entitled: true, plan: 'edu' }], title22_accept_my_invite: null } }, CARDS.join, async () => {
    await page.waitForSelector('#page-app', { state: 'visible', timeout: 20000 });
    await wait(3200);
    await page.evaluate(() => { try { closeUserMenu(); } catch (e) {} try { endTour(false); } catch (e) {} switchTab('lessons'); window.scrollTo(0, 0); });
    await page.waitForFunction(() => typeof lessonsRows !== 'undefined' && lessonsRows.length >= 8, null, { timeout: 20000 });
    await wait(500);
  });
  await step('student', async () => {
    await card(null); await wait(900);
    await scrollTo('#lessons-view .card');
    await tap('#lessons-view button:has-text("Open")');
    await wait(900);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
    await wait(900);
  });
  await step('answer', async () => {
    const pick = async (q, i) => { await tap(`input[name="la-q-${q}"][value="${i}"]`); await wait(120); };
    await pick(0, 0); await pick(1, 2); await pick(2, 1); await pick(3, 0);   // the last one is wrong, on purpose
    await tap('#lessons-view button:has-text("Submit answers")');
    await wait(900);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await wait(1600);
    await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'smooth' }));
    await wait(1400);
    await card(CARDS.back); await wait(700);
  });
  const dbC2 = await endSitting();

  // ── D: the trainer, Results ───────────────────────────────────────────────
  const dbD = clone(dbC2);
  const lesson = dbD.title22_lessons.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
  const mine = dbD.title22_lesson_attempts.find(a => a.user_id === STUDENT.id);
  // The database stamps the time on a real submission; the stand-in does not.
  if (mine && !mine.submitted_at) mine.submitted_at = new Date(Date.now() - 3 * 60000).toISOString();
  CLASSMATES.forEach((c, i) => {
    dbD.profiles.push({ id: c.id, email: c.email, title22_plan: 'trial', title22_trial_ends_at: iso(80), created_at: iso(-2) });
    dbD.facility_members.push({ id: 'mem-' + i, facility_id: fac.id, user_id: c.id, role: 'supervisor', facilities: fac, profiles: { email: c.email } });
    dbD.title22_lesson_attempts.push({ ...(mine || {}), id: 'att-' + i, lesson_id: lesson.id, user_id: c.id, score: c.score, total: (mine && mine.total) || 4,
      submitted_at: new Date(Date.now() - c.mins * 60000).toISOString(), created_at: new Date(Date.now() - c.mins * 60000).toISOString() });
  });
  await sitting({ ...clone(seed), tables: dbD }, CARDS.back, async () => {
    await page.waitForSelector('#page-app', { state: 'visible', timeout: 20000 });
    await wait(3200);
    await page.evaluate(() => { try { closeUserMenu(); } catch (e) {} try { endTour(false); } catch (e) {} switchTab('lessons'); window.scrollTo(0, 0); });
    await page.waitForFunction(() => typeof lessonsRows !== 'undefined' && lessonsRows.length >= 8, null, { timeout: 20000 });
    await wait(500);
  });
  await step('results', async () => {
    await wait(600); await card(null); await wait(800);
    await tap('#lessons-view button:has-text("Results")');
    await wait(1000);
    await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'smooth' }));
  });
  await step('note', async () => {
    await page.evaluate(() => { const d = [...document.querySelectorAll('#lessons-view div')].find(e => /not a training record/.test(e.textContent) && !e.children.length); if (d) d.id = 'v-note'; });
    await spot(['#v-note'], null, VOICE.note * 1000);
    await spotOff();
  });
  await step('outro', async () => { await card(CARDS.outro); });
  await wait(500);
  const T1 = now();
  const dbEnd = await endSitting();

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
  fs.writeFileSync(path.join(OUT, 'classroom.en.vtt'), vtt);
  const band = await browser.newPage({ viewport: { width: 1080, height: 300 } });
  const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  for (const st of timeline) {
    await band.setContent('<body style="margin:0;background:#123a30;height:300px;display:flex;align-items:center;justify-content:center;padding:0 56px;box-sizing:border-box;font:600 ' + (st.say.length > 110 ? 40 : st.say.length > 80 ? 45 : 50) + 'px/1.3 \'Public Sans\',Arial,sans-serif;color:#fff;text-align:center"><div>' + escHtml(st.say) + '</div></body>');
    await band.screenshot({ path: path.join(OUT, 'band-' + st.id + '.png') });
  }
  await band.close();

  console.log(kept.length + ' frames over ' + total.toFixed(1) + 's; cut ' + skipped.toFixed(1) + 's of loading; errors: ' + JSON.stringify(errs));
  console.log('dialogs answered off camera: ' + JSON.stringify(dialogs));
  console.log('db: ' + JSON.stringify({ lessons: dbEnd.title22_lessons.length, attempts: dbEnd.title22_lesson_attempts.map(a => a.score + '/' + a.total), invites: dbEnd.facility_invites.map(i => i.email + ':' + i.role) }));
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
