
window.__LJ_PARAMS__ = __LJ_QS__;
window.__LJ_HASHV__ = __LJ_HASH__;
window.LJNav = function (url) {
  try { parent.postMessage({ lj: 'nav', url: url }, '*'); } catch (e) { location.href = url; }
};
