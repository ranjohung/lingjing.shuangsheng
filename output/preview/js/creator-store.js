/* =====================================================================
 * 灵境 · 双生 — V23 创作功能区共享数据层 (creator-store.js)
 * 键：lingjing_v523_creator_v1（自有数据）+ lingjing_v520_wallet（灵晶，只读写余额字段）
 * 职责：
 *   1. 免费额度系统（V3.0 §2.2：智能体周10/图片日3/视频月1/声音日5/音色首次/灵念日1/Agent月3）
 *   2. 超额灵晶扣费（联动 lingjing_v520_wallet.crystal）
 *   3. 作品库（小说/角色/道具/场景）+ 互动管理四模块 + 动态/灵念/Agent行为
 *   4. 创作者等级（V3.0 §4.2 L1-L5）
 * 铁律：不接真支付；Toast 替代 alert；第三方名 0 出现
 * ===================================================================== */
window.CreatorStore = (function () {
  var KEY = 'lingjing_v523_creator_v1';
  var COIN_KEY = 'lingjing_v520_wallet';

  /* ---------- 额度配置（V3.0 §2.2）---------- */
  var QUOTAS = {
    agent:         { label: '创建智能体', limit: 10,  window: 'week',  cost: 0   },
    image:         { label: '创建图片',   limit: 3,   window: 'day',   cost: 20  },
    video:         { label: '创建视频',   limit: 1,   window: 'month', cost: 200 },
    sound:         { label: '创建声音',   limit: 5,   window: 'day',   cost: 10  },
    voiceClone:    { label: '复刻音色',   limit: 1,   window: 'ever',  cost: 50  },
    post:          { label: '创建动态',   limit: 999, window: 'day',   cost: 0   },
    card:          { label: '创建灵念',   limit: 1,   window: 'day',   cost: 30  },
    agentBehavior: { label: 'Agent 创建', limit: 3,   window: 'month', cost: 100 }
  };

  /* ---------- 基础存储 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return seed();
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }
  function seed() {
    var d = {
      quotaUse: {},           // {kind: {windowKey: count}}
      voiceCloneDone: false,  // 音色复刻首次免费标记
      works: [                // 预置演示作品（V3.0 §4.1 示例 · 仅公版名著）
        { id: 'w_novel', type: 'novel', title: '《西游记》', status: '已发布',
          words: '86.2万字', readers: '1.2万阅读', score: '4.8', income: 8400 },
        { id: 'w_char', type: 'character', title: '角色：孙悟空', status: '已发布',
          desc: '3,200次使用', income: 1800 },
        { id: 'w_prop', type: 'prop', title: '道具：如意金箍棒', status: '已发布',
          desc: '580次购买', income: 2600 }
      ],
      interactions: {         // 互动管理四模块（V3.0 §4.3）{charId: {kind: [items]}} · 示例仅公版角色
        char_wukong: {
          scenes: [
            { id: 's1', name: '和TA一起回水帘洞', open: '花果山飞瀑前，TA招手邀你进洞天',
              choices: 3, ending: '游览后各自归去，关系+2', rel: '+2' }
          ],
          events: [
            { id: 'e1', name: 'TA今天打了一件不平事', trigger: '亲密度≥30 · 上次互动>1天',
              content: 'TA主动发来消息，语气比平日更爽利', options: 3, result: '倾听后关系+3' }
          ],
          fragments: [
            { id: 'f1', name: 'TA的学艺记忆', unlock: '亲密度≥60', content: '一段可互动的回忆',
              options: 2, impact: '解锁隐藏对话' }
          ],
          missions: [
            { id: 'm1', name: '帮TA找回落海的兵器', goal: '找回沉入东海的趁手兵刃', nodes: 3,
              reward: '关系值+5 · 解锁新互动' }
          ]
        }
      },
      posts: [],              // 动态
      cards: [],              // 灵念卡牌
      behaviors: [],          // Agent 行为
      media: [],              // 生成记录（图/视频/声音）
      income: 12800,          // 总收益（灵晶）
      pending: 3200           // 待结算
    };
    save(d);
    return d;
  }

  /* ---------- 时间窗口键 ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function windowKey(w) {
    var t = new Date();
    if (w === 'day') return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
    if (w === 'month') return t.getFullYear() + '-' + pad(t.getMonth() + 1);
    if (w === 'ever') return 'ever';
    if (w === 'week') { // ISO 周（周四定界）
      var d = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
      var day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - day);
      var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      var wk = Math.ceil((((d - y0) / 86400000) + 1) / 7);
      return d.getUTCFullYear() + '-W' + pad(wk);
    }
    return 'na';
  }

  /* ---------- 灵晶（只读写 lingjing_v520_wallet 的 crystal 字段）---------- */
  function getCoins() {
    try {
      var c = JSON.parse(localStorage.getItem(COIN_KEY) || '{}');
      if (typeof c.crystal !== 'number') { c.crystal = 8888; c.jade = c.jade || 60; }
      return c;
    } catch (e) { return { crystal: 8888, jade: 60 }; }
  }
  function setCoins(c) {
    try { localStorage.setItem(COIN_KEY, JSON.stringify(c)); } catch (e) {}
  }

  /* ---------- Toast（铁律 #10：替代 alert/confirm）---------- */
  function toast(kind, title, msg) {
    var t = document.getElementById('lj-creator-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'lj-creator-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);' +
        'z-index:9999;max-width:86%;padding:12px 18px;border-radius:14px;font-size:13px;' +
        'line-height:1.5;color:#fff;background:rgba(26,26,46,.94);border:1px solid rgba(233,69,96,.4);' +
        'box-shadow:0 8px 30px rgba(0,0,0,.35);opacity:0;transition:opacity .25s;pointer-events:none;text-align:center';
      (document.body || document.documentElement).appendChild(t);
    }
    var icon = kind === 'ok' ? '✅ ' : kind === 'warn' ? '⚠️ ' : 'ℹ️ ';
    t.innerHTML = icon + '<b>' + title + '</b>' + (msg ? '<br><span style="opacity:.8;font-size:12px">' + msg + '</span>' : '');
    t.style.opacity = '1';
    clearTimeout(toast._tm);
    toast._tm = setTimeout(function () { t.style.opacity = '0'; }, 2600);
  }

  /* ---------- 额度查询 ---------- */
  function quotaInfo(kind) {
    var q = QUOTAS[kind];
    if (!q) return null;
    var d = load();
    var wk = windowKey(q.window);
    var used = (d.quotaUse[kind] && d.quotaUse[kind][wk]) || 0;
    var unlimited = kind === 'post';
    return {
      kind: kind, label: q.label, used: used,
      limit: unlimited ? '∞' : q.limit,
      remaining: unlimited ? '∞' : Math.max(0, q.limit - used),
      freeLeft: Math.max(0, q.limit - used),
      cost: q.cost, window: q.window, unlimited: unlimited
    };
  }

  /* ---------- 消耗一次（额度内免费，超额扣灵晶）---------- */
  function consume(kind) {
    var q = QUOTAS[kind];
    var info = quotaInfo(kind);
    if (!q || !info) return { ok: false, reason: 'unknown-kind' };
    var d = load();
    var wk = windowKey(q.window);
    if (!d.quotaUse[kind]) d.quotaUse[kind] = {};
    var coins = getCoins();
    if (info.freeLeft > 0) {
      d.quotaUse[kind][wk] = info.used + 1;
      save(d);
      return { ok: true, free: true, charged: 0, balance: coins.crystal, left: q.limit - info.used - 1 };
    }
    if (q.cost <= 0) { // 无额度上限类（动态）
      d.quotaUse[kind][wk] = info.used + 1;
      save(d);
      return { ok: true, free: true, charged: 0, balance: coins.crystal, left: '∞' };
    }
    if (coins.crystal < q.cost) {
      return { ok: false, reason: 'insufficient', need: q.cost, balance: coins.crystal };
    }
    coins.crystal -= q.cost;
    setCoins(coins);
    d.quotaUse[kind][wk] = info.used + 1;
    save(d);
    return { ok: true, free: false, charged: q.cost, balance: coins.crystal, left: 0 };
  }

  /* ---------- 作品库 ---------- */
  function works(type) {
    var d = load();
    return type ? d.works.filter(function (w) { return w.type === type; }) : d.works;
  }
  function addWork(w) {
    var d = load();
    w.id = 'w_' + Date.now();
    w.status = w.status || '草稿';
    d.works.push(w);
    save(d);
    return w;
  }
  function removeWork(id) {
    var d = load();
    d.works = d.works.filter(function (w) { return w.id !== id; });
    save(d);
  }

  /* ---------- 互动管理四模块（V3.0 §4.3：scenes/events/fragments/missions）---------- */
  var IKIND = { scenes: '互动场景', events: '日常事件', fragments: '剧情碎片', missions: '共同任务' };
  function interactions(charId, kind) {
    var d = load();
    var c = d.interactions[charId] || {};
    return kind ? (c[kind] || []) : c;
  }
  function interactionCounts(charId) {
    var d = load();
    var c = d.interactions[charId] || {};
    var out = {};
    Object.keys(IKIND).forEach(function (k) { out[k] = (c[k] || []).length; });
    return out;
  }
  function addInteraction(charId, kind, item) {
    var d = load();
    if (!d.interactions[charId]) d.interactions[charId] = {};
    if (!d.interactions[charId][kind]) d.interactions[charId][kind] = [];
    item.id = kind.charAt(0) + Date.now();
    d.interactions[charId][kind].push(item);
    save(d);
    return item;
  }
  function removeInteraction(charId, kind, id) {
    var d = load();
    var c = d.interactions[charId];
    if (c && c[kind]) c[kind] = c[kind].filter(function (x) { return x.id !== id; });
    save(d);
  }

  /* ---------- 动态 / 灵念 / Agent 行为 / 媒体记录 ---------- */
  function addPost(p) { var d = load(); p.id = 'p_' + Date.now(); p.at = new Date().toISOString(); d.posts.push(p); save(d); return p; }
  function posts() { return load().posts; }
  function addCard(c) { var d = load(); c.id = 'c_' + Date.now(); c.at = new Date().toISOString(); d.cards.push(c); save(d); return c; }
  function cards() { return load().cards; }
  function addBehavior(b) { var d = load(); b.id = 'b_' + Date.now(); d.behaviors.push(b); save(d); return b; }
  function behaviors() { return load().behaviors; }
  function addMedia(m) { var d = load(); m.id = 'md_' + Date.now(); m.at = new Date().toISOString(); d.media.push(m); if (d.media.length > 50) d.media.shift(); save(d); return m; }
  function media() { return load().media; }
  function markVoiceCloneDone() { var d = load(); d.voiceCloneDone = true; save(d); }
  function voiceCloneDone() { return load().voiceCloneDone; }

  /* ---------- 创作者等级（V3.0 §4.2）---------- */
  var LEVELS = [
    { lv: 'L5', name: '传奇', share: '80%' },
    { lv: 'L4', name: '钻石', share: '75%' },
    { lv: 'L3', name: '黄金', share: '70%' },
    { lv: 'L2', name: '白银', share: '60%' },
    { lv: 'L1', name: '青铜', share: '50%' }
  ];
  function level() {
    var d = load();
    var inc = d.income;
    for (var i = 0; i < LEVELS.length; i++) {
      var th = { L5: 1000000, L4: 200000, L3: 10000, L2: 5000, L1: 0 }[LEVELS[i].lv];
      if (inc >= th) return LEVELS[i];
    }
    return LEVELS[4];
  }
  function incomeSummary() {
    var d = load();
    return { total: d.income, pending: d.pending, level: level() };
  }
  function addIncome(n) { var d = load(); d.income += n; save(d); }

  return {
    QUOTAS: QUOTAS, IKIND: IKIND,
    quotaInfo: quotaInfo, consume: consume,
    getCoins: getCoins, toast: toast,
    works: works, addWork: addWork, removeWork: removeWork,
    interactions: interactions, interactionCounts: interactionCounts,
    addInteraction: addInteraction, removeInteraction: removeInteraction,
    addPost: addPost, posts: posts,
    addCard: addCard, cards: cards,
    addBehavior: addBehavior, behaviors: behaviors,
    addMedia: addMedia, media: media,
    markVoiceCloneDone: markVoiceCloneDone, voiceCloneDone: voiceCloneDone,
    level: level, incomeSummary: incomeSummary, addIncome: addIncome
  };
})();
