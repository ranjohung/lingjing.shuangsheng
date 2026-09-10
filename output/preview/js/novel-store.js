/* v5.12 — 本地小说存储层（localStorage CRUD）
   一个 key = 一本小说
   每个 novel 含完整 plotTree
*/
(function () {
  const KEY_PREFIX = 'ljss_novel_v1_';
  const INDEX_KEY = 'ljss_novel_index_v1';

  function loadIndex() {
    try {
      return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    } catch (e) { return []; }
  }
  function saveIndex(arr) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(arr));
  }

  function loadNovel(id) {
    try {
      return JSON.parse(localStorage.getItem(KEY_PREFIX + id));
    } catch (e) { return null; }
  }
  function saveNovel(plot) {
    if (!plot || !plot.novel || !plot.novel.id) return false;
    localStorage.setItem(KEY_PREFIX + plot.novel.id, JSON.stringify(plot));
    const idx = loadIndex();
    const idxEntry = {
      id: plot.novel.id,
      title: plot.novel.title,
      author: plot.novel.author,
      genre: plot.novel.genre,
      uploadedAt: plot.novel.uploadedAt,
      chars: plot.chars.length,
      nodes: Object.keys(plot.nodes).length,
      endings: Object.keys(plot.endings).length,
      highlights: (plot.highlights || []).length,
      chapters: plot.novel.chapters.length
    };
    const ex = idx.findIndex(e => e.id === idxEntry.id);
    if (ex >= 0) idx[ex] = { ...idx[ex], ...idxEntry };
    else idx.push(idxEntry);
    saveIndex(idx);
    return true;
  }
  function deleteNovel(id) {
    localStorage.removeItem(KEY_PREFIX + id);
    const idx = loadIndex().filter(e => e.id !== id);
    saveIndex(idx);
    return true;
  }

  function listNovels() {
    return loadIndex();
  }
  function listByGenre(genreId) {
    return loadIndex().filter(e => e.genre === genreId);
  }
  function countNovels() {
    return loadIndex().length;
  }
  function countByGenre(genreId) {
    return loadIndex().filter(e => e.genre === genreId).length;
  }

  // 调试用 — 列出全部
  function dump() {
    const items = loadIndex();
    return items.map(e => ({
      ...e,
      text: loadNovel(e.id)?.novel?.text?.slice(0, 200) + '...'
    }));
  }

  // 全清（慎用）
  function clearAll() {
    const idx = loadIndex();
    for (const e of idx) localStorage.removeItem(KEY_PREFIX + e.id);
    localStorage.removeItem(INDEX_KEY);
  }

  window.NovelStore = {
    loadNovel, saveNovel, deleteNovel,
    listNovels, listByGenre, countNovels, countByGenre,
    dump, clearAll, KEY_PREFIX, INDEX_KEY
  };
  console.log('[v5.12] novel-store 加载完成');
})();
