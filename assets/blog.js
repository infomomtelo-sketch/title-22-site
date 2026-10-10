/* Blog search and topic filter. Searches the full text of every post
   (blog/search-index.json) and keeps the filter in the address bar, so
   title-22.com/blog/?q=ombudsman or ?topic=arf can be shared as a link. */
(function () {
  'use strict';
  var list = document.getElementById('post-list'); if (!list) return;
  var input = document.getElementById('blog-q');
  var count = document.getElementById('blog-count');
  var empty = document.getElementById('blog-empty');
  var chips = [].slice.call(document.querySelectorAll('.topic-chips button'));
  var items = [].slice.call(list.querySelectorAll('li'));
  var full = {}; // slug -> lowercased article text
  var topic = 'all';

  function slugOf(li) { var m = li.querySelector('h3 a').getAttribute('href').match(/\/blog\/([^/]+)\//); return m ? m[1] : ''; }
  function norm(s) { return (s || '').toLowerCase().replace(/[‘’]/g, "'"); }

  function apply(push) {
    var words = norm(input.value).split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (li) {
      var text = norm(li.textContent) + ' ' + (full[slugOf(li)] || '');
      var okTopic = topic === 'all' || (' ' + li.getAttribute('data-topics') + ' ').indexOf(' ' + topic + ' ') !== -1;
      var okWords = words.every(function (w) { return text.indexOf(w) !== -1; });
      li.hidden = !(okTopic && okWords);
      if (!li.hidden) shown++;
    });
    empty.hidden = shown !== 0;
    count.textContent = (words.length || topic !== 'all') ? shown + (shown === 1 ? ' post' : ' posts') : '';
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-topic') === topic ? 'true' : 'false'); });
    if (push && window.history && history.replaceState) {
      var p = new URLSearchParams();
      if (input.value.trim()) p.set('q', input.value.trim());
      if (topic !== 'all') p.set('topic', topic);
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }
  }

  var params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';
  var t = params.get('topic');
  if (t && chips.some(function (c) { return c.getAttribute('data-topic') === t; })) topic = t;

  input.addEventListener('input', function () { apply(true); });
  input.form.addEventListener('submit', function (e) { e.preventDefault(); apply(true); });
  chips.forEach(function (c) { c.addEventListener('click', function () { topic = c.getAttribute('data-topic'); apply(true); }); });

  apply(false);
  fetch('/blog/search-index.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
    rows.forEach(function (r) { full[r.slug] = norm(r.text); });
    apply(false);
  }).catch(function () { /* titles and summaries still search without it */ });
})();
