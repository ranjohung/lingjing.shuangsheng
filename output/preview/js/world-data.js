/* =================================================================
 * 灵境 · 双生 V17.0 — 世界功能区数据层（mock · 30 题材 + 10 公版）
 * 复用约束：
 *   - 30 题材覆盖：v5.12 题材库 + V17 新增同人专区
 *   - 国际艺人/作品名替换：BTS/HP/EXO → 韩流同人/欧美同人（PRD 9.1 R7）
 *   - 公版作品以"灵境"专属术语呈现（"灵境版红楼梦"）
 *   - 同人专区不在 UI 出现任何国际 IP 名称
 * 暴露：window.WORLD_DATA.{BANNERS, CATEGORIES, FEATURED, HOT, NEW_DONE, PUBLIC_DOMAIN}
 * ================================================================= */
(function () {
  'use strict';
  if (window.WORLD_DATA) return;

  // ---------- Banner 5 张 ----------
  var BANNERS = [
    { id: 'b1', title: '双生 · 入世', subtitle: '一个角色，两种人生', gradient: 'linear-gradient(135deg,#E94560,#6C5CE7)', href: 'discover.html?id=banner1', emoji: '🌌' },
    { id: 'b2', title: '长夜城 · 第三章', subtitle: '新章节上线 · 共写命运', gradient: 'linear-gradient(135deg,#16213E,#1C2542)', href: 'plot-detail.html?novel=changyecheng', emoji: '🏯' },
    { id: 'b3', title: '创作者激励计划', subtitle: '灵晶奖池 10000+ · 青铜起分润', gradient: 'linear-gradient(135deg,#FFB347,#E94560)', href: 'creator-center.html', emoji: '✨' },
    { id: 'b4', title: '心屿 · 新角色', subtitle: '苏念 入驻 · 等你相识', gradient: 'linear-gradient(135deg,#6C5CE7,#A29BFE)', href: 'heart-island.html', emoji: '💬' },
    { id: 'b5', title: '红楼梦 · 灵境版', subtitle: '公版新解读 · 黛玉知己结局', gradient: 'linear-gradient(135deg,#B8863B,#8C5A2B)', href: 'plot-detail.html?novel=pd1', emoji: '📜' }
  ];

  // ---------- 分类树（10 一级 · 多人二级） ----------
  var CATEGORIES = [
    { id: 'gufeng', name: '古风', children: [
      { id: 'gonggu', name: '宫闺府宅' },
      { id: 'wangquan', name: '王权朝堂' },
      { id: 'xianxia', name: '仙侠玄幻' },
      { id: 'wuxia', name: '武侠江湖' },
      { id: 'gdshenghuo', name: '古代生活' },
      { id: 'shinong', name: '士农工商' },
      { id: 'zhuxianmianfei', name: '主线免费' }
    ]},
    { id: 'xiandai', name: '现代', children: [
      { id: 'yulequan', name: '娱乐圈' },
      { id: 'xiaoyuan', name: '校园' },
      { id: 'yuanyuzhou', name: '元宇宙电竞' },
      { id: 'hunyin', name: '婚姻家庭' },
      { id: 'xianshi', name: '现实题材' },
      { id: 'zhichang', name: '职场' },
      { id: 'haomen', name: '豪门' },
      { id: 'minguo', name: '民国' },
      { id: 'xiandaiyiwen', name: '现代异闻' },
      { id: 'xingzhen', name: '刑侦悬疑' },
      { id: 'huanxiang', name: '幻想言情' }
    ]},
    { id: 'huanxiang', name: '幻想冒险', children: [
      { id: 'datuosha', name: '大逃杀' },
      { id: 'maoxian', name: '冒险' },
      { id: 'mori', name: '末日' },
      { id: 'paotuan', name: '跑团怪谈' },
      { id: 'zainan', name: '灾难' },
      { id: 'xuanyi', name: '悬疑推理' }
    ]},
    { id: 'kuachuan', name: '快穿穿书', children: [
      { id: 'kuachuan', name: '快穿' },
      { id: 'chuanshu', name: '穿书' },
      { id: 'yishi', name: '异世玄幻' }
    ]},
    { id: 'shiguang', name: '时光档案', children: [
      { id: 'time1', name: '回到过去' },
      { id: 'time2', name: '未来幻想' },
      { id: 'time3', name: '平行时空' }
    ]},
    // PRD 9.1 R7：BTS/HP/EXO → 韩流同人/欧美同人/日系同人/影视改编
    { id: 'mingxing', name: '同人专区', children: [
      { id: 'hnt', name: '韩流同人' },
      { id: 'omt', name: '欧美同人' },
      { id: 'ri', name: '日系同人' },
      { id: 'yingxi', name: '影视改编' }
    ]},
    { id: 'guangying', name: '光影', children: [
      { id: 'dianying', name: '电影改编' },
      { id: 'dianshi', name: '电视剧改编' }
    ]},
    { id: 'chengzhang', name: '成长向', children: [
      { id: 'shaonian', name: '少年成长' },
      { id: 'qingchun', name: '青春校园' }
    ]},
    { id: 'dongren', name: '动人情感', children: [
      { id: 'aiqing', name: '爱情' },
      { id: 'youqing', name: '友情' },
      { id: 'qinqing', name: '亲情' }
    ]},
    { id: 'wanjie', name: '完结', children: [
      { id: 'wanjiequan', name: '完结全收录' }
    ]}
  ];

  // ---------- 标签配色（卡片题材 tag 用） ----------
  var TAG_COLORS = {
    '古风': '#B8863B', '现代': '#4ECCA3', '幻想冒险': '#6C5CE7',
    '快穿穿书': '#FFB347', '时光档案': '#00B894', '同人专区': '#E94560',
    '光影': '#A29BFE', '成长向': '#4ECCA3', '动人情感': '#E94560', '完结': '#00B894'
  };
  function tagColor(cat) { return TAG_COLORS[cat] || '#A0A0B0'; }

  // ---------- 30 张瀑布流 mock（按板块分区） ----------
  // FEATURED = 编辑推荐 8 张；HOT = 热门佳作 12 张；NEW_DONE = 最新完结 10 张
  var RAW = [
    // FEATURED (8)
    ['凤求凰', '云间月', '古风', 'gufeng', 'gonggu', 9.2, '12.3万字', 'ed'],
    ['长夜城', '夜归人', '古风', 'gufeng', 'wangquan', 9.0, '24.6万字', 'ed'],
    ['深海回声', '林清雪', '幻想冒险', 'huanxiang', 'xuanyi', 8.8, '18.2万字', 'ed'],
    ['快穿之攻略反派', '苏沐橙', '快穿穿书', 'kuachuan', 'kuachuan', 8.6, '16.5万字', 'ed'],
    ['锦衣卫日记', '墨倾池', '古风', 'gufeng', 'wuxia', 8.5, '21.0万字', 'ed'],
    ['回到 1998', '陆星河', '时光档案', 'shiguang', 'time1', 8.4, '15.8万字', 'ed'],
    ['仙侠奇缘录', '白无常', '古风', 'gufeng', 'xianxia', 8.3, '28.4万字', 'ed'],
    ['偶像练习手记', '栀子夏', '现代', 'xiandai', 'yulequan', 8.2, '10.2万字', 'ed'],

    // HOT (12)
    ['赛博长夜', '云雀', '现代', 'xiandai', 'yuanyuzhou', 8.6, '12.8万字', 'hot'],
    ['末日余晖', '七月的风', '幻想冒险', 'huanxiang', 'mori', 8.4, '22.6万字', 'hot'],
    ['民国旧梦', '沈书君', '现代', 'xiandai', 'minguo', 8.3, '19.5万字', 'hot'],
    ['豪门千金', '苏念', '现代', 'xiandai', 'haomen', 8.1, '13.7万字', 'hot'],
    ['刑侦档案', '燕回', '现代', 'xiandai', 'xingzhen', 8.0, '17.0万字', 'hot'],
    ['逃杀游戏', '黑桃K', '幻想冒险', 'huanxiang', 'datuosha', 7.9, '14.1万字', 'hot'],
    ['奇谭怪谈录', '柳惊鸿', '幻想冒险', 'huanxiang', 'paotuan', 7.8, '11.2万字', 'hot'],
    ['灵境红楼梦', '灵境官方', '公版同人', 'mingxing', 'yingxi', 9.4, '全文', 'hot'],
    ['英伦贵族', '清秋', '现代', 'xiandai', 'haomen', 8.7, '20.1万字', 'hot'],
    ['幻想言情', '苏沐', '现代', 'xiandai', 'huanxiang', 8.2, '9.8万字', 'hot'],
    ['校园风云', '夏目', '现代', 'xiandai', 'xiaoyuan', 7.7, '8.5万字', 'hot'],
    ['星际开拓', '铁马', '幻想冒险', 'huanxiang', 'maoxian', 8.0, '26.0万字', 'hot'],

    // NEW_DONE (10)
    ['穿成反派他娘', '木子', '快穿穿书', 'kuachuan', 'chuanshu', 8.5, '14.6万字', 'done'],
    ['公主成长录', '云深', '成长向', 'chengzhang', 'shaonian', 8.3, '11.4万字', 'done'],
    ['古代生活小记', '一树梨花', '古风', 'gufeng', 'gdshenghuo', 8.1, '9.7万字', 'done'],
    ['平行之约', '未眠', '时光档案', 'shiguang', 'time3', 8.0, '13.2万字', 'done'],
    ['职场浮沉', '老白', '现代', 'xiandai', 'zhichang', 7.9, '12.0万字', 'done'],
    ['友情万岁', '南风', '动人情感', 'dongren', 'youqing', 7.8, '7.5万字', 'done'],
    ['末日救援', '银河', '幻想冒险', 'huanxiang', 'zainan', 8.0, '18.0万字', 'done'],
    ['回到过去找你', '时予', '时光档案', 'shiguang', 'time1', 8.2, '10.6万字', 'done'],
    ['少年锦衣', '夜白', '成长向', 'chengzhang', 'shaonian', 7.7, '8.8万字', 'done'],
    ['亲情二三事', '暖阳', '动人情感', 'dongren', 'qinqing', 7.6, '6.5万字', 'done']
  ];

  // 卡片公共字段：status=新/连载中/完结；level=编推/精装/L3/L2；price=灵晶定价（0 表示免费）
  // wordCountNum 用于字数筛选；publishYear 用于年份筛选
  var META = {
    // FEATURED 8 张
    '凤求凰':       { status: 'ing',  level: 'pd',  wc: 12.3, price: 60,  year: 2026 },
    '长夜城':       { status: 'ing',  level: 'pd',  wc: 24.6, price: 128, year: 2026 },
    '深海回声':     { status: 'ing',  level: 'pd',  wc: 18.2, price: 88,  year: 2025 },
    '快穿之攻略反派': { status: 'ing', level: 'lz', wc: 16.5, price: 50,  year: 2025 },
    '锦衣卫日记':   { status: 'ing',  level: 'lz',  wc: 21.0, price: 98,  year: 2025 },
    '回到 1998':    { status: 'new',  level: 'L3',  wc: 15.8, price: 30,  year: 2026 },
    '仙侠奇缘录':   { status: 'ing',  level: 'L3',  wc: 28.4, price: 188, year: 2024 },
    '偶像练习手记': { status: 'done', level: 'L2',  wc: 10.2, price: 50,  year: 2024 },
    // HOT 12 张
    '赛博长夜':     { status: 'ing',  level: 'pd',  wc: 12.8, price: 50,  year: 2026 },
    '末日余晖':     { status: 'ing',  level: 'pd',  wc: 22.6, price: 128, year: 2026 },
    '民国旧梦':     { status: 'done', level: 'lz',  wc: 19.5, price: 88,  year: 2025 },
    '豪门千金':     { status: 'ing',  level: 'lz',  wc: 13.7, price: 60,  year: 2025 },
    '刑侦档案':     { status: 'ing',  level: 'L3',  wc: 17.0, price: 60,  year: 2025 },
    '逃杀游戏':     { status: 'ing',  level: 'L3',  wc: 14.1, price: 50,  year: 2024 },
    '奇谭怪谈录':   { status: 'new',  level: 'L2',  wc: 11.2, price: 30,  year: 2026 },
    '灵境红楼梦':   { status: 'ing',  level: 'pd',  wc: 120,  price: 0,   year: 2026 },
    '英伦贵族':     { status: 'done', level: 'L3',  wc: 20.1, price: 88,  year: 2024 },
    '幻想言情':     { status: 'ing',  level: 'L2',  wc: 9.8,  price: 30,  year: 2026 },
    '校园风云':     { status: 'done', level: 'L2',  wc: 8.5,  price: 0,   year: 2024 },
    '星际开拓':     { status: 'ing',  level: 'L3',  wc: 26.0, price: 128, year: 2025 },
    // NEW_DONE 10 张
    '穿成反派他娘': { status: 'done', level: 'pd',  wc: 14.6, price: 88,  year: 2025 },
    '公主成长录':   { status: 'done', level: 'lz',  wc: 11.4, price: 60,  year: 2024 },
    '古代生活小记': { status: 'done', level: 'L2',  wc: 9.7,  price: 30,  year: 2024 },
    '平行之约':     { status: 'done', level: 'L3',  wc: 13.2, price: 60,  year: 2025 },
    '职场浮沉':     { status: 'done', level: 'L3',  wc: 12.0, price: 50,  year: 2025 },
    '友情万岁':     { status: 'done', level: 'L2',  wc: 7.5,  price: 0,   year: 2024 },
    '末日救援':     { status: 'done', level: 'pd',  wc: 18.0, price: 88,  year: 2025 },
    '回到过去找你': { status: 'done', level: 'L3',  wc: 10.6, price: 30,  year: 2024 },
    '少年锦衣':     { status: 'done', level: 'L2',  wc: 8.8,  price: 0,   year: 2024 },
    '亲情二三事':   { status: 'done', level: 'L2',  wc: 6.5,  price: 0,   year: 2024 }
  };

  function toCard(row, idx) {
    var palette = [
      'linear-gradient(160deg,#2E3A6E,#4A3A8C)',
      'linear-gradient(160deg,#5E2E3A,#E94560)',
      'linear-gradient(160deg,#2E5E56,#00B894)',
      'linear-gradient(160deg,#8E5BD8,#C95B9C)',
      'linear-gradient(160deg,#3A2E5E,#6C5CE7)',
      'linear-gradient(160deg,#5A6B8E,#C95B9C)',
      'linear-gradient(160deg,#B8863B,#8C5A2B)',
      'linear-gradient(160deg,#1C2542,#6C5CE7)'
    ];
    var emojiPool = ['🌸','🏯','🌌','⚡','🌙','🎭','🗡','🌊','🦋','📜','🪄','🎪','🧭','💫','🌿','🐉'];
    var meta = META[row[0]] || { status: 'ing', level: 'L3', wc: 10, price: 30, year: 2026 };
    return {
      id: 'w' + (idx + 1),
      title: row[0],
      author: row[1],
      catName: row[2],
      cat: row[3],
      sub: row[4],
      score: row[5],
      wordCount: row[6],
      board: row[7],
      cov: palette[idx % palette.length],
      emoji: emojiPool[idx % emojiPool.length],
      isNew: meta.status === 'new',
      isDone: meta.status === 'done' || row[7] === 'done',
      isPublicDomain: row[3] === 'mingxing',
      // 5 维筛选字段（V17.0 §2.6）
      status: meta.status,
      level: meta.level,
      wc: meta.wc,
      price: meta.price,
      year: meta.year
    };
  }

  var FEATURED = []; var HOT = []; var NEW_DONE = [];
  RAW.forEach(function (r, i) {
    var c = toCard(r, i);
    if (c.board === 'ed') FEATURED.push(c);
    else if (c.board === 'hot') HOT.push(c);
    else if (c.board === 'done') NEW_DONE.push(c);
  });

  // ---------- 同人区 10 张（公版作品 · 灵境专属术语） ----------
  var PUBLIC_DOMAIN = [
    { id: 'pd1', title: '灵境版红楼梦', author: '灵境官方', catName: '公版同人', cat: 'mingxing', sub: 'yingxi', score: 9.4, wordCount: '全文', cov: 'linear-gradient(160deg,#B8863B,#8C5A2B)', emoji: '📜', desc: '灵境解读 · 黛玉知己结局', publicDomain: true },
    { id: 'pd2', title: '灵境解读三国', author: '灵境官方', catName: '公版同人', cat: 'mingxing', sub: 'yingxi', score: 9.2, wordCount: '全文', cov: 'linear-gradient(160deg,#5E2E3A,#B8863B)', emoji: '⚔️', desc: '穿越成吕布，改写三国命运', publicDomain: true },
    { id: 'pd3', title: '灵境西游漫记', author: '灵境官方', catName: '公版同人', cat: 'mingxing', sub: 'yingxi', score: 9.0, wordCount: '全文', cov: 'linear-gradient(160deg,#2E5E56,#00B894)', emoji: '🐒', desc: '唐僧师徒 · 重走取经路', publicDomain: true },
    { id: 'pd4', title: '水浒群英', author: '灵境官方', catName: '公版同人', cat: 'mingxing', sub: 'yingxi', score: 8.8, wordCount: '全文', cov: 'linear-gradient(160deg,#1C2542,#E94560)', emoji: '🍶', desc: '梁山好汉 · 替天行道', publicDomain: true },
    { id: 'pd5', title: '聊斋夜话', author: '灵境官方', catName: '公版同人', cat: 'mingxing', sub: 'yingxi', score: 9.1, wordCount: '全文', cov: 'linear-gradient(160deg,#3A2E5E,#6C5CE7)', emoji: '🦊', desc: '鬼狐花妖 · 人间百态', publicDomain: true },
    { id: 'pd6', title: '韩流同人志', author: '梦工厂', catName: '公版同人', cat: 'mingxing', sub: 'hnt', score: 8.4, wordCount: '6.2万字', cov: 'linear-gradient(160deg,#8E5BD8,#C95B9C)', emoji: '🎤', desc: '韩流偶像 · 同人短篇集', publicDomain: false },
    { id: 'pd7', title: '欧美同人志', author: '梧桐', catName: '公版同人', cat: 'mingxing', sub: 'omt', score: 8.3, wordCount: '5.8万字', cov: 'linear-gradient(160deg,#5A6B8E,#C95B9C)', emoji: '🎬', desc: '欧美剧集 · 同人衍生', publicDomain: false },
    { id: 'pd8', title: '日系校园志', author: '千鸟', catName: '公版同人', cat: 'mingxing', sub: 'ri', score: 8.1, wordCount: '4.3万字', cov: 'linear-gradient(160deg,#B8863B,#4ECCA3)', emoji: '🌸', desc: '日系校园 · 社团日常', publicDomain: false },
    { id: 'pd9', title: '影视改编：长歌行', author: '灵境官方', catName: '公版同人', cat: 'mingxing', sub: 'yingxi', score: 8.7, wordCount: '12.5万字', cov: 'linear-gradient(160deg,#2E3A6E,#E94560)', emoji: '🎞', desc: '经典古装剧 · 同人续写', publicDomain: false },
    { id: 'pd10', title: '影视改编：琅琊', author: '灵境官方', catName: '公版同人', cat: 'mingxing', sub: 'yingxi', score: 8.9, wordCount: '15.2万字', cov: 'linear-gradient(160deg,#5E2E3A,#6C5CE7)', emoji: '🎭', desc: '权谋古装剧 · 同人续写', publicDomain: false }
  ];

  // ---------- 顶部排序：本周灵韵 / 本周人气 ----------
  var SORTS = [
    { id: 'ly', name: '本周灵韵' },
    { id: 'rq', name: '本周人气' }
  ];

  // ---------- 5 维筛选条件（V17.0 §2.6）----------
  var FILTERS = {
    status: [
      { id: 'all',   name: '不限' },
      { id: 'new',   name: '新作' },
      { id: 'ing',   name: '连载中' },
      { id: 'done',  name: '完结' }
    ],
    level: [
      { id: 'all',   name: '不限' },
      { id: 'pd',    name: '编推' },
      { id: 'lz',    name: '精装' },
      { id: 'L3',    name: 'L3' },
      { id: 'L2',    name: 'L2' }
    ],
    words: [
      { id: 'all',     name: '不限' },
      { id: 'short',   name: '短（3 万以下）' },
      { id: 'mid',     name: '中（3-8 万）' },
      { id: 'long',    name: '长（8 万以上）' }
    ],
    price: [
      { id: 'all',     name: '不限' },
      { id: 'p0',      name: '50 灵晶以内' },
      { id: 'p1',      name: '51-100 灵晶' },
      { id: 'p2',      name: '101-200 灵晶' }
    ],
    year: [
      { id: 'all',     name: '不限' },
      { id: '2026',    name: '2026' },
      { id: '2025',    name: '2025' },
      { id: '2024',    name: '2024' }
    ]
  };

  // ---------- 更新日历（V17.0 §2.3 四大金刚-更新日历）----------
  // 7 天内的更新作品
  var CALENDAR = [
    { date: '09-11', label: '今天', works: ['凤求凰 · 第 24 章 · 后宫风云', '长夜城 · 第 31 章 · 御书房对弈'] },
    { date: '09-10', label: '昨天', works: ['深海回声 · 第 18 章 · 实验室', '回到 1998 · 第 12 章 · 重逢'] },
    { date: '09-09', label: '前天', works: ['锦衣卫日记 · 第 22 章 · 围剿'] },
    { date: '09-08', label: '本周', works: ['赛博长夜 · 第 14 章 · AI 觉醒', '末日余晖 · 第 27 章 · 曙光'] },
    { date: '09-07', label: '本周', works: ['灵境红楼梦 · 新解读上线', '灵境解读三国 · 第二季开启'] },
    { date: '09-06', label: '更早', works: ['快穿之攻略反派 · 第 9 章 · 反派逆袭'] }
  ];

  window.WORLD_DATA = {
    BANNERS: BANNERS,
    CATEGORIES: CATEGORIES,
    FEATURED: FEATURED,
    HOT: HOT,
    NEW_DONE: NEW_DONE,
    PUBLIC_DOMAIN: PUBLIC_DOMAIN,
    SORTS: SORTS,
    FILTERS: FILTERS,
    CALENDAR: CALENDAR,
    tagColor: tagColor
  };
})();