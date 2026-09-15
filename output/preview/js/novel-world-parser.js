/* =====================================================================
 * V22-A · 小说世界自动生成引擎 — 5 步提取流水线
 *
 * 设计原则（S03 第一条铁律）：
 *   AI 是「提取器 + 排版器」，不是「作者」。
 *   所有提取函数严禁使用 LLM / mock 生成；纯规则化（关键词 + 正则 + 上下文）。
 *   零删减：原文段落 byte-equal 保留。
 *
 * 输入：完整小说原文（txt 字符串）
 * 输出：world_bible / scenes / npcs / items / actions 五字段
 *
 * 与 V20-X novel-game-parser.js 的关系：
 *   - parseOriginalNovel（V20-X）：原文 → {title, chapters: [{title, paragraphs, cost}]}
 *   - extractEntities（V20-X）：paragraphs → {npcs, items}（用于 hotzone）
 *   - V22-A 在此基础上新增 5 个 extract 函数（world_bible / scenes / npcs / items / actions）
 *   - 共享 NovelWorldStore 数据中枢
 * ===================================================================== */
(function () {
  var base = window.LJNovelParser;
  if (!base) {
    if (window.console && console.error) console.error('[V22-A] novel-game-parser.js not loaded');
    return;
  }

  // ---- 题材关键词字典（V22-B 也会用） ----
  var GENRE_KEYWORDS = {
    xiuxian: ['炼气', '筑基', '金丹', '元婴', '灵气', '飞升', '闭关', '御剑', '丹药', '灵根', '修真', '仙门', '天劫', '雷劫', '丹田'],
    mori:    ['丧尸', '辐射', '避难所', '物资', '感染', '废土', '变异', '末世', '幸存', '营地', '尸潮', '异变', '抗体'],
    wuxia:   ['门派', '内力', '招式', '江湖', '比武', '武林', '大侠', '武功', '侠客', '帮会', '掌门', '弟子', '侠义', '剑客'],
    jingying:['土地', '作物', '收获', '交易', '金币', '银两', '播种', '耕种', '农田', '粮仓', '商行', '集市', '物价', '收成'],
    gongdou: ['后宫', '位分', '宠爱', '势力', '心计', '皇后', '妃子', '公主', '宫女', '请安', '送礼', '陷害', '宫规', '太监']
  };

  // ---- 属性面板映射（V22-B 装载） ----
  var GENRE_ATTRS = {
    xiuxian: { 修为: 0, 灵根: '未知', 神识: 0, 寿元: 100, 灵气: 0 },
    mori:    { 生命: 100, 精神: 100, 饥饿: 0, 辐射: 0, 物资: 0 },
    wuxia:   { 气血: 100, 内力: 0, 武功: '初学', 声望: 0, 善恶: 0 },
    jingying:{ 体力: 50, 铜钱: 31, 声望: 0, 土地: 1, 饱腹: 100 },
    gongdou: { 位分: '宫女', 宠爱: 0, 心计: 0, 礼仪: 0, 势力: '中立' }
  };

  // ---- 默认操作（V22-B 装载） ----
  var GENRE_ACTIONS = {
    xiuxian:  ['打坐', '炼丹', '闭关', '御剑', '宗门任务', '炼制', '拍卖', '寻访'],
    mori:     ['搜索', '建设', '交易', '采集', '抵御', '修复', '侦察', '庇护'],
    wuxia:    ['比武', '行侠', '修炼', '结交', '收集情报', '拜师', '挑战', '行医'],
    jingying: ['种田', '采集', '烹饪', '建造', '买卖', '歇息', '整理', '伐木'],
    gongdou:  ['请安', '送礼', '拉拢', '陷害', '打探', '献艺', '祈福', '献策']
  };

  /* ---- Step 1 · 场景与时间抽取 ----
     识别地点（家/医馆/后山/城镇）+ 时间变化（上午/黄昏/深夜/第N天）
     输出：[{ scene_id, scene_name, time_period, paragraphs[] }]
     严格不删减：paragraphs = 原文章节 byte-equal */
  function extractScenes(text) {
    var novel = base.parseOriginalNovel(text);
    var scenes = [];
    novel.chapters.forEach(function (chap, cIdx) {
      // 场景识别：每章前 50 字内的地点名词 + 章首行「在…」「于…」模式
      var sceneName = chap.title;
      var timeHint = guessTimePeriod(chap.paragraphs[0] || '');
      if (chap.paragraphs.length === 0) return;
      scenes.push({
        scene_id: 'chap_' + (cIdx + 1),
        scene_name: sceneName,
        time_period: timeHint,
        paragraphs: chap.paragraphs.slice(), // byte-equal 副本
        chapter_idx: cIdx,
        cost: chap.cost || 0
      });
    });
    return scenes;
  }

  function guessTimePeriod(firstPara) {
    var t = firstPara.slice(0, 100);
    if (/凌晨|五更|寅时|卯时|清晨|黎明|早晨|日出/.test(t)) return '清晨';
    if (/中午|午时|晌午/.test(t)) return '中午';
    if (/黄昏|傍晚|夕阳|日落|暮色/.test(t)) return '黄昏';
    if (/深夜|子时|夜半|夜深|月黑/.test(t)) return '深夜';
    if (/上午|辰时|巳时/.test(t)) return '上午';
    if (/下午|申时|未时/.test(t)) return '下午';
    return '日间'; // 兜底
  }

  /* ---- Step 2 · NPC 与角色抽取 ----
     输出：[{ npc_id, name, relation, first_scene, affinity:0 }] */
  function extractNpcs(text) {
    var novel = base.parseOriginalNovel(text);
    var allParas = [];
    novel.chapters.forEach(function (c) { allParas = allParas.concat(c.paragraphs); });
    var entities = base.extractEntities(allParas);
    return entities.npcs.map(function (n, idx) {
      return {
        npc_id: 'npc_' + (idx + 1),
        name: n.name,
        relation: '未知',
        first_scene: scenesAt(allParas, n.firstPara),
        affinity: 0
      };
    });
  }

  function scenesAt(allParas, idx) {
    // 简化：根据 paragraph 索引找最近 chapter
    return 'chap_' + (Math.floor(idx / 3) + 1);
  }

  /* ---- Step 3 · 物品与资源抽取 ----
     输出：[{ item_id, name, category, quantity:0 }] */
  function extractItems(text) {
    var novel = base.parseOriginalNovel(text);
    var allParas = [];
    novel.chapters.forEach(function (c) { allParas = allParas.concat(c.paragraphs); });
    var entities = base.extractEntities(allParas);
    return entities.items.map(function (n, idx) {
      return {
        item_id: 'item_' + (idx + 1),
        name: n.name,
        category: guessItemCategory(n.name),
        quantity: 0
      };
    });
  }

  function guessItemCategory(name) {
    if (/剑|刀|枪|弓|戟|锤/.test(name)) return '武器';
    if (/玉|珠|环|镯|印/.test(name)) return '饰物';
    if (/书|经|符|卷|图/.test(name)) return '文书';
    if (/丹|药|酒|茶|香/.test(name)) return '消耗品';
    if (/钱|银|金|钞|币/.test(name)) return '货币';
    return '杂物';
  }

  /* ---- Step 4 · 动作与经营抽取 ----
     输出：[{ action_id, label, action_type, position, target_scene, cost, gain }] */
  function extractActions(text) {
    var novel = base.parseOriginalNovel(text);
    var allParas = [];
    novel.chapters.forEach(function (c) { allParas = allParas.concat(c.paragraphs); });
    var actions = [];
    var seen = {};

    // 模式 1：「你拾取…」/「你拾起…」→ 拾取动作
    var pickRe = /你(?:拾取|拾起|捡起|采集|采摘)(?:了?\s*)?([\u4e00-\u9fa5]{2,6})/g;
    allParas.forEach(function (p, idx) {
      var m;
      pickRe.lastIndex = 0;
      while ((m = pickRe.exec(p)) !== null) {
        var key = 'pick_' + m[1];
        if (seen[key]) continue;
        seen[key] = true;
        actions.push({
          action_id: 'act_' + (actions.length + 1),
          label: '拾取' + m[1],
          action_type: 'pick',
          position: { x: 0.3 + Math.random() * 0.4, y: 0.5 + Math.random() * 0.3 },
          target_scene: 'chap_' + (Math.floor(idx / 3) + 1),
          cost: { action_points: 1, copper: 0 },
          gain: { item: m[1], quantity: 1 }
        });
      }
    });

    // 模式 2：「去后山」/「去城镇」/「去XXX」→ 移动动作
    var goRe = /你(?:打算|想|要|准备)?(?:去|往|到|前往)([\u4e00-\u9fa5]{2,6})/g;
    allParas.forEach(function (p, idx) {
      var m;
      goRe.lastIndex = 0;
      while ((m = goRe.exec(p)) !== null) {
        var key = 'go_' + m[1];
        if (seen[key]) continue;
        seen[key] = true;
        actions.push({
          action_id: 'act_' + (actions.length + 1),
          label: '去' + m[1],
          action_type: 'travel',
          position: { x: 0.2 + Math.random() * 0.6, y: 0.4 + Math.random() * 0.4 },
          target_scene: 'chap_' + (Math.floor(idx / 3) + 1),
          cost: { action_points: 5, copper: 0 },
          gain: {}
        });
      }
    });

    // 模式 3：「修理/做饭/钓鱼/采集」→ 经营动作
    var opRe = /你(?:修理|做饭|烹饪|钓鱼|采集|伐木|打坐|修炼|炼丹)(?:了?\s*)?([\u4e00-\u9fa5]{0,6})/g;
    var opLabels = ['修理', '做饭', '烹饪', '钓鱼', '采集', '伐木', '打坐', '修炼', '炼丹'];
    allParas.forEach(function (p, idx) {
      opLabels.forEach(function (op) {
        if (p.indexOf(op) >= 0 && !seen['op_' + op]) {
          seen['op_' + op] = true;
          actions.push({
            action_id: 'act_' + (actions.length + 1),
            label: op,
            action_type: 'operation',
            position: { x: 0.25 + Math.random() * 0.5, y: 0.45 + Math.random() * 0.4 },
            target_scene: 'chap_' + (Math.floor(idx / 3) + 1),
            cost: { action_points: 3, copper: 0 },
            gain: { item: op, quantity: 1 }
          });
        }
      });
    });

    // 模式 4（V22-D）：文言动词提取 — 公版古典小说（桃花源记/三国/红楼等）没有
    // 「你拾取/你打算」这类第二人称白话标注，动作直接从原文动词句提取。
    // 铁律：只提取原文中真实出现的动词，不做任何创造。
    var classicalOps = [
      { kw: '捕鱼',   label: '捕鱼',   type: 'operation', gain: { item: '鱼', quantity: 1 } },
      { kw: '种作',   label: '种作',   type: 'operation', gain: { item: '谷物', quantity: 1 } },
      { kw: '设酒',   label: '设酒',   type: 'operation', gain: { item: '酒', quantity: 1 } },
      { kw: '杀鸡',   label: '杀鸡作食', type: 'operation', gain: { item: '鸡肉', quantity: 1 } },
      { kw: '舍船',   label: '舍船上岸', type: 'travel',   gain: {} },
      { kw: '前行',   label: '前行',   type: 'travel',   gain: {} },
      { kw: '复行',   label: '继续前行', type: 'travel',   gain: {} },
      { kw: '问讯',   label: '问讯',   type: 'social',   gain: {} },
      { kw: '具言',   label: '具言所闻', type: 'social',   gain: {} },
      { kw: '饮酒',   label: '饮酒',   type: 'operation', gain: { item: '酒', quantity: 1 } },
      { kw: '叹惋',   label: '叹惋',   type: 'social',   gain: {} },
      { kw: '诣',     label: '拜诣',   type: 'social',   gain: {} }
    ];
    allParas.forEach(function (p, idx) {
      classicalOps.forEach(function (op) {
        if (p.indexOf(op.kw) >= 0 && !seen['cls_' + op.kw]) {
          seen['cls_' + op.kw] = true;
          actions.push({
            action_id: 'act_' + (actions.length + 1),
            label: op.label,
            action_type: op.type,
            position: { x: 0.25 + Math.random() * 0.5, y: 0.45 + Math.random() * 0.4 },
            target_scene: 'chap_' + (Math.floor(idx / 3) + 1),
            cost: { action_points: op.type === 'travel' ? 5 : 2, copper: 0 },
            gain: op.gain
          });
        }
      });
    });

    return actions.slice(0, 20); // 上限 20 个动作
  }

  /* ---- Step 5 · 世界宪法抽取（题材/时代/力量体系/势力） ----
     输出：{ genre, era, power_system, factions, forbidden_rules } */
  function extractWorldBible(text) {
    var novel = base.parseOriginalNovel(text);
    var allParas = novel.chapters.slice(0, Math.max(3, Math.ceil(novel.chapters.length * 0.1)))
      .reduce(function (acc, c) { return acc.concat(c.paragraphs); }, []);
    var weights = detectGenreWeights(allParas);
    var ranked = Object.entries(weights).sort(function (a, b) { return b[1] - a[1]; });
    var primary = ranked[0][0];
    var combo = ranked[0][1] > ranked[1][1] * 2 ? [primary] : [ranked[0][0], ranked[1][0]];

    return {
      genre: primary,
      genre_combo: combo,
      era: guessEra(allParas),
      power_system: guessPowerSystem(primary, allParas),
      factions: extractFactions(allParas),
      forbidden_rules: extractForbiddenRules(primary, allParas)
    };
  }

  function detectGenreWeights(paragraphs) {
    var weights = { xiuxian: 0, mori: 0, wuxia: 0, jingying: 0, gongdou: 0 };
    paragraphs.forEach(function (p) {
      Object.keys(GENRE_KEYWORDS).forEach(function (g) {
        GENRE_KEYWORDS[g].forEach(function (kw) {
          var re = new RegExp(kw, 'g');
          var m = p.match(re);
          if (m) weights[g] += m.length;
        });
      });
    });
    return weights;
  }

  function guessEra(paras) {
    var text = paras.join(' ');
    if (/民国|近代|民国时期|共和国/.test(text)) return '民国';
    if (/明朝|清朝|康熙|乾隆|雍正|光绪/.test(text)) return '明清';
    if (/宋朝|元朝|明朝|唐朝|汉朝|秦朝|周朝|春秋|战国/.test(text)) return '古代';
    if (/2024|2025|2026|2027|现代|都市|公司|写字楼/.test(text)) return '现代';
    if (/未来|星际|飞船|机甲|外星/.test(text)) return '未来';
    return '架空古代';
  }

  function guessPowerSystem(genre, paras) {
    var sys = {
      xiuxian: '炼气、筑基、金丹、元婴',
      mori:    '生命、精神、辐射、抗体',
      wuxia:   '气血、内力、招式',
      jingying:'体力、铜钱、声望',
      gongdou: '位分、宠爱、心计'
    };
    return sys[genre] || '无特定体系';
  }

  function extractFactions(paras) {
    var text = paras.join(' ');
    var factions = [];
    var re = /[「【]([\u4e00-\u9fa5]{2,6}(?:宗|教|门|派|国|朝|城|府|帮|会|楼|阁|宫|殿))[」】]/g;
    var m;
    while ((m = re.exec(text)) !== null && factions.length < 6) {
      if (factions.indexOf(m[1]) === -1) factions.push(m[1]);
    }
    if (factions.length === 0) factions = ['未知'];
    return factions;
  }

  function extractForbiddenRules(genre, paras) {
    var rules = {
      xiuxian:  ['未达筑基不可御剑飞行', '金丹以下不可擅自开山立派'],
      mori:     ['辐射值过高将致死', '避难所物资耗尽后无法庇护'],
      wuxia:    ['未经掌门许可不可私斗', '内力耗尽将无法施展招式'],
      jingying: ['体力耗尽无法继续劳作', '铜钱耗尽无法交易'],
      gongdou:  ['未到品级不可觐见', '礼仪失当将扣减宠爱']
    };
    return rules[genre] || [];
  }

  /* ---- 综合入口：5 步流水线一次跑完 ---- */
  function runPipeline(text) {
    return {
      world_bible: extractWorldBible(text),
      scenes: extractScenes(text),
      npcs: extractNpcs(text),
      items: extractItems(text),
      actions: extractActions(text),
      // 关键保证：原文段落 byte-equal 保留（不删减）
      original_paragraphs: extractAllParagraphs(text)
    };
  }

  function extractAllParagraphs(text) {
    var novel = base.parseOriginalNovel(text);
    var out = [];
    novel.chapters.forEach(function (c) { out = out.concat(c.paragraphs); });
    return out;
  }

  /* ---- 暴露 API ---- */
  window.NovelWorldParser = {
    extractWorldBible: extractWorldBible,
    extractScenes: extractScenes,
    extractNpcs: extractNpcs,
    extractItems: extractItems,
    extractActions: extractActions,
    runPipeline: runPipeline,
    // 题材字典（V22-B 共享）
    GENRE_KEYWORDS: GENRE_KEYWORDS,
    GENRE_ATTRS: GENRE_ATTRS,
    GENRE_ACTIONS: GENRE_ACTIONS
  };
})();