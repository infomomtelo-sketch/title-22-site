/* Title22 social accounts, in one place.
   Add a URL to turn an account on everywhere: the footer "Follow" row on
   every page, /follow/, and the partner kit. Leave url '' to hide it. */
window.T22_SOCIAL = [
  { id: 'facebook',  name: 'Facebook',  url: 'https://www.facebook.com/profile.php?id=61593807941065' },
  { id: 'youtube',   name: 'YouTube',   url: 'https://www.youtube.com/@title22app' },
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/title22app/' },
  { id: 'tiktok',    name: 'TikTok',    url: 'https://www.tiktok.com/@title22529' },
  { id: 'linkedin',  name: 'LinkedIn',  url: '' }
];

(function () {
  'use strict';
  var ICON = {
    facebook: 'M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z',
    youtube: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9L15.5 12l-5.7 3.1z',
    instagram: 'M12 7.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm4.9-9a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM12 2.2c-2.7 0-3 0-4 .1a6.6 6.6 0 0 0-2.4.4 4.9 4.9 0 0 0-2.8 2.8 6.6 6.6 0 0 0-.5 2.5c-.1 1-.1 1.3-.1 4s0 3 .1 4a6.6 6.6 0 0 0 .5 2.4 4.9 4.9 0 0 0 2.8 2.8 6.6 6.6 0 0 0 2.4.5c1 0 1.3.1 4 .1s3 0 4-.1a6.6 6.6 0 0 0 2.4-.5 4.9 4.9 0 0 0 2.8-2.8 6.6 6.6 0 0 0 .5-2.4c0-1 .1-1.3.1-4s0-3-.1-4a6.6 6.6 0 0 0-.5-2.4 4.9 4.9 0 0 0-2.8-2.8 6.6 6.6 0 0 0-2.4-.5c-1-.1-1.3-.1-4-.1zm0 1.8c2.6 0 2.9 0 4 .1a4.6 4.6 0 0 1 1.7.3 3 3 0 0 1 1.7 1.7 4.6 4.6 0 0 1 .3 1.7c.1 1 .1 1.3.1 4s0 2.9-.1 4a4.6 4.6 0 0 1-.3 1.7 3 3 0 0 1-1.7 1.7 4.6 4.6 0 0 1-1.7.3c-1 .1-1.3.1-4 .1s-2.9 0-4-.1a4.6 4.6 0 0 1-1.7-.3 3 3 0 0 1-1.7-1.7 4.6 4.6 0 0 1-.3-1.7c-.1-1-.1-1.3-.1-4s0-2.9.1-4a4.6 4.6 0 0 1 .3-1.7 3 3 0 0 1 1.7-1.7 4.6 4.6 0 0 1 1.7-.3c1-.1 1.3-.1 4-.1z',
    tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6 2.6 2.6 0 0 1 .8.1V9.7a5.8 5.8 0 1 0 4.9 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z',
    linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1a4.2 4.2 0 0 1 3.8-2c4 0 4.8 2.6 4.8 6.1V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z'
  };
  function live() { return window.T22_SOCIAL.filter(function (a) { return a.url; }); }
  function link(a, withLabel) {
    var el = document.createElement('a');
    el.href = a.url; el.target = '_blank'; el.rel = 'noopener';
    el.className = 't22-follow-link'; el.setAttribute('aria-label', 'Title22 on ' + a.name);
    el.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="' + ICON[a.id] + '"/></svg>' +
      (withLabel ? '<span>' + a.name + '</span>' : '');
    el.addEventListener('click', function () {
      try { if (window.gtag) window.gtag('event', 'follow_click', { network: a.id }); } catch (e) {}
    });
    return el;
  }
  window.T22_renderFollow = function (el, withLabel) {
    var acc = live(); el.innerHTML = ''; if (!acc.length) { el.hidden = true; return; }
    acc.forEach(function (a) { el.appendChild(link(a, withLabel)); });
  };

  var css = document.createElement('style');
  css.textContent =
    '.t22-follow{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;margin-top:.9rem}' +
    '.t22-follow .lbl{font-size:.85rem;color:var(--muted,#5b6a63);margin-right:.2rem}' +
    '.t22-follow-link{display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .7rem;border:1px solid var(--line,#d8e2dc);border-radius:999px;color:var(--pine,#1e5748);text-decoration:none;font-size:.88rem;font-weight:600;background:var(--white,#fff)}' +
    '.t22-follow-link:hover{border-color:var(--pine,#1e5748)}' +
    '.site-foot .t22-follow{flex-basis:100%;margin-top:0}';
  document.head.appendChild(css);

  function init() {
    document.querySelectorAll('[data-t22-follow]').forEach(function (el) {
      window.T22_renderFollow(el, el.getAttribute('data-t22-follow') === 'labels');
    });
    var foot = document.querySelector('footer.site-foot .wrap');
    if (foot && !foot.querySelector('.t22-follow') && live().length) {
      var row = document.createElement('div'); row.className = 't22-follow';
      var l = document.createElement('span'); l.className = 'lbl'; l.textContent = 'Follow Title22:';
      row.appendChild(l); live().forEach(function (a) { row.appendChild(link(a, false)); });
      foot.appendChild(row);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
