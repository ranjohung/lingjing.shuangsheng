/* v5.17 — 伏笔台账系统
   伏笔是"埋坑"和"填坑"的对应关系。

   伏笔台账 8 字段：
     1. 伏笔编号（F001）
     2. 伏笔内容（埋下了什么线索）
     3. 埋设章节（第几章埋下的）
     4. 预计回收章节（计划在第几章回收）
     5. 伏笔类型（物件伏笔/语言伏笔/关系伏笔/规则伏笔/谎言伏笔）
     6. 重要度（高/中/低，对应数字 0.91 / 0.75 / 0.62）
     7. 状态（已埋设/已暗示/已揭示/已回收）
     8. 回收章节（实际回收章节）

   伏笔提醒算法：
     当作者写到第 N 章时，系统自动检查：
       - 找出所有"已埋设/已暗示"状态的伏笔
       - 找出"预计回收章节 ≤ N + 10"且尚未回收的伏笔
       - 按重要度排序，列出前 N 条
     输出示例：
       ⚠️ 伏笔提醒
       你有 3 个伏笔尚未回收：
       - F001「神秘戒指」：第12章埋设，重要度 0.91，建议未来10章内推进
       - F003「师父的异常反应」：第8章埋设，重要度 0.75
       - F007「陌生人的口音」：第20章埋设，重要度 0.62
*/
(function () {
  if (window.Foreshadowing) return;

  const TYPES = ['物件伏笔', '语言伏笔', '关系伏笔', '规则伏笔', '谎言伏笔'];
  const STATUSES = ['已埋设', '已暗示', '已揭示', '已回收'];

  // ====== 伏笔添加 ======
  function add(novelId, f) {
    if (!window.DB || !window.DB.foreshadow) return null;
    const all = window.DB.foreshadow.list();
    const existing = all.find(r => r.novel_id === novelId && r.foreshadow_id === f.foreshadow_id);
    const row = {
      id: existing?.id,
      novel_id: novelId,
      creator_id: 'self',
      importance: f.importance || 0.5,
      status: f.status || '已埋设',
      ...f
    };
    return window.DB.foreshadow.put(row);
  }

  function list(novelId) {
    if (!window.DB || !window.DB.foreshadow) return [];
    return window.DB.foreshadow.list()
      .filter(r => r.novel_id === novelId)
      .sort((a, b) => (b.importance || 0) - (a.importance || 0));
  }

  function get(novelId, foreshadowId) {
    return list(novelId).find(r => r.foreshadow_id === foreshadowId);
  }

  // ====== 伏笔回收 ======
  function recover(novelId, foreshadowId, recoverChapter) {
    return add(novelId, {
      foreshadow_id: foreshadowId,
      status: '已回收',
      recovered_chapter: recoverChapter
    });
  }

  // ====== 伏笔提醒（核心算法） ======
  function getReminders(novelId, currentChapter, lookahead = 10, topN = 5) {
    const all = list(novelId);
    const open = all.filter(r => r.status !== '已回收' && r.status !== '已揭示');
    const candidates = open.filter(r => {
      const expected = parseInt(r.expected_recover_chapter) || 999;
      return expected <= currentChapter + lookahead;
    });
    return candidates
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, topN);
  }

  // ====== 伏笔回收率计算 ======
  function getPayoffRate(novelId) {
    const all = list(novelId);
    if (all.length === 0) return 1.0;
    const recovered = all.filter(r => r.status === '已回收' || r.status === '已揭示').length;
    return recovered / all.length;
  }

  // ====== 伏笔类型分布 ======
  function getTypeDistribution(novelId) {
    const all = list(novelId);
    const dist = {};
    TYPES.forEach(t => dist[t] = 0);
    all.forEach(r => {
      const t = r.foreshadow_type || '物件伏笔';
      dist[t] = (dist[t] || 0) + 1;
    });
    return dist;
  }

  // ====== 自动生成下一个伏笔编号 ======
  function nextForeshadowId(novelId, prefix = 'F') {
    const all = list(novelId);
    const maxNum = all.reduce((max, r) => {
      const m = (r.foreshadow_id || '').match(/\d+/);
      return m ? Math.max(max, parseInt(m[0])) : max;
    }, 0);
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }

  // ====== AI 辅助生成伏笔内容 ======
  const AI_TEMPLATES = {
    '物件伏笔': () => shuffleAndPick([
      '神秘戒指上的刻字', '一把断剑', '一张泛黄的照片', '一只不寻常的信鸽',
      '师父临终留下的玉佩', '敌国王室的徽章', '一瓶不知名的药',
      '一封没有署名的信', '一枚从未见过的钱币'
    ], 4),
    '语言伏笔': () => shuffleAndPick([
      '"我们还会再见的"——某位看似不重要的配角', '反派的一句双关语',
      '师父临死前的最后一句话', '主角无意间说出口的预言',
      '酒馆里一位说书人讲的故事', '女主角的奇怪誓言'
    ], 3),
    '关系伏笔': () => shuffleAndPick([
      '主角与反派的血缘暗示', '师父与反派的过往',
      '女主角的真实身份', '一个看似路人的真实身份',
      '两位配角之间隐藏的师徒关系'
    ], 3),
    '规则伏笔': () => shuffleAndPick([
      '看似无关的世界规则（实际是关键能力）',
      '主角违反规则后的"巧合"',
      '某个看似公平实则有破绽的协议',
      '一处违反常理的地理设定'
    ], 3),
    '谎言伏笔': () => shuffleAndPick([
      '师父告诉主角的"真相"其实是谎言',
      '历史书中被刻意抹去的事件',
      '一个被广泛相信的"常识"其实是谬误',
      '主角对自己的误解（以为自己没救过人）'
    ], 3)
  };

  function generateForeshadow(type) {
    const gen = AI_TEMPLATES[type] || AI_TEMPLATES['物件伏笔'];
    return gen()[0];
  }

  function shuffleAndPick(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  window.Foreshadowing = {
    TYPES,
    STATUSES,
    add,
    list,
    get,
    recover,
    getReminders,
    getPayoffRate,
    getTypeDistribution,
    nextForeshadowId,
    generateForeshadow
  };

  console.log('[v5.17] Foreshadowing 加载完成 · 伏笔台账 + 自动提醒');
})();
