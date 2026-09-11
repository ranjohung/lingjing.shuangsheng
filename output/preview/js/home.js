/* =================================================================
 * 灵境 · 双生 V18.0 — 首页数据注入（问候语/签到/4 板块）
 * 暴露：window.LJHome.{greet, renderSignin, renderQuick, renderRecommend}
 * ================================================================= */
(function () {
  'use strict';
  if (window.LJHome && window.LJHome.__mounted) return;

  // ---------- 时段问候 ----------
  function greet() {
    var h = new Date().getHours();
    if (h >= 5 && h < 11) return '🌅 早上好';
    if (h >= 11 && h < 14) return '☀️ 中午好';
    if (h >= 14 && h < 18) return '🌤 下午好';
    if (h >= 18 && h < 23) return '🌙 晚上好';
    return '🌌 夜深了';
  }

  // ---------- 用户余额（mock） ----------
  function getUser() {
    try {
      var raw = localStorage.getItem('lingjing_v5170_user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var fresh = { nickname: '旅人', lingJing: 1280, lingYu: 360, avatar: '👤' };
    try { localStorage.setItem('lingjing_v5170_user', JSON.stringify(fresh)); } catch (e) {}
    return fresh;
  }

  // ---------- 签到状态 ----------
  var SIGN_REWARDS = [4, 4, 6, 8, 10, 12, 25]; // 7 天递增
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function getSigninLog() {
    try {
      var raw = localStorage.getItem('lingjing_v5170_signin_log');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { lastDate: '', streak: 0, totalEarned: 0 };
  }
  function setSigninLog(log) {
    try { localStorage.setItem('lingjing_v5170_signin_log', JSON.stringify(log)); } catch (e) {}
  }
  function isSignedToday() {
    var log = getSigninLog();
    return log.lastDate === todayKey();
  }
  function doSignin() {
    var log = getSigninLog();
    if (log.lastDate === todayKey()) return { ok: false, reason: 'already' };
    // 计算连续天数
    var y = new Date();
    y.setDate(y.getDate() - 1);
    var yKey = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    log.streak = (log.lastDate === yKey) ? (log.streak + 1) : 1;
    if (log.streak > 7) log.streak = 1;
    var reward = SIGN_REWARDS[log.streak - 1];
    log.totalEarned = (log.totalEarned || 0) + reward;
    log.lastDate = todayKey();
    setSigninLog(log);
    // 增加灵晶
    var user = getUser();
    user.lingJing = (user.lingJing || 0) + reward;
    try { localStorage.setItem('lingjing_v5170_user', JSON.stringify(user)); } catch (e) {}
    return { ok: true, streak: log.streak, reward: reward };
  }

  function renderSignin(container) {
    if (!container) return;
    var log = getSigninLog();
    var signed = isSignedToday();
    var tomorrowReward = SIGN_REWARDS[(log.streak >= 7 ? 0 : log.streak)];
    if (!signed) {
      container.innerHTML =
        '<div class="signin-card">' +
        '<span class="sc-emoji">🎁</span>' +
        '<div class="sc-body">' +
        '<div class="sc-title">今日未签到</div>' +
        '<div class="sc-sub">连续签到第 ' + (log.streak || 0) + ' 天，明天可领 ' + tomorrowReward + ' 灵晶</div>' +
        '</div>' +
        '<button class="sc-btn" id="signin-btn">立即签到</button>' +
        '</div>';
      var btn = document.getElementById('signin-btn');
      if (btn) btn.addEventListener('click', function () {
        var r = doSignin();
        if (r.ok) {
          renderSignin(container);
          if (window.LJToast) window.LJToast.show('ok', '签到成功', '+' + r.reward + ' 灵晶 · 连续 ' + r.streak + ' 天');
        }
      });
    } else {
      container.innerHTML =
        '<div class="signin-card signed">' +
        '<span class="sc-emoji">✅</span>' +
        '<div class="sc-body">' +
        '<div class="sc-title">今日已签到 · 明天再来</div>' +
        '<div class="sc-sub">连续第 ' + log.streak + ' 天，本周累计已领 ' + (log.totalEarned || 0) + ' 灵晶</div>' +
        '</div>' +
        '<span class="sc-status">已签到</span>' +
        '</div>';
    }
  }

  // ---------- 4 快捷入口 ----------
  var QUICK_ENTRIES = [
    { ico: '📖', label: '继续阅读', sub: '上次未读完', href: 'output/preview/library.html' },
    { ico: '💬', label: '陪伴', sub: '心屿角色列表', href: 'output/preview/heart-island.html#accompany' },
    { ico: '✨', label: '创作', sub: '创作中心', href: 'output/preview/creator-center.html' },
    { ico: '🎁', label: '每日福利', sub: '领灵玉/灵晶', href: 'output/preview/library.html?sub=welfare' }
  ];
  function renderQuick(container) {
    if (!container) return;
    container.innerHTML = '';
    QUICK_ENTRIES.forEach(function (q) {
      var a = document.createElement('a');
      a.className = 'home-quick-item';
      a.href = q.href;
      a.innerHTML =
        '<span class="hq-ico">' + q.ico + '</span>' +
        '<span class="hq-label">' + q.label + '</span>' +
        '<span class="hq-sub">' + q.sub + '</span>';
      container.appendChild(a);
    });
  }

  // ---------- 4 推荐板块 ----------
  // 今日推荐：从 world-data.js 复用（2 张卡片）
  var TODAY_RECOMMEND = [
    { id: 'w1', title: '长夜城', author: '夜归人', cat: '古风', score: 9.0, desc: '权谋古风 · 24.6万字', cov: 'linear-gradient(160deg,#2E3A6E,#4A3A8C)', emoji: '🏯' },
    { id: 'w2', title: '三国 · 吕布篇', author: '灵境官方', cat: '古风', score: 9.2, desc: '穿越成吕布，改写三国命运', cov: 'linear-gradient(160deg,#B8863B,#8C5A2B)', emoji: '⚔️' },
    { id: 'w3', title: '深海回声', author: '林清雪', cat: '悬疑', score: 8.8, desc: '悬疑 · 18.2万字 · 共写命运', cov: 'linear-gradient(160deg,#2E5E56,#00B894)', emoji: '🌊' }
  ];

  // 陪伴动态（来自心屿角色最近消息）
  var COMPANION_FEED = [
    { name: '林清雪', avatar: '🌸', text: '今天路过一家花店，想起你说喜欢向日葵。', time: '2小时前' },
    { name: '苏晚', avatar: '🌙', text: '你来了。我刚好泡了茶，要不要一起喝？', time: '5小时前' },
    { name: '阿岁', avatar: '🏮', text: '今晚月色很好，要不要一起去走走？', time: '昨天' }
  ];

  // 世界更新
  var WORLD_UPDATE = [
    { title: '《赛博长夜》', chapter: '更新至第12章', author: '云雀', time: '30分钟前', cov: 'linear-gradient(160deg,#5A6B8E,#C95B9C)' },
    { title: '《长夜城》', chapter: '更新至第5章', author: '夜归人', time: '2小时前', cov: 'linear-gradient(160deg,#2E3A6E,#4A3A8C)' },
    { title: '《快穿之攻略反派》', chapter: '更新至第8章', author: '苏沐橙', time: '今天', cov: 'linear-gradient(160deg,#8E5BD8,#C95B9C)' }
  ];

  // 热门活动
  var HOT_ACTIVITY = [
    { ico: '🏆', title: '2026 灵境·双生 创世杯', desc: '正在进行中 · 参赛作品已有 128 部', tag: '进行中' },
    { ico: '🎁', title: '中秋福利月', desc: '完成充值任务，免费领取限定世界', tag: '活动' },
    { ico: '💎', title: '灵玉每日领取', desc: '每日签到 + 任务可领 200 灵玉', tag: '日常' }
  ];

  function renderRecommend(container) {
    if (!container) return;
    var html = '';

    // 板块 1：今日推荐
    html += '<section class="home-board"><div class="home-board-head"><h3>今日推荐</h3><a class="home-board-more" href="output/preview/library.html">全部 ›</a></div>';
    html += '<div class="home-grid-2">';
    TODAY_RECOMMEND.slice(0, 3).forEach(function (w) {
      html +=
        '<a class="home-rec-card" href="output/preview/discover.html?id=' + w.id + '">' +
        '<div class="hr-cov" style="background:' + w.cov + '"><span class="hr-emoji">' + w.emoji + '</span></div>' +
        '<div class="hr-body">' +
        '<div class="hr-title">' + w.title + '</div>' +
        '<div class="hr-cat">' + w.cat + '</div>' +
        '<div class="hr-meta"><span class="hr-score">⭐ ' + w.score.toFixed(1) + '</span><span class="hr-wc">' + w.desc + '</span></div>' +
        '</div></a>';
    });
    html += '</div></section>';

    // 板块 2：陪伴动态
    html += '<section class="home-board"><div class="home-board-head"><h3>陪伴动态</h3><a class="home-board-more" href="output/preview/heart-island.html#accompany">全部 ›</a></div>';
    html += '<div class="home-feed">';
    COMPANION_FEED.forEach(function (c) {
      html +=
        '<a class="home-feed-item" href="output/preview/heart-island.html#accompany">' +
        '<span class="hf-avatar">' + c.avatar + '</span>' +
        '<div class="hf-body">' +
        '<div class="hf-name">' + c.name + '</div>' +
        '<div class="hf-text">' + c.text + '</div>' +
        '</div>' +
        '<span class="hf-time">' + c.time + '</span>' +
        '</a>';
    });
    html += '</div></section>';

    // 板块 3：世界更新
    html += '<section class="home-board"><div class="home-board-head"><h3>世界更新</h3><a class="home-board-more" href="output/preview/library.html">全部 ›</a></div>';
    html += '<div class="home-update-list">';
    WORLD_UPDATE.forEach(function (u) {
      html +=
        '<a class="home-update-item" href="output/preview/discover.html">' +
        '<div class="hu-cov-mini" style="background:' + u.cov + '"></div>' +
        '<div class="hu-body">' +
        '<div class="hu-title">' + u.title + '<span class="hu-tag">更新</span></div>' +
        '<div class="hu-meta">' + u.chapter + ' · ' + u.author + ' · ' + u.time + '</div>' +
        '</div></a>';
    });
    html += '</div></section>';

    // 板块 4：热门活动
    html += '<section class="home-board"><div class="home-board-head"><h3>热门活动</h3><a class="home-board-more" href="output/preview/library.html?sub=welfare">全部 ›</a></div>';
    html += '<div class="home-activity-list">';
    HOT_ACTIVITY.forEach(function (a) {
      html +=
        '<a class="home-activity-item" href="output/preview/library.html?sub=welfare">' +
        '<span class="ha-ico">' + a.ico + '</span>' +
        '<div class="ha-body">' +
        '<div class="ha-title">' + a.title + '<span class="ha-tag">' + a.tag + '</span></div>' +
        '<div class="ha-desc">' + a.desc + '</div>' +
        '</div></a>';
    });
    html += '</div></section>';

    container.innerHTML = html;
  }

  // ---------- 顶部状态栏 ----------
  function renderStatus(container) {
    if (!container) return;
    var u = getUser();
    container.innerHTML =
      '<div class="hs-left">' +
      '<span class="hs-avatar">' + u.avatar + '</span>' +
      '<span class="hs-greet">' + greet() + '，<b>' + u.nickname + '</b></span>' +
      '</div>' +
      '<div class="hs-right">' +
      '<button class="hs-bell" title="通知" onclick="if(window.LJToast)window.LJToast.show(\'warn\',\'3 条未读\',\'通知中心即将开放\')">🔔<span class="badge">3</span></button>' +
      '<a class="hs-wallet" href="output/preview/wallet.html" title="钱包">' +
      '<span class="hs-lj">💎 ' + u.lingJing + '</span>' +
      '<span class="hs-ly">🌙 ' + u.lingYu + '</span>' +
      '</a>' +
      '</div>';
  }

  window.LJHome = {
    greet: greet,
    renderSignin: renderSignin,
    renderQuick: renderQuick,
    renderRecommend: renderRecommend,
    renderStatus: renderStatus,
    getUser: getUser,
    doSignin: doSignin,
    SIGN_REWARDS: SIGN_REWARDS,
    __mounted: true
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderStatus(document.getElementById('home-status'));
      renderSignin(document.getElementById('home-signin'));
      renderQuick(document.getElementById('home-quick'));
      renderRecommend(document.getElementById('home-recommend'));
    });
  } else {
    renderStatus(document.getElementById('home-status'));
    renderSignin(document.getElementById('home-signin'));
    renderQuick(document.getElementById('home-quick'));
    renderRecommend(document.getElementById('home-recommend'));
  }
})();