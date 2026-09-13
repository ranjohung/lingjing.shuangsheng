/* =====================================================================
 * V22-B · 题材识别器（独立模块）
 *
 * 设计原则（PRD-v22 §5.2）：
 *   - 读完小说前 10% 自动判定题材权重
 *   - primary = 最高权重题材；combo = 第二权重 >= primary * 50% 时叠加
 *   - 自动装载属性面板到 player_state
 *   - 题材 → 默认基础操作列表（5-8 个悬浮标签类型）
 *
 * 与 novel-world-parser.js 的关系：
 *   - parser 中的 extractWorldBible 已经返回 genre 字段
 *   - 本模块提供更细的：detect() / applyToPlayerState() / getDefaultActions()
 *   - 测试用 5 题材各 100 段样本验证准确率
 * ===================================================================== */
(function () {
  var GENRE_KEYWORDS = (window.NovelWorldParser && window.NovelWorldParser.GENRE_KEYWORDS) || {
    xiuxian:  ['炼气','筑基','金丹','灵气','飞升','闭关','御剑','丹药','灵根','修真','仙门','天劫','丹田'],
    mori:     ['丧尸','辐射','避难所','物资','感染','废土','变异','末世','幸存','营地','尸潮','异变','抗体'],
    wuxia:    ['门派','内力','招式','江湖','比武','武林','大侠','武功','侠客','帮会','掌门','弟子','侠义','剑客'],
    jingying: ['土地','作物','收获','交易','金币','银两','播种','耕种','农田','粮仓','商行','集市','物价','收成'],
    gongdou:  ['后宫','位分','宠爱','势力','心计','皇后','妃子','公主','宫女','请安','送礼','陷害','宫规','太监']
  };

  var GENRE_ATTRS = (window.NovelWorldParser && window.NovelWorldParser.GENRE_ATTRS) || {};
  var GENRE_ACTIONS = (window.NovelWorldParser && window.NovelWorldParser.GENRE_ACTIONS) || {};

  /* ---- detect：题材识别 ----
     输入：paragraphs: string[]
     输出：{ primary, combo[], weights{} } */
  function detect(paragraphs) {
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
    var ranked = Object.keys(weights).sort(function (a, b) { return weights[b] - weights[a]; });
    var primary = ranked[0];
    var combo = [];
    // combo 规则：第二名 >= 第一名 * 50% → 叠加
    if (weights[ranked[1]] >= weights[ranked[0]] * 0.5) combo.push(ranked[0], ranked[1]);
    else combo.push(ranked[0]);
    return { primary: primary, combo: combo, weights: weights };
  }

  /* ---- applyToPlayerState：装载属性面板 ----
     把题材专属属性 merge 进 player_state.attrs */
  function applyToPlayerState(playerState, genre) {
    var g = genre || 'jingying';
    var extra = GENRE_ATTRS[g] || {};
    if (!playerState.attrs) playerState.attrs = {};
    Object.keys(extra).forEach(function (k) {
      if (typeof playerState.attrs[k] === 'undefined') playerState.attrs[k] = extra[k];
    });
    return playerState;
  }

  /* ---- getDefaultActions：返回题材默认基础操作 ----
     V22-C 悬浮标签会用到 */
  function getDefaultActions(genre) {
    return GENRE_ACTIONS[genre] || [];
  }

  /* ---- getAttrNames：返回题材属性字段名（V22-C 顶部状态栏用） ---- */
  function getAttrNames(genre) {
    var g = genre || 'jingying';
    var attr = GENRE_ATTRS[g] || {};
    var out = [];
    Object.keys(attr).forEach(function (k) { out.push(k); });
    return out;
  }

  /* ---- getGenreList：5 大题材 ---- */
  function getGenreList() {
    return Object.keys(GENRE_KEYWORDS);
  }

  /* ---- 样本生成器（测试用）：生成 5 题材各 100 段 ---- */
  var SAMPLES = {
    xiuxian: [
      '他盘膝打坐，灵气从丹田涌出。', '金丹期修士御剑飞行。', '筑基之后方可闭关。',
      '天剑宗弟子正在炼制丹药。', '灵气充盈，直冲天际。', '元婴老祖降下天劫。',
      '灵根纯正，修炼一日千里。', '飞升之前需度过九重雷劫。', '修真界风云变幻。',
      '仙门大会，各派弟子云集。'
    ],
    mori: [
      '丧尸群冲进避难所。', '辐射值爆表，防护服破裂。', '物资耗尽，饥寒交迫。',
      '废土之上变异生物横行。', '末世幸存者聚集在营地。', '感染扩散，无法遏制。',
      '尸潮来袭，防线崩溃。', '抗体研发成功。', '辐射尘覆盖大地。',
      '异变让人面目全非。'
    ],
    wuxia: [
      '少侠行走江湖，行侠仗义。', '门派比武，争夺武林盟主。', '内力运转，气沉丹田。',
      '一招剑法惊天地。', '大侠结交豪杰。', '帮会之争，血流成河。',
      '掌门闭关修炼。', '弟子拜师学艺。', '侠客仗剑走天涯。',
      '剑客十步杀一人。'
    ],
    jingying: [
      '春耕时节，土地翻耕。', '今秋收获颇丰。', '集市上交易热闹。',
      '金币落袋为安。', '播种希望。', '耕种一年，丰收在望。',
      '粮仓满盈。', '商行开张。', '物价飞涨。',
      '收成是去年的两倍。'
    ],
    gongdou: [
      '后宫佳丽三千。', '皇后娘娘恩威并施。', '妃子为争宠爱不择手段。',
      '势力错综复杂。', '心计深沉。', '公主降生。',
      '宫女请安。', '送礼讨好。', '陷害对手。',
      '宫规森严。'
    ]
  };

  function generateSamples(genre, count) {
    var pool = SAMPLES[genre] || [];
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push(pool[i % pool.length] + ' 第' + (i + 1) + '段。');
    }
    return out;
  }

  /* ---- 自检：5 题材各 100 段准确率 ---- */
  function selfTest() {
    var genres = getGenreList();
    var results = {};
    genres.forEach(function (g) {
      var samples = generateSamples(g, 100);
      var result = detect(samples);
      results[g] = result.primary === g;
    });
    return results;
  }

  /* ---- 暴露 API ---- */
  window.NovelWorldGenre = {
    detect: detect,
    applyToPlayerState: applyToPlayerState,
    getDefaultActions: getDefaultActions,
    getAttrNames: getAttrNames,
    getGenreList: getGenreList,
    generateSamples: generateSamples,
    selfTest: selfTest,
    GENRE_KEYWORDS: GENRE_KEYWORDS,
    GENRE_ATTRS: GENRE_ATTRS,
    GENRE_ACTIONS: GENRE_ACTIONS
  };
})();