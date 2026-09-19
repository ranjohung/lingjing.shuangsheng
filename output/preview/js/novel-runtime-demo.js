/* ==============================================================
 * V3.0 · Novel World Runtime — 演示剧本
 * --------------------------------------------------------------
 * 三段原文 Script，验证 Script Action Runtime 可完整播放。
 * 场景数据验证热点互动系统。
 * 所有原文标注为【灵境原创演示】，不冒充原著或 AI 生成。
 *
 * 注意：SHOW_DIALOGUE / SHOW_NARRATION / SHOW_THOUGHT 内部已
 * 通过 ctrl.pause() + Stage.waitForClick() 自动暂停等待点击，
 * 后面不需要再跟 WAIT_CLICK，否则会造成双重点击。
 * ============================================================== */
(function (global) {
  'use strict';

  // ============ 演示剧本：三段原文 ============
  var DEMO_SCRIPT = {
    script_id: 'demo_ch01',
    novel_id: 'lingjing_demo',
    chapter: 1,
    script_name: '灵境原创演示 · 月下亭',
    nodes: [
      {
        node_id: 'n01',
        node_type: 'CANON',
        source_paragraph_start: 0,
        source_paragraph_end: 0,
        actions: [
          { type: 'SHOW_BACKGROUND', params: { bg_id: 'pavilion_night', transition: 'fade' } },
          { type: 'PLAY_BGM', params: { bgm_id: 'bgm_moonlight', loop: true } },
          { type: 'SHOW_EFFECT', params: { effect_id: 'petals', duration: 8000 } },
          { type: 'SHOW_NARRATION', params: { text: '【灵境原创演示】\n月色如水，洒落在亭台之上。远处隐约传来笛声，花瓣随风飘落。\n今夜，有人在此等候。' } },
          { type: 'SHOW_CHARACTER', params: { char_id: 'gu_yan', position: 'center-right', pose: 'default', expression: 'calm' } },
          { type: 'CAMERA_ZOOM', params: { scale: 1.08, duration: 600 } },
          { type: 'SHOW_DIALOGUE', params: { speaker_id: 'gu_yan', text: '你来了。' } },
          { type: 'CHANGE_EXPRESSION', params: { char_id: 'gu_yan', expression: 'smile' } },
          { type: 'SHOW_DIALOGUE', params: { speaker_id: 'gu_yan', text: '等了你很久。坐吧，月色正好。' } },
          { type: 'SHOW_NARRATION', params: { text: '顾言侧身让出石凳，月光在他肩上投下一道淡淡的影。' } },
          { type: 'SHOW_CHOICE', params: { choice_id: 'c01', options: [
            { label: '「抱歉，来迟了。」', next_node: 'n02', flag: 'apologized', value: true },
            { label: '（沉默不语，入亭落座）', next_node: 'n03', flag: 'silent', value: true }
          ]}}
        ],
        next_node: null
      },
      {
        node_id: 'n02',
        node_type: 'CANON',
        source_paragraph_start: 1,
        source_paragraph_end: 1,
        actions: [
          { type: 'CHANGE_EXPRESSION', params: { char_id: 'gu_yan', expression: 'smile' } },
          { type: 'SHOW_DIALOGUE', params: { speaker_id: 'gu_yan', text: '不必道歉。重要的是你来了，不是什么时候来的。' } },
          { type: 'SHOW_THOUGHT', params: { char_id: 'gu_yan', text: '（这人倒坦诚……比起那些虚礼寒暄，我更喜欢这样的直率。）' } },
          { type: 'SHOW_NARRATION', params: { text: '笛声渐止，夜风卷起几片落花。亭中一时无人言语，却并不尴尬。' } },
          { type: 'SHOW_DIALOGUE', params: { speaker_id: 'gu_yan', text: '既然来了，有件事想问你——你觉得，这世上最难得的是什么？' } },
          { type: 'SHOW_CHOICE', params: { choice_id: 'c02', options: [
            { label: '「知音难觅。」', next_node: 'n04', flag: 'valued_zhiyin', value: true },
            { label: '「心安二字最难得。」', next_node: 'n04', flag: 'valued_peace', value: true }
          ]}}
        ],
        next_node: null
      },
      {
        node_id: 'n03',
        node_type: 'CANON',
        source_paragraph_start: 2,
        source_paragraph_end: 2,
        actions: [
          { type: 'CHANGE_EXPRESSION', params: { char_id: 'gu_yan', expression: 'calm' } },
          { type: 'SHOW_DIALOGUE', params: { speaker_id: 'gu_yan', text: '不说话也好。有些话，说出来反倒轻了。' } },
          { type: 'SHOW_NARRATION', params: { text: '你在石凳上坐下，亭外的月色铺了一地银霜。顾言没有再看你，目光投向远方。' } },
          { type: 'SHOW_THOUGHT', params: { char_id: 'gu_yan', text: '（沉默的人，往往比能说会道的人更值得留意……）' } },
          { type: 'SHOW_DIALOGUE', params: { speaker_id: 'gu_yan', text: '既然你不想说话，那我问你一件事——你觉得，这世上最难得的是什么？' } },
          { type: 'SHOW_CHOICE', params: { choice_id: 'c03', options: [
            { label: '「知音难觅。」', next_node: 'n04', flag: 'valued_zhiyin', value: true },
            { label: '「心安二字最难得。」', next_node: 'n04', flag: 'valued_peace', value: true }
          ]}}
        ],
        next_node: null
      },
      {
        node_id: 'n04',
        node_type: 'CANON',
        source_paragraph_start: 3,
        source_paragraph_end: 3,
        actions: [
          { type: 'CHANGE_EXPRESSION', params: { char_id: 'gu_yan', expression: 'smile' } },
          { type: 'SHOW_DIALOGUE', params: { speaker_id: 'gu_yan', text: '……你说得对。难得的不是东西，是有人愿意在这月下，真心答你一句。' } },
          { type: 'SHOW_NARRATION', params: { text: '花瓣仍在飘落。亭中两人，一坐一立，月色将影子拉得很长很长。\n\n【灵境原创演示 · 第一段完】' } },
          { type: 'SHOW_EFFECT', params: { effect_id: 'fade_black', duration: 800 } },
          { type: 'HIDE_CHARACTER', params: { char_id: 'gu_yan', transition: 'fade' } },
          { type: 'STOP_BGM', params: { fade_out: 1000 } },
          { type: 'SHOW_SYSTEM_MESSAGE', params: { text: '本章剧情已结束' } },
          { type: 'WAIT_CLICK' },
          { type: 'ENTER_SCENE', params: { scene_id: 'study_republic' } }
        ],
        next_node: null
      }
    ]
  };

  // 注册未在 runtime 中注册的动作
  function registerExtra() {
    var R = global.NovelWorldRuntime;
    if (!R) return;
    if (!R.getRegisteredActions().includes('SHOW_SYSTEM_MESSAGE')) {
      R.registerAction('SHOW_SYSTEM_MESSAGE', function (p, ctrl) {
        var Stage = global.NovelWorldStage;
        if (Stage) Stage.showSystemMessage(p.text || '');
        ctrl.advance();
      });
    }
  }

  // ============ 演示场景数据 ============
  var DEMO_SCENES = {
    'study_republic': {
      scene_id: 'study_republic',
      background: 'study_republic.png',
      description: '一间古朴的书房，月光透过窗棂洒在书桌上。',
      hotspots: [
        {
          hotspot_id: 'hs_desk',
          name: '书桌',
          object_type: 'furniture',
          shape: 'rectangle',
          shape_data: { x: 30, y: 50, w: 28, h: 25 },
          description: '一张红木书桌，上面摆着笔墨纸砚。',
          interactions: [
            { interaction_id: 'i_look', name: '查看', result_text: '桌上摆着笔墨纸砚，一封未写完的信。信上只有半句：「月下之约……」' },
            { interaction_id: 'i_take', name: '拿起信件', result_text: '你将信件收入怀中。也许日后能用上。', state_change: { flags: { has_letter: true } } }
          ]
        },
        {
          hotspot_id: 'hs_guyan',
          name: '顾言',
          object_type: 'character',
          shape: 'rectangle',
          shape_data: { x: 58, y: 20, w: 18, h: 55 },
          description: '顾言站在窗边，若有所思。',
          interactions: [
            { interaction_id: 'i_talk', name: '交谈', result_text: '顾言转过身来：「你还在这里。刚才的问题，我想了很久——最难得的，或许是此刻。」' },
            { interaction_id: 'i_observe', name: '观察', result_text: '顾言的眉眼在月光下显得格外清冷，但嘴角似乎有一丝不易察觉的笑意。' }
          ]
        },
        {
          hotspot_id: 'hs_door',
          name: '门',
          object_type: 'environment',
          shape: 'rectangle',
          shape_data: { x: 82, y: 25, w: 12, h: 50 },
          description: '一扇通往庭院的门。',
          interactions: [
            { interaction_id: 'i_enter', name: '进入庭院', action: { type: 'SHOW_BACKGROUND', params: { bg_id: 'pavilion_night', transition: 'dissolve' } } }
          ]
        }
      ]
    }
  };

  // ============ 启动 ============
  function start() {
    registerExtra();
    var Stage = global.NovelWorldStage;
    var Runtime = global.NovelWorldRuntime;
    var Hotspot = global.NovelWorldHotspot;

    if (Stage) { Stage.init(); Stage.setupStageClick(); }
    if (Hotspot) Hotspot.registerScenes(DEMO_SCENES);
    if (Runtime) {
      Runtime.setScriptData(DEMO_SCRIPT);
      // 短暂延迟确保 DOM 就绪
      setTimeout(function () {
        Runtime.play(DEMO_SCRIPT.nodes[0]);
      }, 100);
    }
  }

  // 暴露
  global.NovelRuntimeDemo = { start: start, DEMO_SCRIPT: DEMO_SCRIPT, DEMO_SCENES: DEMO_SCENES };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
