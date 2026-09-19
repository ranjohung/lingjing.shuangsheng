/* ==============================================================
 * V3.0 · Novel World Hotspot — 互动热点系统
 * --------------------------------------------------------------
 * Scene / Hotspot / Interaction 数据驱动。
 * 点击场景中的家具 / 道具 / 人物弹出互动菜单，而不是打开聊天。
 *
 * Scene 数据格式见 DATA_SPEC.md 第二部分。
 * 铁律：所有交互按数据驱动，不依赖聊天。
 * ============================================================== */
(function (global) {
  'use strict';

  var SCENES = {};       // scene_id → scene data
  var currentScene = null;
  var hotspots = [];     // 当前场景热点 DOM

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============ 注册场景数据 ============
  function registerScene(sceneId, sceneData) {
    SCENES[sceneId] = sceneData;
  }

  function registerScenes(map) {
    for (var k in map) SCENES[k] = map[k];
  }

  // ============ 进入场景 ============
  function enterScene(sceneId) {
    var data = SCENES[sceneId];
    if (!data) {
      console.warn('[Hotspot] 场景未注册: ' + sceneId);
      return;
    }
    currentScene = data;
    // 设置背景
    var Stage = global.NovelWorldStage;
    if (Stage && data.background) {
      Stage.showBackground(data.background.replace('.png', ''), 'dissolve');
    }
    // 清除旧热点
    clearHotspots();
    // 渲染热点
    if (data.hotspots) {
      data.hotspots.forEach(function (hs) {
        renderHotspot(hs);
      });
    }
  }

  function exitScene() {
    clearHotspots();
    currentScene = null;
    var Stage = global.NovelWorldStage;
    if (Stage && Stage.showToast) Stage.showToast('已退出场景');
  }

  function clearHotspots() {
    hotspots.forEach(function (h) { if (h.parentNode) h.remove(); });
    hotspots = [];
  }

  // ============ 渲染热点 ============
  function renderHotspot(hs) {
    var objLayer = $('lj-obj-layer');
    if (!objLayer) {
      var Stage = global.NovelWorldStage;
      if (Stage) Stage.init();
      objLayer = $('lj-obj-layer');
      if (!objLayer) return;
    }
    var el2 = document.createElement('div');
    el2.className = 'lj-hotspot lj-hot-' + (hs.object_type || 'environment');
    el2.dataset.hotspotId = hs.hotspot_id;

    // 定位
    var sd = hs.shape_data || {};
    el2.style.left = (sd.x || 0) + '%';
    el2.style.top = (sd.y || 0) + '%';
    el2.style.width = (sd.w || 15) + '%';
    el2.style.height = (sd.h || 15) + '%';

    // 热点标签
    var label = document.createElement('span');
    label.className = 'lj-hot-label';
    var icon = hs.object_type === 'character' ? '👤' :
               hs.object_type === 'furniture' ? '🪑' :
               hs.object_type === 'prop' ? '📦' : '🚪';
    label.innerHTML = '<span class="lj-hot-ico">' + icon + '</span>' + esc(hs.name || '');
    el2.appendChild(label);

    el2.addEventListener('click', function (e) {
      e.stopPropagation();
      showInteractionMenu(hs);
    });

    objLayer.appendChild(el2);
    hotspots.push(el2);
  }

  // ============ 互动菜单 ============
  function showInteractionMenu(hs) {
    var sysLayer = $('lj-sys-layer');
    if (!sysLayer) {
      var Stage = global.NovelWorldStage;
      if (Stage) Stage.init();
      sysLayer = $('lj-sys-layer');
      if (!sysLayer) return;
    }

    var icon = hs.object_type === 'character' ? '👤' :
               hs.object_type === 'furniture' ? '🪑' :
               hs.object_type === 'prop' ? '📦' : '🚪';

    var overlay = document.createElement('div');
    overlay.className = 'lj-interact-overlay';
    var interactions = hs.interactions || [];
    var actionHtml = interactions.map(function (it, i) {
      return '<button class="lj-interact-btn" data-idx="' + i + '">' + esc(it.name || '互动') + '</button>';
    }).join('') || '<div class="lj-interact-empty">无可互动内容</div>';

    overlay.innerHTML =
      '<div class="lj-interact-card">' +
        '<button class="lj-interact-close">✕</button>' +
        '<div class="lj-interact-head">' +
          '<div class="lj-interact-ico">' + icon + '</div>' +
          '<div class="lj-interact-name">' + esc(hs.name || '') + '</div>' +
          '<div class="lj-interact-kind">' + esc(hs.object_type || '') + '</div>' +
        '</div>' +
        '<div class="lj-interact-desc">' + esc(hs.description || ('场景中的' + (hs.name || '对象'))) + '</div>' +
        '<div class="lj-interact-actions">' + actionHtml + '</div>' +
      '</div>';

    sysLayer.appendChild(overlay);
    sysLayer.style.display = 'flex';

    overlay.querySelector('.lj-interact-close').addEventListener('click', function () {
      overlay.remove();
      checkSysLayer();
    });

    overlay.querySelectorAll('.lj-interact-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(b.dataset.idx, 10);
        var it = interactions[idx];
        if (!it) return;
        overlay.remove();
        checkSysLayer();
        executeInteraction(it, hs);
      });
    });
  }

  function checkSysLayer() {
    var sysLayer = $('lj-sys-layer');
    if (sysLayer && !sysLayer.querySelector('.lj-interact-overlay') && !sysLayer.querySelector('.lj-menu-overlay')) {
      sysLayer.style.display = 'none';
    }
  }

  // ============ 执行互动 ============
  function executeInteraction(it, hs) {
    var Stage = global.NovelWorldStage;
    var Runtime = global.NovelWorldRuntime;
    // 如果互动有动作（如 SHOW_BACKGROUND 触发场景切换）
    if (it.action) {
      if (Runtime) {
        Runtime.play({ actions: [it.action], next_node: null });
      }
      return;
    }
    // 显示结果文本 — 使用 Runtime 公共 API 暂停/恢复
    if (it.result_text) {
      if (Stage && Runtime) {
        Runtime.pause();
        var speakerId = hs.object_type === 'character' ? hs.hotspot_id.replace('hs_', '') : '';
        Stage.showDialogue(speakerId, it.result_text, function () {
          // 打字机完成 → 注册点击恢复
          Stage.waitForClick(function () {
            Runtime.resume();
            // 互动结束后清除对白，恢复热点场景视图
            if (Stage && Stage.clearDialogue) Stage.clearDialogue();
          });
        });
      }
    }
    // 状态变更
    if (it.state_change && it.state_change.flags && Runtime) {
      for (var k in it.state_change.flags) {
        Runtime.setFlag(k, it.state_change.flags[k]);
      }
    }
  }

  // ============ 对外 API ============
  global.NovelWorldHotspot = {
    VERSION: '3.0',
    registerScene: registerScene,
    registerScenes: registerScenes,
    enterScene: enterScene,
    exitScene: exitScene,
    getCurrentScene: function () { return currentScene; },
    _hotspots: function () { return hotspots; }
  };

})(window);
