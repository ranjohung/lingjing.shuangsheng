/* =================================================================
 * 灵境 · 双生 V20.0 — 公版小说库数据层
 * 来源：用户 2026-09-11 23:36 提供
 * 40 本书：25 中国古典 + 15 外国经典
 * 每本带 4 维完整性校验（size/chapters/words/keep_rate）
 * 收费点信息（chapterLocks/choiceLocks/bonusLocks/avgPrice）
 * V20-H：40 本全文已真实下载入库（corpus/books/*.txt，共 49.8MB）
 * integrity 数据来自 corpus/manifest.json 真实统计（real: true）
 * ================================================================= */
(function () {
  'use strict';

  // 中国古典文学 25 本
  var ZH_BOOKS = [
    { id: 'hongloumeng', title: '红楼梦', author: '曹雪芹', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B4513,#A0522D)', emoji: '📕',
      integrity: { size: 2464, chapters: 120, words: 709691, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 24, choiceLocks: 8, bonusLocks: 3, avgPrice: 18 } },
    { id: 'xiyouji', title: '西游记', author: '吴承恩', source: '文硕阁',
      cover: 'linear-gradient(135deg,#DAA520,#CD853F)', emoji: '🐒',
      integrity: { size: 1952, chapters: 100, words: 588922, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 20, choiceLocks: 6, bonusLocks: 2, avgPrice: 20 } },
    { id: 'sanguoyanyi', title: '三国演义', author: '罗贯中', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F4F4F,#556B2F)', emoji: '⚔️',
      integrity: { size: 1753, chapters: 120, words: 485415, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 24, choiceLocks: 7, bonusLocks: 4, avgPrice: 19 } },
    { id: 'shuihuzhuan', title: '水浒传', author: '施耐庵', source: '文硕阁',
      cover: 'linear-gradient(135deg,#191970,#000080)', emoji: '🏴',
      integrity: { size: 2520, chapters: 120, words: 705855, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 20, choiceLocks: 6, bonusLocks: 3, avgPrice: 22 } },
    { id: 'liaozhai', title: '聊斋志异', author: '蒲松龄', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F2F2F,#696969)', emoji: '👻',
      integrity: { size: 1426, chapters: 1, words: 384328, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 100, choiceLocks: 12, bonusLocks: 5, avgPrice: 12 } },
    { id: 'rulinwaishi', title: '儒林外史', author: '吴敬梓', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B7355,#A0826D)', emoji: '📚',
      integrity: { size: 952, chapters: 1, words: 272731, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 11, choiceLocks: 3, bonusLocks: 2, avgPrice: 14 } },
    { id: 'jinghuayuan', title: '镜花缘', author: '李汝珍', source: '文硕阁',
      cover: 'linear-gradient(135deg,#FF69B4,#FFB6C1)', emoji: '🌸',
      integrity: { size: 1216, chapters: 200, words: 338385, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 20, choiceLocks: 4, bonusLocks: 2, avgPrice: 15 } },
    { id: 'fengshenyanyi', title: '封神演义', author: '许仲琳', source: '文硕阁',
      cover: 'linear-gradient(135deg,#B22222,#CD5C5C)', emoji: '🔮',
      integrity: { size: 1730, chapters: 1, words: 485245, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 20, choiceLocks: 5, bonusLocks: 3, avgPrice: 16 } },
    { id: 'dongzhou', title: '东周列国志', author: '冯梦龙', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B0000,#A52A2A)', emoji: '🏯',
      integrity: { size: 2016, chapters: 216, words: 554223, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 21, choiceLocks: 5, bonusLocks: 2, avgPrice: 18 } },
    { id: 'suitang', title: '隋唐演义', author: '褚人获', source: '文硕阁',
      cover: 'linear-gradient(135deg,#D2691E,#F4A460)', emoji: '🗡',
      integrity: { size: 1853, chapters: 200, words: 521577, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 20, choiceLocks: 6, bonusLocks: 3, avgPrice: 20 } },
    { id: 'shuoyue', title: '说岳全传', author: '钱彩', source: '文硕阁',
      cover: 'linear-gradient(135deg,#006400,#228B22)', emoji: '🏹',
      integrity: { size: 1257, chapters: 162, words: 349777, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 16, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'laocan', title: '老残游记', author: '刘鹗', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B4513,#CD853F)', emoji: '🎭',
      integrity: { size: 506, chapters: 74, words: 144408, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 1, avgPrice: 12 } },
    { id: 'ershiyi', title: '二十年目睹之怪现状', author: '吴趼人', source: '文硕阁',
      cover: 'linear-gradient(135deg,#4B0082,#8B008B)', emoji: '👁',
      integrity: { size: 1611, chapters: 99, words: 462661, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 21, choiceLocks: 5, bonusLocks: 2, avgPrice: 14 } },
    { id: 'guanchang', title: '官场现形记', author: '李宝嘉', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F4F4F,#708090)', emoji: '🏛',
      integrity: { size: 1925, chapters: 120, words: 561140, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'shishuo', title: '世说新语', author: '刘义庆', source: '文硕阁',
      cover: 'linear-gradient(135deg,#DEB887,#D2B48C)', emoji: '📜',
      integrity: { size: 237, chapters: 1, words: 61736, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 50, choiceLocks: 8, bonusLocks: 3, avgPrice: 10 } },
    { id: 'shiji', title: '史记', author: '司马迁', source: '文硕阁',
      cover: 'linear-gradient(135deg,#800000,#8B0000)', emoji: '👑',
      integrity: { size: 1805, chapters: 1, words: 499436, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 26, choiceLocks: 5, bonusLocks: 3, avgPrice: 17 } },
    { id: 'shanhai', title: '山海经', author: '佚名', source: '文硕阁',
      cover: 'linear-gradient(135deg,#228B22,#006400)', emoji: '🐉',
      integrity: { size: 89, chapters: 1, words: 24251, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 4, avgPrice: 8 } },
    { id: 'zhuangzi', title: '庄子', author: '庄周', source: '文硕阁',
      cover: 'linear-gradient(135deg,#4682B4,#5F9EA0)', emoji: '🦋',
      integrity: { size: 282, chapters: 1, words: 77690, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 7, choiceLocks: 3, bonusLocks: 2, avgPrice: 10 } },
    { id: 'sunzi', title: '孙子兵法', author: '孙武', source: '文硕阁',
      cover: 'linear-gradient(135deg,#556B2F,#8B0000)', emoji: '⚔',
      integrity: { size: 22, chapters: 1, words: 6088, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 3, choiceLocks: 2, bonusLocks: 1, avgPrice: 5 } },
    { id: 'lunyu', title: '论语', author: '孔子及弟子', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B7355,#DEB887)', emoji: '📖',
      integrity: { size: 65, chapters: 1, words: 15998, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 1, avgPrice: 5 } },
    { id: 'daode', title: '道德经', author: '老子', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F4F4F,#696969)', emoji: '☯',
      integrity: { size: 20, chapters: 1, words: 5568, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 4, choiceLocks: 1, bonusLocks: 1, avgPrice: 5 } },
    { id: 'zizhi', title: '资治通鉴', author: '司马光', source: '文硕阁',
      cover: 'linear-gradient(135deg,#800000,#B22222)', emoji: '📜',
      integrity: { size: 9252, chapters: 1, words: 2590377, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 58, choiceLocks: 10, bonusLocks: 5, avgPrice: 25 } },
    { id: 'sanshi', title: '三十六计', author: '佚名', source: '文硕阁',
      cover: 'linear-gradient(135deg,#696969,#2F4F4F)', emoji: '♟',
      integrity: { size: 3, chapters: 1, words: 875, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 4, choiceLocks: 1, bonusLocks: 1, avgPrice: 5 } },
    { id: 'caigen', title: '菜根谭', author: '洪应明', source: '文硕阁',
      cover: 'linear-gradient(135deg,#228B22,#90EE90)', emoji: '🌿',
      integrity: { size: 48, chapters: 1, words: 13915, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 30, choiceLocks: 4, bonusLocks: 2, avgPrice: 8 } },
    { id: 'yanshi', title: '颜氏家训', author: '颜之推', source: '文硕阁',
      cover: 'linear-gradient(135deg,#A0826D,#8B7355)', emoji: '🏠',
      integrity: { size: 51, chapters: 1, words: 14052, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 1, avgPrice: 8 } }
  ];

  // 外国经典文学 15 本
  var EN_BOOKS = [
    { id: 'pride-prejudice', title: '傲慢与偏见', author: '简·奥斯汀', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#4682B4,#5F9EA0)', emoji: '📘',
      integrity: { size: 734, chapters: 59, words: 128565, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 15 } },
    { id: 'wuthering', title: '呼啸山庄', author: '艾米莉·勃朗特', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#2F4F4F,#696969)', emoji: '🌬',
      integrity: { size: 658, chapters: 34, words: 119368, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 7, choiceLocks: 3, bonusLocks: 2, avgPrice: 14 } },
    { id: 'jane-eyre', title: '简·爱', author: '夏洛蒂·勃朗特', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#FFB6C1,#FFC0CB)', emoji: '🌹',
      integrity: { size: 1040, chapters: 38, words: 189604, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 8, choiceLocks: 4, bonusLocks: 2, avgPrice: 16 } },
    { id: 'dracula', title: '德古拉', author: '布拉姆·斯托克', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B0000,#2F2F2F)', emoji: '🦇',
      integrity: { size: 850, chapters: 54, words: 163401, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 5, choiceLocks: 3, bonusLocks: 2, avgPrice: 14 } },
    { id: 'anna-karenina', title: '安娜·卡列尼娜', author: '托尔斯泰', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#DEB887,#A0826D)', emoji: '💔',
      integrity: { size: 2000, chapters: 1, words: 358375, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 48, choiceLocks: 8, bonusLocks: 4, avgPrice: 18 } },
    { id: 'les-miserables', title: '悲惨世界', author: '雨果', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#4682B4,#191970)', emoji: '⛓',
      integrity: { size: 3269, chapters: 358, words: 575614, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 73, choiceLocks: 10, bonusLocks: 5, avgPrice: 19 } },
    { id: 'notre-dame', title: '巴黎圣母院', author: '雨果', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#696969,#2F4F4F)', emoji: '🗼',
      integrity: { size: 1182, chapters: 1, words: 187794, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 5, choiceLocks: 4, bonusLocks: 2, avgPrice: 16 } },
    { id: 'red-black', title: '红与黑', author: '司汤达', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B0000,#000000)', emoji: '🎭',
      integrity: { size: 1078, chapters: 75, words: 196970, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 14, choiceLocks: 4, bonusLocks: 2, avgPrice: 15 } },
    { id: 'pere-goriot', title: '高老头', author: '巴尔扎克', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#DEB887,#8B4513)', emoji: '💰',
      integrity: { size: 578, chapters: 1, words: 105612, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 10, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'eugenie', title: '欧也妮·葛朗台', author: '巴尔扎克', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#FFD700,#DAA520)', emoji: '💎',
      integrity: { size: 381, chapters: 1, words: 67630, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 7, choiceLocks: 3, bonusLocks: 1, avgPrice: 12 } },
    { id: 'tess', title: '苔丝', author: '哈代', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#90EE90,#228B22)', emoji: '🌾',
      integrity: { size: 855, chapters: 1, words: 154663, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'great-expectations', title: '远大前程', author: '狄更斯', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#4682B4,#2F4F4F)', emoji: '🌅',
      integrity: { size: 1014, chapters: 1, words: 189051, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'tale-two-cities', title: '双城记', author: '狄更斯', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B0000,#4682B4)', emoji: '🏙',
      integrity: { size: 769, chapters: 45, words: 138490, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 9, choiceLocks: 4, bonusLocks: 3, avgPrice: 15 } },
    { id: 'oliver-twist', title: '雾都孤儿', author: '狄更斯', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#696969,#2F4F4F)', emoji: '🌫',
      integrity: { size: 914, chapters: 1, words: 162230, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 11, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'sherlock', title: '福尔摩斯探案集', author: '柯南·道尔', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B4513,#696969)', emoji: '🔍',
      integrity: { size: 574, chapters: 1, words: 105863, keepRate: 1.0, conclusion: 'pass', real: true },
      monetization: { chapterLocks: 12, choiceLocks: 6, bonusLocks: 4, avgPrice: 16 } }
  ];

  // 合并 + 标记
  var ALL = ZH_BOOKS.concat(EN_BOOKS).map(function (b, idx) {
    b.idx = idx;
    b.lang = ZH_BOOKS.indexOf(b) >= 0 ? 'zh' : 'en';
    b.category = b.lang === 'zh' ? '中国古典' : '外国经典';
    b.isDownloaded = b.integrity.conclusion === 'pass';
    return b;
  });

  // 概览统计
  function computeStats() {
    var total = ALL.length;
    var downloaded = ALL.filter(function (b) { return b.isDownloaded; }).length;
    var avgKeep = ALL.reduce(function (s, b) { return s + b.integrity.keepRate; }, 0) / total;
    var avgWords = ALL.reduce(function (s, b) { return s + b.integrity.words; }, 0) / total;
    var totalMon = ALL.reduce(function (s, b) {
      return s + b.monetization.chapterLocks + b.monetization.choiceLocks + b.monetization.bonusLocks;
    }, 0);
    var avgPrice = ALL.reduce(function (s, b) { return s + b.monetization.avgPrice; }, 0) / total;
    return {
      total: total,
      downloaded: downloaded,
      avgKeepRate: Math.round(avgKeep * 1000) / 10,
      avgWords: Math.round(avgWords / 10000),
      totalMonetization: totalMon,
      avgPrice: Math.round(avgPrice)
    };
  }

  window.PUBLIC_DOMAIN_DATA = {
    books: ALL,
    stats: computeStats(),
    getByLang: function (lang) {
      return ALL.filter(function (b) { return b.lang === lang; });
    },
    getById: function (id) {
      return ALL.find(function (b) { return b.id === id; });
    }
  };
})();