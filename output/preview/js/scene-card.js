/* v5.17 — 场景卡 + 对话场景卡系统
   场景卡 11 字段（每个场景填写一张）：
     1. 场景编号
     2. 场景地点
     3. 场景时间
     4. 在场人物
     5. 场景目标（这个场景要达成什么）
     6. 核心冲突（这个场景中的矛盾）
     7. 场景类型（主动/被动）
     8. 情绪曲线（开始情绪 → 结束情绪）
     9. 关键描写细节
    10. 场景结尾（钩子/悬念）
    11. 关联伏笔
   场景描写三原则：
     ① 点面结合（整体"面" + 局部"点"）
     ② 以动为主（人物行动和对话为主）
     ③ 情绪渗透（写景要渗透人物感情）

   对话场景卡 6 字段（每个对话场景填写）：
     1. 对话双方（谁和谁在说话）
     2. 对话场景（什么情境下）
     3. 对话目标（推进什么）
     4. 双方关系（陌生人/朋友/敌人/暧昧）
     5. 情绪基调（紧张/轻松/暧昧/对峙）
     6. 关键信息（必须传达的信息）
   对话写作五原则：
     ① 口语化（像真人说话，不像写作文）
     ② 有潜台词（话里有话，别把情绪解释完）
     ③ 符合人设声音（粗人用糙词，书生用文词，反派用冷词）
     ④ 留白（别把话说尽，让读者自己感受）
     ⑤ 每句有用（要么推进剧情，要么暴露性格）
*/
(function () {
  if (window.SceneCard) return;

  // ====== 场景卡字段 ======
  const SCENE_FIELDS = [
    { key: 'scene_no', label: '场景编号', hint: '1.1 / 1.2 / 2.1', required: true },
    { key: 'location', label: '场景地点', hint: '长夜城·城南酒馆', required: true },
    { key: 'time_setting', label: '场景时间', hint: '傍晚，天色将暗未暗', required: true },
    { key: 'characters_present', label: '在场人物', hint: '主角、酒馆老板、神秘陌生人', required: true },
    { key: 'scene_goal', label: '场景目标', hint: '让主角获得关于记忆篡改的第一个线索', required: true },
    { key: 'core_conflict', label: '核心冲突', hint: '陌生人暗示主角的身份，但主角不信任他', required: true },
    { key: 'scene_type', label: '场景类型', hint: '主动场景（主角有目标并行动）/ 被动场景（主角对事件做出反应）', required: true },
    { key: 'emotion_curve_start', label: '情绪曲线起点', hint: '场景开始时的情绪', required: true },
    { key: 'emotion_curve_end', label: '情绪曲线终点', hint: '场景结束时的情绪', required: true },
    { key: 'key_details', label: '关键描写细节', hint: '酒馆的木门声、老板擦拭杯子的动作、陌生人手上的戒指', required: true },
    { key: 'scene_ending', label: '场景结尾', hint: '以什么结束（钩子/悬念）', required: true },
    { key: 'linked_foreshadowing', label: '关联伏笔', hint: 'F001 神秘戒指（本章埋设 / 后续章节回收）', required: false }
  ];

  // ====== 对话卡字段 ======
  const DIALOGUE_FIELDS = [
    { key: 'speaker_a', label: '对话方 A', hint: '主角', required: true },
    { key: 'speaker_b', label: '对话方 B', hint: '神秘陌生人', required: true },
    { key: 'scene_context', label: '对话场景', hint: '酒馆内，周围人声嘈杂', required: true },
    { key: 'dialogue_goal', label: '对话目标', hint: '透露主角身世线索，同时建立悬疑', required: true },
    { key: 'relationship', label: '双方关系', hint: '陌生人/朋友/敌人/暧昧', required: true },
    { key: 'emotion_tone', label: '情绪基调', hint: '表面平静，暗流涌动', required: true },
    { key: 'key_info', label: '关键信息', hint: '必须在这段对话中传达的信息', required: true }
  ];

  // ====== AI 生成规则 ======
  const SCENE_GEN = {
    scene_no: () => shuffleAndPick(['1.1', '1.2', '1.3', '2.1', '2.2', '3.1', '3.2'], 2),
    location: (ctx) => shuffleAndPick([
      '长夜城·城南酒馆', '雾锁民国·上海·霞飞路 47 号', '月森林·千年古树下',
      '银河纪元·星舰·舰桥', '春风不及·高中·阳光走廊', '天剑宗·议事大殿',
      '幽冥沼泽·废弃祭坛', '皇城·夜宴厅'
    ], 4),
    time_setting: () => shuffleAndPick([
      '傍晚，天色将暗未暗', '深夜，万籁俱寂', '清晨，雾气未散',
      '正午，烈日当空', '黄昏，落日余晖', '午夜，钟声敲响十二下'
    ], 3),
    characters_present: (ctx) => {
      const chars = ctx._chars || ['主角', '神秘陌生人', '师父', '师妹'];
      return shuffleAndPick(chars, 3);
    },
    scene_goal: (ctx) => shuffleAndPick([
      '让主角获得关于记忆篡改的第一个线索',
      '建立主角与角色的信任关系',
      '制造一个悬念，让读者想继续读',
      '展示反派的强大，给主角制造压力',
      '让角色之间产生误会，推动后续剧情'
    ], 4),
    core_conflict: () => shuffleAndPick([
      '陌生人暗示主角的身份，但主角不信任他',
      '主角与师父意见分歧，必须做出选择',
      '反派突然出现，打断了原本的平静',
      '女主角的秘密被无意间揭露',
      '同伴受伤，主角必须在救人还是追敌之间选择'
    ], 3),
    scene_type: () => shuffleAndPick([
      '主动场景（主角有目标并行动）',
      '被动场景（主角对事件做出反应）',
      '互动场景（双方试探）',
      '转折场景（发生重大事件）'
    ], 2),
    emotion_curve_start: () => shuffleAndPick([
      '平静好奇', '轻松愉快', '紧张戒备', '悲伤低落', '愤怒压抑'
    ], 3),
    emotion_curve_end: () => shuffleAndPick([
      '震惊警惕', '骤然紧张', '爆发愤怒', '温暖释然', '绝望沉默', '坚定决绝'
    ], 4),
    key_details: () => shuffleAndPick([
      '酒馆的木门声、老板擦拭杯子的动作、陌生人手上的戒指',
      '雨水打在窗户上的声音、杯中晃动的酒液',
      '远处传来的钟声、桌上未写完的信',
      '风穿过破旧窗棂的声音、母亲年轻时的照片',
      '战场上飘落的军旗、同袍的遗物、远方的硝烟'
    ], 3),
    scene_ending: () => shuffleAndPick([
      '陌生人留下一句话后离开，主角追出去但人已消失',
      '师父的遗物中掉出一张纸条，主角读后呆立原地',
      '一阵风吹灭了所有蜡烛，黑暗中传来脚步声',
      '远处传来一声惨叫，主角立刻冲出房间',
      '夜宴结束，主角发现所有人都用奇怪的眼神看着他'
    ], 3),
    linked_foreshadowing: () => shuffleAndPick([
      'F001：神秘戒指（本章埋设）', 'F002：师父遗言（后续回收）',
      'F003：女主左手疤痕（本章暗示）', 'F005：反派真实身份（埋设）',
      '本章无伏笔'
    ], 2)
  };

  const DIALOGUE_GEN = {
    speaker_a: (ctx) => ctx._speaker_a || '主角',
    speaker_b: (ctx) => ctx._speaker_b || '神秘陌生人',
    scene_context: () => shuffleAndPick([
      '酒馆内，周围人声嘈杂', '夜宴上，觥筹交错',
      '深夜小巷，只有风声', '书房内，烛火摇曳', '战场上，硝烟弥漫'
    ], 3),
    dialogue_goal: () => shuffleAndPick([
      '透露主角身世线索', '建立角色间的信任',
      '制造冲突和误解', '揭示反派阴谋',
      '探讨核心主题（命运/真相/自由）'
    ], 3),
    relationship: () => shuffleAndPick(['陌生人', '朋友', '敌人', '暧昧', '师徒', '宿敌'], 4),
    emotion_tone: () => shuffleAndPick([
      '表面平静，暗流涌动', '轻松幽默，但话中有话',
      '激烈对峙，情绪爆发', '暧昧试探，欲言又止',
      '冷静克制，剑拔弩张'
    ], 3),
    key_info: () => shuffleAndPick([
      '主角的过去与某个组织有关', '反派已经知道主角的身份',
      '这个世界的历史被人篡改过', '师父临死前留下一封密信',
      '女主的真实身份是敌国王室'
    ], 3)
  };

  function shuffleAndPick(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  function optionCount(usageCount) {
    if (usageCount < 5) return 2 + Math.floor(Math.random() * 2);
    if (usageCount < 20) return 3 + Math.floor(Math.random() * 2);
    return 4 + Math.floor(Math.random() * 2);
  }

  function generateOptions(fieldKey, ctx, usageCount) {
    const gen = (SCENE_GEN[fieldKey] || DIALOGUE_GEN[fieldKey]);
    if (!gen) return [];
    const all = gen(ctx || {});
    const n = optionCount(usageCount || 0);
    return all.slice(0, n);
  }

  // ====== 数据持久化 ======
  function saveScene(novelId, sceneData) {
    if (!window.DB || !window.DB.scene) return null;
    const all = window.DB.scene.list();
    const existing = all.find(r => r.novel_id === novelId && r.scene_no === sceneData.scene_no);
    const row = {
      id: existing?.id,
      novel_id: novelId,
      creator_id: 'self',
      ...sceneData
    };
    return window.DB.scene.put(row);
  }

  function listScenes(novelId) {
    if (!window.DB || !window.DB.scene) return [];
    return window.DB.scene.list().filter(r => r.novel_id === novelId);
  }

  function saveDialogue(novelId, dialogueData) {
    if (!window.DB || !window.DB.dialogue) return null;
    const all = window.DB.dialogue.list();
    const existing = all.find(r => r.novel_id === novelId && r.scene_no === dialogueData.scene_no && r.speaker_a === dialogueData.speaker_a);
    const row = {
      id: existing?.id,
      novel_id: novelId,
      creator_id: 'self',
      ...dialogueData
    };
    return window.DB.dialogue.put(row);
  }

  function listDialogues(novelId) {
    if (!window.DB || !window.DB.dialogue) return [];
    return window.DB.dialogue.list().filter(r => r.novel_id === novelId);
  }

  // 场景三要素完整性检测
  function checkSceneCompleteness(scene) {
    const issues = [];
    if (!scene.location) issues.push('缺少场景地点');
    if (!scene.time_setting) issues.push('缺少场景时间');
    if (!scene.characters_present) issues.push('缺少在场人物');
    return { ok: issues.length === 0, issues };
  }

  window.SceneCard = {
    SCENE_FIELDS,
    DIALOGUE_FIELDS,
    generateOptions,
    optionCount,
    saveScene,
    listScenes,
    saveDialogue,
    listDialogues,
    checkSceneCompleteness
  };

  console.log('[v5.17] SceneCard 加载完成 · 场景卡 12 字段 + 对话卡 7 字段');
})();
