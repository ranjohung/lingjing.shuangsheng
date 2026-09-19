/* ==============================================================
 * V3.0 · Novel World Runtime — Script Action 执行引擎
 * --------------------------------------------------------------
 * 这是整个游戏 Runtime 的核心。
 * AI 只能生成 Script Action Registry 中已注册的动作，不能自由发明动作。
 *
 * 用法：
 *   NovelWorldRuntime.play(scriptNode)
 *   scriptNode = { actions: [ {type, params}, ... ], next_node }
 *
 * 依赖：NovelWorldStage（八层渲染器）/ NovelWorldHotspot（热点）
 * 铁律：零删减原文 · 零创造内容 · 只组合标准动作
 * ============================================================== */
(function (global) {
  'use strict';

  // ============ 游戏状态 ============
  var STATE = {
    flags: {},            // SET_FLAG 存储
    inventory: [],        // 背包
    currentNode: null,    // 当前剧本节点
    actionIndex: 0,        // 当前动作索引
    paused: false,        // WAIT_CLICK / SHOW_CHOICE 时暂停
    waitCallback: null,   // 恢复时的回调
    scriptData: null,     // 完整剧本数据
    route: 'CANON',       // CANON / SIDE_STORY / IF
    backlog: []           // 对白回放
  };

  // ============ 动作注册表 ============
  var REGISTRY = {};

  function registerAction(type, handler) {
    if (typeof type !== 'string' || typeof handler !== 'function') {
      throw new Error('registerAction: type 必须是字符串, handler 必须是函数');
    }
    REGISTRY[type] = handler;
  }

  function getRegisteredActions() {
    return Object.keys(REGISTRY).sort();
  }

  // ============ 核心播放引擎 ============
  /**
   * 播放一个剧本节点
   * @param {Object} node - { actions: [{type, params}], next_node }
   */
  function play(node) {
    if (!node || !node.actions || !node.actions.length) {
      console.warn('[Runtime] 节点无动作', node);
      return;
    }
    STATE.currentNode = node;
    STATE.actionIndex = 0;
    STATE.paused = false;
    STATE.waitCallback = null;
    executeNext();
  }

  function executeNext() {
    if (STATE.paused) return;
    if (!STATE.currentNode) return;
    var actions = STATE.currentNode.actions;
    if (STATE.actionIndex >= actions.length) {
      // 节点结束，跳转下一节点
      var nextId = STATE.currentNode.next_node;
      if (nextId && STATE.scriptData) {
        var nextNode = findNode(STATE.scriptData, nextId);
        if (nextNode) { play(nextNode); return; }
      }
      // 无下一节点，剧本结束
      onScriptEnd();
      return;
    }
    var action = actions[STATE.actionIndex];
    STATE.actionIndex++;
    executeAction(action);
  }

  function executeAction(action) {
    if (!action || !action.type) {
      console.warn('[Runtime] 非法动作', action);
      executeNext();
      return;
    }
    var handler = REGISTRY[action.type];
    if (!handler) {
      console.warn('[Runtime] 未注册的动作类型: ' + action.type + ' — AI 不能发明新动作');
      executeNext();
      return;
    }
    // 调用 handler，传入 params 和控制接口
    var ctrl = {
      advance: advance,           // 执行下一条动作
      pause: pause,               // 暂停（WAIT_CLICK / SHOW_CHOICE）
      resume: resume,             // 恢复
      getState: getState,
      setFlag: setFlag,
      addBacklog: addBacklog,
      jumpToNode: jumpToNode
    };
    try {
      handler(action.params || {}, ctrl);
    } catch (err) {
      console.error('[Runtime] 动作执行异常: ' + action.type, err);
      advance();
    }
  }

  function advance() {
    // 异步推进，确保 DOM 更新后继续
    setTimeout(executeNext, 0);
  }

  function pause(callback) {
    STATE.paused = true;
    STATE.waitCallback = callback || null;
  }

  function resume() {
    if (!STATE.paused) return;
    STATE.paused = false;
    var cb = STATE.waitCallback;
    STATE.waitCallback = null;
    if (cb) { cb(); return; }
    advance();
  }

  function jumpToNode(nodeId) {
    if (!STATE.scriptData || !nodeId) return;
    var node = findNode(STATE.scriptData, nodeId);
    if (node) play(node);
  }

  function findNode(scriptData, nodeId) {
    if (!scriptData || !scriptData.nodes) return null;
    for (var i = 0; i < scriptData.nodes.length; i++) {
      if (scriptData.nodes[i].node_id === nodeId) return scriptData.nodes[i];
    }
    return null;
  }

  function onScriptEnd() {
    var Stage = global.NovelWorldStage;
    if (Stage && Stage.showSystemMessage) {
      Stage.showSystemMessage('本章剧情已结束');
    }
  }

  // ============ 状态管理 ============
  function getState() {
    return {
      flags: STATE.flags,
      inventory: STATE.inventory,
      route: STATE.route,
      currentNode: STATE.currentNode,
      actionIndex: STATE.actionIndex
    };
  }

  function setFlag(name, value) {
    STATE.flags[name] = value;
  }

  function getFlag(name) {
    return STATE.flags[name];
  }

  function addBacklog(entry) {
    STATE.backlog.push(entry);
    if (STATE.backlog.length > 200) STATE.backlog.shift();
  }

  function getBacklog() {
    return STATE.backlog.slice();
  }

  // ============ 存档 ============
  function saveGame(slot) {
    var data = {
      flags: STATE.flags,
      inventory: STATE.inventory,
      route: STATE.route,
      currentNodeId: STATE.currentNode ? STATE.currentNode.node_id : null,
      actionIndex: STATE.actionIndex,
      savedAt: Date.now()
    };
    var key = 'lingjing_save_' + (slot || 'auto');
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }

  function loadGame(slot) {
    var key = 'lingjing_save_' + (slot || 'auto');
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  // ============ 默认动作注册 ============
  function registerDefaults() {
    var Stage = global.NovelWorldStage;

    // --- 背景类 ---
    registerAction('SHOW_BACKGROUND', function (p, ctrl) {
      if (Stage) Stage.showBackground(p.bg_id, p.transition || 'fade');
      ctrl.advance();
    });
    registerAction('CHANGE_BACKGROUND', function (p, ctrl) {
      if (Stage) Stage.showBackground(p.bg_id, p.transition || 'dissolve');
      ctrl.advance();
    });
    registerAction('SHOW_CG', function (p, ctrl) {
      if (Stage) Stage.showCG(p.cg_id);
      ctrl.advance();
    });

    // --- 角色类 ---
    registerAction('SHOW_CHARACTER', function (p, ctrl) {
      if (Stage) Stage.showCharacter(p.char_id, p.position || 'center', p.pose || 'default', p.expression || 'default');
      ctrl.advance();
    });
    registerAction('HIDE_CHARACTER', function (p, ctrl) {
      if (Stage) Stage.hideCharacter(p.char_id, p.transition || 'fade');
      ctrl.advance();
    });
    registerAction('MOVE_CHARACTER', function (p, ctrl) {
      if (Stage) Stage.moveCharacter(p.char_id, p.target_position, p.duration || 500);
      setTimeout(ctrl.advance, (p.duration || 500) + 50);
    });
    registerAction('CHANGE_EXPRESSION', function (p, ctrl) {
      if (Stage) Stage.changeExpression(p.char_id, p.expression);
      ctrl.advance();
    });
    registerAction('CHANGE_POSE', function (p, ctrl) {
      if (Stage) Stage.changePose(p.char_id, p.pose);
      ctrl.advance();
    });
    registerAction('CHARACTER_FOCUS', function (p, ctrl) {
      if (Stage) Stage.focusCharacter(p.char_id);
      ctrl.advance();
    });
    registerAction('CHARACTER_DIM', function (p, ctrl) {
      if (Stage) Stage.dimCharacter(p.char_id);
      ctrl.advance();
    });

    // --- 对白类 ---
    registerAction('SHOW_NARRATION', function (p, ctrl) {
      ctrl.addBacklog({ source: 'AUTHOR_ORIGINAL', speaker: '（旁白）', text: p.text });
      if (Stage) Stage.showNarration(p.text, function () {
        ctrl.pause();
        // 等待点击
        if (Stage) Stage.waitForClick(function () { ctrl.resume(); });
      });
      // narration 先调 showNarration 再 pause，但 advance 不自动调
      // 实际上 showNarration 内部启动打字机，完成后调 callback
    });
    registerAction('SHOW_DIALOGUE', function (p, ctrl) {
      ctrl.addBacklog({ source: 'AUTHOR_ORIGINAL', speaker: p.speaker_id, text: p.text });
      if (Stage) {
        // V3.0：说话者聚焦高亮（无角色在场时静默跳过）
        if (p.speaker_id && Stage.focusCharacter) {
          try { Stage.focusCharacter(p.speaker_id); } catch (e) {}
        }
        Stage.showDialogue(p.speaker_id, p.text, function () {
          ctrl.pause();
          if (Stage) Stage.waitForClick(function () { ctrl.resume(); });
        });
      }
    });
    registerAction('SHOW_THOUGHT', function (p, ctrl) {
      ctrl.addBacklog({ source: 'AUTHOR_ORIGINAL', speaker: p.char_id + '（内心）', text: p.text });
      if (Stage) Stage.showThought(p.char_id, p.text, function () {
        ctrl.pause();
        if (Stage) Stage.waitForClick(function () { ctrl.resume(); });
      });
    });

    // --- 音频类 ---
    registerAction('PLAY_BGM', function (p, ctrl) {
      if (Stage) Stage.playBGM(p.bgm_id, p.loop !== false);
      ctrl.advance();
    });
    registerAction('STOP_BGM', function (p, ctrl) {
      if (Stage) Stage.stopBGM(p.fade_out || 1000);
      ctrl.advance();
    });
    registerAction('PLAY_SOUND', function (p, ctrl) {
      if (Stage) Stage.playSound(p.sound_id);
      ctrl.advance();
    });

    // --- 特效类 ---
    registerAction('SHOW_EFFECT', function (p, ctrl) {
      if (Stage) Stage.showEffect(p.effect_id, p.duration || 3000);
      ctrl.advance();
    });
    registerAction('HIDE_EFFECT', function (p, ctrl) {
      if (Stage) Stage.hideEffect(p.effect_id);
      ctrl.advance();
    });
    registerAction('CAMERA_ZOOM', function (p, ctrl) {
      if (Stage) Stage.cameraZoom(p.scale || 1.0, p.duration || 500);
      setTimeout(ctrl.advance, (p.duration || 500) + 50);
    });
    registerAction('CAMERA_SHAKE', function (p, ctrl) {
      if (Stage) Stage.cameraShake(p.intensity || 5, p.duration || 300);
      setTimeout(ctrl.advance, (p.duration || 300) + 50);
    });

    // --- 流程类 ---
    registerAction('WAIT', function (p, ctrl) {
      ctrl.pause();
      setTimeout(function () { ctrl.resume(); }, p.duration || 1000);
    });
    registerAction('WAIT_CLICK', function (p, ctrl) {
      ctrl.pause();
      if (Stage) Stage.waitForClick(function () { ctrl.resume(); });
    });
    registerAction('SHOW_CHOICE', function (p, ctrl) {
      ctrl.pause();
      if (Stage) Stage.showChoice(p.options, function (selectedOption) {
        // 记录选择
        ctrl.addBacklog({ source: 'PLAYER_CHOICE', speaker: '（玩家选择）', text: selectedOption.label });
        // 设置 flag
        if (selectedOption.flag) ctrl.setFlag(selectedOption.flag, selectedOption.value || true);
        // 跳转到选项指定的节点
        if (selectedOption.next_node) {
          ctrl.jumpToNode(selectedOption.next_node);
        } else {
          ctrl.resume();
        }
      });
    });
    registerAction('SET_FLAG', function (p, ctrl) {
      ctrl.setFlag(p.flag_name, p.value !== undefined ? p.value : true);
      ctrl.advance();
    });
    registerAction('OPEN_MENU', function (p, ctrl) {
      if (Stage) Stage.openMenu(p.menu_type || 'main');
      ctrl.advance();
    });
    registerAction('ENTER_SCENE', function (p, ctrl) {
      var Hotspot = global.NovelWorldHotspot;
      if (Hotspot && p.scene_id) {
        Hotspot.enterScene(p.scene_id);
      }
      ctrl.advance();
    });
    registerAction('EXIT_SCENE', function (p, ctrl) {
      var Hotspot = global.NovelWorldHotspot;
      if (Hotspot) Hotspot.exitScene();
      ctrl.advance();
    });
    registerAction('SAVE_GAME', function (p, ctrl) {
      saveGame('auto');
      if (Stage && Stage.showToast) Stage.showToast('已存档');
      ctrl.advance();
    });
  }

  // ============ 初始化 ============
  function init() {
    registerDefaults();
  }

  // ============ 对外 API ============
  global.NovelWorldRuntime = {
    VERSION: '3.0',
    init: init,
    play: play,
    registerAction: registerAction,
    getRegisteredActions: getRegisteredActions,
    getState: getState,
    getFlag: getFlag,
    setFlag: setFlag,
    getBacklog: getBacklog,
    saveGame: saveGame,
    loadGame: loadGame,
    setScriptData: function (data) { STATE.scriptData = data; },
    // 暴露 pause/resume/advance 供 Hotspot 等外部模块使用
    pause: pause,
    resume: resume,
    advance: advance,
    _STATE: STATE
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
