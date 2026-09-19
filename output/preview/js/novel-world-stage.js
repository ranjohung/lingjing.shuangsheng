/* ==============================================================
 * V3.0 · Novel World Stage — GameStage 八层渲染器
 * --------------------------------------------------------------
 * 八层结构（从下到上，z-index 严格固定）：
 *   1 BackgroundLayer   z=1   场景背景、CG、天气
 *   2 CharacterLayer    z=2   角色立绘、表情、位置
 *   3 ObjectLayer       z=3   家具、道具、可交互对象
 *   4 EffectLayer       z=4   粒子特效
 *   5 UILayer           z=10  顶部状态栏、菜单按钮
 *   6 DialogueLayer     z=20  对话框、打字机
 *   7 ChoiceLayer       z=30  选项按钮
 *   8 SystemLayer       z=40  系统弹窗、存档面板
 *
 * 层级顺序绝对不能改。后面的层永远覆盖在前面层上面。
 * 依赖：无（纯 DOM 操作）
 * ============================================================== */
(function (global) {
  'use strict';

  // ============ 资产映射 ============
  // bg_id → 图片路径（相对 output/preview/）
  var BG_MAP = {
    'pavilion_night': 'scenes/pavilion_night.png',
    'palace_tang': 'scenes/palace_tang.png',
    'study_republic': 'scenes/study_republic.png',
    'xianxia_peak': 'scenes/xianxia_peak.png',
    'classroom_sunny': 'scenes/classroom_sunny.png',
    'livingroom_warm': 'scenes/livingroom_warm.png',
    'neon_street': 'scenes/neon_street.png',
    'elf_forest': 'scenes/elf_forest.png',
    'starship_bridge': 'scenes/starship_bridge.png'
  };

  // char_id → 立绘路径
  var CHAR_MAP = {
    'gu_yan': 'portraits/gu_yan.png',
    'shen_zhou': 'portraits/shen_zhou.png',
    'wen_heng': 'portraits/wen_heng.png',
    'lin_shuangwan': 'portraits/lin_shuangwan.png',
    'jiang_yinxue': 'portraits/jiang_yinxue.png',
    'bai_lusheng': 'portraits/bai_lusheng.png',
    'a_luo': 'portraits/a_luo.png',
    'ai_erwei': 'portraits/ai_erwei.png',
    'nx07': 'portraits/nx07.png'
  };

  // char_id → 显示名
  var CHAR_NAME = {
    'gu_yan': '顾言',
    'shen_zhou': '沈舟',
    'wen_heng': '文衡',
    'lin_shuangwan': '林霜晚',
    'jiang_yinxue': '江吟雪',
    'bai_lusheng': '白鹭生',
    'a_luo': '阿洛',
    'ai_erwei': '艾尔维',
    'nx07': 'NX-07'
  };

  // position → CSS left%
  var POS_MAP = {
    'left': '12%',
    'center-left': '28%',
    'center': '42%',
    'center-right': '58%',
    'right': '72%'
  };

  // ============ 打字机状态 ============
  var TYPE = { timer: null, full: '', shown: 0, speed: 28, done: null, clicking: false };

  // ============ DOM 引用 ============
  var LAYERS = {};
  var initialized = false;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============ 初始化八层 ============
  function init() {
    if (initialized) return;
    var root = $('lj-stage-root');
    if (!root) {
      // 容器不存在，由页面创建
      return;
    }

    // 层 1: BackgroundLayer
    LAYERS.bg = mkLayer('lj-bg-layer', 1);
    // 层 2: CharacterLayer
    LAYERS.char = mkLayer('lj-char-layer', 2);
    // 层 3: ObjectLayer
    LAYERS.obj = mkLayer('lj-obj-layer', 3);
    // 层 4: EffectLayer
    LAYERS.fx = mkLayer('lj-fx-layer', 4);
    // 层 5: UILayer
    LAYERS.ui = mkLayer('lj-ui-layer', 10);
    // 层 6: DialogueLayer
    LAYERS.dlg = mkLayer('lj-dlg-layer', 20);
    // 层 7: ChoiceLayer
    LAYERS.choice = mkLayer('lj-choice-layer', 30);
    // 层 8: SystemLayer
    LAYERS.sys = mkLayer('lj-sys-layer', 40);

    initialized = true;
    setupUIDefaults();
    setupDialogueClick();
  }

  function mkLayer(id, z) {
    var el2 = $(id);
    if (!el2) {
      el2 = document.createElement('div');
      el2.id = id;
      el2.className = 'lj-layer';
      el2.style.zIndex = z;
      var root = $('lj-stage-root');
      if (root) root.appendChild(el2);
    }
    return el2;
  }

  // ============ UILayer 默认按钮 ============
  function setupUIDefaults() {
    if (!LAYERS.ui) return;
    LAYERS.ui.innerHTML =
      '<div class="lj-ui-bar">' +
        '<button class="lj-ui-btn" data-act="menu" title="菜单">☰</button>' +
        '<button class="lj-ui-btn" data-act="save" title="存档">💾</button>' +
        '<button class="lj-ui-btn" data-act="backlog" title="回放">📜</button>' +
        '<button class="lj-ui-btn" data-act="back" title="返回">↩</button>' +
      '</div>';
    var self = this;
    LAYERS.ui.querySelectorAll('.lj-ui-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.dataset.act;
        if (act === 'menu') openMenu('main');
        else if (act === 'save') { global.NovelWorldRuntime && global.NovelWorldRuntime.saveGame('auto'); showToast('已存档'); }
        else if (act === 'backlog') showBacklog();
        else if (act === 'back') { try { parent.postMessage({ lj: 'back' }, '*'); } catch (e) {} }
      });
    });
  }

  // ============ 背景层 ============
  function showBackground(bgId, transition) {
    if (!LAYERS.bg) init();
    var url = BG_MAP[bgId] || bgId;
    var layer = LAYERS.bg;
    // 创建新背景层，淡入
    var newBg = document.createElement('div');
    newBg.className = 'lj-bg-img';
    newBg.style.backgroundImage = 'url("' + url + '")';
    newBg.style.opacity = '0';
    layer.appendChild(newBg);
    // 淡入
    requestAnimationFrame(function () {
      newBg.style.transition = 'opacity ' + (transition === 'cut' ? '0s' : '0.8s') + ' ease';
      newBg.style.opacity = '1';
    });
    // 移除旧背景
    setTimeout(function () {
      var olds = layer.querySelectorAll('.lj-bg-img:not(:last-child)');
      olds.forEach(function (o) { o.remove(); });
    }, 900);
    // 更新场景名
    var nameEl = $('lj-scene-name');
    if (nameEl) nameEl.textContent = bgId;
  }

  function showCG(cgId) {
    if (!LAYERS.bg) init();
    var url = BG_MAP[cgId] || cgId;
    var cg = document.createElement('div');
    cg.className = 'lj-cg';
    cg.style.backgroundImage = 'url("' + url + '")';
    cg.addEventListener('click', function () { cg.remove(); });
    LAYERS.bg.appendChild(cg);
  }

  // ============ 角色层 ============
  function showCharacter(charId, position, pose, expression) {
    if (!LAYERS.char) init();
    var existing = LAYERS.char.querySelector('[data-char="' + charId + '"]');
    if (existing) existing.remove();
    var url = CHAR_MAP[charId];
    var el2 = document.createElement('div');
    el2.className = 'lj-char';
    el2.dataset.char = charId;
    el2.dataset.position = position;
    if (url) el2.style.backgroundImage = 'url("' + url + '")';
    el2.style.left = POS_MAP[position] || '42%';
    el2.style.opacity = '0';
    el2.style.transform = 'translateY(20px)';
    el2.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    LAYERS.char.appendChild(el2);
    requestAnimationFrame(function () {
      el2.style.opacity = '1';
      el2.style.transform = 'translateY(0)';
    });
    // 说话者高亮标记
    el2.dataset.speaking = 'false';
  }

  function hideCharacter(charId, transition) {
    if (!LAYERS.char) return;
    var el2 = LAYERS.char.querySelector('[data-char="' + charId + '"]');
    if (!el2) return;
    el2.style.transition = 'opacity 0.5s ease';
    el2.style.opacity = '0';
    setTimeout(function () { el2.remove(); }, 550);
  }

  function moveCharacter(charId, targetPos, duration) {
    if (!LAYERS.char) return;
    var el2 = LAYERS.char.querySelector('[data-char="' + charId + '"]');
    if (!el2) return;
    el2.dataset.position = targetPos;
    el2.style.transition = 'left ' + (duration || 500) + 'ms ease';
    el2.style.left = POS_MAP[targetPos] || '42%';
  }

  function changeExpression(charId, expression) {
    // 单张立绘暂不支持表情切换图片，用滤镜模拟
    if (!LAYERS.char) return;
    var el2 = LAYERS.char.querySelector('[data-char="' + charId + '"]');
    if (!el2) return;
    el2.dataset.expression = expression;
    if (expression === 'smile' || expression === 'happy') {
      el2.style.filter = 'brightness(1.1) saturate(1.15)';
    } else if (expression === 'sad' || expression === 'angry') {
      el2.style.filter = 'brightness(0.85) saturate(0.8)';
    } else {
      el2.style.filter = 'none';
    }
  }

  function changePose(charId, pose) {
    if (!LAYERS.char) return;
    var el2 = LAYERS.char.querySelector('[data-char="' + charId + '"]');
    if (!el2) return;
    el2.dataset.pose = pose;
  }

  function focusCharacter(charId) {
    if (!LAYERS.char) return;
    var chars = LAYERS.char.querySelectorAll('.lj-char');
    chars.forEach(function (c) {
      if (c.dataset.char === charId) {
        c.style.filter = 'brightness(1) saturate(1.1)';
        c.style.transform = 'scale(1.05)';
        c.dataset.speaking = 'true';
      } else {
        c.style.filter = 'brightness(0.5) saturate(0.6)';
        c.dataset.speaking = 'false';
      }
    });
  }

  function dimCharacter(charId) {
    if (!LAYERS.char) return;
    var el2 = LAYERS.char.querySelector('[data-char="' + charId + '"]');
    if (el2) {
      el2.style.filter = 'brightness(0.5) saturate(0.6)';
      el2.dataset.speaking = 'false';
    }
  }

  // ============ 对白层 ============
  function clearDialogue() {
    if (TYPE.timer) { clearInterval(TYPE.timer); TYPE.timer = null; }
    TYPE.full = ''; TYPE.shown = 0; TYPE.done = null; TYPE.clicking = false;
    if (LAYERS.dlg) {
      LAYERS.dlg.innerHTML = '';
      LAYERS.dlg.style.display = 'none';
    }
  }

  // ============ 动态角色注册（V3.0：书籍编译期注入立绘映射） ============
  function registerCharacter(charId, portraitUrl, displayName) {
    if (!charId) return;
    CHAR_MAP[charId] = portraitUrl || '';
    if (displayName) CHAR_NAME[charId] = displayName;
  }
  function registerCharacters(map) {
    Object.keys(map || {}).forEach(function (id) {
      registerCharacter(id, map[id].url, map[id].name);
    });
  }
  function clearCharacters() {
    Object.keys(CHAR_MAP).forEach(function (k) { delete CHAR_MAP[k]; });
    Object.keys(CHAR_NAME).forEach(function (k) { delete CHAR_NAME[k]; });
  }

  function showNarration(text, onTyped) {
    showDialogue('', text, onTyped);
  }

  function showDialogue(speakerId, text, onTyped) {
    if (!LAYERS.dlg) init();
    var box = LAYERS.dlg;
    box.innerHTML = '';
    var speakerEl = document.createElement('div');
    speakerEl.className = 'lj-dlg-speaker';
    speakerEl.textContent = speakerId ? (CHAR_NAME[speakerId] || speakerId) : '';
    speakerEl.style.display = speakerId ? 'block' : 'none';
    var bodyEl = document.createElement('div');
    bodyEl.className = 'lj-dlg-body';
    var hintEl = document.createElement('div');
    hintEl.className = 'lj-dlg-hint';
    hintEl.textContent = '轻触继续 ▾';
    hintEl.style.display = 'none';
    box.appendChild(speakerEl);
    box.appendChild(bodyEl);
    box.appendChild(hintEl);
    box.style.display = 'flex';
    // 聚焦说话者
    if (speakerId) focusCharacter(speakerId);
    // 打字机
    typewrite(text, function () {
      hintEl.style.display = 'block';
      if (onTyped) onTyped();
    });
  }

  function showThought(charId, text, onTyped) {
    if (!LAYERS.dlg) init();
    var box = LAYERS.dlg;
    box.innerHTML = '';
    var speakerEl = document.createElement('div');
    speakerEl.className = 'lj-dlg-speaker lj-dlg-thought';
    speakerEl.textContent = (CHAR_NAME[charId] || charId) + ' · 内心';
    var bodyEl = document.createElement('div');
    bodyEl.className = 'lj-dlg-body lj-dlg-thought-body';
    var hintEl = document.createElement('div');
    hintEl.className = 'lj-dlg-hint';
    hintEl.textContent = '轻触继续 ▾';
    hintEl.style.display = 'none';
    box.appendChild(speakerEl);
    box.appendChild(bodyEl);
    box.appendChild(hintEl);
    box.style.display = 'flex';
    typewrite(text, function () {
      hintEl.style.display = 'block';
      if (onTyped) onTyped();
    });
  }

  // ============ 打字机 ============
  function typewrite(text, onDone) {
    if (TYPE.timer) { clearInterval(TYPE.timer); TYPE.timer = null; }
    TYPE.full = String(text || '');
    TYPE.shown = 0;
    TYPE.done = onDone || null;
    TYPE.clicking = false;
    var body = LAYERS.dlg ? LAYERS.dlg.querySelector('.lj-dlg-body') : null;
    if (body) body.innerHTML = '<span class="lj-cursor"></span>';
    TYPE.timer = setInterval(function () {
      TYPE.shown++;
      if (TYPE.shown >= TYPE.full.length) {
        clearInterval(TYPE.timer);
        TYPE.timer = null;
        if (body) body.innerHTML = esc(TYPE.full);
        if (TYPE.done) { TYPE.done(); TYPE.done = null; }
      } else {
        if (body) {
          body.innerHTML = esc(TYPE.full.substring(0, TYPE.shown)) + '<span class="lj-cursor"></span>';
        }
      }
    }, TYPE.speed);
  }

  function skipTypewriter() {
    if (!TYPE.timer) return;
    clearInterval(TYPE.timer);
    TYPE.timer = null;
    var body = LAYERS.dlg ? LAYERS.dlg.querySelector('.lj-dlg-body') : null;
    if (body) body.innerHTML = esc(TYPE.full);
    if (TYPE.done) { TYPE.done(); TYPE.done = null; }
  }

  // ============ 对话框点击 ============
  function setupDialogueClick() {
    if (!LAYERS.dlg) return;
    LAYERS.dlg.addEventListener('click', function (e) {
      // 跳过打字机（不同时推进剧情）
      if (TYPE.timer) { e.stopPropagation(); skipTypewriter(); return; }
    });
  }

  // ============ 等待点击 ============
  var clickHandler = null;
  function waitForClick(callback) {
    clickHandler = callback;
  }

  function setupStageClick() {
    var root = $('lj-stage-root');
    if (!root) return;
    root.addEventListener('click', function (e) {
      // 如果打字机在跑，先跳过
      if (TYPE.timer) { skipTypewriter(); return; }
      // 如果有等待点击回调
      if (clickHandler) {
        var cb = clickHandler;
        clickHandler = null;
        cb();
      }
    });
  }

  // ============ 选项层 ============
  function showChoice(options, onSelect) {
    if (!LAYERS.choice) init();
    var layer = LAYERS.choice;
    layer.innerHTML = '';
    var panel = document.createElement('div');
    panel.className = 'lj-choice-panel';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'lj-choice-btn';
      btn.textContent = opt.label || '';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        layer.innerHTML = '';
        layer.style.display = 'none';
        if (onSelect) onSelect(opt);
      });
      panel.appendChild(btn);
    });
    layer.appendChild(panel);
    layer.style.display = 'flex';
  }

  // ============ 音频 ============
  var bgmAudio = null;
  function playBGM(bgmId, loop) {
    try {
      if (!bgmAudio) {
        bgmAudio = new Audio();
        bgmAudio.volume = 0.3;
      }
      // 暂无 BGM 音频文件，用静默占位
      // bgmAudio.src = 'audio/' + bgmId + '.mp3';
      bgmAudio.loop = loop !== false;
      // bgmAudio.play().catch(function(){});
    } catch (e) {}
  }

  function stopBGM(fadeOut) {
    try {
      if (bgmAudio) {
        setTimeout(function () { bgmAudio.pause(); }, fadeOut || 1000);
      }
    } catch (e) {}
  }

  function playSound(soundId) {
    try {
      var a = new Audio();
      // a.src = 'audio/' + soundId + '.mp3';
      // a.play().catch(function(){});
    } catch (e) {}
  }

  // ============ 特效层 ============
  function showEffect(effectId, duration) {
    if (!LAYERS.fx) init();
    var fx = document.createElement('div');
    fx.className = 'lj-fx lj-fx-' + effectId;
    if (effectId === 'rain' || effectId === 'snow' || effectId === 'petals') {
      fx.innerHTML = mkParticles(effectId, 30);
    } else if (effectId === 'flash') {
      fx.style.background = 'rgba(255,255,255,0.8)';
      fx.style.animation = 'ljFlash 0.3s ease';
    } else if (effectId === 'fade_black') {
      fx.style.background = '#000';
      fx.style.animation = 'ljFadeIn 0.5s ease forwards';
    }
    LAYERS.fx.appendChild(fx);
    if (duration) {
      setTimeout(function () { fx.remove(); }, duration);
    }
  }

  function hideEffect(effectId) {
    if (!LAYERS.fx) return;
    var fxs = LAYERS.fx.querySelectorAll('.lj-fx-' + effectId);
    fxs.forEach(function (f) { f.remove(); });
  }

  function mkParticles(type, count) {
    var html = '';
    var chars = { rain: '·', snow: '❄', petals: '✿' };
    var ch = chars[type] || '·';
    for (var i = 0; i < count; i++) {
      var left = Math.random() * 100;
      var delay = Math.random() * 3;
      var dur = 2 + Math.random() * 3;
      html += '<span style="position:absolute;left:' + left + '%;top:-10%;animation:ljFall' + type + ' ' + dur + 's linear ' + delay + 's infinite">' + ch + '</span>';
    }
    return html;
  }

  // ============ 镜头 ============
  function cameraZoom(scale, duration) {
    var root = $('lj-stage-root');
    if (!root) return;
    var inner = root.querySelector('.lj-stage-inner');
    if (!inner) return;
    inner.style.transition = 'transform ' + (duration || 500) + 'ms ease';
    inner.style.transform = 'scale(' + scale + ')';
  }

  function cameraShake(intensity, duration) {
    var root = $('lj-stage-root');
    if (!root) return;
    var inner = root.querySelector('.lj-stage-inner');
    if (!inner) return;
    var orig = inner.style.transform;
    var n = 0;
    var maxN = Math.floor((duration || 300) / 50);
    var t = setInterval(function () {
      n++;
      if (n >= maxN) {
        clearInterval(t);
        inner.style.transform = orig;
        return;
      }
      var dx = (Math.random() - 0.5) * intensity * 2;
      var dy = (Math.random() - 0.5) * intensity * 2;
      inner.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }, 50);
  }

  // ============ 系统层 ============
  function showSystemMessage(msg) {
    if (!LAYERS.sys) init();
    var msg2 = document.createElement('div');
    msg2.className = 'lj-sys-msg';
    msg2.textContent = msg;
    LAYERS.sys.appendChild(msg2);
    LAYERS.sys.style.display = 'flex';
    setTimeout(function () {
      msg2.style.opacity = '0';
      setTimeout(function () {
        msg2.remove();
        if (!LAYERS.sys.children.length) LAYERS.sys.style.display = 'none';
      }, 500);
    }, 2500);
  }

  function showToast(msg) {
    var t = document.createElement('div');
    t.className = 'lj-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 400);
    }, 1800);
  }

  function openMenu(menuType) {
    if (!LAYERS.sys) init();
    var existing = LAYERS.sys.querySelector('.lj-menu-overlay');
    if (existing) { existing.remove(); LAYERS.sys.style.display = 'none'; return; }
    var overlay = document.createElement('div');
    overlay.className = 'lj-menu-overlay';
    var state = global.NovelWorldRuntime ? global.NovelWorldRuntime.getState() : {};
    var flagList = Object.keys(state.flags || {});
    var flagHtml = flagList.length ? flagList.map(function (k) {
      return '<div class="lj-menu-flag"><span>' + esc(k) + '</span><b>' + esc(state.flags[k]) + '</b></div>';
    }).join('') : '<div class="lj-menu-empty">暂无标记</div>';

    overlay.innerHTML =
      '<div class="lj-menu-card">' +
        '<div class="lj-menu-head"><span>⚙ 菜单</span><button class="lj-menu-close">✕</button></div>' +
        '<div class="lj-menu-section"><div class="lj-menu-title">📜 剧情回放</div>' +
          '<div class="lj-menu-backlog">' + buildBacklogHtml() + '</div>' +
        '</div>' +
        '<div class="lj-menu-section"><div class="lj-menu-title">🏷 标记</div>' + flagHtml + '</div>' +
        '<div class="lj-menu-section"><div class="lj-menu-title">💾 存档</div>' +
          '<div class="lj-menu-actions">' +
            '<button class="lj-menu-btn" data-act="save">立即存档</button>' +
            '<button class="lj-menu-btn" data-act="load">读档</button>' +
          '</div>' +
        '</div>' +
        '<div class="lj-menu-section"><div class="lj-menu-title">导航</div>' +
          '<div class="lj-menu-actions">' +
            '<button class="lj-menu-btn" data-act="restart">重新开始</button>' +
            '<button class="lj-menu-btn" data-act="back">返回书库</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    LAYERS.sys.appendChild(overlay);
    LAYERS.sys.style.display = 'flex';
    overlay.querySelector('.lj-menu-close').addEventListener('click', function () {
      overlay.remove();
      if (!LAYERS.sys.querySelector('.lj-menu-overlay')) LAYERS.sys.style.display = 'none';
    });
    overlay.querySelectorAll('.lj-menu-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.dataset.act;
        if (act === 'save') { global.NovelWorldRuntime.saveGame('auto'); showToast('已存档'); }
        else if (act === 'load') { showToast('读档功能待接入'); }
        else if (act === 'restart') { overlay.remove(); LAYERS.sys.style.display = 'none'; if (state.currentNode && global.NovelWorldRuntime) global.NovelWorldRuntime.play(state.currentNode); }
        else if (act === 'back') { try { parent.postMessage({ lj: 'back' }, '*'); } catch (e) {} }
      });
    });
  }

  function buildBacklogHtml() {
    var backlog = global.NovelWorldRuntime ? global.NovelWorldRuntime.getBacklog() : [];
    if (!backlog.length) return '<div class="lj-menu-empty">暂无记录</div>';
    return backlog.slice(-15).map(function (e) {
      return '<div class="lj-backlog-item"><b>' + esc(e.speaker || '') + '</b> ' + esc(e.text) + '</div>';
    }).join('');
  }

  function showBacklog() {
    openMenu('backlog');
  }

  // ============ 对外 API ============
  global.NovelWorldStage = {
    VERSION: '3.0',
    init: init,
    showBackground: showBackground,
    showCG: showCG,
    showCharacter: showCharacter,
    registerCharacter: registerCharacter,
    registerCharacters: registerCharacters,
    clearCharacters: clearCharacters,
    hideCharacter: hideCharacter,
    moveCharacter: moveCharacter,
    changeExpression: changeExpression,
    changePose: changePose,
    focusCharacter: focusCharacter,
    dimCharacter: dimCharacter,
    showNarration: showNarration,
    showDialogue: showDialogue,
    showThought: showThought,
    clearDialogue: clearDialogue,
    typewrite: typewrite,
    skipTypewriter: skipTypewriter,
    waitForClick: waitForClick,
    setupStageClick: setupStageClick,
    showChoice: showChoice,
    playBGM: playBGM,
    stopBGM: stopBGM,
    playSound: playSound,
    showEffect: showEffect,
    hideEffect: hideEffect,
    cameraZoom: cameraZoom,
    cameraShake: cameraShake,
    showSystemMessage: showSystemMessage,
    showToast: showToast,
    openMenu: openMenu,
    showBacklog: showBacklog,
    _LAYERS: function () { return LAYERS; }
  };

})(window);
