/* =================================================================
 * 灵境 · 双生 V18.0 — 经济体系文案 + 5 档充值 + 福利列表
 * 数据源：window.ECONOMY.{LANG_REPLACE, RECHARGE_TIERS, FEATURED_WORKS}
 * 红线执行：全文零第三方平台文案
 * ================================================================= */
(function () {
  'use strict';
  if (window.ECONOMY) return;

  // ---------- 旧名词 → 灵境术语 清洗替换（红线机制）----------
  // 用法：LANG_REPLACE.forEach(r => text = text.replace(r.from, r.to));
  var LANG_REPLACE = [
    { from: '丸子', to: '灵韵' },
    { from: '橙心推', to: '心屿推' },
    { from: '橙子', to: '灵晶' },
    { from: '鲜花', to: '灵花' },
    { from: '推荐官', to: '引路人' },
    { from: '每周最佳', to: '每周回响' },
    { from: '创作比赛', to: '创世杯' },
    { from: '官方交流群', to: '同频共振群' },
    { from: '橙光殿堂', to: '灵境殿堂' },
    { from: '作品徽章', to: '灵纹' },
    { from: '橙光', to: '灵境' }
  ];
  function purify(text) {
    if (!text) return text;
    LANG_REPLACE.forEach(function (r) {
      text = text.split(r.from).join(r.to);
    });
    return text;
  }

  // ---------- 5 档充值（V12.0 第三红线）----------
  var RECHARGE_TIERS = [
    { amount: 6, name: '首充档', lingJing: 600, lingYu: 200, extra: '' },
    { amount: 18, name: '月卡档', lingJing: 1800, lingYu: 600, extra: '+ 专属灵纹' },
    { amount: 58, name: '星卡档', lingJing: 5800, lingYu: 2000, extra: '+ 限定头像框' },
    { amount: 128, name: '超值档', lingJing: 12800, lingYu: 5000, extra: '+ 灵境殿堂周榜' },
    { amount: 328, name: '至尊档', lingJing: 32800, lingYu: 12000, extra: '+ 同频共振群 + 限定世界' }
  ];

  // ---------- 限免广场（mock · 仅使用已上架公版名著，无第三方作品名）----------
  var FREE_WORKS = [
    { id: 'fw1', title: '西游记', author: '公版', cat: '神魔', tag: '灵玉领', cov: 'linear-gradient(160deg,#8E5BD8,#C95B9C)' },
    { id: 'fw2', title: '三国演义', author: '公版', cat: '历史', tag: '灵玉领', cov: 'linear-gradient(160deg,#B8863B,#4ECCA3)' },
    { id: 'fw3', title: '红楼梦', author: '公版', cat: '世情', tag: '灵玉领', cov: 'linear-gradient(160deg,#E94560,#C95B9C)' }
  ];

  // ---------- 心屿推（V12.0 3.2 · 仅公版名著/占位用户）----------
  var XINYU_TUI = {
    weeklyEcho: [
      { user: '灵境书友', avatar: '📖', workTitle: '《西游记》', review: '花果山、水帘洞读来如临其境，公版重制太适合二刷了。' },
      { user: '公版引路人', avatar: '🏮', workTitle: '《三国演义》', review: '群雄逐鹿的转折写得紧凑，人物关系图很方便。' }
    ],
    yinluRank: [
      { rank: 1, user: '灵境书友', avatar: '📖', title: '引路人·连续 4 周', score: 2840 },
      { rank: 2, user: '公版引路人', avatar: '🏮', title: '引路人·连续 2 周', score: 2120 },
      { rank: 3, user: '新晋引路人', avatar: '🌺', title: '新晋引路人', score: 1680 }
    ],
    moreRecommend: [
      { id: 'mr1', workTitle: '《红楼梦》', review: '世情细节丰富，公版角色线梳理得很清楚。', likes: 248 },
      { id: 'mr2', workTitle: '《水浒传》', review: '一百零八将关系图谱一目了然，适合入坑。', likes: 192 }
    ]
  };

  // ---------- 创世杯（V12.0 3.4 · 活动真实存在，榜单示例仅列公版名著）----------
  var CHUANGSHIBEI = {
    banner: '2026 灵境·双生 创世杯',
    period: '9.10 - 10.09',
    rank: [
      { rank: 1, workTitle: '《西游记》', author: '公版', score: 4520, cov: 'linear-gradient(160deg,#8E5BD8,#C95B9C)' },
      { rank: 2, workTitle: '《三国演义》', author: '公版', score: 4180, cov: 'linear-gradient(160deg,#2E3A6E,#4A3A8C)' },
      { rank: 3, workTitle: '《红楼梦》', author: '公版', score: 3960, cov: 'linear-gradient(160deg,#2E5E56,#00B894)' },
      { rank: 4, workTitle: '《水浒传》', author: '公版', score: 3580, cov: 'linear-gradient(160deg,#B8863B,#8C5A2B)' }
    ]
  };

  window.ECONOMY = {
    LANG_REPLACE: LANG_REPLACE,
    purify: purify,
    RECHARGE_TIERS: RECHARGE_TIERS,
    FREE_WORKS: FREE_WORKS,
    XINYU_TUI: XINYU_TUI,
    CHUANGSHIBEI: CHUANGSHIBEI
  };
})();