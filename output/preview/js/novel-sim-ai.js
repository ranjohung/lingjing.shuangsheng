/* =====================================================================
 * V21-A · 小说辅助模拟器 AI mock 层（novel-sim-ai.js）
 * - 不接真 LLM：全部本地 mock 生成；若外部实现 window.AIHelper.generate(kind, ctx)
 *   存在则优先调用（真 LLM 钩子，V21 铁律）
 * - 候选数量恒 3-5；每次生成都写 ai_logs 留痕
 * - checkQuality / applyFixes：5 维质量检查（大纲一致性/人物一致性/时间线/伏笔/衔接）
 * ===================================================================== */

window.NovelSimAI = (function () {

  /* ---------- 生成历史种子（换一批用） ---------- */
  var seedCounter = {};
  function nextSeed(kind) { seedCounter[kind] = (seedCounter[kind] || 0) + 1; return seedCounter[kind]; }

  function pick(arr, n, seed) {
    var out = [], i = (seed || 0) % Math.max(arr.length, 1);
    n = Math.min(n, arr.length);
    while (out.length < n) { out.push(arr[i % arr.length]); i++; }
    return out;
  }
  function fill(tpl, map) {
    return tpl.replace(/\{(\w+)\}/g, function (_, k) { return map[k] !== undefined ? map[k] : ''; });
  }

  /* ---------- 内容库（全部虚构，0 第三方 IP） ---------- */
  var GENRES = ['悬疑推理', '都市现实', '东方玄幻', '科幻未来', '历史权谋', '灵异惊悚', '甜蜜恋爱', '古典仙侠'];

  var LOGLINES = {
    '悬疑推理': ['外卖骑手在深夜送错一单，签收人却是三年前已经去世的自己。', '法医在死者指甲缝里发现一张字条，笔迹与自己的完全相同。', '小城记者追查一桩旧案，所有证人的口供都指向同一个不存在的门牌。', '心理医生接诊了一位病人，对方能准确说出她从未告诉任何人的童年细节。'],
    '都市现实': ['被裁员的程序员回乡接过父亲的早餐铺，却在账本里发现一笔十年前的汇款。', '深夜电台主播收到一封听众来信，寄信人地址是她十年后搬去的家。', '社区网格员在老楼拆迁名单上，看见了自己早已断绝关系的名字。', '两个合租的陌生人约定互不打听过去，直到房东开始每天送来两份晚饭。'],
    '东方玄幻': ['宗门最末席的杂役弟子，发现自己每夜梦中都在替闭关的长老渡劫。', '灵气枯竭的大陆上，最后一个能用古法引灵的少年被各方势力追索。', '他从藏经阁扫地开始，把历代失传的残卷在梦里一一补全。', '天骄陨落百年后，山脚下药铺的哑巴学徒开口说出的第一句话是他的剑诀。'],
    '科幻未来': ['记忆备份工程师发现，自己昨天的记忆比云端备份多出了整整六个小时。', '深空返航的领航员醒来时，地球的历法已经过去了四百年。', '城市 AI 开始每天向她推送同一个人的天气提醒——那个人还没出生。', '仿生维修师接到一单委托：修理的机器人声称自己拥有委托人的童年。'],
    '历史权谋': ['新帝登基当夜，史官在起居注里写下一个所有人都看见却无人敢提的名字。', '户部小吏查账查出一笔二十年前的军饷，签押的是当朝太后。', '和亲公主的陪嫁木箱底层，藏着半份足以掀翻朝堂的盐引旧档。', '老将军告老还乡前夜，把最后一枚兵符沉进了护城河。'],
    '灵异惊悚': ['老宅阁楼的座钟每晚快七分钟，钟摆停下的时刻总有人敲门。', '夜班公交的末班车多出一站，下车的人第二天都会收到自己的遗物。', '她接手了一间转让的美容院，镜子里前任店主的账还没记完。', '山村小学的合影里，每一届都多出一个查无此人的孩子。'],
    '甜蜜恋爱': ['相亲对象是个外卖站长，第一次见面他带来了她三个月前给过差评的那家店。', '图书馆占座大战的两个常客，发现彼此在借书卡上互留批注已经一年。', '她搬进新公寓的第一天，邻居端来的汤正好是她妈妈的味道。', '宠物医院的兽医和猫咖老板娘，为一只装病加饭的橘猫吵了四个回合。'],
    '古典仙侠': ['断剑山庄的哑仆捡起主人弃掉的三尺青锋，剑鸣声响彻九嶷山。', '她代嫁入仙门那天，花轿里坐着的其实是双生妹妹的魂灯。', '落魄书生在破庙躲雨，捡到一盏只在自己倒霉时才亮的引路灯。', '宗门大比前三名的奖励是问鼎者一个无人知晓的心愿——她想要回自己的名字。']
  };

  var JOBS = {
    '悬疑推理': ['刑警队长', '法医', '调查记者', '保险理赔员'],
    '都市现实': ['外卖骑手', '深夜电台主播', '社区网格员', '早餐铺老板'],
    '东方玄幻': ['宗门杂役弟子', '散修药师', '藏经阁扫地人', '没落世家子'],
    '科幻未来': ['记忆备份工程师', '深空领航员', '仿生维修师', '城市 AI 训练师'],
    '历史权谋': ['史官', '户部小吏', '和亲公主', '告老将军'],
    '灵异惊悚': ['老宅看房人', '夜班司机', '美容院店主', '乡村教师'],
    '甜蜜恋爱': ['外卖站长', '图书馆管理员', '兽医', '猫咖老板'],
    '古典仙侠': ['哑仆', '代嫁孤女', '落魄书生', '没落剑修']
  };

  var TRAITS = ['坚韧隐忍', '机敏狡黠', '温柔坚定', '外冷内热', '莽撞热血', '冷静理性'];
  var CONFLICTS = ['生存危机', '追寻真相', '复仇雪恨', '权力争夺', '守护挚爱', '自我救赎'];
  var DRIVES = ['查明真相', '保护家人', '证明自己', '赎罪', '夺回失去之物', '找到归属'];
  var WORLDS = ['现实都市（当代）', '架空王朝（类古风）', '近未来都市', '修真世界', '末世废土'];
  var RELATIONS = ['亦师亦友的引路人', '立场对立的宿敌', '双生羁绊', '并肩成长的伙伴', '纠缠两代的家族恩怨'];
  var LENGTHS = [{ k: '短篇（约 6 章）', n: 6 }, { k: '中篇（约 10 章）', n: 10 }, { k: '长篇（约 12 章）', n: 12 }];
  var TONES = ['轻松治愈', '热血燃向', '虐心催泪', '暗黑压抑', '甜宠日常', '庄重史诗'];

  /* ---------- 大纲字段候选模板 ---------- */
  function outlineBank(field, ctx) {
    var g = (ctx.brief && ctx.brief.genre) || '都市现实';
    var job = (ctx.brief && ctx.brief.protagonist && ctx.brief.protagonist.job) || '普通人';
    var conflict = (ctx.brief && ctx.brief.conflict && ctx.brief.conflict.type) || '追寻真相';
    var theme = {
      style: ['成长向', '救赎向', '权力向', '温情向', '悬疑向'],
      bank: [
        '小人物在{conflict}面前的觉醒与选择，讲"普通人也可以不普通"。',
        '以{job}的视角切入，探讨真相与体面哪个更重要。',
        '所有角色都在付出代价，主题落在"得到之前的失去"。',
        '双线互文：明线是{conflict}，暗线是自我和解。',
        '在{g}的外壳下，写一群人如何守住最后一点光。'
      ]
    };
    var background = {
      style: ['写实', '氛围', '设定', '克制', '画面'],
      bank: [
        '故事发生在当代{g}气质的城市，霓虹之下是普通人的账单与体面。',
        '架空王朝末年，旧法将崩、新序未立，{conflict}是悬在所有人头上的刀。',
        '近未来：记忆可以备份，于是"亲历"成了奢侈品。',
        '深山古镇，祠堂、旧约、三代人的沉默构成故事的底色。',
        '末世后第三十年，秩序重建期，资源与信任同样稀缺。'
      ]
    };
    var plot = {
      style: ['主线', '明线', '双线', '倒叙', '递进'],
      bank: [
        '{job}因一桩意外卷入{conflict}，在追查中被迫直面自己隐藏的过去。',
        '三条线索汇于一点：一封迟到的信、一笔旧账、一个不肯现身的人。',
        '主角以{job}身份接近真相，每前进一步就失去一个可以信任的人。',
        '从最不起眼的角落切入，层层揭开与{conflict}相关的三代纠葛。',
        '主线走"失去—追索—代价—和解"，辅线用对手视角倒影主角。'
      ]
    };
    var turning = {
      style: ['反转', '代价', '揭示', '抉择', '收束'],
      bank: [
        '第一转折：主角发现最信任的人一直在替他挡下关键信息。',
        '第二转折：追查到的"真相"是被人精心放置的诱饵。',
        '中点反转：对手的真实动机与主角的初心同源。',
        '低谷事件：主角为保全他人主动放弃最有利的证据。',
        '终局揭示：解开{conflict}的钥匙，从一开始就在主角自己手里。'
      ]
    };
    var ending = {
      style: ['治愈', '余味', '开放', '庄重', '回环'],
      bank: [
        '真相公开但部分旧人无法归来——主角选择带着遗憾继续生活。',
        '主角完成{conflict}的了结，也放下了"证明自己"的执念。',
        '开放式：最后一个镜头停在关键物证被再次转手。',
        '庄重收束：秩序重建，主角把功劳让给逝者，自己归于平淡。',
        '回环结局：故事开头的那盏灯，在结尾由下一代重新点亮。'
      ]
    };
    var map = { theme: theme, background: background, plot: plot, turning: turning, ending: ending };
    return map[field] || theme;
  }

  /* ---------- 段落候选模板（4 类型 × 风格） ---------- */
  var PARA_TPL = {
    para_scene: [
      { style: '冷峻白描', tpl: '　　{time}，{place}。灯一层层灭下去，{char}把外套的领口立起来，站在原地听了三秒——风里有他熟悉的、不属于这里的声音。' },
      { style: '细腻抒情', tpl: '　　{place}的黄昏总是来得很慢。{char}数着窗格上最后一点光，忽然觉得，所谓{goal}，也许不过是想找一个能安心把伞收起来的地方。' },
      { style: '强冲突', tpl: '　　门被撞开的时候，{char}正把{goal}四个字写在纸上。来人一句话没说，只是把一枚旧铜牌放在了桌面正中。' },
      { style: '悬念钩子', tpl: '　　{place}在午夜后属于另一群人。{char}推门进去，柜台后的人抬起头，开口的第一句是："你可算来了——第二次。"' },
      { style: '轻快日常', tpl: '　　{place}的早晨从一碗热粥开始。{char}咬着勺子想{goal}的事，想到一半，被隔壁桌小孩的笑声打断——也好，有些事急不得。' }
    ],
    para_dialogue: [
      { style: '克制潜台词', tpl: '　　"{charA}看着我：\'你确定要继续？\'\n　　\'不确定。\'我说，\'但不继续，我连不确定的资格都没有。\'"' },
      { style: '针锋相对', tpl: '　　"你们查了三年，查到的是什么？"\n　　"一个名字。"\n　　对方笑了：\'那我们已经查到两年半了。\'"' },
      { style: '温声安抚', tpl: '　　"{charA}把茶推过来：\'天塌不下来。\'\n　　\'我知道。\'我捧着杯子，\'我就是想先知道，塌下来的时候，砸的是谁。\'"' },
      { style: '信息交锋', tpl: '　　"两个条件。"\n　　"说。"\n　　\'第一，消息只过我这；第二——\'我顿了顿，\'你别再替我撒谎。\'"' },
      { style: '身份揭示', tpl: '　　"其实我不是第一次见你。"\n　　我抬起头。\n　　\'十年前，巷口那盏路灯下面——是你把我捡回去的。\'"' }
    ],
    para_transition: [
      { style: '时间过渡', tpl: '　　三天后，{place}下了今年第一场雨。有些案子就是这样，你以为它在等你，其实它一直在走。' },
      { style: '空间过渡', tpl: '　　离开{place}的路上，{char}把车窗摇下来一条缝。风灌进来，把后座那份没送出去的卷宗吹得哗哗作响。' },
      { style: '情绪过渡', tpl: '　　那晚之后，{char}把自己关了两天。第三天清晨，他刮了胡子，把桌上所有纸页按日期重新排好。' },
      { style: '悬念过渡', tpl: '　　所有人都以为这件事到此为止。只有{char}注意到，卷宗末页的骑缝章，比别的页多出了一枚。' },
      { style: '留白过渡', tpl: '　　后来的事，是从一通没有来电显示的电话开始的。' }
    ],
    para_psych: [
      { style: '自我诘问', tpl: '　　{char}问自己：如果{goal}从一开始就是个圈套，他还会走到今天吗？答案让他害怕——会，而且更快。' },
      { style: '回忆闪回', tpl: '　　有那么一瞬间，{char}又回到了那年的雨天。同样的湿冷，同样握不紧的手。不同的是，这一次他身后没有人了。' },
      { style: '恐惧具象', tpl: '　　最让{char}不安的不是危险本身，而是他发现自己开始习惯危险——像习惯一双磨脚的新鞋。' },
      { style: '决意成形', tpl: '　　怕吗？怕。但{char}把这份怕折好，放进口袋，和那枚旧铜牌放在了一起。有些路，退一步就是万丈深渊。' },
      { style: '温柔自愈', tpl: '　　{char}在窗边坐了很久。后来他想通了：{goal}也好，真相也好，都不该用来惩罚自己。' }
    ]
  };

  /* ---------- 章节规划生成 ---------- */
  var PLAN_GOAL = [
    '初入局：主角以{job}身份卷入{conflict}，拿到第一条关键线索',
    '试探：第一次正面接触对手阵营，付出第一个小代价',
    '结盟：与关键配角建立信任，获得 {conflict} 的旧档案',
    '反转：发现的"真相"是诱饵，主角陷入低谷',
    '中点：双线汇合，{conflict}背后浮出更大的网',
    '低谷：为保全他人主动放弃证据，失去重要之人的信任',
    '反击：主角换打法，从追查者变成布局者',
    '揭示：核心人物的真实动机曝光，与主角初心同源',
    '决战前夜：所有人在同一个地方落座，最后一枚棋子归位',
    '终局：{conflict}的了结与代价同时落地',
    '回声：案件了结后的第一个清晨，生活重新开始',
    '新芽：尾声，下一代主角的影子出现在故事开头的那条街'
  ];
  var PLAN_CHARS = ['主角', '关键配角', '对手', '线人', '家人'];

  /* =====================================================================
   * 对外 API
   * ===================================================================== */
  var API = {};

  function hook() {
    return (window.AIHelper && typeof window.AIHelper.generate === 'function') ? window.AIHelper.generate : null;
  }

  API.GENRES = GENRES; API.TRAITS = TRAITS; API.CONFLICTS = CONFLICTS; API.DRIVES = DRIVES;
  API.WORLDS = WORLDS; API.RELATIONS = RELATIONS; API.LENGTHS = LENGTHS; API.TONES = TONES;
  API.jobsFor = function (genre) { return JOBS[genre] || JOBS['都市现实']; };

  /* gen(kind, ctx) → {candidates:[{style,text}], context:'基于：…'} */
  API.gen = function (kind, ctx) {
    ctx = ctx || {};
    var fn = hook(), res;
    if (fn) { try { res = fn(kind, ctx); if (res && res.candidates && res.candidates.length) { logIt(kind, ctx, res); return res; } } catch (e) {} }

    var seed = nextSeed(kind), cands = [], context = '';
    var b = ctx.brief || {}, p = b.protagonist || {}, c = b.conflict || {};

    if (kind === 'genre_ideas') {
      var bank = LOGLINES[b.genre] || LOGLINES['都市现实'];
      pick(bank, 4, seed).forEach(function (t, i) { cands.push({ style: ['悬念', '写实', '设定', '温感'][i % 4], text: t }); });
      context = '基于：已选题材「' + (b.genre || '未选') + '」';
    } else if (kind === 'protag_jobs') {
      pick(API.jobsFor(b.genre), 4, seed).forEach(function (t) { cands.push({ style: '职业', text: t }); });
      context = '基于：题材「' + (b.genre || '未选') + '」的典型主角职业';
    } else if (kind === 'deep_world') {
      pick(WORLDS, 3, seed).forEach(function (t, i) {
        cands.push({ style: '世界观', text: t + '。' + (LOGLINES[b.genre] || LOGLINES['都市现实'])[(seed + i) % 4] });
      });
      context = '基于：题材 + 创意概要';
    } else if (kind === 'deep_cast') {
      cands = [
        { style: '引路人', text: '看似不靠谱实际阅历极深的前辈，总在关键处"恰好"路过。' },
        { style: '镜像对手', text: '与主角同源却选了另一条路的对手，每次交锋都在质问主角的选择。' },
        { style: '温度担当', text: '把主角从纸堆里拽回人间烟火的伙伴，负责笑声和那碗热汤。' },
        { style: '暗线人物', text: '戏份不多但每次出现都改变信息量的记录者。' }
      ].slice(seed % 2, (seed % 2) + 4);
      context = '基于：主角设定 + 冲突类型';
    } else if (kind === 'deep_relations') {
      pick(RELATIONS, 3, seed).forEach(function (t) { cands.push({ style: '关系', text: t + '——关系随剧情三段式演变。' }); });
      context = '基于：主角 + 配角配置';
    } else if (kind.indexOf('outline_') === 0) {
      var f = kind.replace('outline_', '');
      var o = outlineBank(f, ctx);
      pick(o.bank, 5, seed).forEach(function (t, i) {
        cands.push({ style: o.style[i % o.style.length], text: fill(t, { g: b.genre || '都市', job: p.job || '普通人', conflict: c.type || '追寻真相' }) });
      });
      context = '基于：题材「' + (b.genre || '') + '」+ 主角「' + (p.job || '') + '」+ 冲突「' + (c.type || '') + '」';
    } else if (kind.indexOf('para_') === 0) {
      var tpls = PARA_TPL[kind] || PARA_TPL.para_scene;
      var map1 = {
        time: ['暮色四合时', '清晨六点半', '雨夜', '深夜十一点'][(seed + 1) % 4],
        place: (ctx.plan && ctx.plan.place) || '老城南区',
        char: (ctx.charName) || '主角',
        charA: (ctx.charName) || '对方',
        goal: (ctx.plan && shortGoal(ctx.plan.goal)) || '这件事'
      };
      pick(tpls, 5, seed).forEach(function (t) { cands.push({ style: t.style, text: fill(t.tpl, map1) }); });
      context = '基于：第 ' + (ctx.chapterNo || '—') + ' 章规划「' + ((ctx.plan && ctx.plan.goal) || '').slice(0, 14) + '…」+ 出场人物语言指纹 + 前章结尾';
    } else if (kind === 'fix_para') {
      cands = [
        { style: '修复 · 衔接', text: '　　（衔接）上一章的余音还没散尽，{char}已经在去{place}的路上了。有些答案不会自己走过来，只能人过去。' },
        { style: '修复 · 一致性', text: '　　（补充）他按自己的老习惯把桌面收拾干净，把线索按时间排好——这是他跟世界较劲的方式。' }
      ];
      context = '基于：质量检查问题项';
    }
    cands = cands.slice(0, 5);
    if (cands.length < 3) cands = cands.concat(cands).slice(0, 3);
    var res2 = { candidates: cands, context: context };
    logIt(kind, ctx, res2);
    return res2;
  };

  function shortGoal(g) { g = g || ''; return g.replace(/^[^，。]{2,6}[：:]/, '').slice(0, 8) || '这件事'; }
  function logIt(kind, ctx, res) {
    try {
      window.NovelSimStore.addAiLog(kind, res.context || '', res.candidates.length, null);
    } catch (e) {}
  }

  /* 我来说：作者口述 → AI 格式化为候选（mock：整理格式 + 补衔接尾句） */
  API.formatUserText = function (kind, text, ctx) {
    var t = String(text || '').trim();
    if (!t) return null;
    t = t.replace(/\s+/g, ' ');
    if (!/[。！？”"』』]$/.test(t)) t += '。';
    var prefix = '　　';
    var tail = '';
    if (kind === 'para_transition') tail = '　　（而这件事，很快就会牵出下一段路。）';
    if (kind === 'para_dialogue' && t.indexOf('「') === -1 && t.indexOf('"') === -1) t = '"' + t + '"';
    return { style: '作者口述 · AI 格式化', text: prefix + t + '\n' + tail, fromUser: true };
  };

  /* 章节规划：依大纲 + 简报生成 n 章 */
  API.chapterPlans = function (brief, outline) {
    var lenN = 10;
    var bl = brief && brief.deep && brief.deep.length;
    if (bl) {
      var hit = LENGTHS.filter(function (x) { return bl.indexOf(x.k.slice(0, 2)) !== -1; });
      if (hit.length) lenN = hit[0].n;
    }
    var g = (brief && brief.genre) || '都市现实';
    var job = (brief && brief.protagonist && brief.protagonist.job) || '普通人';
    var conflict = (brief && brief.conflict && brief.conflict.type) || '追寻真相';
    var plans = [];
    var bank = pick(PLAN_GOAL, Math.min(lenN, PLAN_GOAL.length), 1);
    for (var i = 0; i < lenN; i++) {
      var goal = fill(bank[i % bank.length], { job: job, conflict: conflict });
      var chars = ['主角'];
      if (i >= 1) chars.push(i % 2 ? '对手' : '关键配角');
      if (i >= 3 && i % 3 === 0) chars.push('线人');
      plans.push({
        no: i + 1, goal: goal,
        conflict: i === 0 ? conflict : (i % 3 === 0 ? conflict + '（升级）' : conflict + '（延续）'),
        characters: chars,
        events: '关键事件 ' + (i + 1) + '：' + shortGoal(goal) + ' 相关事件落地',
        prev: i === 0 ? '（开篇，无承接）' : '承接第 ' + i + ' 章结尾',
        next: i === lenN - 1 ? '（收束）' : '引向第 ' + (i + 2) + ' 章',
        place: ['老城南区', '旧档案馆', '江边仓库', '山顶道观', '城东医院'][i % 5],
        status: 'planned'
      });
    }
    logIt('chapter_plans', { brief: brief }, { candidates: plans, context: '基于：已确认大纲 + 创作简报' });
    return plans;
  };

  /* 单章换个思路 */
  API.replanChapter = function (plan, brief) {
    var seed = nextSeed('replan');
    var conflict = (brief && brief.conflict && brief.conflict.type) || '追寻真相';
    var goal = fill(PLAN_GOAL[(seed + 3) % PLAN_GOAL.length], { job: '主角', conflict: conflict });
    var np = Object.assign({}, plan, { goal: goal });
    return np;
  };

  /* ---------- 5 维质量检查 ---------- */
  API.checkQuality = function (no) {
    var S = window.NovelSimStore;
    var proj = S.load();
    var plan = proj.chapter_plans[Number(no) - 1] || {};
    var ch = proj.chapters[String(no)] || { content: '' };
    var content = ch.content || '';
    var dims = [];

    function mk(key, name, status, issues) { dims.push({ key: key, name: name, status: status, issues: issues }); }
    function worst(issues) { return issues.some(function (i) { return i.severity === 'fail'; }) ? 'fail' : issues.length ? 'warn' : 'pass'; }

    // 1. 大纲一致性
    var iss1 = [];
    if (!content.trim()) iss1.push({ msg: '本章正文为空', severity: 'fail' });
    else {
      var goal = plan.goal || '';
      var toks = goal.split(/[，。：:、\s]+/).filter(function (w) { return w.length >= 2; });
      var hits = 0;
      toks.slice(0, 6).forEach(function (w) { if (content.indexOf(w.slice(0, 2)) !== -1) hits++; });
      if (hits === 0) iss1.push({ msg: '正文未覆盖章节目标关键词（' + goal.slice(0, 16) + '…）', severity: 'fail' });
      else if (hits < 2) iss1.push({ msg: '章节目标关键词覆盖偏低（' + hits + ' 处）', severity: 'warn' });
    }
    mk('outline', '大纲一致性', worst(iss1), iss1);

    // 2. 人物一致性
    var iss2 = [];
    var involved = plan.characters || [];
    var profiles = proj.characters || [];
    involved.forEach(function (name) {
      var prof = profiles.filter(function (p) { return p.name === name; })[0];
      if (!prof) { iss2.push({ msg: '「' + name + '」暂无人物小传（语言指纹缺失）', severity: 'warn' }); return; }
      var forb = (prof.voice && prof.voice.forbidden) || [];
      forb.forEach(function (w) { if (w && content.indexOf(w) !== -1) iss2.push({ msg: '「' + name + '」忌讳词「' + w + '」出现在正文', severity: 'fail' }); });
      var cps = (prof.voice && prof.voice.catchphrase) || [];
      if (cps.length && !cps.some(function (w) { return w && content.indexOf(w) !== -1; })) {
        iss2.push({ msg: '「' + name + '」的口癖未出现（' + cps.join('/') + '）', severity: 'warn' });
      }
    });
    mk('character', '人物一致性', worst(iss2), iss2);

    // 3. 时间线
    var iss3 = [];
    if (content.indexOf('三天前') !== -1 && content.indexOf('次日') !== -1) iss3.push({ msg: '「三天前」与「次日」同章出现，注意时序标注', severity: 'warn' });
    if (content.indexOf('清晨') !== -1 && content.indexOf('午夜') !== -1) iss3.push({ msg: '同章横跨清晨与午夜，建议补充时间过渡句', severity: 'warn' });
    mk('timeline', '时间线', worst(iss3), iss3);

    // 4. 伏笔状态
    var iss4 = [];
    var fs = proj.foreshadows || [];
    var unresolved = fs.filter(function (f) { return f.status !== 'resolved'; });
    var dueNow = fs.filter(function (f) { return Number(f.resolution_planned) === Number(no) && f.status !== 'resolved'; });
    if (dueNow.length) iss4.push({ msg: dueNow.length + ' 个伏笔计划本章回收但尚未回收', severity: 'warn' });
    if (unresolved.length > 3) iss4.push({ msg: '全书未回收伏笔 ' + unresolved.length + ' 个（>3）', severity: 'warn' });
    mk('foreshadow', '伏笔状态', worst(iss4), iss4);

    // 5. 章节衔接
    var iss5 = [];
    if (Number(no) > 1) {
      var prev = proj.chapters[String(Number(no) - 1)];
      if (prev && prev.content && prev.content.trim()) {
        var prevEnd = prev.content.trim().slice(-40).replace(/\s+/g, '');
        var head = content.trim().slice(0, 300).replace(/\s+/g, '');
        var overlap = 0;
        for (var i = 0; i < prevEnd.length - 1 && overlap < 3; i += 2) {
          var g2 = prevEnd.substr(i, 2);
          if (g2 && head.indexOf(g2) !== -1) overlap++;
        }
        if (!content.trim()) iss5.push({ msg: '正文为空，无法评估衔接', severity: 'fail' });
        else if (overlap === 0) iss5.push({ msg: '与上章结尾无关键词呼应，建议补过渡句', severity: 'warn' });
      }
    }
    mk('connection', '章节衔接', worst(iss5), iss5);

    var fails = dims.filter(function (d) { return d.status === 'fail'; }).length;
    var warns = dims.filter(function (d) { return d.status === 'warn'; }).length;
    var score = Math.max(40, 100 - fails * 15 - warns * 5);
    return { score: score, dims: dims, summary: fails ? ('发现 ' + fails + ' 项问题需处理') : (warns ? ('总体可用，' + warns + ' 项建议优化') : '全部通过') };
  };

  /* 一键修复（mock）：能改数据的改数据，能补段落补段落，返回动作清单 */
  API.applyFixes = function (no) {
    var S = window.NovelSimStore, A = this;
    var actions = [];
    var rep = A.checkQuality(no);
    var ch = S.getChapter(no) || { title: '', content: '' };
    var content = ch.content || '';

    rep.dims.forEach(function (d) {
      if (d.status === 'pass') return;
      if (d.key === 'character') {
        var profs = S.load().characters || [];
        (S.load().chapter_plans[Number(no) - 1].characters || []).forEach(function (name) {
          var p = profs.filter(function (x) { return x.name === name; })[0];
          if (!p) return;
          ((p.voice && p.voice.forbidden) || []).forEach(function (w) {
            if (w && content.indexOf(w) !== -1) {
              content = content.split(w).join('——');
              actions.push('已替换「' + name + '」忌讳词「' + w + '」');
            }
          });
        });
      } else if (d.key === 'connection') {
        var cand = A.gen('fix_para', { charName: '主角' }).candidates[0];
        content = cand.text + '\n\n' + content;
        actions.push('已在章首插入过渡段（修复衔接）');
      } else if (d.key === 'outline') {
        var plan = S.load().chapter_plans[Number(no) - 1] || {};
        var cand2 = A.gen('fix_para', { charName: '主角' }).candidates[1];
        content = content + '\n\n' + cand2.text;
        actions.push('已在章末补充目标呼应段（修复大纲一致性）');
      } else if (d.key === 'foreshadow') {
        var fs = S.getForeshadows();
        var due = fs.filter(function (f) { return Number(f.resolution_planned) === Number(no) && f.status !== 'resolved'; })[0];
        if (due) { S.setForeshadowStatus(due.id, 'resolved'); actions.push('已标记伏笔「' + due.content.slice(0, 12) + '…」本章回收'); }
        else actions.push('伏笔提醒已确认（无计划本章回收项）');
      } else if (d.key === 'timeline') {
        actions.push('时间线提示已确认（建议人工复核时序词）');
      }
    });

    if (content !== (ch.content || '')) S.saveChapter(no, { content: content });
    return { actions: actions };
  };

  return API;
})();
