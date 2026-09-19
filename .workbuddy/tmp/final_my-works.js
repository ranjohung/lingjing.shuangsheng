
document.addEventListener('click', function (e) {
  var el = e.target;
  while (el && el.nodeType === 1 && el.tagName !== 'A') el = el.parentElement;
  if (!el || el.tagName !== 'A') return;
  var h = el.getAttribute('href') || '';
  if (h.charAt(0) === '#') {
    if (h.length > 1) {
      e.preventDefault();
      var t = document.getElementById(h.slice(1));
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { window.dispatchEvent(new Event('hashchange')); } catch (err) {}
    }
    return;
  }
  if (!h || /^[a-zA-Z][\w+.\-]*:/.test(h)) return;
  if (/([\w.\-]+)\.html(\?|#|$)/.test(h)) {
    e.preventDefault();
    window.LJNav(h);
  }
}, true);
