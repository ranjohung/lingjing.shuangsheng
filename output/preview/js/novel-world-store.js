/* =====================================================================
 * V22-A · 小说世界自动生成引擎 — 数据中枢（NovelWorldStore）
 *
 * PRD-v22-novel-world-engine §7 数据模型完整实现：
 *   world_bible / assets / story_nodes / scene_interactions / player_state / runtime
 *
 * 设计原则：
 *   - 零删减：所有 paragraphs / scenes[].paragraphs 都是原文 byte-equal
 *   - 题材叠加属性：player_state.attrs 自动装载（V22-B 共享）
 *   - localStorage 前缀：lingjing_v522_novel_world_v1（与 v521 隔离）
 *   - 所有改动走 setX()，严禁直接修改 state（避免脏数据）
 * ===================================================================== */
(function () {
  var KEY_PREFIX = 'lingjing_v522_novel_world_v1';
  var RUN_PREFIX = 'lingjing_v522_novel_world_run_';  // 单本书存档

  /* ---- 默认初始状态（题材 = 模拟经营/种田，最宽松兜底） ---- */
  function defaultAttrs(genre) {
    var base = { hp: 100, stamina: 62, copper: 31, silver: 5 };
    var gen = (window.NovelWorldParser && window.NovelWorldParser.GENRE_ATTRS) || {};
    var g = (genre && gen[genre]) ? genre : 'jingying';
    var extra = gen[g] || {};
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(extra).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  function defaultPlayerState(genre, traits) {
    return {
      scene_id: null,
      attrs: defaultAttrs(genre),
      backpack: [],
      traits: traits || [],
      affinity_log: {}    // npc_id → affinity 数值
    };
  }

  function defaultRuntime() {
    return {
      chap_idx: 0,
      para_idx: 0,
      typewriter_active: false,
      selected_choice_history: [],
      last_save_at: null
    };
  }

  function defaultStore() {
    return {
      meta: {
        book_id: null,
        book_title: '',
        book_author: '',
        updated_at: null,
        created_at: Date.now()
      },
      world_bible: {
        genre: 'jingying',
        genre_combo: ['jingying'],
        era: '架空古代',
        power_system: '体力、铜钱、声望',
        factions: ['未知'],
        forbidden_rules: []
      },
      assets: {
        scenes: [],
        npcs: [],
        items: [],
        actions: [],
        recipes: []
      },
      story_nodes: [],
      scene_interactions: [],
      player_state: defaultPlayerState('jingying', []),
      runtime: defaultRuntime(),
      // 关键保证：原文 byte-equal 保留
      _original_text: '',
      _original_paragraphs: []
    };
  }

  /* ---- 加载（按 book_id 隔离） ---- */
  function load(bookId) {
    try {
      var raw = localStorage.getItem(RUN_PREFIX + bookId);
      if (raw) {
        var data = JSON.parse(raw);
        return data;
      }
    } catch (e) { /* fall through */ }
    return defaultStore();
  }

  /* ---- 保存（按 book_id 隔离） ---- */
  function save(bookId, data) {
    try {
      data.meta = data.meta || {};
      data.meta.updated_at = Date.now();
      data.meta.book_id = bookId;
      localStorage.setItem(RUN_PREFIX + bookId, JSON.stringify(data));
      return true;
    } catch (e) {
      if (window.console && console.error) console.error('[V22-A Store] save fail:', e);
      return false;
    }
  }

  /* ---- 重置（清空单本书存档） ---- */
  function reset(bookId) {
    try { localStorage.removeItem(RUN_PREFIX + bookId); } catch (e) {}
    return defaultStore();
  }

  /* ---- 初始化：从原文 + 元数据建立完整 store ---- */
  function initFromText(text, meta) {
    if (!window.NovelWorldParser) {
      if (window.console && console.error) console.error('[V22-A Store] NovelWorldParser missing');
      return defaultStore();
    }
    var pipeline = window.NovelWorldParser.runPipeline(text);
    var store = defaultStore();
    store.meta = Object.assign({}, store.meta, meta || {});
    store.meta.created_at = Date.now();
    store.world_bible = pipeline.world_bible;
    store.assets.scenes = pipeline.scenes;
    store.assets.npcs = pipeline.npcs;
    store.assets.items = pipeline.items;
    store.assets.actions = pipeline.actions;
    store.scene_interactions = pipeline.actions; // 默认与 actions 同源
    store.story_nodes = buildStoryNodes(pipeline.scenes);
    store.player_state = defaultPlayerState(pipeline.world_bible.genre, meta && meta.traits);
    store.player_state.scene_id = pipeline.scenes.length ? pipeline.scenes[0].scene_id : null;
    // 零删减：byte-equal 保留
    store._original_text = text;
    store._original_paragraphs = pipeline.original_paragraphs;
    return store;
  }

  /* ---- 构建剧情节点树（按章节切分，标注 anchor） ---- */
  function buildStoryNodes(scenes) {
    return scenes.map(function (s, idx) {
      return {
        node_index: idx,
        scene_id: s.scene_id,
        original_text: (s.paragraphs || []).join('\n'),
        is_anchor: idx === 0,  // 每章首节点为 anchor
        choices: [
          { label: '继续阅读', action_ref: 'next_para', is_canonical: true },
          { label: '探索场景', action_ref: 'explore_scene', is_canonical: false,
            divergence: { limit_step: 3, converge_to_anchor: idx + 1 } }
        ]
      };
    });
  }

  /* ---- 玩家状态修改（带守门） ---- */
  function setAttr(store, key, val) {
    if (!store.player_state.attrs) store.player_state.attrs = {};
    store.player_state.attrs[key] = val;
  }

  function addItem(store, itemId, quantity) {
    var found = (store.player_state.backpack || []).find(function (x) { return x.item_id === itemId; });
    if (found) {
      found.quantity += quantity;
    } else {
      store.player_state.backpack.push({ item_id: itemId, quantity: quantity });
    }
  }

  function consumeItem(store, itemId, quantity) {
    var found = (store.player_state.backpack || []).find(function (x) { return x.item_id === itemId; });
    if (!found || found.quantity < quantity) return false;
    found.quantity -= quantity;
    if (found.quantity <= 0) {
      store.player_state.backpack = store.player_state.backpack.filter(function (x) { return x.item_id !== itemId; });
    }
    return true;
  }

  function setAffinity(store, npcId, delta) {
    if (!store.player_state.affinity_log) store.player_state.affinity_log = {};
    var cur = store.player_state.affinity_log[npcId] || 0;
    store.player_state.affinity_log[npcId] = cur + delta;
  }

  /* ---- 选择历史（用于支线收敛判断） ---- */
  function recordChoice(store, label) {
    if (!store.runtime) store.runtime = defaultRuntime();
    if (!store.runtime.selected_choice_history) store.runtime.selected_choice_history = [];
    store.runtime.selected_choice_history.push({ label: label, at: Date.now() });
  }

  function shouldConverge(store) {
    if (!store.runtime || !store.runtime.selected_choice_history) return false;
    var nonCanonical = store.runtime.selected_choice_history.filter(function (c) { return !c.is_canonical; });
    return nonCanonical.length >= 3;
  }

  function clearDivergence(store) {
    if (!store.runtime) return;
    store.runtime.selected_choice_history = [];
  }

  /* ---- 工具函数 ---- */
  function hasOriginalParagraph(store, text) {
    // 校验：text 是否在原文 paragraphs 中（byte-equal 任意段）
    var paras = store._original_paragraphs || [];
    return paras.indexOf(text) >= 0;
  }

  function getScene(store, sceneId) {
    return (store.assets.scenes || []).find(function (s) { return s.scene_id === sceneId; });
  }

  function getNpc(store, npcId) {
    return (store.assets.npcs || []).find(function (n) { return n.npc_id === npcId; });
  }

  function getItem(store, itemId) {
    return (store.assets.items || []).find(function (i) { return i.item_id === itemId; });
  }

  function getAction(store, actionId) {
    return (store.assets.actions || []).find(function (a) { return a.action_id === actionId; });
  }

  /* ---- 暴露 API ---- */
  window.NovelWorldStore = {
    KEY_PREFIX: KEY_PREFIX,
    load: load,
    save: save,
    reset: reset,
    initFromText: initFromText,
    // 玩家状态修改
    setAttr: setAttr,
    addItem: addItem,
    consumeItem: consumeItem,
    setAffinity: setAffinity,
    // 流程控制
    recordChoice: recordChoice,
    shouldConverge: shouldConverge,
    clearDivergence: clearDivergence,
    // 查询
    hasOriginalParagraph: hasOriginalParagraph,
    getScene: getScene,
    getNpc: getNpc,
    getItem: getItem,
    getAction: getAction,
    // 默认
    defaultStore: defaultStore,
    defaultAttrs: defaultAttrs
  };
})();