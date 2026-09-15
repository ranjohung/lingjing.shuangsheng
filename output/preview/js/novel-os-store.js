/* =====================================================================
 * V24-B · 小说世界OS V2.0 — 数据中枢（NovelOSStore）
 *
 * PRD-v24-novel-world-os §3 七层架构 + §4 Quality Gate + §7 收费点
 *   L0 SOURCE（原文+SHA-256） / L1 CANON（锚点 immutable） /
 *   L2 PRESENTATION（演出，二次元摄影风格 token） /
 *   L3 INTERACTION（热点·世界探索） / L4 SIMULATION（生活·非原著标记） /
 *   L5 BRANCH / L6 WHAT-IF / L7 DUAL SOUL（结构占位，即将开放）
 *
 * 铁律：
 *   - 主线渲染只读 canon.anchors[].text（byte-equal 原文），无任何 LLM 路径
 *   - AI 生成内容一律 source='AI_GENERATED' + marker 标记
 *   - localStorage: lingjing_v524_novel_os_v1（与 v522/v521/v520 隔离）
 * ===================================================================== */
'use strict';

var NovelOSStore = (function () {
  var KEY = 'lingjing_v524_novel_os_v1';
  var SAVE_PREFIX = 'lingjing_v524_novel_os_save_';
  var STYLE_TOKEN = 'anime_cel+photo_dof+film_grain'; // 二次元摄影画面风格 token

  var SENSITIVE = ['赌博', '毒品', '自杀教程'];

  /* ---------- 演示文本：公版名著《西游记》第一回（非自写） ---------- */
  var DEMO_TITLE = '西游记（公版）';
  var DEMO_TEXT = [
    '《西游记》吴承恩（明）',
    '',
    '第一回 灵根育孕源流出 心性修持大道生',
    '',
    '诗曰：',
    '混沌未分天地乱，茫茫渺渺无人见。',
    '自从盘古破鸿蒙，开辟从兹清浊辨。',
    '覆载群生仰至仁，发明万物皆成善。',
    '欲知造化会元功，须看西游释厄传。',
    '',
    '盖闻天地之数，有十二万九千六百岁为一元。',
    '将一元分为十二会，乃子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥之十二支也。',
    '每会该一万八百岁。',
    '且就一日而论：子时得阳气而丑则鸡鸣，寅不通光而卯则日出，辰时食后而巳则挨排，日午天中而未则西蹉，申时晡而日落酉，戌黄昏而人定亥。',
    '譬于大数，若到戌会之终，则天地昏蒙而万物否矣。',
    '再去五千四百岁，交亥会之初，则当黑暗，而两间人物俱无矣，故曰混沌。',
    '又五千四百岁，亥会将终，贞下起元，近子之会，而浑然始萌矣。',
    '',
    '海外有一国土，名曰傲来国。',
    '国近大海，海中有一座名山，唤为花果山。',
    '此山乃十洲之祖脉，三岛之来龙，自开清浊而立，鸿蒙判后而成。',
    '势镇汪洋，威宁瑶海。',
    '势镇汪洋，潮涌银山鱼入穴；威宁瑶海，波翻雪浪蜃离渊。',
    '水火方隅高积土，东海之处耸崇巅。',
    '丹崖怪石，削壁奇峰。',
    '丹崖上，彩凤双鸣；削壁前，麒麟独卧。',
    '峰头时听锦鸡鸣，石窟每观龙出入。',
    '林中有寿鹿仙狐，树上有灵禽玄鹤。',
    '瑶草奇花不谢，青松翠柏长春。',
    '仙桃常结果，修竹每留云。',
    '一条涧壑藤萝密，四面原堤草色新。',
    '正是百川会处擎天柱，万劫无移大地根。',
    '',
    '那座山正当顶上，有一块仙石。',
    '盖自开辟以来，每受天真地秀，日精月华，感之既久，遂有灵通之意。',
    '内育仙胞，一日迸裂，产一石卵，似圆球样大。',
    '因见风，化作一个石猴。',
    '五官俱备，四肢皆全。',
    '便就学爬学走，拜了四方。',
    '目运两道金光，射冲斗府。',
    '惊动高天上圣大慈仁者玉皇大天尊玄穹高上帝，驾座金阙云宫灵霄宝殿，聚集仙卿，见有金光焰焰，即命千里眼、顺风耳开南天门观看。',
    '二将果奉旨出门外，看的真，听的明。',
    '须臾回报道：「臣奉旨观听金光之处，乃东胜神洲傲来国花果山也。',
    '山上有一仙石，石产一卵，见风化一石猴，在那里拜四方，眼运金光，冲射斗府。',
    '如今服饵水食，金光将潜息矣。」',
    '玉帝垂赐恩慈曰：「下方之物，乃天地精华所生，不足为异。」',
    '',
    '那猴在山中，却会行走跳跃，食草木，饮涧泉，采山花，觅树果；与狼虫为伴，虎豹为群，獐鹿为友，猕猿为亲；夜宿石崖之下，朝游峰洞之中。',
    '真是：',
    '山中无甲子，寒尽不知年。',
    '一朝天气炎热，与群猴避暑，都在松阴之下顽耍。',
    '你看他一个个：',
    '跳树攀枝，采花觅果；抛弹子，邷么儿；跑沙窝，砌宝塔；赶蜻蜓，扑八蜡；参老天，拜菩萨；扯葛藤，编草帙；捉虱子，咬又掐；理毛衣，剔指甲；挨的挨，擦的擦；推的推，压的压；扯的扯，拉的拉。',
    '青松林下任他顽，绿水涧边随洗濯。',
    '一群猴子耍了一会，却去那山涧中洗澡。',
    '见那股涧水奔流，真个似滚瓜涌溅。',
    '古云：禽有禽言，兽有兽语。',
    '众猴道：「这股水不知是那里的水。',
    '我们今日赶闲无事，顺涧边往上溜头寻看源流，耍子去耶！」',
    '喊一声，都拖男挈女，唤弟呼兄，一齐跑来，顺涧爬山，直至源流之处，乃是一股瀑布飞泉。',
    '但见那：',
    '一派白虹起，千寻雪浪飞。',
    '海风吹不断，江月照还依。',
    '冷气分青嶂，余流润翠微。',
    '潺湲名瀑布，真似挂帘帷。',
    '',
    '众猴拍手称扬道：「好水！好水！原来此处远通山脚之下，直接大海之波。」',
    '又道：「那一个有本事的，钻进去寻个源头出来，不伤身体者，我等即拜他为王。」',
    '连呼了三声，忽见丛杂中跳出一个石猴，应声高叫道：「我进去！我进去！」',
    '你看他瞑目蹲身，将身一纵，径跳入瀑布泉中，忽睁睛抬头观看，那里边却无水无波，明明朗朗的一架桥梁。',
    '他住了身，定了神，仔细再看，原来是座铁板桥。',
    '桥下之水，冲贯于石窍之间，倒挂流出去，遮闭了桥门。',
    '却又欠身上桥头，再走再看，却似有人家住处一般，真个好所在。',
    '但见那：',
    '翠藓堆蓝，白云浮玉，光摇片片烟霞。',
    '虚窗静室，滑凳板生花。',
    '乳窟龙珠倚挂，萦回满地奇葩。',
    '锅灶傍崖存火迹，樽罍靠案见肴渣。',
    '石座石床真可爱，石盆石碗更堪夸。',
    '又见那一竿两竿修竹，三点五点梅花。',
    '几树青松常带雨，浑然像个人家。',
    '',
    '看罢多时，跳过桥中间，左右观看，只见正当中有一石碣。',
    '碣上有一行楷书大字，镌着「花果山福地，水帘洞洞天」。',
    '石猴喜不自胜，急抽身往外便走，复瞑目蹲身，跳出水外，打了两个呵呵道：「大造化！大造化！」'
  ].join('\n');

  /* ================= 工具 ================= */

  function escToken(s) { return String(s || '').slice(0, 400); }

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    var h2 = 0x811c9dc5;
    for (var j = str.length - 1; j >= 0; j--) {
      h2 ^= str.charCodeAt(j);
      h2 = (h2 + ((h2 << 1) + (h2 << 4) + (h2 << 7) + (h2 << 8) + (h2 << 24))) >>> 0;
    }
    return 'fnv2_' + h.toString(16) + h2.toString(16);
  }

  function sha256Hex(str) {
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      var bytes = new TextEncoder().encode(str);
      return crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
        var arr = new Uint8Array(buf), out = '';
        for (var i = 0; i < arr.length; i++) out += ('0' + arr[i].toString(16)).slice(-2);
        return 'sha256_' + out;
      }).catch(function () { return fnv1a(str); });
    }
    return Promise.resolve(fnv1a(str));
  }

  function anchorHash(text) { return fnv1a(text); }

  /* ================= 状态 ================= */

  function defaultState() {
    return {
      source: { title: '', text: '', word_count: 0, hash: '', hash_algo: '', uploaded_at: null },
      quality: { report: null, confirmed: false, confirm_list: [] },
      canon: { anchors: [], compiled: false },
      presentation: {},          // anchorId → 演出数据
      interactions: [],          // L3 世界探索
      simulation: [],            // L4 世界生活
      branch_records: [],        // L5 占位
      whatif_records: [],        // L6 占位
      dual_soul: [],             // L7 占位
      pay_points: [],
      logs: [],                  // world_generation_logs
      player: { mode: 'A', anchor_idx: 0, inventory: [], started_at: null },
      style_token: STYLE_TOKEN
    };
  }

  var state = defaultState();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { state = JSON.parse(raw); return true; }
    } catch (e) { /* 损坏即重置 */ }
    state = defaultState();
    return false;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 配额忽略 */ }
  }

  function reset() { state = defaultState(); save(); }

  function log(step, status, data) {
    state.logs.push({ step: step, status: status, data: data || null, at: Date.now() });
  }

  /* ================= L0 SOURCE ================= */

  function setSource(title, text) {
    state = defaultState();   // 换书即全量重置
    state.source.title = title;
    state.source.text = text;
    state.source.word_count = text.replace(/\s/g, '').length;
    state.source.uploaded_at = Date.now();
    return sha256Hex(text).then(function (h) {
      state.source.hash = h;
      state.source.hash_algo = h.indexOf('sha256_') === 0 ? 'SHA-256' : 'FNV-1a-x2(降级)';
      log('L0 SOURCE', 'ok', { hash: h.slice(0, 18) + '…', words: state.source.word_count });
      save();
      return h;
    });
  }

  /* ================= Quality Gate（第一、二层） ================= */

  function chapterMarkers(text) {
    var re = /第[一二三四五六七八九十百千零〇0-9]+[章回卷节]/g, m, out = [];
    while ((m = re.exec(text)) !== null) out.push({ label: m[0], idx: m.index });
    return out;
  }

  function editDist1(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 9;
    var i = 0, j = 0, diff = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++diff > 1) return 9;
      if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; }
    }
    diff += (a.length - i) + (b.length - j);
    return diff <= 1 ? 1 : 9;
  }

  function extractNames(text) {
    var names = {}, m, re = /[「"‘']([^\u4e00-\u9fa5]{0,2})([\u4e00-\u9fa5]{2,4})[」"’']|[「"‘']([\u4e00-\u9fa5]{2,4})[」"’'](?=[说道问喊笑答])/g;
    while ((m = re.exec(text)) !== null) {
      var n = m[2] || m[3];
      if (n && n.length >= 2) names[n] = (names[n] || 0) + 1;
    }
    return names;
  }

  function runGate() {
    var text = state.source.text, issues = [], checks = [];
    var paras = text.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var chapters = chapterMarkers(text);

    // 1 乱码率
    var bad = (text.match(/ï|¿|�|\uFFFD/g) || []).length;
    var garbleRate = text.length ? bad / text.length : 0;
    checks.push({ key: 'garble', name: '乱码检测', value: (garbleRate * 100).toFixed(2) + '%', pass: garbleRate < 0.005 });

    // 2 章节识别与缺章
    var chapNums = [], reN = /第([一二三四五六七八九十百千零〇0-9]+)[章回卷节]/;
    chapters.forEach(function (c) {
      var cn = c.label.match(reN)[1];
      var num = cn.replace(/[一二三四五六七八九十百千零〇]/g, function (d, off, s) {
        var map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 零: 0, 〇: 0 };
        if (map[d] !== undefined) return map[d];
        if (d === '十') return (s.charAt(off - 1) && map[s.charAt(off - 1)]) ? '' : '10';
        return d;
      });
      var n = parseInt(num, 10);
      if (!isNaN(n)) chapNums.push(n);
    });
    var gaps = 0;
    for (var i = 1; i < chapNums.length; i++) {
      if (chapNums[i] - chapNums[i - 1] > 1) gaps += chapNums[i] - chapNums[i - 1] - 1;
    }
    checks.push({ key: 'chapters', name: '章节识别', value: chapters.length + ' 章', pass: chapters.length > 0 });
    if (gaps > 0) issues.push('⚠ 章节序号存在 ' + gaps + ' 处跳号，疑似缺章。');

    // 3 重复段
    var seen = {}, dups = 0;
    paras.forEach(function (p) { if (p.length > 10) { if (seen[p]) dups++; seen[p] = 1; } });
    checks.push({ key: 'dup', name: '重复章节/段落', value: dups + ' 处', pass: dups === 0 });
    if (dups > 0) issues.push('⚠ 检出 ' + dups + ' 处重复段落，请确认是否重复粘贴。');

    // 4 对话占比
    var dial = 0;
    paras.forEach(function (p) { if (/[「"“]|说道|问道|回答/.test(p)) dial++; });
    var dialRate = paras.length ? dial / paras.length : 0;
    checks.push({ key: 'dialogue', name: '对话识别', value: (dialRate * 100).toFixed(0) + '%', pass: true });

    // 5 相似人名（编辑距离≤1 归并）
    var names = extractNames(text);
    var keys = Object.keys(names), conflicts = [];
    for (var a = 0; a < keys.length; a++) {
      for (var b = a + 1; b < keys.length; b++) {
        if (editDist1(keys[a], keys[b]) === 1) {
          conflicts.push(keys[a] + ' ↔ ' + keys[b]);
          issues.push('⚠ 人物「' + keys[a] + '」与「' + keys[b] + '」可能为同一人物，请确认用名。');
        }
      }
    }
    checks.push({ key: 'names', name: '人物名称一致性', value: keys.length + ' 个角色名', pass: conflicts.length === 0 });

    // 6 敏感风险
    var sens = SENSITIVE.filter(function (w) { return text.indexOf(w) >= 0; });
    checks.push({ key: 'sensitive', name: '内容敏感风险', value: sens.length + ' 项', pass: sens.length === 0 });

    // 7 完整性
    var tooShort = state.source.word_count < 300;
    checks.push({ key: 'complete', name: '文本完整性', value: state.source.word_count + ' 字', pass: !tooShort });
    if (tooShort) issues.push('⚠ 全文不足 300 字，可能为断章/节选，建议检查。');

    // 第二层：五维结构分（确定性推导）
    var dims = {
      character_consistency: Math.max(40, 100 - conflicts.length * 15),
      timeline: Math.max(40, 100 - gaps * 12),
      location: Math.min(99, 82 + (dialRate > 0.15 ? 6 : 0) + (chapters.length >= 3 ? 6 : 0)),
      plot_completeness: Math.min(99, 78 + chapters.length * 2 + (/\u8f6c|\u7a81\u7136|\u7adf\u7136/.test(text) ? 6 : 0)),
      chapter_completeness: Math.max(40, 100 - gaps * 10 - dups * 8)
    };
    var total = Math.round(
      dims.character_consistency * 0.24 + dims.timeline * 0.18 + dims.location * 0.14 +
      dims.plot_completeness * 0.22 + dims.chapter_completeness * 0.22);

    var report = {
      total: total, dims: dims, issues: issues,
      checks: checks, chapters: chapters.length, names: keys,
      suggestion: issues.length ? '建议作者处理 ⚠ 问题后再生成世界。' : '全部检测通过，可以生成小说世界。'
    };
    state.quality.report = report;
    log('QualityGate', 'ok', { total: total, issues: issues.length });
    save();
    return report;
  }

  /* ================= 作者确认（第三层） ================= */

  var CONFIRM_KEYS = ['文本完整', '人物名称', '章节结构', '世界观设定', '权利声明'];
  function confirmAuthor(checked) {
    state.quality.confirm_list = CONFIRM_KEYS.map(function (k, i) { return { key: k, ok: !!checked[i] }; });
    state.quality.confirmed = checked.every(Boolean);
    log('AuthorConfirm', state.quality.confirmed ? 'ok' : 'blocked', null);
    save();
    return state.quality.confirmed;
  }

  /* ================= L1 CANON ================= */

  function classifyType(p) {
    if (/[「"“]/.test(p) || /^[^\u4e00-\u9fa5]{0,4}[\u4e00-\u9fa5]{2,4}[说道问喊笑答]/.test(p)) return '对白';
    if (/突然|但是|谁知|竟然|直到|那一刻|猛地|忽然/.test(p)) return '转折';
    if (p.length <= 12) return '旁白';
    return '叙述';
  }

  function compileCanon() {
    var text = state.source.text;
    var lines = text.split(/\n+/).map(function (s) { return s.trim(); })
      .filter(function (s) { return s && s.charAt(0) !== '#' && !/^【收费/.test(s); });
    var anchors = [], chapter = 0, m;
    lines.forEach(function (p, i) {
      var cm = p.match(/^##\s*第([一二三四五六七八九十百千零〇0-9]+)[章回卷节]/);
      if (cm) return; // 章节标题行并入下一锚点的章号
      var cml = chapterMarkers(p);
      if (cml.length) chapter++;
      anchors.push({
        id: 'C' + ('0000' + (i + 1)).slice(-5),
        chapter: chapter,
        idx: i,
        type: classifyType(p),
        text: p,                          // byte-equal 原文
        hash: anchorHash(p),
        immutable: true
      });
    });
    state.canon.anchors = anchors;
    state.canon.compiled = true;
    log('L1 CANON', 'ok', { anchors: anchors.length });
    return anchors;
  }

  /* ================= L2 PRESENTATION ================= */

  var ENV_MAP = [
    { re: /雨|伞|檐/, env: '雨夜 · 湿石板街', bg: 'street_rain_night' },
    { re: /书房|书桌|信|灯/, env: '室内 · 书房', bg: 'study_rain_night' },
    { re: /酒楼|酒|掌柜|跑堂/, env: '室内 · 酒楼', bg: 'tavern_warm' }
  ];
  var BGM_MAP = { '雨夜 · 湿石板街': '雨声 + 低沉古筝', '室内 · 书房': '雨声渐弱 + 钢琴独奏', '室内 · 酒楼': '市井喧闹 + 琵琶' };

  function compilePresentation() {
    var out = {};
    state.canon.anchors.forEach(function (a) {
      var env = { env: '临安 · 十二巷', bg: 'street_rain_night' };
      for (var i = 0; i < ENV_MAP.length; i++) {
        if (ENV_MAP[i].re.test(a.text)) { env = { env: ENV_MAP[i].env, bg: ENV_MAP[i].bg }; break; }
      }
      var chars = [];
      var cm = a.text.match(/[「"“]([^\u4e00-\u9fa5]{0,2})([\u4e00-\u9fa5]{2,4})[」"”’]/g) || [];
      cm.forEach(function (s) {
        var n = s.replace(/[「"“”」’'\u4e00-\u9fa5]{0,0}/g, '').match(/[\u4e00-\u9fa5]{2,4}/);
        if (n && chars.indexOf(n[0]) < 0 && state.quality.report && state.quality.report.names.indexOf(n[0]) >= 0) chars.push(n[0]);
      });
      var camera, action = '';
      if (a.type === '对白') camera = ['过肩镜头', '说话者特写'];
      else if (a.type === '转折') camera = ['缓慢推近', '特写定格'];
      else camera = ['中景', '缓慢横移'];
      var am = a.text.match(/推开|收伞|踏进|拆开|回头|走过|坐|站|接|吹熄/);
      if (am) action = am[0];
      out[a.id] = {
        camera: camera, characters: chars, action: action,
        environment: env.env, bg: env.bg,
        bgm: BGM_MAP[env.env] || '环境氛围乐',
        style: STYLE_TOKEN,
        note: '演出层 · AI 生成，原文零删减'
      };
    });
    state.presentation = out;
    log('L2 PRESENTATION', 'ok', { anchors: Object.keys(out).length, style: STYLE_TOKEN });
    return out;
  }

  /* ================= L3 INTERACTION + L4 SIMULATION ================= */

  var OBJECTS = [
    { name: '信', kind: '物品', tpl: '【查看】一封未拆开的信，火漆完好。是否查看？（世界探索内容）' },
    { name: '玉佩', kind: '物品', tpl: '【查看】一枚碧绿玉佩，雕着半朵梅花，断口很新。（世界探索内容）' },
    { name: '书桌', kind: '家具', tpl: '【查看】书桌抽屉里似乎还压着几张旧笺。（世界探索内容）' },
    { name: '书架', kind: '家具', tpl: '【查看】第三层空了一格，落灰的轮廓还在。（世界探索内容）' },
    { name: '窗', kind: '家具', tpl: '【查看窗外】巷子里空无一人，只有灯笼在雨里晃。（世界探索内容）' },
    { name: '酒', kind: '物品', tpl: '【查看】一壶热酒，酒香里混着一点梅子味。（世界探索内容）' },
    { name: '门', kind: '家具', tpl: '【查看】门轴新上了油，最近常有人开关。（世界探索内容）' },
    { name: '灯笼', kind: '物品', tpl: '【查看】灯笼纸上洇着水痕，光晕发暖。（世界探索内容）' },
    { name: '茶', kind: '物品', tpl: '【查看】半盏冷茶，杯沿有主人的唇印。（世界探索内容）' },
    { name: '钥匙', kind: '物品', tpl: '【查看】黄铜钥匙，齿口磨损，用了很多年。（世界探索内容）' }
  ];

  function compileInteractions() {
    var found = [], used = {};
    state.canon.anchors.forEach(function (a) {
      OBJECTS.forEach(function (o) {
        if (!used[o.name] && a.text.indexOf(o.name) >= 0) {
          used[o.name] = 1;
          found.push({
            id: 'IX-' + found.length, anchor_id: a.id, object: o.name, kind: o.kind,
            interaction_type: '查看', text: o.tpl,
            source: 'AI_GENERATED', canon: false, marker: 'explore',
            author_approved: false
          });
        }
      });
    });
    state.interactions = found;
    log('L3 INTERACTION', 'ok', { points: found.length });

    // L4 SIMULATION：家具/日常（非原著正文，必须标记）
    var sim = [];
    found.forEach(function (f) {
      if (f.kind === '家具') {
        sim.push({
          id: 'SIM-' + sim.length, name: f.object, kind: '家具',
          text: f.object + '：可走近观察、坐下、翻找（SIMULATION 演示 · 非原著正文）',
          marker: 'simulation', source: 'AI_GENERATED'
        });
      }
    });
    (state.quality.report ? state.quality.report.names : []).slice(0, 3).forEach(function (n) {
      sim.push({
        id: 'SIM-' + sim.length, name: n, kind: 'NPC生活',
        text: n + ' 的日常作息：辰时起身、午后临街、夜里掌灯（SIMULATION 演示 · 非原著正文）',
        marker: 'simulation', source: 'AI_GENERATED'
      });
    });
    state.simulation = sim;
    log('L4 SIMULATION', 'ok', { items: sim.length });
    return { interactions: found, simulation: sim };
  }

  /* ================= 收费点推荐（AI 只推荐，作者裁决） ================= */

  function recommendPayPoints() {
    var pts = [];
    state.canon.anchors.forEach(function (a, i) {
      if (a.type === '转折' && pts.length < 3) {
        var stars = 3 + (i % 3);
        pts.push({
          id: 'PP-' + pts.length, anchor_id: a.id,
          position: '第' + a.chapter + '章 · 锚点 ' + a.id,
          stars: stars,
          reason: a.text.slice(0, 14) + '… 剧情转折点，用户留存概率高',
          price: 6 + stars * 2,      // 建议灵玉价
          status: 'pending'
        });
      }
    });
    state.pay_points = pts;
    log('PayPoints', 'ok', { count: pts.length });
    return pts;
  }

  function resolvePayPoint(id, action) {
    state.pay_points.forEach(function (p) {
      if (p.id === id) p.status = action; // accepted / modified / cancelled
    });
    save();
    return state.pay_points;
  }

  /* ================= World Compiler（第四层）+ Canon QA（第五层） ================= */

  function compile() {
    if (!state.quality.confirmed) return { ok: false, reason: '作者未确认' };
    var steps = [];
    var anchors = compileCanon();
    steps.push({ name: 'World Bible', out: '环境 3 类 · 风格 ' + STYLE_TOKEN });
    steps.push({ name: 'Character Bible', out: (state.quality.report.names.length) + ' 个角色建档' });
    steps.push({ name: 'Location Bible', out: Object.keys(ENV_MAP).length + ' 类场景登记' });
    steps.push({ name: 'Canon Graph', out: anchors.length + ' 个不可变锚点' });
    compilePresentation();
    compileInteractions();
    recommendPayPoints();
    steps.push({ name: 'Interaction & Asset Manifest', out: state.interactions.length + ' 热点 · ' + state.simulation.length + ' 生活条目' });
    state.logs.push({ step: 'WorldCompiler', status: 'ok', data: steps, at: Date.now() });
    var qa = canonIntegrityCheck();
    state.logs.push({ step: 'CanonQA', status: qa.passed ? 'ok' : 'failed', data: qa, at: Date.now() });
    save();
    return { ok: qa.passed, steps: steps, qa: qa };
  }

  function canonIntegrityCheck() {
    var details = [], ok = true;
    var text = state.source.text;
    state.canon.anchors.forEach(function (a) {
      if (text.indexOf(a.text) < 0) { ok = false; details.push('锚点 ' + a.id + ' 不在原文中'); }
      if (a.hash !== anchorHash(a.text)) { ok = false; details.push('锚点 ' + a.id + ' 哈希不符'); }
    });
    return {
      passed: ok && state.canon.anchors.length > 0,
      anchors: state.canon.anchors.length,
      details: details,
      algo: state.source.hash_algo
    };
  }

  /* ================= 玩家（三身份 + 存档） ================= */

  function setMode(m) { state.player.mode = m; state.player.started_at = Date.now(); save(); }

  function saveGame(bookKey) {
    try {
      localStorage.setItem(SAVE_PREFIX + bookKey, JSON.stringify({
        mode: state.player.mode, anchor_idx: state.player.anchor_idx,
        inventory: state.player.inventory, at: Date.now()
      }));
      return true;
    } catch (e) { return false; }
  }

  function loadGame(bookKey) {
    try {
      var raw = localStorage.getItem(SAVE_PREFIX + bookKey);
      if (!raw) return null;
      var s = JSON.parse(raw);
      state.player.mode = s.mode;
      state.player.anchor_idx = s.anchor_idx;
      state.player.inventory = s.inventory || [];
      save();
      return s;
    } catch (e) { return null; }
  }

  load();

  return {
    KEY: KEY, STYLE_TOKEN: STYLE_TOKEN, CONFIRM_KEYS: CONFIRM_KEYS,
    DEMO_TITLE: DEMO_TITLE, DEMO_TEXT: DEMO_TEXT,
    get state() { return state; },
    setSource: setSource, runGate: runGate, confirmAuthor: confirmAuthor,
    compile: compile, canonIntegrityCheck: canonIntegrityCheck,
    resolvePayPoint: resolvePayPoint,
    setMode: setMode, saveGame: saveGame, loadGame: loadGame,
    save: save, reset: reset
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = NovelOSStore; }
