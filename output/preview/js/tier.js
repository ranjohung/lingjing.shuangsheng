/* V17-G 创作者分成阶梯
 * - 5 档：L1 青铜 50% / L2 白银 60% / L3 黄金 70% / L4 钻石 75% / L5 传奇 80%
 * - 升级检测：基于用户当前流水 / 字数 / 评分 / 月数
 * - 公开 API：LJTier.{getAll, getCurrent, calcTier, getProgress, calcShare, formatThreshold}
 * - 兼容：db.js creator_tiers 表为空时回退到内置 5 档
 */
window.LJTier = (function () {
  'use strict';

  // 内置 fallback（DB 不可用时）
  var FALLBACK_TIERS = [
    { tier_code: 'L1', tier_name: '青铜创作者', tier_emoji: '🥉', share_ratio: 50,
      threshold_revenue: 0, threshold_word_count: 0, threshold_rating: 0, threshold_months: 0,
      threshold_other: '注册创作者 + 发布 1 部作品',
      privileges: '平台基础曝光 / 收益结算 / 社区基础权限',
      obligations: '遵守平台创作规范 / 不得违规发布',
      evaluation_period: '即时' },
    { tier_code: 'L2', tier_name: '白银创作者', tier_emoji: '🥈', share_ratio: 60,
      threshold_revenue: 50000, threshold_word_count: 80000, threshold_rating: 7.5, threshold_months: 0,
      threshold_other: '累计流水 ≥ 500 元 + 完本或稳定连载',
      privileges: '优先客服 / 作品专题页推荐 / 数据看板',
      obligations: '保持稳定更新（每月 ≥ 1 万字）/ 不得断更超过 14 天',
      evaluation_period: '每月 1 日' },
    { tier_code: 'L3', tier_name: '黄金创作者', tier_emoji: '🥇', share_ratio: 70,
      threshold_revenue: 200000, threshold_word_count: 150000, threshold_rating: 8.0, threshold_months: 0,
      threshold_other: '月流水 ≥ 2000 元 + 评分 ≥ 8.0 + 独家发布',
      privileges: '首页推荐位 / 专属编辑对接 / 灵玉月福利',
      obligations: '独家发布 / 不得在竞品平台同步更新 / 配合平台活动',
      evaluation_period: '每月 1 日 + 季度复评' },
    { tier_code: 'L4', tier_name: '钻石创作者', tier_emoji: '💎', share_ratio: 75,
      threshold_revenue: 500000, threshold_word_count: 300000, threshold_rating: 8.5, threshold_months: 3,
      threshold_other: '稳定更新 3 个月 + 阅读时长 ≥ 30 分钟 + 无违规',
      privileges: '创作者沙龙 / 改编优先权 / 灵晶季度大奖 / VIP 客服',
      obligations: '稳定更新 3 个月 / 阅读均时长 ≥ 30 分钟 / 严格零违规',
      evaluation_period: '每月 1 日 + 季度复评 + 年度签约' },
    { tier_code: 'L5', tier_name: '传奇创作者', tier_emoji: '🏆', share_ratio: 80,
      threshold_revenue: 1000000, threshold_word_count: 500000, threshold_rating: 9.0, threshold_months: 6,
      threshold_other: '平台主动签约 + 独家 + 月更新 ≥ 5 万字 + 完本承诺 + 版权授权清晰',
      privileges: '保底收入 / 影视改编直通 / IP 孵化 / 年度盛典席位',
      obligations: '月更新 ≥ 5 万字 / 完本承诺 / 配合平台运营 / 版权授权清晰',
      evaluation_period: '年度签约评审' }
  ];

  function getAll() {
    try {
      if (window.DB && window.DB.tiers && window.DB.tiers.list().length) {
        return window.DB.tiers.list();
      }
    } catch (e) {}
    return FALLBACK_TIERS.slice();
  }

  function getByCode(code) {
    var all = getAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].tier_code === code) return all[i];
    }
    return all[0];
  }

  // 根据创作者数据计算应该所在档位
  function calcTier(metrics) {
    // metrics: { totalRevenue, totalWords, avgRating, stableMonths, hasExclusive, hasViolation }
    metrics = metrics || {};
    var all = getAll();
    var matched = all[0]; // 至少 L1
    for (var i = 0; i < all.length; i++) {
      var t = all[i];
      var ok = true;
      if (metrics.totalRevenue != null && t.threshold_revenue > 0 && metrics.totalRevenue < t.threshold_revenue) ok = false;
      if (metrics.totalWords != null && t.threshold_word_count > 0 && metrics.totalWords < t.threshold_word_count) ok = false;
      if (metrics.avgRating != null && t.threshold_rating > 0 && metrics.avgRating < t.threshold_rating) ok = false;
      if (metrics.stableMonths != null && t.threshold_months > 0 && metrics.stableMonths < t.threshold_months) ok = false;
      if (metrics.hasViolation && t.tier_code !== 'L1') ok = false; // 违规不能升级（L1 除外）
      if (ok) matched = t;
    }
    return matched;
  }

  // 计算升级进度（0-100）
  function getProgress(currentTierCode, metrics) {
    metrics = metrics || {};
    var all = getAll();
    var currentIdx = 0;
    for (var i = 0; i < all.length; i++) {
      if (all[i].tier_code === currentTierCode) { currentIdx = i; break; }
    }
    if (currentIdx >= all.length - 1) return 100; // 顶级

    var current = all[currentIdx];
    var next = all[currentIdx + 1];
    var dimensions = [];
    if (next.threshold_revenue > 0) {
      dimensions.push({ name: '累计流水', cur: metrics.totalRevenue || 0, target: next.threshold_revenue, unit: '元' });
    }
    if (next.threshold_word_count > 0) {
      dimensions.push({ name: '累计字数', cur: metrics.totalWords || 0, target: next.threshold_word_count, unit: '字' });
    }
    if (next.threshold_rating > 0) {
      dimensions.push({ name: '平均评分', cur: metrics.avgRating || 0, target: next.threshold_rating, unit: '分' });
    }
    if (next.threshold_months > 0) {
      dimensions.push({ name: '稳定更新', cur: metrics.stableMonths || 0, target: next.threshold_months, unit: '月' });
    }
    if (dimensions.length === 0) return 100;

    var sum = 0;
    for (var j = 0; j < dimensions.length; j++) {
      var d = dimensions[j];
      sum += Math.min(1, d.cur / d.target);
    }
    return Math.round((sum / dimensions.length) * 100);
  }

  // 格式化门槛（用于 UI 展示）
  function formatThreshold(tier) {
    var parts = [];
    if (tier.threshold_revenue > 0) parts.push('累计流水 ≥ ' + (tier.threshold_revenue / 100) + ' 元');
    if (tier.threshold_word_count > 0) parts.push('字数 ≥ ' + (tier.threshold_word_count / 10000) + ' 万字');
    if (tier.threshold_rating > 0) parts.push('评分 ≥ ' + tier.threshold_rating);
    if (tier.threshold_months > 0) parts.push('稳定更新 ≥ ' + tier.threshold_months + ' 月');
    if (tier.threshold_other) parts.push(tier.threshold_other);
    return parts.length ? parts.join(' + ') : '即时（注册即生效）';
  }

  // 计算分成金额
  function calcShare(grossAmount, tierCode) {
    var tier = getByCode(tierCode);
    var creatorShare = Math.round(grossAmount * (tier.share_ratio / 100));
    var platformShare = grossAmount - creatorShare;
    return {
      tier: tier,
      gross: grossAmount,
      creator: creatorShare,
      platform: platformShare,
        ratio: tier.share_ratio + '%'
    };
  }

  return {
    getAll: getAll,
    getByCode: getByCode,
    getCurrent: calcTier,
    calcTier: calcTier,
    getProgress: getProgress,
    formatThreshold: formatThreshold,
    calcShare: calcShare,
    FALLBACK_TIERS: FALLBACK_TIERS
  };
})();