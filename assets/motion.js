/* title-22.com — entry and hand-off animations.

   Two moments, in the same drawing style as the homepage's "The story, in
   four steps" and the readiness dial in "Ten seconds, not ten paragraphs":

   1. ENTRY. The first page a visitor lands on in a visit — whichever page,
      from search, a typed address or a shared link — opens with the four
      story icons drawing themselves in, then fades to the page. Once per
      visit (sessionStorage), so moving between pages does not replay it.
      Any tap, key or scroll skips it. About 1.8s untouched.

   2. HAND-OFF. Every plain click on a link to title22.app ("Open Title22",
      the trial buttons, anything) shows the readiness dial sweeping up while
      the app loads. The navigation starts at 450ms and the dial keeps moving
      while the browser fetches the app, so it covers load time rather than
      adding to it.

   Rules this file keeps:
   - It never decides WHERE a link goes. The href is read at click time, so
     the homepage's ?ref= forwarder (which rewrites hrefs) still wins.
   - New-tab clicks (ctrl/cmd/shift/middle, target=_blank) are left alone.
   - prefers-reduced-motion: nothing here runs at all.
   - If anything throws, the page behaves exactly as it did without this file:
     the entry overlay removes itself on a timer, and a hand-off that fails
     before preventDefault is an ordinary link.
   - Decoration only: both overlays are aria-hidden and hold no content a
     reader needs. The page is fully rendered underneath.

   Loaded as the FIRST element of <body>, synchronously, so the entry overlay
   is in place before the first paint — with `defer` the page would flash and
   then be covered. */
