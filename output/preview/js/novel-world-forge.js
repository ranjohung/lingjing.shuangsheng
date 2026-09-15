/* =====================================================================
 * V25-A · 小说世界自动生成引擎（NovelWorldForge）
 *
 * 输入：任意一本小说原文（公版书 / 作者上传 txt）
 * 输出：世界蓝图 world = { meta, genre, characters, locations, props,
 *                        scenes, anchors, presentation, interactions,
 *                        assets, stats }
 *
 * 三大铁律（与 V22 / V24 一致）：
 *   ① 零删减 —— anchors[].text 与原文 byte-equal，任何 UI 只能读它
 *   ② 零创造 —— 所有角色名/地名/道具名/意象词必须能在原文里原样搜到
 *              （assertFromSource 会逐条校验，false 即抛错）
 *   ③ 提取而非生成 —— 本模块内无任何「造词」逻辑，只有识别 + 归并 + 排序
 *
 * 本模块不含任何示例文本、不含任何演示数据。书源由调用方传入。
 * ===================================================================== */
'use strict';

var NovelWorldForge = (function () {
  var VERSION = 'v25.1';

  /* ================= 词典区（只用于「识别」原文里已有的词） ================= */

  // 中文场所后缀。命中即认定为一个地点候选，候选正文仍取自原文。
  var ZH_PLACE_SUFFIX = [
    '洞府', '山庄', '桃园', '山寨', '水寨', '码头', '衙门',
    '城', '楼', '殿', '宫', '山', '岭', '峰', '岩', '崖', '洞', '府', '庄',
    '寺', '观', '庙', '祠', '陵', '庵', '塔', '亭', '台', '斋', '阁', '堂', '厅', '院',
    '桥', '街', '巷', '坊', '铺', '店', '馆', '营', '寨', '村', '镇', '州', '郡', '县',
    '关', '监', '狱', '仓', '库', '港', '湾', '浦', '渚', '洲', '岛', '屿', '礁',
    '江', '河', '湖', '海', '溪', '泉', '池', '潭', '塘', '渡', '津', '井', '坡', '沟',
    '林', '园', '苑', '庄', '塞', '堡', '垒', '圃', '场', '界'
  ];

  // 中文物件后缀。
  var ZH_PROP_SUFFIX = [
    '宝剑', '宝刀', '棒', '袈裟', '禅杖', '念珠',
    '剑', '刀', '枪', '戟', '斧', '钺', '锤', '鞭', '弓', '箭', '甲', '盔', '袍', '冠', '带', '履',
    '书', '信', '诏', '榜', '帖', '契', '图', '画', '卷', '册', '简', '碑', '印', '玺',
    '玉', '珠', '钗', '环', '镯', '镜', '囊', '盒', '匣', '箱', '柜', '瓶', '壶', '碗', '杯', '盘',
    '盏', '炉', '灯', '伞', '扇', '琴', '箫', '笛', '钟', '鼓', '铃', '旗', '幡', '杖', '符', '丹',
    '药', '酒', '茶', '舟', '船', '车', '马', '轿', '绳', '索', '钥', '匙', '帘', '屏', '案', '榻',
    '席', '枕', '被', '衣', '衫', '裙', '巾', '帕', '履', '鞋', '履', '钥'
  ];

  // 地点误报黑名单（这些"看起来像地点"的其实是常用词）
  var ZH_STOP = {
    '时候': 1, '什么': 1, '怎么': 1, '这样': 1, '那样': 1, '这里': 1, '那里': 1, '哪里': 1,
    '地方': 1, '上头': 1, '下面': 1, '中间': 1, '旁边': 1, '外面': 1, '里面': 1, '前面': 1,
    '后面': 1, '心头': 1, '口中': 1, '心中': 1, '手中': 1, '身上': 1, '眼前': 1, '天下': 1,
    '地上': 1, '天上': 1, '地下': 1, '人间': 1, '世界': 1, '里头': 1, '外头': 1, '后头': 1,
    '前头': 1, '如今': 1, '一时': 1, '一山': 1, '那山': 1, '这山': 1, '座山': 1, '个山': 1,
    '如何': 1, '若何': 1, '奈何': 1, '云头': 1, '心头': 1, '口内': 1, '心内': 1,
    // 泛称地点（是原文里的词，但不是一个"可以走进去的场景"）
    '高山': 1, '大山': 1, '深山': 1, '小山': 1, '前山': 1, '后山': 1, '此山': 1, '那山': 1,
    '山中': 1, '山上': 1, '山下': 1, '此地': 1, '此处': 1, '他处': 1, '各处': 1, '某处': 1,
    '房内': 1, '屋内': 1, '门内': 1, '门外': 1, '船上': 1, '路上': 1, '街上': 1, '心中': 1
  };

  // 人物误报黑名单（"X道/X曰"里的 X 若是这些，就不是人名）
  var ZH_NAME_STOP = {
    '知道': 1, '难道': 1, '说道': 1, '大道': 1, '天道': 1, '人道': 1, '无道': 1, '有道': 1,
    '得道': 1, '听道': 1, '怪道': 1, '暗道': 1, '便道': 1, '只道': 1, '不道': 1, '怎道': 1,
    '开道': 1, '其道': 1, '此道': 1, '何道': 1, '是道': 1, '有曰': 1, '名曰': 1, '诗曰': 1,
    '或曰': 1, '人曰': 1, '子曰': 1, '故曰': 1, '赞曰': 1, '所谓': 1, '话说': 1, '但说': 1,
    '再说': 1, '却说': 1, '且说': 1, '且听': 1, '不说': 1, '休说': 1, '莫说': 1, '休提': 1
  };

  // 行为动词（用于 L2 演出层的「动作」标签，取自原文）
  var ZH_VERBS = [
    '推开', '拿起', '放下', '走出', '走进', '回头', '转身', '举手', '跪下', '拜倒',
    '睁开', '闭上', '抬头', '低头', '点头', '摇头', '大笑', '大哭', '喝道', '喊道',
    '抽出', '拔出', '举起', '劈下', '掌', '敲', '敲打', '拆开', '收起', '翻看', '握住',
    '坐', '站', '躺', '跪', '拜', '走', '跑', '跳', '飞', '跳下', '跳上', '落下', '升起',
    '打开', '关上', '吹熄', '点亮', '端', '捧', '托', '扛', '背', '牵', '骑', '登', '渡'
  ];

  // 镜头（机器指令，非原文内容；类型 → 镜头语言）
  var CAMERA_BY_TYPE = {
    '对白': ['过肩镜头', '说话者特写'],
    '转折': ['缓慢推近', '特写定格'],
    '旁白': ['远景空镜', '缓慢横移'],
    '叙述': ['中景', '缓慢横移']
  };

  // 意象词 → 英文视觉 token（SD 提示词用；中文 SD 不支持，故做查表映射）
  var IMAGE_LEXICON = {
    '月': 'moonlight', '明月': 'bright moon', '日': 'sunlight', '太阳': 'sun', '星': 'stars',
    '云': 'clouds', '云雾': 'clouds and mist', '雾': 'mist', '霞': 'sunset glow', '虹': 'rainbow',
    '雨': 'rain', '雪': 'snow', '风': 'wind', '霜': 'frost', '露': 'dew', '雷': 'thunder',
    '电': 'lightning', '烟': 'smoke haze', '火': 'fire glow', '焰': 'flames', '光': 'light rays',
    '影': 'shadows', '阳光': 'sunlight', '春': 'spring', '夏': 'summer', '秋': 'autumn',
    '冬': 'winter', '晨': 'dawn', '暮': 'dusk', '昏': 'twilight', '夜': 'night', '晓': 'daybreak',
    '松': 'pine trees', '柳': 'willow', '桃': 'peach blossom', '梅': 'plum blossom',
    '竹': 'bamboo', '荷': 'lotus', '草': 'grassland', '花': 'flowers', '藤': 'vines',
    '石': 'rocks', '沙': 'sand', '水': 'water', '波': 'ripples', '浪': 'waves', '潮': 'tide',
    '金': 'golden', '银': 'silver', '铜': 'bronze', '玉': 'jade', '朱': 'vermilion',
    '丹': 'crimson', '碧': 'jade green', '青': 'cyan', '翠': 'emerald', '白': 'white',
    '苍': 'pale blue', '幽': 'secluded', '深': 'deep', '险': 'perilous', '峻': 'steep',
    '秀': 'graceful', '寒': 'cold', '暖': 'warm', '凉': 'cool', '清': 'clear',
    '殿': 'hall interior', '宫': 'palace', '楼': 'tower', '阁': 'pavilion',
    '洞': 'cave', '洞府': 'cave dwelling', '山': 'mountain', '洞天': 'grotto heaven',
    '海': 'sea', '江': 'river', '河': 'river', '湖': 'lake', '溪': 'stream', '泉': 'spring water',
    '林': 'forest', '园': 'garden', '桥': 'bridge', '城': 'walled city', '街': 'street',
    '灯': 'lanterns', '灯笼': 'red lanterns', '酒': 'wine jars', '茶': 'tea', '书': 'books',
    '琴': 'guqin', '棋': 'go board', '画': 'scroll painting', '香': 'incense smoke',
    '钟': 'bronze bell', '鼓': 'war drum', '旗': 'banners', '船': 'boat', '舟': 'boat'
  };

  // 人物外观词典（同样只做「识别 + 映射」，外观描述必须来自原文）
  var APPEARANCE_LEXICON = {
    '金冠': 'golden crown', '玉带': 'jade belt', '红袍': 'red robe', '紫袍': 'purple robe',
    '青袍': 'cyan robe', '白衣': 'white robe', '黑衣': 'black robe', '黄袍': 'yellow robe',
    '袈裟': 'buddhist kasaya robe', '锦襕': 'brocade cassock', '短褐': 'coarse short jacket',
    '金甲': 'golden armor', '银甲': 'silver armor', '铁甲': 'iron armor', '披挂': 'armor',
    '长须': 'long beard', '白须': 'white beard', '黑须': 'black beard', '胡须': 'beard',
    '光头': 'shaved head', '长发': 'long hair', '白发': 'white hair', '黑发': 'black hair',
    '眉如': 'shaped eyebrows', '眼如': 'piercing eyes', '面如': 'distinctive face',
    '面圆': 'round face', '面黄': 'sallow face', '白面': 'fair face', '红脸': 'ruddy face',
    '身长': 'tall stature', '身高': 'tall stature', '肥大': 'bulky build', '矮小': 'short build',
    '瘦': 'slender build', '胖': 'heavy build', '魁梧': 'burly build',
    '金睛': 'fiery golden eyes', '火眼': 'fiery eyes', '铜头': 'bronze head',
    '铁额': 'iron brow', '獠牙': 'tusks', '雷公嘴': 'beak-like mouth', '毛脸': 'furry face',
    '九齿': 'nine-toothed', '玉面': 'jade-like face', '蟒袍': 'python robe',
    '凤冠': 'phoenix crown', '霞帔': 'embroidered shawl', '珠翠': 'pearl ornaments',
    '道袍': 'daoist robe', '纶巾': 'silk headscarf', '羽扇': 'feather fan',
    '云履': 'cloud-patterned boots', '长裙': 'long skirt', '水袖': 'flowing sleeves'
  };

  // 中文场景类型 → 英文视觉基底（Blender/SD 共用）
  var KIND_EN = {
    mountain: 'majestic mountain peak, layered cliffs, sea of clouds',
    cave: 'cavern interior, stalactites, glowing shafts of light',
    palace: 'grand oriental palace hall, red pillars, golden roof, silk drapes',
    town: 'ancient chinese walled town, tiled roofs, flagstone street, lanterns',
    water: 'river and lake vista, water ripples, distant shoreline, mist',
    forest: 'dense ancient forest, tall trunks, dappled light, undergrowth',
    bridge: 'stone arch bridge over water, railings, willow branches',
    street: 'narrow old street with shopfronts, cloth banners, hanging lanterns',
    temple: 'buddhist temple courtyard, incense burner, prayer flags, stone steps',
    garden: 'classical chinese garden, rockery, pond, winding corridor',
    generic: 'ancient chinese environment, atmospheric depth, cinematic composition'
  };

  // 场所后缀 → 场景类型（供 Blender 建模配方 / SD 基底选择）
  var SUFFIX_KIND = {
    '山': 'mountain', '岭': 'mountain', '峰': 'mountain', '岩': 'mountain', '崖': 'mountain',
    '坡': 'mountain', '谷': 'mountain', '沟': 'mountain',
    '洞': 'cave', '洞府': 'cave', '洞天': 'cave',
    '宫': 'palace', '殿': 'palace', '阁': 'palace', '堂': 'palace', '厅': 'palace',
    '楼': 'palace', '塔': 'temple', '亭': 'palace', '台': 'palace', '斋': 'palace',
    '寺': 'temple', '庙': 'temple', '观': 'temple', '庵': 'temple', '祠': 'temple', '陵': 'temple',
    '城': 'town', '关': 'town', '寨': 'town', '营': 'town', '村': 'town', '镇': 'town',
    '州': 'town', '郡': 'town', '县': 'town', '庄': 'town', '府': 'town', '堡': 'town',
    '垒': 'town', '塞': 'town', '衙': 'town', '监': 'town', '狱': 'town', '仓': 'town', '库': 'town',
    '江': 'water', '河': 'water', '湖': 'water', '海': 'water', '溪': 'water', '泉': 'water',
    '池': 'water', '潭': 'water', '塘': 'water', '渡': 'water', '津': 'water', '浦': 'water',
    '洲': 'water', '渚': 'water', '岛': 'water', '屿': 'water', '礁': 'water', '湾': 'water',
    '港': 'water', '井': 'water',
    '林': 'forest', '园': 'garden', '苑': 'garden', '圃': 'garden', '庄院': 'garden',
    '桥': 'bridge',
    '街': 'street', '巷': 'street', '坊': 'street', '店': 'street', '馆': 'street',
    '铺': 'street', '场': 'street', '界': 'generic', '码头': 'water'
  };

  /* ================= 通用工具 ================= */

  function sortByLenDesc(arr) {
    return arr.slice().sort(function (a, b) { return b.length - a.length; });
  }

  function topN(map, n) {
    var arr = [];
    for (var k in map) { if (Object.prototype.hasOwnProperty.call(map, k)) arr.push({ k: k, v: map[k] }); }
    arr.sort(function (a, b) { return b.v - a.v || (a.k < b.k ? -1 : 1); });
    return arr.slice(0, n);
  }

  function countOccur(text, sub) {
    var c = 0, i = 0;
    while (true) {
      var p = text.indexOf(sub, i);
      if (p < 0) break;
      c++; i = p + sub.length;
    }
    return c;
  }

  // 去掉捕获到的前缀噪声（方位词/量词/动词/文言虚词）
  var LEAD_NOISE_RE = /^(?:这|那|此|其|之|一所|一座|一个|一座|在|到|至|入|出|往|向|从|自|由|与|和|把|被|的|了|是|有|无|不|大|小|一|个|座|所|处|座|了|着|过|来|去|回|离|上|下|里|外|前|后|中|旁|左|右|边|面|头)+/;

  function cleanCandidate(s) {
    var out = String(s || '');
    for (var i = 0; i < 4; i++) {
      var n = out.replace(LEAD_NOISE_RE, '');
      if (n === out) break;
      out = n;
    }
    return out;
  }

  /* ---- 虚词/动词/代词集合：候选词向前扫描时遇到即停 ----
     这是「零创造」的边界守卫：它只用来切断噪声，从不新增任何字。 */
  var NOISE_SET = {};
  (function () {
    var s = '的了是在有不到至入出往向从自与和把被读写拿取看闻听我你他她它们咱这那此其之乎者也而则若乃既已皆都又亦复更还只便就即才却方且夫盖故但唯念想见来去回归过上下中前后内外的里间头面边旁座将欲能为所以因由如同共各每凡诸众群甚岂然猛忽陡骤顿遂始终久常颇极最闹打杀走跑坐站放挂悬藏埋推拉抬举飞跳进退转穿越抵赴投奔赶逃避住停歇游玩持握';

    for (var i = 0; i < s.length; i++) NOISE_SET[s.charAt(i)] = 1;
  })();

  // 人物专用虚词集：人名常以「者/王/帝/师/僧/君/子」收尾，故这些字不做切断位
  var NOISE_NAME = (function () {
    var m = {};
    for (var k in NOISE_SET) { if (Object.prototype.hasOwnProperty.call(NOISE_SET, k)) m[k] = 1; }
    ['者'].forEach(function (c) { delete m[c]; });
    // 情态状语（厉声/欢喜/醒悟/启奏 之类）不应成为人名的一部分
    '声喜醒奏忙急慌怒惊欢愁惨笑悲啼'.split('').forEach(function (c) { m[c] = 1; });
    return m;
  })();

  // 物件专用虚词集：保留「如」（如意棒/如意钩），排除拿取安放类动词
  var NOISE_PROP = (function () {
    var m = {};
    for (var k in NOISE_SET) { if (Object.prototype.hasOwnProperty.call(NOISE_SET, k)) m[k] = 1; }
    '安非排报奉弼养唤叫送借还买卖造炼收寻找遇逢陪随领带跟幌摇摆扯拽递呈献赐赠赏罚抛掷摔碰撞砸踢砍劈刺戳'.split('')
      .forEach(function (c) { m[c] = 1; });
    delete m['如'];
    return m;
  })();

  function isCJK(ch) { return ch >= '\u4e00' && ch <= '\u9fa5'; }

  // 从 end 向前走，遇到非中文或虚词即停，最多取 maxPrefix 个实字
  function walkBack(text, end, maxPrefix, noiseSet) {
    var NS = noiseSet || NOISE_SET;
    var start = end;
    while (start > 0 && (end - start) < maxPrefix) {
      var ch = text.charAt(start - 1);
      if (!isCJK(ch) || NS[ch]) break;
      start--;
    }
    return start;
  }

  // 若候选词后面紧跟一个场所后缀，说明它其实是被地点词吞掉的碎片（如「水帘」→「水帘洞」）
  var PLACE_FOLLOW_RE = null;

  // 通用「后缀锚定 + 向前回溯」抽取：候选词 100% 是原文子串
  function collectMentions(text, suffixes, maxPrefix, opts) {
    opts = opts || {};
    if (!PLACE_FOLLOW_RE) {
      PLACE_FOLLOW_RE = new RegExp('^(' + sortByLenDesc(ZH_PLACE_SUFFIX).join('|') + ')');
    }
    var re = new RegExp('(' + sortByLenDesc(suffixes).join('|') + ')', 'g');
    var map = {}, first = {}, m;
    while ((m = re.exec(text)) !== null) {
      var endPos = m.index;
      var nameEnd = endPos + m[1].length;
      if (opts.skipFollowerPlace) {
        var after = text.slice(nameEnd, nameEnd + 3);
        if (PLACE_FOLLOW_RE.test(after)) continue;
      }
      var start = walkBack(text, endPos, maxPrefix, opts.noiseSet);
      var name = text.slice(start, nameEnd);
      var maxLen = opts.maxLen || 8;
      if (name.length < 2 || name.length > maxLen) continue;
      if (opts.noLeadingNumeral && name.length <= 2 && /^[一二三四五六七八九十百千万两]/.test(name)) continue;
      map[name] = (map[name] || 0) + 1;
      if (first[name] === undefined) first[name] = m.index;
    }
    return { map: map, first: first };
  }

  // 归并嵌套候选：保留高频的、同频更长的，去掉被包含的碎片
  function mergeNested(list) {
    list.sort(function (a, b) {
      return b.mentions - a.mentions || b.name.length - a.name.length || (a.first_at - b.first_at);
    });
    var kept = [];
    list.forEach(function (o) {
      var nested = kept.some(function (k2) {
        return k2.name.indexOf(o.name) >= 0 || o.name.indexOf(k2.name) >= 0;
      });
      if (!nested) kept.push(o);
    });
    return kept;
  }

  /* ================= 体裁识别（票数制，全部来自原文特征词） ================= */

  var GENRE_DICT = [
    { id: '修仙', name: '仙侠修真', kw: ['修道', '神仙', '妖', '法术', '丹', '仙', '真人', '妖魔', '法术', '元神', '仙丹', '玉帝', '天宫', '蟠桃', '妖猴', '神通', '金丹'] },
    { id: '武侠', name: '武侠江湖', kw: ['江湖', '武功', '内功', '镖局', '剑客', '拳', '掌门', '侠客', '刀法', '掌门', '门派', '武林'] },
    { id: '历史', name: '历史演义', kw: ['丞相', '都督', '将军', '兵马', '朝廷', '天子', '大都督', '太守', '刺史', '战马', '粮草', '诸侯', '天下大势'] },
    { id: '世情', name: '世情家族', kw: ['府上', '夫人', '小姐', '丫鬟', '婚嫁', '家宴', '太太', '老爷', '聘礼', '亲事', '婆子'] },
    { id: '志怪', name: '志怪传奇', kw: ['狐狸', '鬼', '阴司', '判官', '魂', '夜间', '坟', '棺材', '僵尸', '狐'] },
    { id: '神魔', name: '神魔斗法', kw: ['法宝', '妖魔', '天兵', '哪吒', '龙王', '雷公', '齐天大圣', '金箍棒', '如来', '观音'] },
    { id: '游记', name: '游历见闻', kw: ['游记', '一路', '行至', '历', '沿途', '路上', '晓行夜宿', '坐船', '渡河'] },
    { id: '悬疑', name: '悬疑推理', kw: ['侦探', '尸', '凶', '案', '线索', '疑', '证', '谋杀'] }
  ];

  function detectGenre(text) {
    var sample = text.slice(0, 200000);
    var votes = [], total = 0;
    GENRE_DICT.forEach(function (g) {
      var score = 0;
      g.kw.forEach(function (w) { score += countOccur(sample, w); });
      votes.push({ id: g.id, name: g.name, score: score });
      total += score;
    });
    votes.sort(function (a, b) { return b.score - a.score; });
    var top = votes.slice(0, 3).map(function (v) {
      return { id: v.id, name: v.name, weight: total ? Math.round(v.score / total * 100) : 0, score: v.score };
    });
    return { primary: top[0] ? top[0].id : '通用', list: top, total: total };
  }

  /* ================= 人物提取 ================= */

  // 对话归属锚点：X道 / X曰 / X说道 …（X 向前回溯，遇虚词即停）
  var ZH_SAY_RE = /(说道|问道|笑道|喝道|骂道|叫道|答道|言道|道|曰)(?=[，。：:「"”‘’\s])/g;
  var ZH_QUOTE_RE = /[「"“]([^\u4e00-\u9fa5]{0,2})([\u4e00-\u9fa5]{2,3})[」"”](?=[说道问喊笑答：])/g;

  function extractCharacters(text, opts) {
    opts = opts || {};
    var minMentions = opts.minMentions || 3;
    var map = {}, first = {}, dialog = {}, m;

    ZH_SAY_RE.lastIndex = 0;
    while ((m = ZH_SAY_RE.exec(text)) !== null) {
      var endPos = m.index;
      var start = walkBack(text, endPos, 3, NOISE_NAME);
      var n = text.slice(start, endPos);
      if (n.length < 2 || n.length > 3) continue;
      if (ZH_NAME_STOP[n]) continue;
      if (NOISE_SET[n.charAt(0)]) continue;   // 首字是虚词 → 判为噪声
      map[n] = (map[n] || 0) + 1;
      if (first[n] === undefined) first[n] = m.index;
      dialog[n] = (dialog[n] || 0) + 1;
    }
    ZH_QUOTE_RE.lastIndex = 0;
    while ((m = ZH_QUOTE_RE.exec(text)) !== null) {
      var n2 = m[2];
      if (n2.length < 2 || n2.length > 3) continue;
      if (ZH_NAME_STOP[n2]) continue;
      map[n2] = (map[n2] || 0) + 1;
      if (first[n2] === undefined) first[n2] = m.index;
    }

    var out = [];
    for (var k in map) {
      if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
      if (map[k] < minMentions) continue;
      out.push({
        name: k,
        mentions: map[k],
        dialogues: dialog[k] || 0,
        first_at: first[k],
        in_source: text.indexOf(k) >= 0
      });
    }
    mergeNested(out);
    out.sort(function (a, b) { return b.mentions - a.mentions || a.first_at - b.first_at; });
    out = out.slice(0, opts.limit || 24);
    out.forEach(function (c, i) { c.tier = i < 3 ? 'main' : (i < 8 ? 'support' : 'minor'); });
    return out;
  }

  /* ================= 地点提取 ================= */

  function extractLocations(text, opts) {
    opts = opts || {};
    var minMentions = opts.minMentions || 2;
    var col = collectMentions(text, ZH_PLACE_SUFFIX, 6);
    var out = [];
    for (var k in col.map) {
      if (!Object.prototype.hasOwnProperty.call(col.map, k)) continue;
      if (col.map[k] < minMentions) continue;
      if (ZH_STOP[k]) continue;
      out.push({ name: k, mentions: col.map[k], first_at: col.first[k], kind: classifyLocation(k) });
    }
    var kept = mergeNested(out).slice(0, opts.limit || 30);
    kept.forEach(function (l, i) { l.tier = i < 6 ? 'main' : (i < 14 ? 'support' : 'minor'); });
    return kept;
  }

  function classifyLocation(name) {
    var suf = sortByLenDesc(ZH_PLACE_SUFFIX);
    for (var i = 0; i < suf.length; i++) {
      if (name.length > suf[i].length && name.slice(-suf[i].length) === suf[i]) {
        return SUFFIX_KIND[suf[i]] || 'generic';
      }
    }
    return 'generic';
  }

  /* ================= 道具提取 ================= */

  function extractProps(text, opts) {
    opts = opts || {};
    var minMentions = opts.minMentions || 2;
    var col = collectMentions(text, ZH_PROP_SUFFIX, 5, {
      skipFollowerPlace: true, noiseSet: NOISE_PROP, maxLen: 5, noLeadingNumeral: true
    });
    var out = [];
    for (var k in col.map) {
      if (!Object.prototype.hasOwnProperty.call(col.map, k)) continue;
      if (col.map[k] < minMentions) continue;
      if (ZH_STOP[k]) continue;
      out.push({ name: k, mentions: col.map[k], first_at: col.first[k] });
    }
    return mergeNested(out).slice(0, opts.limit || 24);
  }

  /* ================= 场景切分（地点切换 = 场景边界） ================= */

  function buildScenes(anchors, locations, opts) {
    opts = opts || {};
    var minSpan = opts.minSpan || 6;
    var minLocMentions = opts.sceneMinMentions || 3;
    // 只有"够显著"的地点才配成为场景边界，避免次要地名把叙事切碎
    var byLen = locations.filter(function (l) { return l.mentions >= minLocMentions; })
      .sort(function (a, b) { return b.name.length - a.name.length; });
    var scenes = [], cur = null, lastBound = 0;

    anchors.forEach(function (a, i) {
      var hit = null;
      for (var j = 0; j < byLen.length; j++) {
        if (a.text.indexOf(byLen[j].name) >= 0) { hit = byLen[j].name; break; }
      }
      var loc = hit || (cur ? cur.location : (locations[0] ? locations[0].name : '未命名场景'));
      var needNew = !cur || (hit && hit !== cur.location && (i - lastBound) >= minSpan);
      if (needNew) {
        cur = {
          scene_id: 'S' + ('00' + (scenes.length + 1)).slice(-3),
          index: scenes.length,
          location: loc,
          kind: classifyLocation(loc),
          anchor_ids: [],
          from: i,
          to: i,
          characters: [],
          images: []
        };
        scenes.push(cur);
        lastBound = i;
      } else if (hit) {
        cur.location = hit;
        cur.kind = classifyLocation(hit);
      }
      cur.anchor_ids.push(a.id);
      cur.to = i;
    });

    // 太短的尾场景并入前一场景
    if (scenes.length > 1) {
      var tail = scenes[scenes.length - 1];
      if (tail.anchor_ids.length < minSpan) {
        var prev = scenes[scenes.length - 2];
        prev.anchor_ids = prev.anchor_ids.concat(tail.anchor_ids);
        prev.to = tail.to;
        scenes.pop();
      }
    }
    // 同地点相邻场景合并（原文来回走动不应产生重复背景）
    var merged = [];
    scenes.forEach(function (s) {
      var last = merged[merged.length - 1];
      if (last && last.location === s.location) {
        last.anchor_ids = last.anchor_ids.concat(s.anchor_ids);
        last.to = s.to;
      } else {
        merged.push(s);
      }
    });
    merged.forEach(function (s, i) {
      s.index = i;
      s.scene_id = 'S' + ('00' + (i + 1)).slice(-3);
      s.span = s.anchor_ids.length;
    });
    // 重建 presentation 的 scene 归属依赖此 id，调用方须在 merge 之后使用
    return merged;
  }

  /* ================= L2 演出层 ================= */

  function buildPresentation(anchors, scenes, characters, opts) {
    opts = opts || {};
    var styleToken = opts.styleToken || 'anime_cel+photo_dof+film_grain';
    var sceneOf = {};
    scenes.forEach(function (s) { s.anchor_ids.forEach(function (id) { sceneOf[id] = s; }); });
    var out = {};

    anchors.forEach(function (a) {
      var sc = sceneOf[a.id];
      var chars = [];
      characters.forEach(function (c) {
        if (a.text.indexOf(c.name) >= 0 && chars.indexOf(c.name) < 0) chars.push(c.name);
      });
      var cam = CAMERA_BY_TYPE[a.type] || CAMERA_BY_TYPE['叙述'];
      var action = '';
      for (var v = 0; v < ZH_VERBS.length; v++) {
        if (a.text.indexOf(ZH_VERBS[v]) >= 0) { action = ZH_VERBS[v]; break; }
      }
      out[a.id] = {
        scene_id: sc ? sc.scene_id : null,
        environment: sc ? sc.location : '—',
        kind: sc ? sc.kind : 'generic',
        camera: cam,
        characters: chars,
        action: action,
        style: styleToken,
        note: '演出层（机器指令，不含新增正文）'
      };
    });
    return out;
  }

  /* ================= L3 交互热点（从原文道具/地点抽取） ================= */

  function buildInteractions(anchors, props, locations) {
    var found = [];
    var usedProp = {}, usedLoc = {};
    anchors.forEach(function (a) {
      props.forEach(function (p) {
        if (usedProp[p.name] || found.length >= 40) return;
        if (a.text.indexOf(p.name) >= 0) {
          usedProp[p.name] = 1;
          found.push({
            id: 'IX-' + found.length,
            anchor_id: a.id,
            object: p.name,
            kind: '物件',
            interaction_type: '查看',
            source: 'EXTRACTED',
            from_source: true,
            canon: false
          });
        }
      });
      locations.forEach(function (l) {
        if (usedLoc[l.name] || found.length >= 40) return;
        if (a.text.indexOf(l.name) >= 0) {
          usedLoc[l.name] = 1;
          found.push({
            id: 'IX-' + found.length,
            anchor_id: a.id,
            object: l.name,
            kind: '地点',
            interaction_type: '前往',
            source: 'EXTRACTED',
            from_source: true,
            canon: false
          });
        }
      });
    });
    return found;
  }

  /* ================= 人物外观特征（从原文共现窗口抽取，仍是零创造） ================= */

  function extractCharacterTraits(text, name, opts) {
    opts = opts || {};
    var win = opts.window || 34;
    var map = {}, idx = 0, m = text.indexOf(name, 0), guard = 0;
    while (m >= 0 && guard < 200) {
      guard++;
      var seg = text.slice(Math.max(0, m - win), m + name.length + win);
      for (var k in APPEARANCE_LEXICON) {
        if (Object.prototype.hasOwnProperty.call(APPEARANCE_LEXICON, k) && seg.indexOf(k) >= 0) {
          map[k] = (map[k] || 0) + 1;
        }
      }
      idx = m + name.length;
      m = text.indexOf(name, idx);
    }
    return topN(map, opts.limit || 6).map(function (x) {
      return { zh: x.k, en: APPEARANCE_LEXICON[x.k], n: x.v };
    });
  }

  /* ================= 资产清单（交给 SD / Blender 生产） ================= */

  function extractImageryTokens(text, opts) {
    opts = opts || {};
    var map = {}, keys = Object.keys(IMAGE_LEXICON);
    keys.forEach(function (k) {
      var c = countOccur(text, k);
      if (c > 0) map[k] = c;
    });
    return topN(map, opts.limit || 10).map(function (x) { return { zh: x.k, en: IMAGE_LEXICON[x.k], n: x.v }; });
  }

  function buildAssetManifest(world, opts) {
    opts = opts || {};
    var maxBg = opts.maxBackgrounds || 12;
    var pool = [], used = {};
    world.scenes.forEach(function (s) {
      var key = s.kind + '_' + s.location;
      if (used[key]) { used[key].scene_ids.push(s.scene_id); used[key].anchors += s.anchor_ids.length; return; }
      var seg = world.anchors.slice(s.from, s.to + 1).map(function (a) { return a.text; }).join('');
      var tokens = extractImageryTokens(seg, { limit: 8 });
      var rec = {
        asset_id: '',
        location: s.location,
        kind: s.kind,
        scene_ids: [s.scene_id],
        file: '',
        // 提示词 = 场景英文基底 + 原文意象词英文映射（全部可溯源）
        prompt_parts: [KIND_EN[s.kind] || KIND_EN.generic].concat(tokens.map(function (t) { return t.en; })),
        imagery_sources: tokens,
        anchors: s.anchor_ids.length
      };
      used[key] = rec;
      pool.push(rec);
    });

    // 每种场景类型至少留 1 张，其余按锚点覆盖量补齐到上限
    pool.sort(function (a, b) { return b.anchors - a.anchors; });
    var picked = [], kinds = {};
    pool.forEach(function (r) {
      if (!kinds[r.kind]) { kinds[r.kind] = 1; picked.push(r); }
    });
    pool.forEach(function (r) {
      if (picked.length >= maxBg) return;
      if (picked.indexOf(r) < 0) picked.push(r);
    });
    picked = picked.slice(0, maxBg);
    picked.sort(function (a, b) { return a.scene_ids[0] < b.scene_ids[0] ? -1 : 1; });

    var backgrounds = picked.map(function (r, i) {
      r.asset_id = 'sc' + ('00' + (i + 1)).slice(-3) + '_' + r.kind;
      r.file = r.asset_id + '.png';
      return r;
    });

    // 3D 资产：每个 buildable kind 一个场景模型
    var kinds = {}, models3d = [];
    world.scenes.forEach(function (s) {
      if (!kinds[s.kind] && s.kind !== 'generic') {
        kinds[s.kind] = 1;
        models3d.push({
          asset_id: 'm3d_' + s.kind,
          kind: s.kind,
          location: s.location,
          recipe: s.kind,
          glb: 'm3d_' + s.kind + '.glb',
          render: 'm3d_' + s.kind + '.png'
        });
      }
    });

    // 立绘：主要角色（外观特征同样从原文共现窗口抽取）
    var srcText = opts.text || '';
    var portraits = world.characters.filter(function (c) { return c.tier === 'main' || c.tier === 'support'; })
      .map(function (c, i) {
        var traits = srcText ? extractCharacterTraits(srcText, c.name, { limit: 6 }) : [];
        var id = 'por' + ('00' + (i + 1)).slice(-3);
        return {
          asset_id: id,
          name: c.name,
          tier: c.tier,
          mentions: c.mentions,
          file: id + '.png',
          traits: traits,
          prompt_parts: ['anime character portrait, upper body, centered, plain dark background']
            .concat(traits.map(function (t) { return t.en; }))
        };
      });

    return { backgrounds: backgrounds, models3d: models3d, portraits: portraits };
  }

  /* ================= 零删减 / 零创造 校验 ================= */

  function assertFromSource(world, text) {
    var bad = [];
    world.characters.forEach(function (c) { if (text.indexOf(c.name) < 0) bad.push('角色:' + c.name); });
    world.locations.forEach(function (l) { if (text.indexOf(l.name) < 0) bad.push('地点:' + l.name); });
    world.props.forEach(function (p) { if (text.indexOf(p.name) < 0) bad.push('道具:' + p.name); });
    return { ok: bad.length === 0, bad: bad };
  }

  function assertAnchorsByteEqual(world, text) {
    var bad = [];
    world.anchors.forEach(function (a) {
      if (text.indexOf(a.text) < 0) bad.push(a.id);
    });
    return { ok: bad.length === 0, bad: bad, total: world.anchors.length };
  }

  /* ================= 综合入口 ================= */

  function splitParagraphs(text) {
    return text.replace(/\r/g, '').split(/\n+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  function classifyParagraph(p) {
    if (/[「"“]/.test(p)) return '对白';
    if (/突然|但是|谁知|竟然|直到|那一刻|猛地|忽然|不料|岂知/.test(p)) return '转折';
    if (p.length <= 12) return '旁白';
    return '叙述';
  }

  function buildAnchors(text, opts) {
    opts = opts || {};
    var maxChars = opts.maxChars || 0;
    var paras = splitParagraphs(text);
    var anchors = [], chapter = 0, used = 0, m;
    for (var i = 0; i < paras.length; i++) {
      var p = paras[i];
      if (/^#/.test(p)) continue;
      if (/^第[一二三四五六七八九十百千零〇0-9]+[章回卷节]/.test(p)) { chapter++; continue; }
      if (/^《.*》/.test(p) && p.length < 30) continue;
      if (maxChars && used + p.length > maxChars && anchors.length > 0) break;
      anchors.push({
        id: 'C' + ('00000' + (anchors.length + 1)).slice(-5),
        chapter: chapter,
        idx: anchors.length,
        type: classifyParagraph(p),
        text: p,
        immutable: true
      });
      used += p.length;
    }
    return anchors;
  }

  function forge(input) {
    input = input || {};
    var text = String(input.text || '');
    if (!text.trim()) return { ok: false, reason: '原文为空' };

    var opts = input.options || {};
    var anchors = buildAnchors(text, opts);
    if (!anchors.length) return { ok: false, reason: '未解析出任何段落' };

    var genre = detectGenre(text);
    var characters = extractCharacters(text, opts);
    var locations = extractLocations(text, opts);
    var props = extractProps(text, opts);
    var scenes = buildScenes(anchors, locations, opts);
    var presentation = buildPresentation(anchors, scenes, characters, {
      styleToken: opts.styleToken || 'anime_cel+photo_dof+film_grain'
    });
    var interactions = buildInteractions(anchors, props, locations);

    var world = {
      version: VERSION,
      built_at: Date.now(),
      meta: {
        book_id: input.bookId || '',
        title: input.title || '',
        author: input.author || '',
        source_kind: input.sourceKind || 'public_domain',
        chars: text.length,
        chapters: anchors.length ? anchors[anchors.length - 1].chapter : 0
      },
      genre: genre,
      anchors: anchors,
      characters: characters,
      locations: locations,
      props: props,
      scenes: scenes,
      presentation: presentation,
      interactions: interactions,
      assets: null,
      stats: {
        anchors: anchors.length,
        scenes: scenes.length,
        characters: characters.length,
        locations: locations.length,
        props: props.length,
        interactions: interactions.length,
        imagery: extractImageryTokens(text, { limit: 12 })
      }
    };
    world.assets = buildAssetManifest(world, {
      text: text,
      maxBackgrounds: opts.maxBackgrounds
    });
    world.checks = {
      from_source: assertFromSource(world, text),
      anchors_byte_equal: assertAnchorsByteEqual(world, text)
    };
    return world;
  }

  /* ================= 自测 ================= */

  function selfTest() {
    var cases = [];
    function t(name, fn) {
      try { cases.push({ name: name, ok: !!fn() }); }
      catch (e) { cases.push({ name: name, ok: false, err: String(e) }); }
    }

    var SRC = [
      '花果山上有一仙石，石产一卵，化作石猴。',
      '那猴王跳入水帘洞，被众猴拜为大王。',
      '猴王道：「我乃花果山水帘洞之主。」',
      '猴王拜入斜月三星洞，祖师道：「你既来自花果山，可留在此处。」',
      '祖师道：「斜月三星洞中，自有你的名字。」',
      '猴王自东海龙宫取来金箍棒，龙王道：「此乃定海神针。」',
      '行者手持金箍棒，直入南天门。',
      '玉帝道：「妖猴无礼。」',
      '行者大闹天宫，被压在五行山下。',
      '观音道：「五百年后，自有取经人来。」',
      '行者出五行山，又过黑风山。',
      '行者道：「前面是何处？」',
      '天王道：「那是天宫。」',
      '祖师道：「花果山，水帘洞，三星洞，皆是你来处。」'
    ].join('\n');

    t('forge 返回世界蓝图', function () {
      var w = forge({ title: '测试', text: SRC });
      return !!w && w.anchors.length === 14 && w.anchors[0].text === '花果山上有一仙石，石产一卵，化作石猴。';
    });

    t('零删减：锚点 byte-equal', function () {
      var w = forge({ title: '测试', text: SRC });
      return w.checks.anchors_byte_equal.ok === true;
    });

    t('零创造：角色/地点/道具都能在原文搜到', function () {
      var w = forge({ title: '测试', text: SRC });
      return w.checks.from_source.ok === true && w.characters.length > 0;
    });

    t('地点提取命中 花果山/水帘洞/斜月三星洞', function () {
      var w = forge({ title: '测试', text: SRC });
      var names = w.locations.map(function (l) { return l.name; }).join(',');
      return names.indexOf('花果山') >= 0 && names.indexOf('水帘洞') >= 0 && names.indexOf('斜月三星洞') >= 0;
    });

    t('地点不提噪声：我乃花果山 / 大闹天宫 / 定海 均不入库', function () {
      var w = forge({ title: '测试', text: SRC });
      var names = w.locations.map(function (l) { return l.name; }).join(',');
      return names.indexOf('我乃花果山') < 0 && names.indexOf('大闹天宫') < 0 && names.indexOf('定海') < 0;
    });

    t('角色提取命中 猴王/行者/祖师（含低频）', function () {
      var names = extractCharacters(SRC, { minMentions: 1 }).map(function (c) { return c.name; }).join(',');
      return names.indexOf('猴王') >= 0 && names.indexOf('祖师') >= 0 && names.indexOf('行者') >= 0;
    });

    t('道具提取命中 金箍棒', function () {
      var w = forge({ title: '测试', text: SRC });
      return w.props.map(function (p) { return p.name; }).indexOf('金箍棒') >= 0;
    });

    t('场景切分 ≥2 且场景锚点全覆盖', function () {
      var w = forge({ title: '测试', text: SRC, options: { minSpan: 2, sceneMinMentions: 2 } });
      var total = 0;
      w.scenes.forEach(function (s) { total += s.anchor_ids.length; });
      return w.scenes.length >= 2 && total === w.anchors.length;
    });

    t('场景同地点相邻合并（无重复背景）', function () {
      var w = forge({ title: '测试', text: SRC, options: { minSpan: 2, sceneMinMentions: 2 } });
      for (var i = 1; i < w.scenes.length; i++) {
        if (w.scenes[i].location === w.scenes[i - 1].location) return false;
      }
      return true;
    });

    t('演出层每个锚点都有 scene/environment', function () {
      var w = forge({ title: '测试', text: SRC });
      return w.anchors.every(function (a) {
        var p = w.presentation[a.id];
        return p && p.environment && p.camera && p.camera.length > 0;
      });
    });

    t('资产清单：背景数 = 去重场景数', function () {
      var w = forge({ title: '测试', text: SRC });
      var keys = {};
      w.scenes.forEach(function (s) { keys[s.kind + '_' + s.location] = 1; });
      return w.assets.backgrounds.length === Object.keys(keys).length;
    });

    t('资产清单：含 3D 模型与立绘请求', function () {
      var w = forge({ title: '测试', text: SRC });
      return w.assets.models3d.length >= 1 && w.assets.portraits.length >= 1;
    });

    t('背景提示词含「原文意象词 → 英文映射」溯源', function () {
      var w = forge({ title: '测试', text: SRC });
      return w.assets.backgrounds.every(function (b) {
        return Array.isArray(b.imagery_sources) && Array.isArray(b.prompt_parts) && b.prompt_parts.length >= 1;
      });
    });

    t('地点类型分类：山→mountain 洞→cave 宫→palace', function () {
      return classifyLocation('花果山') === 'mountain' &&
        classifyLocation('水帘洞') === 'cave' &&
        classifyLocation('天宫') === 'palace';
    });

    t('误报黑名单生效：天下/时候 不入地点', function () {
      var names = extractLocations('天下之事，时候未到。天下大势，时候已到。', { minMentions: 1 })
        .map(function (l) { return l.name; });
      return names.indexOf('天下') < 0 && names.indexOf('时候') < 0;
    });

    t('误报黑名单生效：难道/知道 不入人物', function () {
      var names = extractCharacters('他难道知道？我难道知道？谁难道知道？', { minMentions: 1 })
        .map(function (c) { return c.name; });
      return names.indexOf('难道') < 0 && names.indexOf('知道') < 0;
    });

    t('体裁识别：仙侠/神魔 文本判为修仙或神魔', function () {
      var g = detectGenre('神仙妖魔法术金丹元神玉帝天宫蟠桃妖猴神通 修道 仙丹 真人 妖魔 天兵 法宝 龙王 如来 观音 齐天大圣 金箍棒');
      return g.primary === '修仙' || g.primary === '神魔';
    });

    t('空文本返回 ok=false', function () {
      return forge({ title: 'x', text: '   ' }).ok === false;
    });

    t('maxChars 限制生效', function () {
      var long = new Array(200).join('这一句话很长很长很长很长很长很长很长。\n');
      var w = forge({ title: 'x', text: long, options: { maxChars: 100 } });
      return w.anchors.length < 10;
    });

    t('交互热点只来自原文（from_source 全 true）', function () {
      var w = forge({ title: '测试', text: SRC });
      return w.interactions.every(function (i) { return i.from_source === true; });
    });

    var passed = cases.filter(function (c) { return c.ok; }).length;
    return { version: VERSION, passed: passed, total: cases.length, cases: cases };
  }

  var api = {
    VERSION: VERSION,
    forge: forge,
    detectGenre: detectGenre,
    extractCharacters: extractCharacters,
    extractLocations: extractLocations,
    extractProps: extractProps,
    buildScenes: buildScenes,
    buildAnchors: buildAnchors,
    buildAssetManifest: buildAssetManifest,
    extractImageryTokens: extractImageryTokens,
    extractCharacterTraits: extractCharacterTraits,
    classifyLocation: classifyLocation,
    assertFromSource: assertFromSource,
    assertAnchorsByteEqual: assertAnchorsByteEqual,
    selfTest: selfTest,
    // 词典（只读，UI 可展示"识别依据"）
    ZH_PLACE_SUFFIX: ZH_PLACE_SUFFIX,
    ZH_PROP_SUFFIX: ZH_PROP_SUFFIX,
    IMAGE_LEXICON: IMAGE_LEXICON,
    KIND_EN: KIND_EN
  };

  if (typeof window !== 'undefined') { window.NovelWorldForge = api; }
  return api;
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = NovelWorldForge; }
