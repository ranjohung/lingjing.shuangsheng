
window.__LJ_PAGE__ = "my-works";
window.__LJ_PARAMS__ = __LJ_QS__;
window.__LJ_HASHV__ = __LJ_HASH__;
window.LJSearch = function () { var v = window.__LJ_PARAMS__; return v ? v : location.search; };
window.LJHashVal = function () { var v = window.__LJ_HASHV__; return v ? v : location.hash; };
window.LJNav = function (url) {
  if (typeof url === 'string') {
    var m = /([\w.\-]+)\.html(\?[^#]*)?(#.*)?$/.exec(url);
    if (m) {
      try { parent.postMessage({ lj: 'go', id: m[1], qs: m[2] || '', hash: m[3] || '' }, '*'); return; } catch (err) {}
    }
    try { parent.LJ.goUrl(url); return; } catch (err2) {}
  }
  location.href = url;
};
window.LJBack = function () {
  try { parent.postMessage({ lj: 'back' }, '*'); } catch (err) { history.back(); }
};
