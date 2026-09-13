/* ===========================================================
 * V22-C · 视觉小说范式控制器（顶部状态栏 + 场景标签 + 底部文字框）
 * ------------------------------------------------------------
 * 纯前端 module · window.NovelWorldVN · 依赖 V22-A store/parser + V22-B genre
 * 设计铁律：零删减 · 零创造 · 提取而非生成
 * =========================================================== */
(function (global) {
  'use strict';

  // ============ 类型：5 题材属性 ============
  var GENRE_LABEL = {
    xiuxian: '修仙',
    mori: '末日',
    wuxia: '武侠',
    jingying: '经营',
    gongdou: '宫斗',
    geshitu: '故事'
  };

  // ============ 类型→emoji 场景 ============
  var SCENE_EMOJI = {
    xiuxian: '⛰️',
    mori: '🏚️',
    wuxia: '🗡️',
    jingying: '🌾',
    gongdou: '🏯',
    geshitu: '📖'
  };

  // ============ 打字机状态 ============
  var TYPING = {
    timer: null,
    fullText: '',
    shown: 0,
    speed: 30,    // ms/字
    onDone: null
  };

  function $(sel) { return document.querySelector(sel); }
  function el(tag, attrs, txt) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (txt != null) n.textContent = txt;
    return n;
  }

  // ============ 顶部状态栏更新 ============
  function updateTopbar(ps) {
    if (!ps) ps = global.state && global.state.v22Player ? global.state.v22Player : {};
    var ap = $('#ng-v22-ap');
    var copper = $('#ng-v22-copper');
    var silver = $('#ng-v22-silver');
    var jade = $('#ng-v22-jade');
    var sub = $('#ng-v22-sub');
    var time = $('#ng-v22-time');
    var avatar = $('#ng-v22-avatar');

    if (ap) ap.textContent = ps.actionPoints != null ? ps.actionPoints : (ps.ap != null ? ps.ap : 100);
    if (copper) copper.textContent = ps.copper != null ? ps.copper : 0;
    if (silver) silver.textContent = ps.silver != null ? ps.silver : 0;
    if (jade) jade.textContent = ps.jade != null ? ps.jade : 10;
    if (sub) sub.textContent = '行动值 ' + (ps.actionPoints != null ? ps.actionPoints : (ps.ap != null ? ps.ap : 100));
    if (time) time.textContent = ps.time || (ps.timeBucket || '0年12月上旬');
    if (avatar) avatar.textContent = ps.avatarEmoji || (ps.gender === 'female' ? '👩' : '🧑');
  }

  // ============ 场景悬浮标签渲染 ============
  /**
   * tags 数据格式：
   *   [{ type: 'action'|'npc'|'item', label, x, y, cost?, action? }, ...]
   * cost = { copper: 5, silver: 0, ap: 3, item: { wood: 2 } }
   */
  function renderTags(tags) {
    var box = $('#ng-v22-tags');
    if (!box) return;
    box.innerHTML = '';
    if (!tags || !tags.length) return;
    tags.forEach(function (t) {
      var b = el('button', { class: 'ng-v22-tag ' + (t.type || 'action'), title: t.label || '' });
      b.style.left = (t.x != null ? t.x : 50) + '%';
      b.style.top = (t.y != null ? t.y : 50) + '%';
      var ic = t.type === 'npc' ? '👤' : (t.type === 'item' ? '🎁' : '▶');
      b.innerHTML = '<span class="ic">' + ic + '</span><span>' + (t.label || '动作') + '</span>';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        handleTagClick(t);
      });
      box.appendChild(b);
    });
  }

  // ============ 标签点击 → 确认弹窗 → 执行 ============
  var PENDING = null;
  function handleTagClick(t) {
    // NPC 标签：直接展示人物介绍（不消耗）
    if (t.type === 'npc') {
      showSpeaker(t.label, t.desc || '（人物相关动作将基于原文生成）');
      return;
    }
    // 物品/动作：弹确认
    var cost = t.cost || {};
    var hasCost = Object.keys(cost).length > 0;
    if (!hasCost) {
      // 无消耗：直接执行
      executeTagAction(t);
      return;
    }
    PENDING = t;
    var title = $('#ng-v22-confirm-title');
    var body = $('#ng-v22-confirm-body');
    var costBox = $('#ng-v22-confirm-cost');
    if (title) title.textContent = t.confirmTitle || ('是否「' + (t.label || '动作') + '」？');
    if (body) body.textContent = t.confirmBody || '该动作将基于原文段触发，可能消耗资源。';
    if (costBox) {
      costBox.innerHTML = '';
      var ps = getPlayerState();
      Object.keys(cost).forEach(function (k) {
        var span = el('span', { class: 'item' });
        var v = cost[k];
        var label = k === 'ap' ? '⚡ 行动值' : (k === 'copper' ? '🪙 铜钱' : (k === 'silver' ? '💰 银两' : (k === 'jade' ? '💎 灵玉' : '🎒 ' + k)));
        var have = ps[k] || 0;
        var insufficient = have < v;
        span.innerHTML = label + ' <b>' + v + '</b>' + ' / 你有 ' + have;
        if (insufficient) span.classList.add('insufficient');
        costBox.appendChild(span);
      });
    }
    var mask = $('#ng-v22-confirm');
    if (mask) mask.classList.add('open');
  }

  function executeTagAction(t) {
    // 扣资源（如果有 cost）
    var cost = t.cost || {};
    var ps = getPlayerState();
    Object.keys(cost).forEach(function (k) {
      if (ps[k] != null) ps[k] = Math.max(0, (ps[k] || 0) - cost[k]);
    });
    // 推进时间
    if (t.advanceTime && global.NovelWorldStore) {
      global.NovelWorldStore.advanceTimeBucket(ps);
    }
    // 更新顶部
    updateTopbar(ps);
    // 显示结果（原文段）
    var txt = t.result || ('【' + (t.label || '动作') + '】动作触发 · 基于原文段 ' + (t.paragraphRef || ''));
    typewrite(txt, function () {
      // 完成后推进到下一段
      if (t.advanceParagraph && global.state && global.state.v22AdvanceParagraph) {
        global.state.v22AdvanceParagraph();
      }
    });
  }

  function getPlayerState() {
    if (global.state && global.state.v22Player) return global.state.v22Player;
    if (global.NovelWorldStore) {
      var s = global.NovelWorldStore.load();
      if (s) return s.player_state;
    }
    return { ap: 100, copper: 0, silver: 0, jade: 10, time: '0年12月上旬', timeBucket: 0 };
  }

  function confirmCancel() {
    PENDING = null;
    var mask = $('#ng-v22-confirm');
    if (mask) mask.classList.remove('open');
  }
  function confirmOk() {
    if (PENDING) {
      var t = PENDING;
      confirmCancel();
      executeTagAction(t);
    }
  }

  // ============ 底部文字框：打字机 ============
  function showSpeaker(name, text) {
    var speaker = $('#ng-v22-textbox-speaker');
    var body = $('#ng-v22-textbox-body');
    if (speaker) {
      speaker.textContent = '◆ ' + (name || '');
      speaker.style.display = name ? '' : 'none';
    }
    typewrite(text);
  }

  function typewrite(text, onDone) {
    if (TYPING.timer) clearInterval(TYPING.timer);
    TYPING.fullText = String(text || '');
    TYPING.shown = 0;
    TYPING.onDone = onDone || null;
    var body = $('#ng-v22-textbox-body');
    if (body) body.innerHTML = '<span class="ng-v22-textbox-cursor"></span>';
    TYPING.timer = setInterval(function () {
      TYPING.shown++;
      if (TYPING.shown >= TYPING.fullText.length) {
        clearInterval(TYPING.timer);
        TYPING.timer = null;
        if (body) body.innerHTML = escHtml(TYPING.fullText);
        if (TYPING.onDone) TYPING.onDone();
      } else {
        if (body) {
          body.innerHTML = escHtml(TYPING.fullText.substring(0, TYPING.shown))
            + '<span class="ng-v22-textbox-cursor"></span>';
        }
      }
    }, TYPING.speed);
  }

  function showTextbox(text) {
    var box = $('#ng-v22-textbox');
    if (box) box.style.display = 'block';
    typewrite(text);
  }
  function hideTextbox() {
    var box = $('#ng-v22-textbox');
    if (box) box.style.display = 'none';
    if (TYPING.timer) { clearInterval(TYPING.timer); TYPING.timer = null; }
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
  }

  // ============ 模式切换（视觉小说 ⇄ 长滚动） ============
  var MODE = 'vn'; // 'vn' | 'scroll'
  function toggleMode() {
    var container = $('#ng-v22-container');
    var rBody = $('#ng-r-body');
    var toggleBtn = $('#ng-v22-mode-toggle');
    var rStage = $('#ng-r-stage');
    if (MODE === 'vn') {
      // 切到长滚动
      MODE = 'scroll';
      if (container) container.style.display = 'none';
      if (rBody) rBody.style.display = 'block';
      if (rStage) rStage.style.display = 'none';
      if (toggleBtn) toggleBtn.textContent = '🎬 视觉小说模式';
    } else {
      // 切回视觉小说
      MODE = 'vn';
      if (container) container.style.display = '';
      if (rBody) rBody.style.display = 'none';
      if (rStage) rStage.style.display = 'none';
      if (toggleBtn) toggleBtn.textContent = '📜 长滚动模式';
    }
  }

  // ============ 视觉小说场景入口：基于段落 + 题材渲染 ============
  /**
   * enterScene({ paragraph, genre, npcs, items, actions, time, ps })
   *   - paragraph: 当前原文段（原文一字不动）
   *   - genre: 'xiuxian' / 'mori' / 'wuxia' / 'jingying' / 'gongdou'
   *   - npcs: [{ name, desc }] 从原文提取
   *   - items: [{ name }] 从原文提取
   *   - actions: [{ label, cost, result, paragraphRef }] 从原文提取
   */
  function enterScene(opts) {
    opts = opts || {};
    // 关掉入口/进度遮罩（demo 路径会弹，避免遮挡视觉小说场景）
    ['#ng-entry-mask', '#ng-progress-mask', '#ng-char-mask', '#ng-paid', '#ng-menu-mask', '#ng-v22-confirm']
      .forEach(function (sel) {
        var el2 = document.querySelector(sel);
        if (el2) {
          el2.classList.remove('open');
          el2.style.display = 'none';
        }
      });
    // 先激活 ng-stage 容器（让里面的 reader/dialog 生效）
    var stage = $('#ng-stage');
    if (stage) {
      stage.classList.add('active');
      stage.style.position = 'fixed';
      stage.style.top = '44px';
      stage.style.bottom = '0';
      stage.style.left = '0';
      stage.style.right = '0';
      stage.style.zIndex = '5';
    }
    // 显示 ng-reader
    var reader = $('#ng-reader');
    if (reader) {
      reader.style.display = 'block';
      reader.style.position = 'absolute';
      reader.style.top = '0';
      reader.style.bottom = '0';
      reader.style.left = '0';
      reader.style.right = '0';
      reader.style.paddingBottom = '0';
      reader.style.background = 'transparent';
    }
    // 显示容器
    var container = $('#ng-v22-container');
    if (container) {
      container.style.display = 'block';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.bottom = '0';
      container.style.left = '0';
      container.style.right = '0';
    }
    var rStage = $('#ng-r-stage');
    if (rStage) rStage.style.display = 'none';
    var rBody = $('#ng-r-body');
    if (rBody) rBody.style.display = 'none';
    var toggle = $('#ng-v22-mode-toggle');
    if (toggle) toggle.classList.add('show');
    MODE = 'vn';

    // 保存当前 ps 到 global.state（供 getPlayerState 调用）
    if (!global.state) global.state = {};
    global.state.v22Player = opts.ps || global.state.v22Player || {
      ap: 100, copper: 0, silver: 0, jade: 10, time: '0年12月上旬', timeBucket: 0
    };

    // 顶部
    updateTopbar(opts.ps || getPlayerState());

    // 场景标签：从原文抽取 → 不创造
    var tags = [];
    if (opts.npcs && opts.npcs.length) {
      opts.npcs.slice(0, 4).forEach(function (n, i) {
        tags.push({ type: 'npc', label: n.name, desc: n.desc || ('来自原文 · ' + n.name), x: 25 + i * 12, y: 60 });
      });
    }
    if (opts.items && opts.items.length) {
      opts.items.slice(0, 4).forEach(function (it, i) {
        tags.push({ type: 'item', label: '拾取 ' + it.name, x: 60 + (i % 2) * 18, y: 40 + i * 8,
          cost: { ap: 1 }, result: '获得【' + it.name + '】· 原文段触发', paragraphRef: it.name });
      });
    }
    if (opts.actions && opts.actions.length) {
      opts.actions.slice(0, 4).forEach(function (a, i) {
        tags.push({ type: 'action', label: a.label, cost: a.cost || {}, result: a.result || '',
          paragraphRef: a.paragraphRef, x: 30 + (i % 3) * 18, y: 75 + (i % 2) * 8 });
      });
    }
    renderTags(tags);

    // 底部原文（打字机）
    showSpeaker(opts.speaker || '', opts.paragraph || '（无原文段）');
  }

  // ============ 文字框点击：跳过打字机 / 进入下一段 ============
  function setupTextboxClick() {
    var box = $('#ng-v22-textbox');
    if (!box) return;
    box.addEventListener('click', function (e) {
      // 跳过打字机
      if (TYPING.timer) {
        clearInterval(TYPING.timer);
        TYPING.timer = null;
        var body = $('#ng-v22-textbox-body');
        if (body) body.innerHTML = escHtml(TYPING.fullText);
        if (TYPING.onDone) { TYPING.onDone(); TYPING.onDone = null; }
      }
    });
  }

  // ============ 初始化 ============
  function init() {
    setupTextboxClick();
    var cancel = $('#ng-v22-confirm-cancel');
    if (cancel) cancel.addEventListener('click', confirmCancel);
    var ok = $('#ng-v22-confirm-ok');
    if (ok) ok.addEventListener('click', confirmOk);
    var toggle = $('#ng-v22-mode-toggle');
    if (toggle) toggle.addEventListener('click', toggleMode);
    // 暴露模式查询
    global.NovelWorldVN = global.NovelWorldVN || {};
    global.NovelWorldVN.getMode = function () { return MODE; };
  }

  // ============ 对外 API ============
  global.NovelWorldVN = {
    init: init,
    updateTopbar: updateTopbar,
    renderTags: renderTags,
    enterScene: enterScene,
    showSpeaker: showSpeaker,
    showTextbox: showTextbox,
    hideTextbox: hideTextbox,
    typewrite: typewrite,
    toggleMode: toggleMode,
    getMode: function () { return MODE; },
    // 测试钩子
    _confirmCancel: confirmCancel,
    _confirmOk: confirmOk,
    _getPlayerState: getPlayerState,
    _PENDING: function () { return PENDING; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
