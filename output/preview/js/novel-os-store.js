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

  /* ---------- 演示文本（自写，无版权风险；6 章 40+ 段） ---------- */
  var DEMO_TITLE = '临安十二巷（演示文本）';
  var DEMO_TEXT = [
    '# 临安十二巷', '## 第一章 · 雨夜归人',
    '临安城的雨下了整整三日。',
    '沈砚之收伞踏进十二巷时，灯笼在湿石板上拖出细长的倒影。',
    '巷口酒楼的伙计正在上门板，木门发出吱呀的响声。',
    '「沈公子，这么晚了还回来？」伙计探出半个身子。',
    '「取一样东西。」沈砚之说。',
    '他推开书房的门，一股旧纸的气味扑面而来。',
    '书桌上摊着一封未拆开的信，火漆完好。',
    '突然，窗外传来瓦片轻响，像有人踩过屋檐。',
    '沈砚之吹熄灯，在黑暗里静静站着。',
    '## 第二章 · 未拆的信',
    '雨声渐渐小了。',
    '沈砚之重新点亮灯，把信拿到窗边细看。',
    '火漆上压着一朵梅花印，是京城沈家的私记。',
    '「三年了。」他低声说。',
    '他拆开信，只有短短一行字：故人至，十二巷，雨停时。',
    '谁知窗外竟有人轻笑了一声。',
    '「雨还没停呢。」那声音说。',
    '沈砚之猛地回头，窗纸上映着一个纤细的影子。',
    '## 第三章 · 夜访者',
    '「你是谁？」沈砚之问。',
    '「送信的人。」影子说。',
    '窗被推开一条缝，湿冷的风灌进来，灯焰摇晃。',
    '门外传来更夫的梆子声，二更天。',
    '那影子却不见了，只留窗台上一枚碧绿的玉佩。',
    '玉佩雕着半朵梅花，断口很新，像是刚掰开的。',
    '沈砚之握紧玉佩，指节发白。',
    '## 第四章 · 酒楼问话',
    '第二日晌午，雨终于停了。',
    '沈砚之坐在酒楼临窗的位子，要了一壶热酒。',
    '「客官打听着什么？」掌柜的擦着碗问。',
    '「三年前离开京城的沈家二爷。」',
    '掌柜的手停了一下，又若无其事地继续擦碗。',
    '「十二巷里，没有姓沈的。」掌柜说。',
    '「那昨夜送信的人呢？」',
    '酒楼里忽然安静下来，连跑堂都停住了脚。',
    '## 第五章 · 梅花断佩',
    '沈砚之把玉佩放在桌上。',
    '掌柜盯着那半朵梅花看了很久，终于叹了口气。',
    '「跟我来。」掌柜说。',
    '他们穿过酒楼后厨，走进一条窄得只容侧身的夹道。',
    '夹道尽头是一扇小门，门上挂着铜锁，锁身布满绿锈。',
    '「这屋子租出去三年，钥匙一直没人来取。」掌柜说。',
    '沈砚之接过钥匙时，忽然想起信上那行字。',
    '故人至，十二巷，雨停时。',
    '## 第六章 · 雨停时',
    '锁开了。',
    '屋里的陈设和三年前一模一样，桌上的茶杯还剩半盏冷茶。',
    '椅背上搭着一件男子的外袍，是京城才有的料子。',
    '沈砚之走到书架前，第三层空了一格。',
    '那本该放着的，是一本梅花谱。',
    '他身后，门又被人轻轻推开了。',
    '「沈二爷，别来无恙。」来人说。',
    '沈砚之回过身，灯笼的光照亮了那张脸。',
    '（演示文本 · 完）'
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
