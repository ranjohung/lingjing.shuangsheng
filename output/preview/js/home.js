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
      if (btn) btn.addEventListener('click', function (e) {
        e.stopPropagation();
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
        '<div class="sc-title">今日已签到 · 明日再来</div>' +
        '<div class="sc-sub">连续第 ' + log.streak + ' 天，本周累计已领 ' + (log.totalEarned || 0) + ' 灵晶</div>' +
        '</div>' +
        '<span class="sc-status">已签到</span>' +
        '</div>';
    }
    // V20-L 设计文档 §2.2：点击签到卡片 → 完整签到界面
    var card = container.querySelector('.signin-card');
    if (card) card.addEventListener('click', function () { openSigninCenter(); });
  }

  // ---------- 完整签到界面（V20-L 设计文档 §2.2：7 天签到 + 看视频领灵晶 + 4 快捷入口） ----------
  function openSigninCenter() {
    var old = document.getElementById('lj-signin-center');
    if (old) old.remove();
    var log = getSigninLog();
    var signed = isSignedToday();
    var days = ['一', '二', '三', '四', '五', '六', '日'];
    var cells = '';
    for (var i = 0; i < 7; i++) {
      var reached = log.streak > i || (log.streak === 0 && false);
      var isToday = (log.streak === i + 1) && signed;
      cells +=
        '<div class="sc-day-cell' + (isToday ? ' today' : (reached ? ' done' : '')) + '">' +
        '<div class="sc-day-lbl">第' + days[i] + '天</div>' +
        '<div class="sc-day-emoji">' + (reached || isToday ? '💎' : '·') + '</div>' +
        '<div class="sc-day-val">' + SIGN_REWARDS[i] + '</div>' +
        '</div>';
    }
    var quickLinks = [
      { ico: '📖', label: '继续阅读', href: 'output/preview/library.html' },
      { ico: '💬', label: '陪伴', href: 'output/preview/heart-island.html#accompany' },
      { ico: '✨', label: '创作', href: 'output/preview/creator-center.html' },
      { ico: '🎁', label: '每日福利', href: 'output/preview/library.html?sub=welfare' }
    ];
    var quickHtml = quickLinks.map(function (q) {
      return '<a class="sc-quick-item" href="' + q.href + '"><span class="sq-ico">' + q.ico + '</span><span class="sq-lbl">' + q.label + '</span></a>';
    }).join('');

    var mask = document.createElement('div');
    mask.id = 'lj-signin-center';
    mask.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(10,10,26,.72);display:flex;align-items:flex-end;justify-content:center;';
    var panel = document.createElement('div');
    panel.style.cssText = 'width:100%;max-width:480px;max-height:82vh;overflow-y:auto;background:#16213E;border-radius:18px 18px 0 0;padding:20px 18px 26px;';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
      '<div style="font-size:17px;font-weight:600;color:#fff">签到中心</div>' +
      '<button class="sc-close" style="width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:none;color:rgba(255,255,255,.7);font-size:14px;cursor:pointer">✕</button>' +
      '</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.55);margin-bottom:12px">连续签到 ' + log.streak + ' 天 · 本周累计已领 ' + (log.totalEarned || 0) + ' 灵晶</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:18px">' + cells + '</div>' +
      '<button id="sc-sign-btn" style="width:100%;height:44px;border-radius:12px;border:0;background:' + (signed ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#E94560,#C73652)') + ';color:' + (signed ? 'rgba(255,255,255,.5)' : '#fff') + ';font-size:15px;font-weight:600;cursor:pointer;margin-bottom:14px">' +
      (signed ? '今日已签到 · 明日再来' : '立即签到（+' + SIGN_REWARDS[Math.min(log.streak, 6)] + ' 灵晶）') + '</button>' +
      '<button id="sc-video-btn" style="width:100%;height:44px;border-radius:12px;border:1px solid rgba(255,179,71,.4);background:rgba(255,179,71,.12);color:#FFB347;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:18px">📺 看视频领灵晶（+5）</button>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:8px">快捷入口</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' + quickHtml + '</div>';
    mask.appendChild(panel);
    document.body.appendChild(mask);

    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
    panel.querySelector('.sc-close').addEventListener('click', function () { mask.remove(); });
    var signBtn = panel.querySelector('#sc-sign-btn');
    if (signBtn) signBtn.addEventListener('click', function () {
      if (isSignedToday()) return;
      var r = doSignin();
      if (r.ok) {
        mask.remove();
        renderSignin(document.getElementById('home-signin'));
        if (window.LJToast) window.LJToast.show('ok', '签到成功', '+' + r.reward + ' 灵晶 · 连续 ' + r.streak + ' 天');
      }
    });
    var videoBtn = panel.querySelector('#sc-video-btn');
    if (videoBtn) videoBtn.addEventListener('click', function () {
      var user = getUser();
      user.lingJing = (user.lingJing || 0) + 5;
      try { localStorage.setItem('lingjing_v5170_user', JSON.stringify(user)); } catch (e) {}
      renderStatus(document.getElementById('home-status'));
      if (window.LJToast) window.LJToast.show('ok', '视频奖励已到账', '+5 灵晶');
    });
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
  // 今日推荐：只使用 corpus/manifest.json 中的真实公版名著
  var TODAY_RECOMMEND = [
    { id: 'sanguoyanyi', title: '三国演义 · 小说世界', author: '罗贯中（公版）', cat: '公版名著', score: 9.6, desc: '120 回 · 沉浸式世界已生成', cov: 'linear-gradient(160deg,#6B2737,#B8863B)', emoji: '📖', href: 'world-view.html?book=sanguoyanyi' },
    { id: 'hongloumeng', title: '红楼梦 · 小说世界', author: '曹雪芹（公版）', cat: '公版名著', score: 9.4, desc: '120 回 · 大观园可探索', cov: 'linear-gradient(160deg,#B8863B,#8C5A2B)', emoji: '📜', href: 'world-view.html?book=hongloumeng' },
    { id: 'xiyouji', title: '西游记 · 小说世界', author: '吴承恩（公版）', cat: '公版名著', score: 9.5, desc: '100 回 · 花果山/天宫场景', cov: 'linear-gradient(160deg,#2E5E56,#00B894)', emoji: '🏔', href: 'world-view.html?book=xiyouji' },
    { id: 'shuihuzhuan', title: '水浒传 · 小说世界', author: '施耐庵（公版）', cat: '公版名著', score: 9.2, desc: '120 回 · 梁山好汉世界', cov: 'linear-gradient(160deg,#2E3A6E,#4A3A8C)', emoji: '🏯', href: 'world-view.html?book=shuihuzhuan' }
  ];

  // 陪伴动态（来自心屿角色最近消息 · V20-L：点击进入角色聊天）
  var COMPANION_FEED = [
    { cid: 'c06', name: '孙悟空', avatar: '🌸', text: '今天路过一家花店，想起你说喜欢向日葵。', time: '2小时前' },
    { cid: 'c01', name: '苏晚', avatar: '🌙', text: '你来了。我刚好泡了茶，要不要一起喝？', time: '5小时前' },
    { cid: 'c04', name: '阿岁', avatar: '🏮', text: '今晚月色很好，要不要一起去走走？', time: '昨天' }
  ];

  // 世界更新：只展示 corpus/manifest.json 中的真实公版名著
  var WORLD_UPDATE = [
    { id: 'xiyouji', title: '《西游记》', chapter: '世界已生成 · 12 场景 · 8 立绘 · 5 3D', author: '吴承恩（公版）', time: '刚刚', cov: 'linear-gradient(160deg,#5A6B8E,#C95B9C)', href: 'world-view.html?book=xiyouji' },
    { id: 'sanguoyanyi', title: '《三国演义》', chapter: '100 回 · 自动生成世界', author: '罗贯中（公版）', time: '今日', cov: 'linear-gradient(160deg,#6B2737,#B8863B)', href: 'world-forge.html?book=sanguoyanyi' },
    { id: 'hongloumeng', title: '《红楼梦》', chapter: '120 回 · 自动生成世界', author: '曹雪芹（公版）', time: '今日', cov: 'linear-gradient(160deg,#B8863B,#8C5A2B)', href: 'world-forge.html?book=hongloumeng' }
  ];

  // 热门活动：不再使用虚构赛事数据，改为描述真实已上线功能
  var HOT_ACTIVITY = [
    { ico: '📚', title: '公版名著世界计划', desc: '40 部公版名著已接入小说世界自动生成', tag: '已上线' },
    { ico: '🎁', title: '本地创作激励', desc: '作者上传原创小说经质检后可生成世界', tag: '活动' },
    { ico: '💎', title: '灵玉每日领取', desc: '每日签到 + 任务可领 200 灵玉', tag: '日常' }
  ];

  function renderRecommend(container) {
    if (!container) return;
    var html = '';

    // 板块 1：今日推荐
    html += '<section class="home-board"><div class="home-board-head"><h3>今日推荐</h3><a class="home-board-more" href="output/preview/library.html">全部 ›</a></div>';
    html += '<div class="home-grid-2">';
    TODAY_RECOMMEND.slice(0, 4).forEach(function (w) {
      // V20-J：推荐卡（介绍页图片）→ 详细介绍页；游玩在详情页内进入
      var wHref = w.href || ('output/preview/plot-detail.html?novel=' + w.id);
      html +=
        '<a class="home-rec-card" href="' + wHref + '">' +
        '<div class="hr-cov" style="background:' + w.cov + '"><span class="hr-emoji">' + w.emoji + '</span></div>' +
        '<div class="hr-body">' +
        '<div class="hr-title">' + w.title + '</div>' +
        '<div class="hr-cat">' + w.cat + '</div>' +
        '<div class="hr-meta"><span class="hr-score">⭐ ' + w.score.toFixed(1) + '</span><span class="hr-wc">' + w.desc + '</span></div>' +
        '</div></a>';
    });
    html += '</div></section>';

    // 板块 2：陪伴动态（V20-L 设计文档 §2.4：点击进入角色聊天）
    html += '<section class="home-board"><div class="home-board-head"><h3>陪伴动态</h3><a class="home-board-more" href="output/preview/heart-island.html#accompany">全部 ›</a></div>';
    html += '<div class="home-feed">';
    COMPANION_FEED.forEach(function (c) {
      html +=
        '<a class="home-feed-item" href="output/preview/chat.html?cid=' + c.cid + '">' +
        '<span class="hf-avatar">' + c.avatar + '</span>' +
        '<div class="hf-body">' +
        '<div class="hf-name">' + c.name + '</div>' +
        '<div class="hf-text">' + c.text + '</div>' +
        '</div>' +
        '<span class="hf-time">' + c.time + '</span>' +
        '</a>';
    });
    html += '</div></section>';

    // 板块 3：世界更新（V20-L 设计文档 §2.4：点击进入世界详情）
    html += '<section class="home-board"><div class="home-board-head"><h3>世界更新</h3><a class="home-board-more" href="output/preview/library.html">全部 ›</a></div>';
    html += '<div class="home-update-list">';
    WORLD_UPDATE.forEach(function (u) {
      var href = u.href || 'output/preview/world-forge.html?book=' + u.id;
      html +=
        '<a class="home-update-item" href="' + href + '">' +
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
    openSigninCenter: openSigninCenter,
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