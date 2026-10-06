/* Title22 partner media kit.
   Draws every image in the browser with the partner's own link and QR code.
   Claims used here are the approved ones only: no resident records, no
   medications, no compliance guarantees. Change wording in COPY, not in the
   drawing code. */
(function () {
  'use strict';

  var C = { cream: '#fbf7f0', deep: '#143c31', pine: '#1e5748', gold: '#e8a33d',
            ink: '#1a2420', muted: '#5b6a63', sage: '#e9f1ec', line: '#d8e2dc', white: '#ffffff' };
  var SERIF = '"Zilla Slab", Georgia, serif';
  var SANS = '"Public Sans", Arial, sans-serif';
  var MONO = '"IBM Plex Mono", monospace';

  var $ = function (id) { return document.getElementById(id); };
  var codeEl = $('code'), daysEl = $('days'), roleEl = $('role');

  function clean(v) {
    return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  function state() {
    var code = clean(codeEl.value);
    return { code: code, days: daysEl.value, role: roleEl.value,
             short: 'title-22.com/r/' + (code || 'yourcode'),
             url: 'https://title-22.com/r/' + (code || 'yourcode') };
  }

  var COPY = {
    disclose: 'Partner link: I may earn a commission if you subscribe.',
    discloseTrainer: 'Your instructor is a Title22 partner and may earn a commission if you subscribe.',
    noPhi: 'No resident health information. No card to start.'
  };

  /* ---------------- drawing helpers ---------------- */
  function font(ctx, w, size, fam) { ctx.font = w + ' ' + size + 'px ' + fam; }
  function lines(ctx, text, maxW) {
    var words = text.split(' '), out = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var t = cur ? cur + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = words[i]; } else cur = t;
    }
    if (cur) out.push(cur);
    return out;
  }
  function wrap(ctx, text, x, y, maxW, lh) {
    var ls = lines(ctx, text, maxW);
    for (var i = 0; i < ls.length; i++) ctx.fillText(ls[i], x, y + i * lh);
    return y + ls.length * lh;
  }
  function fitFont(ctx, w, size, fam, text, maxW, min) {
    var s = size; font(ctx, w, s, fam);
    while (ctx.measureText(text).width > maxW && s > (min || 10)) { s -= 2; font(ctx, w, s, fam); }
    return s;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function brand(ctx, x, y, size, onDark) {
    font(ctx, 700, size, SERIF); ctx.textBaseline = 'alphabetic';
    var a = 'title', b = '-22', c = '.com';
    ctx.fillStyle = onDark ? C.white : C.deep; ctx.fillText(a, x, y);
    var w = ctx.measureText(a).width;
    ctx.fillStyle = C.gold; ctx.fillText(b, x + w, y);
    w += ctx.measureText(b).width;
    ctx.fillStyle = onDark ? C.white : C.deep; ctx.fillText(c, x + w, y);
  }
  function qr(ctx, url, x, y, size, pad) {
    var q = qrcode(0, 'M'); q.addData(url); q.make();
    var n = q.getModuleCount(), p = pad == null ? Math.round(size * 0.06) : pad;
    ctx.fillStyle = C.white; rrect(ctx, x, y, size, size, Math.round(size * 0.05)); ctx.fill();
    var cell = (size - 2 * p) / n;
    ctx.fillStyle = C.ink;
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++)
      if (q.isDark(r, c)) ctx.fillRect(Math.floor(x + p + c * cell), Math.floor(y + p + r * cell), Math.ceil(cell), Math.ceil(cell));
  }
  function bg(ctx, W, H) {
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#efe5cf'; ctx.beginPath(); ctx.arc(W * 1.02, H * 0.92, Math.min(W, H) * 0.42, 0, 7); ctx.fill();
  }

  /* ---------------- the formats ---------------- */
  var FORMATS = [
    { id: 'square', title: 'Social post (square)', note: 'Facebook, Instagram, LinkedIn. 1080 × 1080.', W: 1080, H: 1080,
      draw: function (ctx, s, W, H) {
        bg(ctx, W, H); ctx.fillStyle = C.pine; ctx.fillRect(0, 0, W, 18);
        brand(ctx, 80, 130, 48);
        ctx.fillStyle = C.deep; font(ctx, 700, 86, SERIF);
        var y = wrap(ctx, 'Your first DSS inspection, without guessing.', 80, 260, 900, 94);
        ctx.fillStyle = C.muted; font(ctx, 400, 34, SANS);
        y = wrap(ctx, 'Staff files, training hours and clearances in one place. Title22 warns you before a certification lapses.', 80, y + 30, 860, 48);
        var by = 700; ctx.fillStyle = C.deep; rrect(ctx, 60, by, 960, 280, 28); ctx.fill();
        qr(ctx, s.url, 90, by + 30, 220);
        ctx.fillStyle = C.gold; font(ctx, 700, 50, SERIF); ctx.fillText(s.days + ' days free', 350, by + 100);
        ctx.fillStyle = C.white; font(ctx, 400, 30, SANS); ctx.fillText('through my link. No card to start.', 350, by + 148);
        fitFont(ctx, 500, 38, MONO, s.short, 630, 22); ctx.fillStyle = C.white; ctx.fillText(s.short, 350, by + 222);
        ctx.fillStyle = C.muted; font(ctx, 400, 22, SANS); ctx.fillText(COPY.disclose, 80, 1040);
      } },
    { id: 'story', title: 'Story / Reel cover (vertical)', note: 'Instagram and Facebook Stories, TikTok. 1080 × 1920.', W: 1080, H: 1920,
      draw: function (ctx, s, W, H) {
        bg(ctx, W, H); ctx.fillStyle = C.pine; ctx.fillRect(0, 0, W, 22);
        brand(ctx, 90, 220, 56);
        ctx.fillStyle = C.deep; font(ctx, 700, 110, SERIF);
        var y = wrap(ctx, 'Your first DSS inspection, without guessing.', 90, 420, 900, 120);
        ctx.fillStyle = C.muted; font(ctx, 400, 42, SANS);
        y = wrap(ctx, 'Staff files, training hours and clearances in one place. Title22 warns you before a certification lapses, and names the person.', 90, y + 50, 880, 60);
        var qy = 1200; qr(ctx, s.url, 90, qy, 400);
        ctx.fillStyle = C.pine; font(ctx, 700, 70, SERIF); ctx.fillText(s.days + ' days', 540, qy + 120);
        ctx.fillText('free', 540, qy + 200);
        ctx.fillStyle = C.muted; font(ctx, 400, 34, SANS); ctx.fillText('through my link.', 540, qy + 260);
        ctx.fillText('No card to start.', 540, qy + 306);
        fitFont(ctx, 500, 50, MONO, s.short, 900, 26); ctx.fillStyle = C.deep; ctx.fillText(s.short, 90, qy + 500);
        ctx.fillStyle = C.muted; font(ctx, 400, 28, SANS); ctx.fillText(COPY.disclose, 90, 1840);
      } },
    { id: 'slide', title: 'Class slide', note: 'For trainers. Drop it into your deck. 1920 × 1080.', W: 1920, H: 1080,
      draw: function (ctx, s, W, H) {
        ctx.fillStyle = C.deep; ctx.fillRect(0, 0, W, H);
        brand(ctx, 128, 170, 52, true);
        ctx.fillStyle = C.gold; font(ctx, 500, 28, MONO); ctx.fillText('FOR THIS CLASS', 128, 290);
        ctx.fillStyle = C.white; font(ctx, 700, 108, SERIF);
        var y = wrap(ctx, 'Practice it in Title22.', 128, 410, 1050, 118);
        ctx.fillStyle = '#cfdccb'; font(ctx, 400, 40, SANS);
        y = wrap(ctx, 'Staff records, training hours and clearances for California care homes, with a practice home ready inside.', 128, y + 40, 1000, 58);
        ctx.fillStyle = C.white; font(ctx, 700, 44, SANS); ctx.fillText(s.days + '-day free trial. No card.', 128, y + 70);
        qr(ctx, s.url, 1300, 190, 500);
        fitFont(ctx, 500, 40, MONO, s.short, 500, 22); ctx.fillStyle = C.white; ctx.textAlign = 'center';
        ctx.fillText(s.short, 1550, 760); ctx.textAlign = 'left';
        ctx.fillStyle = '#cfdccb'; font(ctx, 400, 28, SANS); ctx.textAlign = 'center';
        ctx.fillText('Sign up right after scanning,', 1550, 822);
        ctx.fillText('in the same browser. New accounts only.', 1550, 862); ctx.textAlign = 'left';
        ctx.fillStyle = '#9fb5aa'; font(ctx, 400, 24, SANS); ctx.fillText(COPY.discloseTrainer, 128, 1010);
      } },
    { id: 'handout', title: 'Printable handout', note: 'Letter size at 300 dpi. Print it or attach it to an email.', W: 2550, H: 3300,
      draw: function (ctx, s, W, H) {
        ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = C.deep; ctx.fillRect(0, 0, W, 560);
        brand(ctx, 200, 250, 110, true);
        ctx.fillStyle = '#cfdccb'; font(ctx, 400, 60, SANS); ctx.fillText('Checklists for California RCFEs and ARFs', 200, 400);
        ctx.fillStyle = C.deep; font(ctx, 700, 170, SERIF);
        var y = wrap(ctx, 'Your first DSS inspection, without guessing.', 200, 820, 2150, 185);
        var items = [
          ['Know what DSS will ask for.', 'The facility and staff requirements, with your own dates against them.'],
          ['Nothing expires unnoticed.', 'CPR, First Aid, TB, LiveScan and administrator dates, with a warning before each one lapses.'],
          ['Staff files in one place.', 'Staff records, training hours and documents. Every entry timestamped and tied to a person.'],
          ['Tello, the built-in assistant.', 'A plain-language briefing on what needs attention today.']
        ];
        y += 90;
        for (var i = 0; i < items.length; i++) {
          ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(225, y - 40, 22, 0, 7); ctx.fill();
          ctx.fillStyle = C.ink; font(ctx, 700, 70, SANS); ctx.fillText(items[i][0], 290, y);
          ctx.fillStyle = C.muted; font(ctx, 400, 58, SANS); y = wrap(ctx, items[i][1], 290, y + 85, 2050, 76) + 70;
        }
        var by = 2380; ctx.fillStyle = C.sage; rrect(ctx, 150, by, 2250, 700, 50); ctx.fill();
        qr(ctx, s.url, 220, by + 70, 560);
        ctx.fillStyle = C.deep; font(ctx, 700, 110, SERIF); ctx.fillText(s.days + ' days free', 880, by + 200);
        ctx.fillStyle = C.ink; font(ctx, 400, 56, SANS); ctx.fillText('through my link. No card to start.', 880, by + 290);
        fitFont(ctx, 500, 76, MONO, s.short, 1450, 36); ctx.fillStyle = C.pine; ctx.fillText(s.short, 880, by + 430);
        ctx.fillStyle = C.muted; font(ctx, 400, 44, SANS);
        ctx.fillText('After the trial: $29/month for one home, $79/month for up to five.', 880, by + 530);
        ctx.fillText(COPY.noPhi, 880, by + 600);
        ctx.fillStyle = C.muted; font(ctx, 400, 40, SANS);
        ctx.fillText(COPY.disclose + '  Questions: hello@title-22.com', 200, 3200);
      } },
    { id: 'email', title: 'Email signature banner', note: 'Shows at 600 × 150 (file is 2× for sharp screens). Link the image to your link.', W: 1200, H: 300,
      draw: function (ctx, s, W, H) {
        ctx.fillStyle = C.deep; rrect(ctx, 0, 0, W, H, 24); ctx.fill();
        brand(ctx, 50, 95, 44, true);
        ctx.fillStyle = C.white; font(ctx, 700, 50, SERIF); ctx.fillText('Getting ready for DSS?', 50, 170);
        ctx.fillStyle = '#cfdccb'; font(ctx, 400, 30, SANS); ctx.fillText('Try Title22 free for ' + s.days + ' days.', 50, 220);
        ctx.fillStyle = '#9fb5aa'; font(ctx, 400, 18, SANS); ctx.fillText(COPY.disclose, 50, 272);
        fitFont(ctx, 500, 30, MONO, s.short, 400, 18); ctx.fillStyle = C.gold; ctx.textAlign = 'right';
        ctx.fillText(s.short, 1150 - 0, 272); ctx.textAlign = 'left';
        qr(ctx, s.url, 950, 30, 200, 12);
      } },
    { id: 'follow', title: 'Follow Title22 card', note: 'For a class slide, a Story or a printout. Points to every Title22 account. 1080 × 1350.', W: 1080, H: 1350,
      draw: function (ctx, s, W, H) {
        ctx.fillStyle = C.deep; ctx.fillRect(0, 0, W, H);
        brand(ctx, 90, 150, 52, true);
        ctx.fillStyle = C.white; font(ctx, 700, 96, SERIF);
        var y = wrap(ctx, 'Follow Title22.', 90, 330, 900, 104);
        ctx.fillStyle = '#cfdccb'; font(ctx, 400, 40, SANS);
        y = wrap(ctx, 'Short how-to videos and DSS readiness tips for California care homes.', 90, y + 20, 880, 56);
        var nets = (window.T22_SOCIAL || []).filter(function (a) { return a.url; }).map(function (a) { return a.name; });
        if (nets.length) { ctx.fillStyle = C.gold; font(ctx, 600, 36, SANS); ctx.fillText(nets.join('  ·  '), 90, y + 40); }
        qr(ctx, 'https://title-22.com/follow/', 90, 760, 440);
        ctx.fillStyle = C.white; font(ctx, 700, 44, SANS); ctx.fillText('Scan to follow', 580, 900);
        fitFont(ctx, 500, 40, MONO, 'title-22.com/follow', 440, 22); ctx.fillStyle = C.gold; ctx.fillText('title-22.com/follow', 580, 970);
        ctx.fillStyle = '#9fb5aa'; font(ctx, 400, 30, SANS); ctx.fillText('Free trial through my link:', 580, 1070);
        fitFont(ctx, 500, 32, MONO, s.short, 440, 18); ctx.fillStyle = C.white; ctx.fillText(s.short, 580, 1120);
        ctx.fillStyle = '#9fb5aa'; font(ctx, 400, 24, SANS); ctx.fillText(COPY.disclose, 90, 1290);
      } },
    { id: 'qr', title: 'QR code', note: 'Your link as a QR code, for anything you print. 1200 × 1350.', W: 1200, H: 1350,
      draw: function (ctx, s, W, H) {
        ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
        qr(ctx, s.url, 100, 80, 1000, 60);
        fitFont(ctx, 500, 56, MONO, s.short, 1050, 26); ctx.fillStyle = C.deep; ctx.textAlign = 'center';
        ctx.fillText(s.short, 600, 1175);
        ctx.fillStyle = C.muted; font(ctx, 400, 30, SANS); ctx.fillText(COPY.disclose, 600, 1260); ctx.textAlign = 'left';
      } }
  ];

  /* ---------------- ready-to-send text ---------------- */
  function posts(s) {
    var L = s.url.replace('https://', '');
    var out = [
      { t: 'Caption for the 30-second video', when: 'Post with "Title22 in 30 seconds". On Instagram or TikTok, put the link in your bio or the first comment.',
        x: 'Licensing visits can come without warning. Title22 warns you before a CPR card, TB test or LiveScan lapses, shows a DSS readiness checklist with your own dates, and Tello tells you each morning, in plain words, what needs you today. It holds no resident health information.\n\n' + s.days + ' days free through my link, no card: ' + L + '\n\nFollow Title22 for short how-to videos: title-22.com/follow\n\n#ad I earn a commission if you subscribe. #RCFE #assistedliving #California' },
      { t: 'Facebook or LinkedIn post', when: 'Post with the square image or the Tello video.',
        x: 'If you run a care home in California, or you\'re about to, this is worth a look.\n\nTitle22 keeps staff files, training hours and clearances in one place, and warns you before a CPR card, TB test or LiveScan lapses. It holds no resident health information.\n\nThrough my link you get ' + s.days + ' days free, no card: ' + L + '\n\nFor short how-to videos, follow Title22: title-22.com/follow\n\nPartner link: I earn a commission if you subscribe.' },
      { t: 'Instagram or TikTok caption', when: 'Put the link in your bio or the first comment.',
        x: 'Getting ready for your first DSS visit? Title22 keeps staff records, training and clearances in one place and warns you before anything lapses. ' + s.days + ' days free through my link: ' + L + '\n\nFollow Title22 for short how-to videos: title-22.com/follow\n\n#ad I earn a commission if you subscribe. #RCFE #assistedliving #California' },
      { t: 'Text or DM to someone you know', when: 'One person at a time, someone who knows you.',
        x: 'Hi [name], you mentioned staff paperwork is a headache. Take a look at Title22. It tracks staff files, training and clearances and warns you before anything expires. My link gets you ' + s.days + ' days free, no card: ' + L + '\nShort how-to videos: follow Title22: title-22.com/follow\n(Full disclosure: I\'m a Title22 partner, so I earn a commission if you subscribe.)' },
      { t: 'Email', when: 'Subject: A tool for staff records before DSS visits',
        x: 'Hi [name],\n\nI wanted to pass along Title22. It keeps a care home\'s staff files, training hours and clearances in one place, shows the facility and staff requirements with your own dates against them, and warns you before a certification lapses. It holds no resident health information.\n\nIf you sign up through my link, the free trial is ' + s.days + ' days, with no card:\n' + s.url + '\n\nSign up right after opening the link, in the same browser, so the longer trial sticks.\n\nFor short how-to videos and DSS tips, follow Title22: title-22.com/follow\n\nFull disclosure: I\'m a Title22 partner and earn a commission if you subscribe.\n\n[your name]' }
    ];
    if (s.role === 'trainer') out.unshift(
      { t: 'Message to your class', when: 'Email or LMS announcement, and say it in class with the slide up.',
        x: 'Hi everyone,\n\nWe\'ll be practicing staff records and readiness in Title22. Sign up here before our next session:\n' + s.url + '\n\nOpen the link and sign up right away, in the same browser. Use an email that doesn\'t already have a Title22 account. You get ' + s.days + ' days free, no card, and a practice home with sample staff is ready inside.\n\nAlso follow Title22 for short how-to videos you can rewatch after class: title-22.com/follow\n\nI\'m a Title22 partner, so I earn a commission if you later subscribe. You never have to.\n\n[your name]' });
    return out;
  }

  /* ---------------- render ---------------- */
  var grid = $('kitGrid'), list = $('copyList'), items = [];
  FORMATS.forEach(function (f) {
    var box = document.createElement('div'); box.className = 'kit-item';
    var th = document.createElement('div'); th.className = 'thumb';
    var cv = document.createElement('canvas'); cv.width = f.W; cv.height = f.H;
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', f.title + ' preview');
    th.appendChild(cv);
    var h = document.createElement('h3'); h.textContent = f.title;
    var p = document.createElement('p'); p.textContent = f.note;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kit-btn'; b.textContent = 'Download PNG';
    b.addEventListener('click', function () {
      var s = state(); if (!s.code) { codeEl.focus(); codeEl.setAttribute('aria-invalid', 'true'); return; }
      cv.toBlob(function (blob) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'title22-' + f.id + '-' + s.code + '.png'; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      }, 'image/png');
    });
    box.appendChild(th); box.appendChild(h); box.appendChild(p); box.appendChild(b);
    grid.appendChild(box); items.push({ f: f, cv: cv, btn: b });
  });

  function copy(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} t.remove(); }
  }

  function renderPosts(s) {
    list.innerHTML = '';
    posts(s).forEach(function (p, i) {
      var d = document.createElement('div'); d.className = 'copy-card';
      var h = document.createElement('h3'); h.textContent = p.t;
      var w = document.createElement('p'); w.className = 'when'; w.textContent = p.when;
      var ta = document.createElement('textarea'); ta.value = p.x; ta.id = 'post' + i; ta.setAttribute('aria-label', p.t);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'kit-btn ghost'; b.textContent = 'Copy text';
      b.addEventListener('click', function () { copy(ta.value, b); });
      d.appendChild(h); d.appendChild(w); d.appendChild(ta); d.appendChild(b); list.appendChild(d);
    });
  }

  function render() {
    var s = state();
    $('linkText').textContent = s.short;
    items.forEach(function (it) {
      var ctx = it.cv.getContext('2d'); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.clearRect(0, 0, it.f.W, it.f.H); it.f.draw(ctx, s, it.f.W, it.f.H);
      it.btn.disabled = !s.code; it.btn.title = s.code ? '' : 'Type your code first';
    });
    renderPosts(s);
    try { localStorage.setItem('t22kit', JSON.stringify({ c: codeEl.value, d: daysEl.value, r: roleEl.value })); } catch (e) {}
  }

  $('copyLink').addEventListener('click', function () { copy(state().url, this); });
  try {
    var q = new URLSearchParams(location.search), saved = JSON.parse(localStorage.getItem('t22kit') || '{}');
    codeEl.value = q.get('code') || saved.c || '';
    if (saved.d) daysEl.value = saved.d;
    if (q.get('role') || saved.r) roleEl.value = q.get('role') || saved.r;
  } catch (e) {}
  var timer;
  [codeEl, daysEl, roleEl].forEach(function (el) {
    el.addEventListener('input', function () { codeEl.removeAttribute('aria-invalid'); clearTimeout(timer); timer = setTimeout(render, 150); });
    el.addEventListener('change', render);
  });

  var fonts = ['700 40px "Zilla Slab"', '400 20px "Public Sans"', '700 20px "Public Sans"', '500 20px "IBM Plex Mono"'];
  render();
  if (document.fonts && document.fonts.load) Promise.all(fonts.map(function (f) { return document.fonts.load(f); })).then(render, render);
})();
