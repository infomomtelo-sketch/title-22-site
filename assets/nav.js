/* Opens one dropdown at a time: click/tap on any device, hover on a mouse. */
(function () {
  'use strict';
  var nav = document.querySelector('.t22nav'); if (!nav) return;
  var burger = document.querySelector('.t22burger');
  // Drawn icons, not the old ☰ / ✕ characters, which some phones show as emoji.
  var OPEN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var groups = [].slice.call(nav.querySelectorAll('.grp'));
  var hover = window.matchMedia('(hover: hover) and (min-width: 60.01rem)');
  function close(except) { groups.forEach(function (g) { if (g !== except) { g.classList.remove('open'); g.querySelector('.top').setAttribute('aria-expanded', 'false'); } }); }
  groups.forEach(function (g) {
    var btn = g.querySelector('.top'), t;
    btn.addEventListener('click', function (e) {
      e.preventDefault(); var open = hover.matches ? true : !g.classList.contains('open'); close(g);
      g.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    g.addEventListener('mouseenter', function () { if (!hover.matches) return; clearTimeout(t); close(g); g.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); });
    g.addEventListener('mouseleave', function () { if (!hover.matches) return; t = setTimeout(function () { g.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }, 180); });
  });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target) && e.target !== burger) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  if (burger) burger.addEventListener('click', function () {
    var show = !nav.classList.contains('show'); nav.classList.toggle('show', show);
    burger.setAttribute('aria-expanded', show ? 'true' : 'false'); burger.innerHTML = show ? CLOSE : OPEN;
  });
})();