(function () {
  'use strict';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce || !document.body) return;

  var ICONS = [
    'M16 12 h32 v8 h-32 Z M16 26 h32 v8 h-32 Z M16 40 h32 v8 h-32 Z',
    'M14 8 h36 v48 h-36 Z M20 20 l4 4 l8 -8 M20 34 l4 4 l8 -8 M20 48 l4 4 l8 -8',
    'M32 6 L54 15 V32 C54 46 44 55 32 59 C20 55 10 46 10 32 V15 Z M21 32 l7 7 l15 -16',
    'M8 42 h12 v-11 l-6 -6 l-6 6 Z M26 48 h12 v-11 l-6 -6 l-6 6 Z M44 42 h12 v-11 l-6 -6 l-6 6 Z M20 40 L26 40 M38 40 L44 40'
  ];
  var LABELS = ['Binders', 'One record', 'Current daily', 'Every home'];

  var css =
    '.t22m{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;gap:1.4rem;padding:1rem;background:#fbf7f0;color:#1e5748;' +
      'font-family:"Public Sans",-apple-system,"Segoe UI",sans-serif;transition:opacity .35s ease}' +
    '.t22m.out{opacity:0;pointer-events:none}' +
    '.t22m-brand{font-family:"Zilla Slab",Georgia,serif;font-weight:700;font-size:1.6rem;color:#143c31;' +
      'opacity:0;animation:t22mUp .45s ease forwards}' +
    '.t22m-brand span{color:#e8a33d}' +
    '.t22m-row{display:flex;align-items:flex-start;gap:.35rem;max-width:100%}' +
    '.t22m-step{display:flex;flex-direction:column;align-items:center;gap:.35rem;width:4rem}' +
    '.t22m-step svg{width:2.6rem;height:2.6rem}' +
    '.t22m-step path{fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;' +
      'stroke-linejoin:round;stroke-dasharray:300;stroke-dashoffset:300;animation:t22mDraw .5s ease forwards}' +
    '.t22m-step small{font-size:.72rem;color:#5b6a63;text-align:center;line-height:1.2;opacity:0;' +
      'animation:t22mUp .35s ease forwards}' +
    '.t22m-line{flex:0 0 .7rem;margin-top:1.3rem;border-top:2px dashed #d8e2dc;opacity:0;' +
      'animation:t22mFade .25s ease forwards}' +
    '.t22m-dial{position:relative;width:7.5rem;height:7.5rem;display:grid;place-items:center}' +
    '.t22m-dial svg{position:absolute;inset:0;width:100%;height:100%}' +
    '.t22m-arc{stroke-dasharray:314;stroke-dashoffset:91;animation:t22mDial 1.1s cubic-bezier(.2,.7,.3,1) forwards}' +
    '.t22m-num{font-family:"IBM Plex Mono",monospace;font-size:1.5rem;font-weight:500;color:#1e5748}' +
    '.t22m-msg{font-size:.95rem;color:#5b6a63;opacity:0;animation:t22mUp .35s ease .15s forwards}' +
    '@keyframes t22mDraw{to{stroke-dashoffset:0}}' +
    '@keyframes t22mUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
    '@keyframes t22mFade{to{opacity:1}}' +
    '@keyframes t22mDial{to{stroke-dashoffset:19}}';   /* 71% -> 94% of 314 */

  var style = document.createElement('style');
  style.textContent = css;
  (document.head || document.body).appendChild(style);

  function svgIcon(d) {
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  /* ── 1. ENTRY ─────────────────────────────────────────────────────────── */
  var seen = '1';
  try { seen = sessionStorage.getItem('t22_intro'); sessionStorage.setItem('t22_intro', '1'); } catch (e) {}
  // Storage unavailable reads as "seen": better no intro than one on every page.
  if (!seen) {
    var html = '<div class="t22m-brand">title<span>-22</span>.com</div><div class="t22m-row">';
    for (var i = 0; i < 4; i++) {
      var t = 0.25 + i * 0.28;
      if (i) html += '<div class="t22m-line" style="animation-delay:' + (t - 0.1).toFixed(2) + 's"></div>';
      html += '<div class="t22m-step">' +
        svgIcon(ICONS[i]).replace('<path ', '<path style="animation-delay:' + t.toFixed(2) + 's" ') +
        '<small style="animation-delay:' + (t + 0.2).toFixed(2) + 's">' + LABELS[i] + '</small></div>';
    }
    html += '</div>';
    var intro = document.createElement('div');
    intro.className = 't22m t22m-intro';
    intro.setAttribute('aria-hidden', 'true');
    intro.innerHTML = html;
    document.body.insertBefore(intro, document.body.firstChild);

    var gone = false;
    var dismiss = function () {
      if (gone) return;
      gone = true;
      intro.classList.add('out');
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 400);
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
        window.removeEventListener(ev, dismiss, true);
      });
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, dismiss, { capture: true, passive: true });
    });
    setTimeout(dismiss, 1800);
  }

  /* ── 2. HAND-OFF to title22.app ───────────────────────────────────────── */
  var leaving = null;

  function handoff() {
    var o = document.createElement('div');
    o.className = 't22m t22m-handoff';
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML =
      '<div class="t22m-dial">' +
        '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#d8e2dc" stroke-width="10"/>' +
        '<circle class="t22m-arc" cx="60" cy="60" r="50" fill="none" stroke="#1e5748" stroke-width="10" ' +
        'stroke-linecap="round" transform="rotate(-90 60 60)"/></svg>' +
        '<div class="t22m-num"><span>71</span>%</div>' +
      '</div>' +
      '<div class="t22m-msg">Opening Title22…</div>';
    document.body.appendChild(o);
    var num = o.querySelector('.t22m-num span'), n = 71;
    var timer = setInterval(function () {
      n++; num.textContent = n;
      if (n >= 94) clearInterval(timer);
    }, 1000 / 23);
    return o;
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || leaving) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.hostname !== 'title22.app') return;
    e.preventDefault();
    leaving = handoff();
    var dest = url.toString();
    setTimeout(function () { location.assign(dest); }, 450);
  });

  // Back button from the app restores this page from the back/forward cache
  // with the overlay still up. Take it down so the page is usable.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && leaving) {
      if (leaving.parentNode) leaving.parentNode.removeChild(leaving);
      leaving = null;
    }
  });
})();
