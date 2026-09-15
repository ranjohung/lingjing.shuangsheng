/* =====================================================================
 * V22-D · 小说世界自动生成引擎 — 主线锚点 + 支线收敛（NovelWorldFlow）
 *
 * PRD-v22-novel-world-engine §5 + §6.4 + §P-5：
 *   - 主线路径：玩家选择符合原著的选项 → 直接播放原著下一段文字
 *   - 支线路径：玩家选择偏离原著的选项 → 受"世界观规则库"约束推演
 *   - 收敛规则：偏离 3 次互动后强制回到原著下一大剧情节点（anchor）
 *
 * 铁律：
 *   - 零删减（所有原文段 byte-equal，从 store._original_paragraphs 取）
 *   - 零创造（branch_text 不凭空写，由调用方传入）
 *   - 不接真 LLM（branch_text 由 mock / window.AIHelper 提供）
 *
 * 依赖：NovelWorldStore（V22-A）/ NovelWorldGenre（V22-B）/ NovelWorldVN（V22-C）
 * ===================================================================== */
(function () {
  /* ---------- 时辰推进工具 ----------
     上旬 → 中旬 → 下旬 → 次月
     起点 0年12月上旬（与 PRD §6.1 / vn.js 默认 ps 一致）
     路径序列：
       0: 上旬 0年12月
       1: 中旬 0年12月
       2: 下旬 0年12月
       3: 上旬 1年1月
       4: 中旬 1年1月
       ...
       35: 下旬 1年12月
       36: 上旬 2年1月
       ... */
  var TIME_BUCKETS = ['上旬', '中旬', '下旬'];

  function advanceTimeBucket(ps) {
    if (!ps) return null;
    if (typeof ps.timeBucket !== 'number') ps.timeBucket = 0;
    ps.timeBucket += 1;
    var N = ps.timeBucket;
    var slot = N % 3;
    var year, monthIdx;
    if (N < 3) {
      // 起点 0 年 12 月（覆盖前 3 旬）
      year = 0; monthIdx = 11;
    } else {
      // N >= 3：第 N 个桶对应"起始 12 月后第 m_idx 个月（1-indexed from 1月）"
      var m_idx = Math.floor((N - 3) / 3);  // 0=1月, 1=2月, ...
      year = 1 + Math.floor(m_idx / 12);
      monthIdx = m_idx % 12;  // 0..11 → 1月..12月
    }
    ps.time = year + '年' + (monthIdx + 1) + '月' + TIME_BUCKETS[slot];
    return ps.time;
  }

  /* ---------- 原文段选择 ----------
     根据 anchor 索引取 store._original_paragraphs 对应段（byte-equal） */
  function getOriginalParagraphAt(store, anchorIdx) {
    var paras = (store && store._original_paragraphs) || [];
    if (!paras.length) return null;
    var idx = ((anchorIdx || 0) % paras.length + paras.length) % paras.length;
    return paras[idx];
  }

  /* ---------- 主线 / 支线判定 ----------
     isCanonicalChoice(choice) →
       true  ：canonical 原著推进（直接从原文取下一段，无干涉）
       false ：branch 偏离（需要 AI 介入或 mock 推演，但受世界观约束）
     默认规则：
       - choice.is_canonical 显式字段 → 按字段
       - choice.action_ref === 'next_para' / 'read_on' → canonical
       - choice.action_type === 'pick' / 'travel' （直接动）→ canonical
       - 其余（探索 / 闲聊 / 互动 / 打开菜单）→ branch（偏离） */
  function isCanonicalChoice(choice) {
    if (!choice) return false;
    if (typeof choice.is_canonical === 'boolean') return choice.is_canonical;
    var ref = choice.action_ref || choice.action_type || '';
    if (ref === 'next_para' || ref === 'read_on' || ref === 'auto_next') return true;
    if (ref === 'pick' || ref === 'travel' || ref === 'consume') return true;
    if (ref === 'explore' || ref === 'chat' || ref === 'about' || ref === 'leave') return false;
    return false;
  }

  /* ---------- 偏离记录 ----------
     把 diverging 写入 store.runtime.selected_choice_history
     同时 push 一条 is_canonical=false 标记 */
  function divergeAndTrack(store, choice, anchor_idx) {
    if (!store) return { diverged: false, history_len: 0 };
    if (!store.runtime) {
      if (window.NovelWorldStore) store.runtime = window.NovelWorldStore.defaultStore().runtime;
      else store.runtime = { selected_choice_history: [] };
    }
    if (!store.runtime.selected_choice_history) store.runtime.selected_choice_history = [];
    store.runtime.selected_choice_history.push({
      label: (choice && choice.label) || '未命名选项',
      action_ref: (choice && (choice.action_ref || choice.action_type)) || 'unknown',
      anchor_idx: anchor_idx || 0,
      is_canonical: false,
      at: Date.now()
    });
    var ps = store.player_state || (store.player_state = {});
    advanceTimeBucket(ps);
    return {
      diverged: true,
      history_len: store.runtime.selected_choice_history.length,
      time: ps.time
    };
  }

  /* ---------- 收敛判定 ----------
     连续 N 次偏离后强制回到 anchor（N 默认为 3） */
  function shouldConverge(store, limitStep) {
    var N = limitStep || 3;
    if (!store || !store.runtime) return false;
    var h = store.runtime.selected_choice_history || [];
    if (h.length < N) return false;
    var lastN = h.slice(-N);
    return lastN.every(function (c) { return c.is_canonical === false; });
  }

  /* ---------- 收敛执行 ----------
     强制跳到 anchor_idx 对应的原文段（byte-equal），清空历史
     返回 { paragraph, anchor_idx, cleared_history } */
  function convergeToAnchor(store, anchor_idx) {
    anchor_idx = anchor_idx || 0;
    var para = getOriginalParagraphAt(store, anchor_idx);
    if (store && store.runtime && store.runtime.selected_choice_history) {
      store.runtime.selected_choice_history = [];
    }
    if (store && store.player_state) {
      store.player_state.last_anchor_idx = anchor_idx;
    }
    return {
      paragraph: para,
      anchor_idx: anchor_idx,
      cleared_history: true,
      is_converged: true
    };
  }

  /* ---------- 综合入口：selectChoice ----------
     opts: { choice, store, anchor_idx, branch_text?, branch_speaker? }
     返回：
       { kind: 'canonical', paragraph, anchor_idx, advanced: false }
       { kind: 'diverged', paragraph: branch_text, history_len, time, anchor_idx }
       { kind: 'converged', paragraph: getOriginalParagraphAt(), anchor_idx, cleared: true }
     UI 层应根据 kind 进入不同播放路径：
       canonical → 打字机播放下一段原文
       diverged  → 打字机播放 branch_text（由调用方提供）或下一段原文 + "支线提示"
       converged → 打字机播放 anchor 原文 + "已回归主线"toast

     关键设计：偏离时"先记录再判断"——历史记录到 N 后，本次即触发收敛 */
  function selectChoice(opts) {
    opts = opts || {};
    var choice = opts.choice;
    var store = opts.store;
    var anchor_idx = opts.anchor_idx || 0;

    if (!choice) {
      return { kind: 'noop', paragraph: null, error: 'choice missing' };
    }

    var canonical = isCanonicalChoice(choice);

    if (canonical) {
      // 主线推进：直接取下一段原文
      var nextIdx = anchor_idx + 1;
      var para = getOriginalParagraphAt(store, nextIdx);
      if (!para) {
        para = getOriginalParagraphAt(store, anchor_idx);
        nextIdx = anchor_idx;
      }
      return {
        kind: 'canonical',
        paragraph: para,
        anchor_idx: nextIdx,
        advanced: true,
        label: choice.label || '继续'
      };
    }

    // 偏离路径：先记录到 history（说明本次是偏离）
    divergeAndTrack(store, choice, anchor_idx);

    // 记录后判断是否到收敛阈值（第 N 次偏离即触发收敛，"刚达成"语义）
    if (shouldConverge(store)) {
      var conv = convergeToAnchor(store, anchor_idx + 1);
      return {
        kind: 'converged',
        paragraph: conv.paragraph,
        anchor_idx: conv.anchor_idx,
        cleared: true,
        history_len: 0,
        label: choice.label || '偏离选项'
      };
    }

    // 偏离但未达阈值：推演 + 时间推进
    var branch_text = opts.branch_text || getOriginalParagraphAt(store, anchor_idx);
    var trackInfo = (store.runtime && store.runtime.selected_choice_history)
      ? { history_len: store.runtime.selected_choice_history.length, time: (store.player_state || {}).time }
      : { history_len: 0, time: '' };
    return {
      kind: 'diverged',
      paragraph: branch_text,
      paragraph_is_branch: !!opts.branch_text,
      history_len: trackInfo.history_len,
      time: trackInfo.time,
      anchor_idx: anchor_idx,
      label: choice.label || '偏离选项'
    };
  }

  /* ---------- 时间标签：用于顶部状态栏展示 ----------
     返回简短的"0年12月上旬"格式；空状态返回默认占位 */
  function getTimeLabel(ps) {
    if (!ps) return '0年12月上旬';
    return ps.time || '0年12月上旬';
  }

  /* ---------- 单元测试 ----------
     selfTest() → { passed, total, cases: [...] }
     内部使用，V22-D test_v22_d_flow.py 通过 window.NovelWorldFlow.selfTest() 拿到结果 */
  function selfTest() {
    var passed = 0, total = 0;
    var cases = [];

    function t(name, fn) {
      total++;
      try {
        var ok = fn();
        if (ok) passed++;
        cases.push({ name: name, ok: ok === true });
      } catch (e) {
        cases.push({ name: name, ok: false, err: String(e && e.message || e) });
      }
    }
    function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

    // 构造测试 store
    function makeStore(n, paras) {
      var stored = {
        _original_paragraphs: paras || ['段A', '段B', '段C', '段D'],
        runtime: { selected_choice_history: [] }
      };
      // V22-D：runtume 需要正确写
      var store = window.NovelWorldStore && window.NovelWorldStore.defaultStore
        ? window.NovelWorldStore.defaultStore()
        : { _original_paragraphs: stored._original_paragraphs, runtime: stored.runtime };
      store._original_paragraphs = stored._original_paragraphs;
      store.runtime = stored.runtime;
      store.player_state = {};
      return store;
    }

    t('isCanonicalChoice(next_para) → true', function () {
      return isCanonicalChoice({ action_ref: 'next_para' }) === true;
    });
    t('isCanonicalChoice(pick) → true', function () {
      return isCanonicalChoice({ action_type: 'pick' }) === true;
    });
    t('isCanonicalChoice(explore) → false', function () {
      return isCanonicalChoice({ action_ref: 'explore' }) === false;
    });
    t('isCanonicalChoice(显式 false) → false', function () {
      return isCanonicalChoice({ is_canonical: false, label: 'x' }) === false;
    });
    t('isCanonicalChoice(显式 true) → true', function () {
      return isCanonicalChoice({ is_canonical: true, label: 'x' }) === true;
    });

    t('getOriginalParagraphAt(2) → 段C', function () {
      var s = makeStore();
      return getOriginalParagraphAt(s, 2) === '段C';
    });
    t('getOriginalParagraphAt(-1 → 回环) → 段D', function () {
      var s = makeStore();
      return getOriginalParagraphAt(s, -1) === '段D';
    });

    t('advanceTimeBucket 0→1 上旬→中旬', function () {
      var ps = { timeBucket: 0, time: '0年12月上旬' };
      var t1 = advanceTimeBucket(ps);
      return t1 === '0年12月中旬' && ps.timeBucket === 1;
    });
    t('advanceTimeBucket 2→3 12月下旬→1年1月上旬', function () {
      var ps = { timeBucket: 2, time: '0年12月下旬' };
      var t1 = advanceTimeBucket(ps);
      return t1 === '1年1月上旬' && ps.timeBucket === 3;
    });

    t('divergeAndTrack push 一条非 canonical', function () {
      var s = makeStore();
      divergeAndTrack(s, { label: '去后山' }, 0);
      return s.runtime.selected_choice_history.length === 1
        && s.runtime.selected_choice_history[0].is_canonical === false;
    });
    t('divergeAndTrack 推进时间 +1', function () {
      var s = makeStore();
      var before = s.player_state.timeBucket || 0;
      divergeAndTrack(s, { label: '闲聊' }, 0);
      return s.player_state.timeBucket === 1;
    });

    t('shouldConverge(0 偏离) → false', function () {
      var s = makeStore();
      return shouldConverge(s) === false;
    });
    t('shouldConverge(2 偏离) → false', function () {
      var s = makeStore();
      divergeAndTrack(s, { label: 'a' }, 0);
      divergeAndTrack(s, { label: 'b' }, 0);
      return shouldConverge(s) === false;
    });
    t('shouldConverge(3 偏离) → true', function () {
      var s = makeStore();
      divergeAndTrack(s, { label: 'a' }, 0);
      divergeAndTrack(s, { label: 'b' }, 0);
      divergeAndTrack(s, { label: 'c' }, 0);
      return shouldConverge(s) === true;
    });

    t('convergeToAnchor 清空历史', function () {
      var s = makeStore();
      divergeAndTrack(s, { label: 'a' }, 0);
      divergeAndTrack(s, { label: 'b' }, 0);
      var r = convergeToAnchor(s, 1);
      return s.runtime.selected_choice_history.length === 0
        && r.cleared_history === true
        && r.paragraph === '段B';
    });

    t('selectChoice(canonical) 返回 next paragraph', function () {
      var s = makeStore();
      var r = selectChoice({ choice: { action_ref: 'next_para' }, store: s, anchor_idx: 0 });
      return r.kind === 'canonical' && r.paragraph === '段B' && r.anchor_idx === 1;
    });
    t('selectChoice(diverged 第1次) 返回 branch text', function () {
      var s = makeStore();
      var r = selectChoice({ choice: { action_ref: 'explore' }, store: s, anchor_idx: 0 });
      return r.kind === 'diverged' && r.history_len === 1;
    });
    t('selectChoice(连续 3 次 diverge) 第3次返回 converged', function () {
      var s = makeStore();
      selectChoice({ choice: { action_ref: 'explore' }, store: s, anchor_idx: 0 });
      selectChoice({ choice: { action_ref: 'explore' }, store: s, anchor_idx: 0 });
      var r1 = selectChoice({ choice: { action_ref: 'explore' }, store: s, anchor_idx: 1 });
      return r1.kind === 'converged' && r1.cleared === true;
    });
    t('selectChoice(连续 3 次 diverge) 第2次仍为 diverged', function () {
      var s = makeStore();
      selectChoice({ choice: { action_ref: 'explore' }, store: s, anchor_idx: 0 });
      var r2 = selectChoice({ choice: { action_ref: 'explore' }, store: s, anchor_idx: 0 });
      return r2.kind === 'diverged' && r2.history_len === 2;
    });
    t('selectChoice(branch_text 传参) 用分支文案', function () {
      var s = makeStore();
      var r = selectChoice({ choice: { action_ref: 'explore' }, store: s, anchor_idx: 0,
        branch_text: '你走向一条陌生的小路' });
      return r.kind === 'diverged' && r.paragraph === '你走向一条陌生的小路'
        && r.paragraph_is_branch === true;
    });
    t('selectChoice 缺 choice → noop', function () {
      var s = makeStore();
      var r = selectChoice({ store: s, anchor_idx: 0 });
      return r.kind === 'noop';
    });

    t('getTimeLabel 默认 → 0年12月上旬', function () {
      return getTimeLabel() === '0年12月上旬';
    });
    t('getTimeLabel 已有 → 返回', function () {
      return getTimeLabel({ time: '5年7月中旬' }) === '5年7月中旬';
    });

    return { passed: passed, total: total, cases: cases };
  }

  /* ---- 暴露 API ---- */
  window.NovelWorldFlow = {
    isCanonicalChoice: isCanonicalChoice,
    getOriginalParagraphAt: getOriginalParagraphAt,
    advanceTimeBucket: advanceTimeBucket,
    divergeAndTrack: divergeAndTrack,
    shouldConverge: shouldConverge,
    convergeToAnchor: convergeToAnchor,
    selectChoice: selectChoice,
    getTimeLabel: getTimeLabel,
    selfTest: selfTest,
    // 常量
    CONVERGE_LIMIT: 3,
    TIME_BUCKETS: TIME_BUCKETS
  };
})();
