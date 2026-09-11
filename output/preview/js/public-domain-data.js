/* =================================================================
 * 灵境 · 双生 V20.0 — 公版小说库数据层
 * 来源：用户 2026-09-11 23:36 提供
 * 40 本书：25 中国古典 + 15 外国经典
 * 每本带 4 维完整性校验（size/chapters/words/keep_rate）
 * 收费点信息（chapterLocks/choiceLocks/bonusLocks/avgPrice）
 * 注：标准字数来自公开资料，prototype mock 不下载真实文件
 * ================================================================= */
(function () {
  'use strict';

  // 中国古典文学 25 本
  var ZH_BOOKS = [
    { id: 'hongloumeng', title: '红楼梦', author: '曹雪芹', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B4513,#A0522D)', emoji: '📕',
      integrity: { size: 4096, chapters: 120, words: 730000, keepRate: 0.987, conclusion: 'pass' },
      monetization: { chapterLocks: 24, choiceLocks: 8, bonusLocks: 3, avgPrice: 18 } },
    { id: 'xiyouji', title: '西游记', author: '吴承恩', source: '文硕阁',
      cover: 'linear-gradient(135deg,#DAA520,#CD853F)', emoji: '🐒',
      integrity: { size: 5200, chapters: 100, words: 860000, keepRate: 0.992, conclusion: 'pass' },
      monetization: { chapterLocks: 20, choiceLocks: 6, bonusLocks: 2, avgPrice: 20 } },
    { id: 'sanguoyanyi', title: '三国演义', author: '罗贯中', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F4F4F,#556B2F)', emoji: '⚔️',
      integrity: { size: 4800, chapters: 120, words: 800000, keepRate: 0.989, conclusion: 'pass' },
      monetization: { chapterLocks: 24, choiceLocks: 7, bonusLocks: 4, avgPrice: 19 } },
    { id: 'shuihuzhuan', title: '水浒传', author: '施耐庵', source: '文硕阁',
      cover: 'linear-gradient(135deg,#191970,#000080)', emoji: '🏴',
      integrity: { size: 5800, chapters: 100, words: 960000, keepRate: 0.984, conclusion: 'pass' },
      monetization: { chapterLocks: 20, choiceLocks: 6, bonusLocks: 3, avgPrice: 22 } },
    { id: 'liaozhai', title: '聊斋志异', author: '蒲松龄', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F2F2F,#696969)', emoji: '👻',
      integrity: { size: 2400, chapters: 500, words: 400000, keepRate: 0.978, conclusion: 'pass' },
      monetization: { chapterLocks: 100, choiceLocks: 12, bonusLocks: 5, avgPrice: 12 } },
    { id: 'rulinwaishi', title: '儒林外史', author: '吴敬梓', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B7355,#A0826D)', emoji: '📚',
      integrity: { size: 1200, chapters: 56, words: 200000, keepRate: 0.993, conclusion: 'pass' },
      monetization: { chapterLocks: 11, choiceLocks: 3, bonusLocks: 2, avgPrice: 14 } },
    { id: 'jinghuayuan', title: '镜花缘', author: '李汝珍', source: '文硕阁',
      cover: 'linear-gradient(135deg,#FF69B4,#FFB6C1)', emoji: '🌸',
      integrity: { size: 1900, chapters: 100, words: 320000, keepRate: 0.981, conclusion: 'pass' },
      monetization: { chapterLocks: 20, choiceLocks: 4, bonusLocks: 2, avgPrice: 15 } },
    { id: 'fengshenyanyi', title: '封神演义', author: '许仲琳', source: '文硕阁',
      cover: 'linear-gradient(135deg,#B22222,#CD5C5C)', emoji: '🔮',
      integrity: { size: 3000, chapters: 100, words: 500000, keepRate: 0.985, conclusion: 'pass' },
      monetization: { chapterLocks: 20, choiceLocks: 5, bonusLocks: 3, avgPrice: 16 } },
    { id: 'dongzhou', title: '东周列国志', author: '冯梦龙', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B0000,#A52A2A)', emoji: '🏯',
      integrity: { size: 4200, chapters: 108, words: 700000, keepRate: 0.982, conclusion: 'pass' },
      monetization: { chapterLocks: 21, choiceLocks: 5, bonusLocks: 2, avgPrice: 18 } },
    { id: 'suitang', title: '隋唐演义', author: '褚人获', source: '文硕阁',
      cover: 'linear-gradient(135deg,#D2691E,#F4A460)', emoji: '🗡',
      integrity: { size: 4800, chapters: 100, words: 800000, keepRate: 0.979, conclusion: 'pass' },
      monetization: { chapterLocks: 20, choiceLocks: 6, bonusLocks: 3, avgPrice: 20 } },
    { id: 'shuoyue', title: '说岳全传', author: '钱彩', source: '文硕阁',
      cover: 'linear-gradient(135deg,#006400,#228B22)', emoji: '🏹',
      integrity: { size: 1800, chapters: 80, words: 300000, keepRate: 0.988, conclusion: 'pass' },
      monetization: { chapterLocks: 16, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'laocan', title: '老残游记', author: '刘鹗', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B4513,#CD853F)', emoji: '🎭',
      integrity: { size: 800, chapters: 20, words: 130000, keepRate: 0.995, conclusion: 'pass' },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 1, avgPrice: 12 } },
    { id: 'ershiyi', title: '二十年目睹之怪现状', author: '吴趼人', source: '文硕阁',
      cover: 'linear-gradient(135deg,#4B0082,#8B008B)', emoji: '👁',
      integrity: { size: 1800, chapters: 108, words: 300000, keepRate: 0.984, conclusion: 'pass' },
      monetization: { chapterLocks: 21, choiceLocks: 5, bonusLocks: 2, avgPrice: 14 } },
    { id: 'guanchang', title: '官场现形记', author: '李宝嘉', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F4F4F,#708090)', emoji: '🏛',
      integrity: { size: 1500, chapters: 60, words: 250000, keepRate: 0.987, conclusion: 'pass' },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'shishuo', title: '世说新语', author: '刘义庆', source: '文硕阁',
      cover: 'linear-gradient(135deg,#DEB887,#D2B48C)', emoji: '📜',
      integrity: { size: 600, chapters: 1130, words: 100000, keepRate: 0.976, conclusion: 'pass' },
      monetization: { chapterLocks: 50, choiceLocks: 8, bonusLocks: 3, avgPrice: 10 } },
    { id: 'shiji', title: '史记', author: '司马迁', source: '文硕阁',
      cover: 'linear-gradient(135deg,#800000,#8B0000)', emoji: '👑',
      integrity: { size: 3100, chapters: 130, words: 520000, keepRate: 0.991, conclusion: 'pass' },
      monetization: { chapterLocks: 26, choiceLocks: 5, bonusLocks: 3, avgPrice: 17 } },
    { id: 'shanhai', title: '山海经', author: '佚名', source: '文硕阁',
      cover: 'linear-gradient(135deg,#228B22,#006400)', emoji: '🐉',
      integrity: { size: 200, chapters: 18, words: 30000, keepRate: 0.989, conclusion: 'pass' },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 4, avgPrice: 8 } },
    { id: 'zhuangzi', title: '庄子', author: '庄周', source: '文硕阁',
      cover: 'linear-gradient(135deg,#4682B4,#5F9EA0)', emoji: '🦋',
      integrity: { size: 500, chapters: 33, words: 80000, keepRate: 0.993, conclusion: 'pass' },
      monetization: { chapterLocks: 7, choiceLocks: 3, bonusLocks: 2, avgPrice: 10 } },
    { id: 'sunzi', title: '孙子兵法', author: '孙武', source: '文硕阁',
      cover: 'linear-gradient(135deg,#556B2F,#8B0000)', emoji: '⚔',
      integrity: { size: 40, chapters: 13, words: 6000, keepRate: 0.998, conclusion: 'pass' },
      monetization: { chapterLocks: 3, choiceLocks: 2, bonusLocks: 1, avgPrice: 5 } },
    { id: 'lunyu', title: '论语', author: '孔子及弟子', source: '文硕阁',
      cover: 'linear-gradient(135deg,#8B7355,#DEB887)', emoji: '📖',
      integrity: { size: 100, chapters: 20, words: 16000, keepRate: 0.997, conclusion: 'pass' },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 1, avgPrice: 5 } },
    { id: 'daode', title: '道德经', author: '老子', source: '文硕阁',
      cover: 'linear-gradient(135deg,#2F4F4F,#696969)', emoji: '☯',
      integrity: { size: 30, chapters: 81, words: 5000, keepRate: 0.998, conclusion: 'pass' },
      monetization: { chapterLocks: 4, choiceLocks: 1, bonusLocks: 1, avgPrice: 5 } },
    { id: 'zizhi', title: '资治通鉴', author: '司马光', source: '文硕阁',
      cover: 'linear-gradient(135deg,#800000,#B22222)', emoji: '📜',
      integrity: { size: 18000, chapters: 294, words: 3000000, keepRate: 0.972, conclusion: 'pass' },
      monetization: { chapterLocks: 58, choiceLocks: 10, bonusLocks: 5, avgPrice: 25 } },
    { id: 'sanshi', title: '三十六计', author: '佚名', source: '文硕阁',
      cover: 'linear-gradient(135deg,#696969,#2F4F4F)', emoji: '♟',
      integrity: { size: 30, chapters: 36, words: 5000, keepRate: 0.999, conclusion: 'pass' },
      monetization: { chapterLocks: 4, choiceLocks: 1, bonusLocks: 1, avgPrice: 5 } },
    { id: 'caigen', title: '菜根谭', author: '洪应明', source: '文硕阁',
      cover: 'linear-gradient(135deg,#228B22,#90EE90)', emoji: '🌿',
      integrity: { size: 300, chapters: 360, words: 50000, keepRate: 0.985, conclusion: 'pass' },
      monetization: { chapterLocks: 30, choiceLocks: 4, bonusLocks: 2, avgPrice: 8 } },
    { id: 'yanshi', title: '颜氏家训', author: '颜之推', source: '文硕阁',
      cover: 'linear-gradient(135deg,#A0826D,#8B7355)', emoji: '🏠',
      integrity: { size: 200, chapters: 20, words: 36000, keepRate: 0.992, conclusion: 'pass' },
      monetization: { chapterLocks: 4, choiceLocks: 2, bonusLocks: 1, avgPrice: 8 } }
  ];

  // 外国经典文学 15 本
  var EN_BOOKS = [
    { id: 'pride-prejudice', title: '傲慢与偏见', author: '简·奥斯汀', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#4682B4,#5F9EA0)', emoji: '📘',
      integrity: { size: 614, chapters: 61, words: 122000, keepRate: 0.994, conclusion: 'pass' },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 15 } },
    { id: 'wuthering', title: '呼啸山庄', author: '艾米莉·勃朗特', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#2F4F4F,#696969)', emoji: '🌬',
      integrity: { size: 600, chapters: 34, words: 120000, keepRate: 0.993, conclusion: 'pass' },
      monetization: { chapterLocks: 7, choiceLocks: 3, bonusLocks: 2, avgPrice: 14 } },
    { id: 'jane-eyre', title: '简·爱', author: '夏洛蒂·勃朗特', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#FFB6C1,#FFC0CB)', emoji: '🌹',
      integrity: { size: 1300, chapters: 38, words: 220000, keepRate: 0.992, conclusion: 'pass' },
      monetization: { chapterLocks: 8, choiceLocks: 4, bonusLocks: 2, avgPrice: 16 } },
    { id: 'dracula', title: '德古拉', author: '布拉姆·斯托克', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B0000,#2F2F2F)', emoji: '🦇',
      integrity: { size: 1000, chapters: 27, words: 160000, keepRate: 0.991, conclusion: 'pass' },
      monetization: { chapterLocks: 5, choiceLocks: 3, bonusLocks: 2, avgPrice: 14 } },
    { id: 'anna-karenina', title: '安娜·卡列尼娜', author: '托尔斯泰', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#DEB887,#A0826D)', emoji: '💔',
      integrity: { size: 3600, chapters: 239, words: 600000, keepRate: 0.987, conclusion: 'pass' },
      monetization: { chapterLocks: 48, choiceLocks: 8, bonusLocks: 4, avgPrice: 18 } },
    { id: 'les-miserables', title: '悲惨世界', author: '雨果', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#4682B4,#191970)', emoji: '⛓',
      integrity: { size: 3900, chapters: 365, words: 650000, keepRate: 0.984, conclusion: 'pass' },
      monetization: { chapterLocks: 73, choiceLocks: 10, bonusLocks: 5, avgPrice: 19 } },
    { id: 'notre-dame', title: '巴黎圣母院', author: '雨果', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#696969,#2F4F4F)', emoji: '🗼',
      integrity: { size: 1400, chapters: 11, words: 230000, keepRate: 0.989, conclusion: 'pass' },
      monetization: { chapterLocks: 5, choiceLocks: 4, bonusLocks: 2, avgPrice: 16 } },
    { id: 'red-black', title: '红与黑', author: '司汤达', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B0000,#000000)', emoji: '🎭',
      integrity: { size: 1300, chapters: 70, words: 220000, keepRate: 0.991, conclusion: 'pass' },
      monetization: { chapterLocks: 14, choiceLocks: 4, bonusLocks: 2, avgPrice: 15 } },
    { id: 'pere-goriot', title: '高老头', author: '巴尔扎克', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#DEB887,#8B4513)', emoji: '💰',
      integrity: { size: 1100, chapters: 50, words: 180000, keepRate: 0.993, conclusion: 'pass' },
      monetization: { chapterLocks: 10, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'eugenie', title: '欧也妮·葛朗台', author: '巴尔扎克', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#FFD700,#DAA520)', emoji: '💎',
      integrity: { size: 500, chapters: 33, words: 80000, keepRate: 0.996, conclusion: 'pass' },
      monetization: { chapterLocks: 7, choiceLocks: 3, bonusLocks: 1, avgPrice: 12 } },
    { id: 'tess', title: '苔丝', author: '哈代', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#90EE90,#228B22)', emoji: '🌾',
      integrity: { size: 1100, chapters: 59, words: 180000, keepRate: 0.990, conclusion: 'pass' },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'great-expectations', title: '远大前程', author: '狄更斯', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#4682B4,#2F4F4F)', emoji: '🌅',
      integrity: { size: 1000, chapters: 59, words: 160000, keepRate: 0.992, conclusion: 'pass' },
      monetization: { chapterLocks: 12, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'tale-two-cities', title: '双城记', author: '狄更斯', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B0000,#4682B4)', emoji: '🏙',
      integrity: { size: 1300, chapters: 45, words: 210000, keepRate: 0.989, conclusion: 'pass' },
      monetization: { chapterLocks: 9, choiceLocks: 4, bonusLocks: 3, avgPrice: 15 } },
    { id: 'oliver-twist', title: '雾都孤儿', author: '狄更斯', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#696969,#2F4F4F)', emoji: '🌫',
      integrity: { size: 1000, chapters: 53, words: 170000, keepRate: 0.991, conclusion: 'pass' },
      monetization: { chapterLocks: 11, choiceLocks: 4, bonusLocks: 2, avgPrice: 14 } },
    { id: 'sherlock', title: '福尔摩斯探案集', author: '柯南·道尔', source: 'Project Gutenberg',
      cover: 'linear-gradient(135deg,#8B4513,#696969)', emoji: '🔍',
      integrity: { size: 2700, chapters: 60, words: 450000, keepRate: 0.983, conclusion: 'pass' },
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