/* v5.17 — 大纲要素表系统
   4 大类共 28 字段：
     1. 基础信息表 7 字段（书名/类型/主题/基调/字数/简介/读者）
     2. 世界格局表 7 字段（世界类型/时代/力量体系/主要势力/社会阶层/核心冲突/地理环境）
     3. 主线情节表 6 字段（主线/起点/终点/三个关键事件/辅线/感情线）
     4. 章节细纲表 7 字段（事件编号/起因/发展/高潮/尾声/伏笔/角色/地点）
   字段模板 + AI 辅助生成规则
   与 ai-helper.js 集成：作者点击 🤖 帮我写 → 弹 2-5 选项
   选项数量动态控制：使用次数 ≤5 给 2-3；5-20 给 3-4；>20 给 4-5
*/
(function () {
  if (window.NovelOutline) return;

  // ====== 28 字段定义（按 4 大类组织） ======
  const SECTIONS = {
    basic: {
      key: 'basic',
      label: '基础信息表',
      desc: '让 AI 知道这是一本什么书、给谁看',
      fields: [
        { key: 'book_title', label: '书名', hint: '如《长夜将明》', required: true },
        { key: 'book_genre', label: '类型', hint: '可多选（玄幻/仙侠/都市/校园/历史/科幻/末日/古言等）', required: true },
        { key: 'book_theme', label: '主题', hint: '核心表达的内核：成长/救赎/真相/权力与代价', required: true },
        { key: 'book_tone', label: '基调', hint: '整体情绪氛围：沉重/紧张/轻松幽默/黑暗幽默/温暖治愈', required: true },
        { key: 'word_count', label: '预计字数', hint: '大致篇幅（10万/30万/100万）', required: true },
        { key: 'book_synopsis', label: '一句话简介', hint: 'logline，用一句话概括整个故事', required: true },
        { key: 'target_reader', label: '目标读者', hint: '18-30岁，喜欢悬疑+修仙的女性读者', required: false }
      ]
    },
    world: {
      key: 'world',
      label: '世界格局表',
      desc: '让 AI 知道故事发生在什么样的世界里',
      fields: [
        { key: 'world_type', label: '世界类型', hint: '现实/架空/半架空', required: true },
        { key: 'era', label: '时代背景', hint: '类唐宋/民国/现代/未来 2999 年', required: true },
        { key: 'power_system', label: '力量体系', hint: '修仙：炼气→筑基→金丹→元婴→化神', required: false },
        { key: 'major_factions', label: '主要势力', hint: '3-5 个核心势力（天剑宗/幽冥教/皇朝）', required: true },
        { key: 'social_classes', label: '社会阶层', hint: '3 个代表性阶层（修士/凡人/被放逐者）', required: true },
        { key: 'core_conflict', label: '核心冲突', hint: '整个世界面临的最大矛盾', required: true },
        { key: 'geography', label: '地理环境', hint: '主要地点及特征（东：天剑山脉；西：幽冥沼泽）', required: true }
      ]
    },
    plot: {
      key: 'plot',
      label: '主线情节表',
      desc: '让 AI 知道故事的主线脉络',
      fields: [
        { key: 'main_plot', label: '主线一句话', hint: '主角的核心目标', required: true },
        { key: 'plot_start', label: '主线起点', hint: '故事从哪开始', required: true },
        { key: 'plot_end', label: '主线终点', hint: '故事最终走向', required: true },
        { key: 'key_events', label: '三个关键事件', hint: '主线上的三个重大转折点', required: true },
        { key: 'sub_plots', label: '辅线（2-3 条）', hint: '次要情节线（感情线/宿命对决/寻亲）', required: false },
        { key: 'romance_arc', label: '感情线', hint: '感情发展的脉络', required: false }
      ]
    },
    chapter: {
      key: 'chapter',
      label: '章节细纲表',
      desc: '每个关键事件一张表，细化到 起因/发展/高潮/尾声/伏笔/角色/地点',
      fields: [
        { key: 'event_no', label: '事件编号', hint: '事件一/事件二/事件三', required: true },
        { key: 'cause', label: '起因', hint: '什么引发了这件事', required: true },
        { key: 'development', label: '发展', hint: '事情如何推进', required: true },
        { key: 'climax', label: '高潮', hint: '事件的最紧张时刻', required: true },
        { key: 'ending', label: '尾声', hint: '事件如何收场', required: true },
        { key: 'planted_foreshadow', label: '埋下的伏笔', hint: '这个事件中埋了什么线索（F001 神秘戒指）', required: false },
        { key: 'involved_chars', label: '涉及角色', hint: '出场角色列表', required: true },
        { key: 'location', label: '场景地点', hint: '发生在哪里', required: true }
      ]
    }
  };

  // ====== 28 字段生成规则（AI 辅助填表） ======
  const FIELD_GEN = {
    book_title: (ctx) => {
      const themes = ctx.themes || ['命运', '记忆', '剑', '长夜', '春风', '深渊', '星辰'];
      const adjs = ['孤', '残', '深', '未央', '已逝', '将明', '无声', '无尽'];
      const nouns = ['城', '歌', '卷', '梦', '约', '录', '图', '辞'];
      const pool = [];
      themes.forEach(t => pool.push(t, t + adjs[Math.floor(Math.random() * adjs.length)], adjs[Math.floor(Math.random() * adjs.length)] + t));
      themes.forEach(t => nouns.forEach(n => pool.push(t + n)));
      return shuffleAndPick(pool, 5);
    },
    book_synopsis: (ctx) => [
      `一个${ctx.mc || '失去记忆'}的${ctx.role || '修士'}发现，整个${ctx.world || '修仙世界'}的历史都是被人改写的。`,
      `${ctx.mc || '她'}曾以为${ctx.world || '这个世界'}是${ctx.mood || '温柔的'}，直到一个${ctx.role || '修士'}用${ctx.weapon || '一柄残剑'}打碎了所有的${ctx.theme || '谎言'}。`,
      `当${ctx.mc || '他'}从${ctx.time || '十年昏迷'}中醒来，${ctx.world || '他熟悉的一切'}都不再是他记忆中的模样。`,
      `${ctx.role || '一只被遗忘的妖'}，踏上了寻找${ctx.mc || '被篡改的真相'}的旅程。`,
      `所有人都说${ctx.theme || '她'}已经死了。可${ctx.role || '他'}亲眼看到——她从火里走出来。`
    ],
    book_theme: () => shuffleAndPick([
      '成长与代价', '真相与谎言', '自由与束缚', '爱与复仇', '记忆与遗忘',
      '命运与抗争', '权力与正义', '理想与现实', '生与死', '人性与兽性'
    ], 5),
    book_tone: () => shuffleAndPick([
      '沉重', '紧张', '轻松幽默', '沉重中带希望', '黑暗幽默',
      '温暖治愈', '悲壮', '史诗', '悬疑', '清新'
    ], 5),
    word_count: () => shuffleAndPick([
      '8 万字（短篇）', '15 万字（中篇）', '30 万字（长篇）', '50 万字（超长篇）', '100 万字以上（巨著）'
    ], 3),
    book_genre: (ctx) => {
      const cur = ctx.book_genre || [];
      const pool = ['玄幻', '仙侠', '都市', '校园', '历史', '军事', '游戏', '体育', '科幻', '灵异', '悬疑', '二次元', '古言', '现言', '浪漫青春', '武侠', '古武', '网游', '末世', '赛博朋克', '无限流', '童话', '剧本杀'];
      return shuffleAndPick(pool.filter(x => !cur.includes(x)), 5);
    },
    target_reader: () => shuffleAndPick([
      '18-30 岁，喜欢悬疑+修仙的女性读者',
      '25-40 岁，热衷权谋与朝堂博弈的男性读者',
      '15-22 岁，校园言情爱好者',
      '30-45 岁，怀旧民国+谍战爱好者',
      '科幻迷，硬核设定控'
    ], 4),
    world_type: () => shuffleAndPick(['现实', '架空', '半架空（现实+超凡元素）', '历史架空', '异世界穿越', '平行宇宙'], 4),
    era: () => shuffleAndPick(['类唐宋（灵气复苏）', '民国 1937', '现代 2026', '赛博 2099', '架空大齐王朝', '星际殖民时代 2300'], 4),
    power_system: (ctx) => {
      const t = ctx.world_type || '架空';
      if (t.includes('架空') || t.includes('仙侠')) {
        return shuffleAndPick([
          '炼气→筑基→金丹→元婴→化神→大乘',
          '武徒→武者→武师→武宗→武王→武帝',
          '灵士→灵师→灵宗→灵尊→灵圣',
          '剑修：剑气→剑意→剑心→剑域',
          '觉醒者 F→E→D→C→B→A→S'
        ], 4);
      } else if (t.includes('赛博') || t.includes('科幻')) {
        return shuffleAndPick([
          '基因强化 一阶→九阶',
          '机械融合 Ⅰ→Ⅸ',
          '念动力 1-9 级',
          '超体进化 微观→宏观',
          'AI 觉醒 L0→L5'
        ], 4);
      } else {
        return ['（现实世界无超凡力量）'];
      }
    },
    major_factions: (ctx) => shuffleAndPick([
      '天剑宗（正道领袖）', '幽冥教（邪道组织）', '皇朝（世俗权力）',
      '散修联盟（中立自治）', '妖族联邦（异族政权）',
      '学院派（学术权威）', '黑市商盟（地下经济）', '监察司（朝廷鹰犬）'
    ], 4),
    social_classes: () => shuffleAndPick([
      '修士 / 凡人 / 被放逐者',
      '皇族 / 贵族 / 平民',
      '觉醒者 / 普通人 / 变异者',
      '公司高层 / 中产 / 无产者',
      '学院师生 / 学院外平民 / 流浪学者'
    ], 3),
    core_conflict: (ctx) => shuffleAndPick([
      `${ctx.world || '整个世界'}灵气正在枯竭，各大势力争夺最后的资源`,
      `${ctx.world || '皇朝与宗门'}争夺统治权，谁掌握了${ctx.power || '核心力量'}谁就是王`,
      `被篡改的${ctx.world || '历史'}真相即将浮出水面，触动所有势力的利益根基`,
      `异族入侵，${ctx.world || '人类'}文明危在旦夕`,
      `科技失控，AI 觉醒反噬人类`
    ], 4),
    geography: (ctx) => shuffleAndPick([
      '东：天剑山脉；西：幽冥沼泽；中：皇城；南：凡人聚居地；北：禁地',
      '三大都市 + 数条贸易走廊 + 一片被诅咒的无人区',
      '悬浮在云端的塔群 + 地下深处的深渊城',
      '群岛散布，每岛一势力，中央是禁忌的漩涡海',
      '一整片被辐射尘覆盖的废土 + 几个堡垒城市'
    ], 3),
    main_plot: (ctx) => shuffleAndPick([
      `主角要找到自己被篡改的记忆真相`,
      `主角要带领族人走出即将毁灭的家园`,
      `主角要揭开王朝更迭背后的惊天阴谋`,
      `主角要拯救被献祭的挚爱`,
      `主角要打败比自己强大百倍的最终反派`
    ], 4),
    plot_start: () => shuffleAndPick([
      '主角在一场战争中醒来，发现自己什么都不记得',
      '主角平静的日常生活被一个不速之客打破',
      '主角收到一封来自十年后的自己寄来的信',
      '主角亲眼目睹一场不可思议的事件，被迫踏上逃亡之路',
      '主角从师父遗物中发现了一个惊天秘密'
    ], 4),
    plot_end: () => shuffleAndPick([
      '主角发现真相，并选择是否公开这个真相',
      '主角牺牲自己换来族人的延续',
      '主角与反派同归于尽，留下一代又一代的传说',
      '主角选择隐退，把未来交给下一代',
      '主角打破命运的轮回，重新书写世界规则'
    ], 4),
    key_events: () => shuffleAndPick([
      '事件一：发现记忆被篡改的线索；事件二：遇到知道真相的人；事件三：面对篡改记忆的幕后黑手',
      '事件一：家园被毁；事件二：拜师学艺；事件三：决战巅峰',
      '事件一：意外卷入宫廷政变；事件二：被陷害入狱；事件三：洗冤昭雪',
      '事件一：与女主相遇；事件二：发现女主身世秘密；事件三：共同对抗强敌'
    ], 2),
    sub_plots: () => shuffleAndPick([
      '辅线一：与女主角的感情发展；辅线二：与反派的宿命对决；辅线三：寻找失散的同门',
      '辅线一：师父的复仇之路；辅线二：师妹的成长线；辅线三：朝廷权谋线',
      '辅线一：男二号的救赎；辅线二：妖族与人族的冲突；辅线三：遗失的国宝线索'
    ], 2),
    romance_arc: () => shuffleAndPick([
      '从互相戒备→并肩作战→产生信任→面临抉择→最终结局',
      '从青梅竹马→误会分离→重逢对峙→共同成长→生死相依',
      '从契约婚姻→日常相处→暗生情愫→外力介入→坚定选择'
    ], 3),
    event_no: (ctx) => {
      const used = ctx._used_event_nos || [];
      const pool = ['事件一', '事件二', '事件三', '事件四', '事件五'].filter(x => !used.includes(x));
      return pool.length ? [pool[0]] : ['事件一'];
    },
    cause: () => shuffleAndPick([
      '主角在旧书摊偶得一本神秘日记',
      '一场突如其来的刺杀打乱了主角的计划',
      '师父临终前的一句遗言',
      '一场天灾让主角失去了一切',
      '朝廷的密令让主角成为棋子'
    ], 3),
    development: () => shuffleAndPick([
      '主角开始暗中调查，遇到了志同道合的伙伴',
      '主角深入敌方阵营，发现惊天阴谋',
      '主角一边修炼，一边解开一个个谜团',
      '主角联合多方势力，但彼此心怀鬼胎',
      '主角在一次次战斗中不断成长'
    ], 3),
    climax: () => shuffleAndPick([
      '主角在最终一战中觉醒，击溃反派',
      '主角发现了真相，但必须做出痛苦的抉择',
      '一场惊天大爆炸，所有人被迫面对自己的命运',
      '主角与宿敌正面对决，胜负在一念之间',
      '一场精心设计的陷阱，所有人陷入绝境'
    ], 3),
    ending: () => shuffleAndPick([
      '主角带着一身伤痕和一群生死之交离开',
      '主角继承了师父的衣钵，成为新一代领袖',
      '主角回到家乡，发现一切都已经物是人非',
      '主角踏上新的旅程，前方还有未知的挑战',
      '主角把真相公之于众，撼动了整个世界'
    ], 3),
    planted_foreshadow: () => shuffleAndPick([
      'F001：神秘戒指上的刻字',
      'F002：师父临终前的遗言',
      'F003：女主的左手疤痕',
      'F004：一本没有作者的禁书',
      'F005：反派的真实身份暗示'
    ], 3),
    involved_chars: (ctx) => {
      const chars = ctx._chars || [];
      const pool = ['主角', '女主角', '反派', '师父', '师妹', '师兄', '神秘老人', '朝廷官员'];
      const subset = shuffleAndPick(pool, 3);
      return chars.length ? [`（含已有角色：${chars.slice(0, 2).join('、')}）`, ...subset] : subset;
    },
    location: () => shuffleAndPick([
      '西游记·大明宫·夜宴厅',
      '雾锁民国·上海·霞飞路 47 号',
      '月森林·千年古树下',
      '银河纪元·星舰·舰桥',
      '春风不及·高中·阳光走廊'
    ], 3)
  };

  // ====== 工具函数 ======
  function shuffleAndPick(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  // ====== 选项数量动态控制 ======
  function optionCount(usageCount) {
    if (usageCount < 5) return 2 + Math.floor(Math.random() * 2); // 2-3
    if (usageCount < 20) return 3 + Math.floor(Math.random() * 2); // 3-4
    return 4 + Math.floor(Math.random() * 2); // 4-5
  }

  // ====== 生成选项（统一入口） ======
  function generateOptions(fieldKey, ctx, usageCount) {
    const gen = FIELD_GEN[fieldKey];
    if (!gen) return [];
    const all = gen(ctx || {});
    const n = optionCount(usageCount || 0);
    return all.slice(0, n);
  }

  // ====== 数据持久化（基于 window.DB.outline） ======
  function saveField(novelId, section, fieldKey, value, isAiGenerated) {
    if (!window.DB || !window.DB.outline) {
      console.warn('[NovelOutline] window.DB.outline not ready');
      return null;
    }
    const fieldDef = (SECTIONS[section]?.fields || []).find(f => f.key === fieldKey);
    const all = window.DB.outline.list();
    const existing = all.find(r => r.novel_id === novelId && r.section === section && r.field_key === fieldKey);
    const row = {
      id: existing?.id,
      novel_id: novelId,
      creator_id: 'self',
      section,
      field_key: fieldKey,
      field_label: fieldDef?.label || fieldKey,
      field_category: section,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      ai_generated: !!isAiGenerated,
      ai_modified: false,
      human_filled: !isAiGenerated
    };
    return window.DB.outline.put(row);
  }

  function getField(novelId, section, fieldKey) {
    if (!window.DB || !window.DB.outline) return null;
    const all = window.DB.outline.list();
    return all.find(r => r.novel_id === novelId && r.section === section && r.field_key === fieldKey) || null;
  }

  function getAllByNovel(novelId) {
    if (!window.DB || !window.DB.outline) return {};
    const all = window.DB.outline.list().filter(r => r.novel_id === novelId);
    const grouped = {};
    all.forEach(r => {
      if (!grouped[r.section]) grouped[r.section] = {};
      grouped[r.section][r.field_key] = r.value;
    });
    return grouped;
  }

  function getCompletion(novelId) {
    const total = Object.values(SECTIONS).reduce((s, sec) => s + sec.fields.filter(f => f.required).length, 0);
    if (!window.DB || !window.DB.outline) return { filled: 0, total, percent: 0 };
    const all = window.DB.outline.list().filter(r => r.novel_id === novelId);
    let filled = 0;
    Object.values(SECTIONS).forEach(sec => {
      sec.fields.filter(f => f.required).forEach(f => {
        if (all.find(r => r.section === sec.key && r.field_key === f.key && r.value)) filled++;
      });
    });
    return { filled, total, percent: Math.round((filled / total) * 100) };
  }

  // ====== 暴露 API ======
  window.NovelOutline = {
    SECTIONS,
    FIELD_GEN,
    generateOptions,
    optionCount,
    saveField,
    getField,
    getAllByNovel,
    getCompletion
  };

  console.log('[v5.17] NovelOutline 加载完成 · 4 大类 28 字段模板');
})();
