/* =================================================================
 * 灵境 · 双生 V18.0 — 经济体系文案 + 5 档充值 + 福利列表
 * 数据源：window.ECONOMY.{LANG_REPLACE, RECHARGE_TIERS, FEATURED_WORKS}
 * V12.0 严格执行：全文零橙光文案
 * ================================================================= */
(function () {
  'use strict';
  if (window.ECONOMY) return;

  // ---------- 橙光→灵境 名词替换（V12.0 第二红线）----------
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

  // ---------- 限免广场（mock）----------
  var FREE_WORKS = [
    { id: 'fw1', title: '凤求凰', author: '云间月', cat: '古风', tag: '灵玉领', cov: 'linear-gradient(160deg,#8E5BD8,#C95B9C)' },
    { id: 'fw2', title: '深海回声', author: '林清雪', cat: '悬疑', tag: '灵玉领', cov: 'linear-gradient(160deg,#2E5E56,#00B894)' },
    { id: 'fw3', title: '校园风云', author: '夏目', cat: '现代', tag: '灵玉领', cov: 'linear-gradient(160deg,#B8863B,#4ECCA3)' }
  ];

  // ---------- 心屿推（V12.0 3.2）----------
  var XINYU_TUI = {
    weeklyEcho: [
      { user: '顾长夜', avatar: '🌙', workTitle: '《长夜未央》', review: '每一章都有惊喜，林清雪的故事让人欲罢不能。' },
      { user: '云雀', avatar: '🌸', workTitle: '《深海回声》', review: '悬疑线铺得极好，结局的反转我反复看了三遍。' }
    ],
    yinluRank: [
      { rank: 1, user: '顾长夜', avatar: '🌙', title: '引路人·连续 4 周', score: 2840 },
      { rank: 2, user: '云雀', avatar: '🌸', title: '引路人·连续 2 周', score: 2120 },
      { rank: 3, user: '千鸟', avatar: '🌺', title: '新晋引路人', score: 1680 }
    ],
    moreRecommend: [
      { id: 'mr1', workTitle: '《凤求凰》', review: '古风爱好者必入，文笔极佳。', likes: 248 },
      { id: 'mr2', workTitle: '《三国·吕布篇》', review: '穿越剧情设计合理，不套路。', likes: 192 }
    ]
  };

  // ---------- 创世杯（V12.0 3.4）----------
  var CHUANGSHIBEI = {
    banner: '2026 灵境·双生 创世杯',
    period: '9.10 - 10.09',
    rank: [
      { rank: 1, workTitle: '《凤求凰》', author: '云间月', score: 4520, cov: 'linear-gradient(160deg,#8E5BD8,#C95B9C)' },
      { rank: 2, workTitle: '《长夜城》', author: '夜归人', score: 4180, cov: 'linear-gradient(160deg,#2E3A6E,#4A3A8C)' },
      { rank: 3, workTitle: '《深海回声》', author: '林清雪', score: 3960, cov: 'linear-gradient(160deg,#2E5E56,#00B894)' },
      { rank: 4, workTitle: '《三国·吕布篇》', author: '灵境官方', score: 3580, cov: 'linear-gradient(160deg,#B8863B,#8C5A2B)' }
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