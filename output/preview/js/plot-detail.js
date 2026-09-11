/* =================================================================
 * 灵境 · 双生 V19.0 — plot-detail 详情页逻辑层
 * 功能：3 Tab + 主演横滑 + 互动区 + 交流区 + 底部操作栏
 * ================================================================= */
(function () {
  'use strict';
  if (window.LJPlotDetail && window.LJPlotDetail.__mounted) return;

  var PLOT = window.PLOT_DETAIL_DATA;
  var el = function (tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (children) (Array.isArray(children) ? children : [children]).forEach(function (c) {
      if (c == null) return;
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else e.appendChild(c);
    });
    return e;
  };
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var currentNovelId = 'changyecheng';
  var currentTab = 'detail';
  var currentInteractTab = 'selected';

  function getQuery() {
    var q = (window.location.search || '').replace(/^\?/, '');
    q.split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0] === 'novel') currentNovelId = p[1] || currentNovelId;
    });
    return currentNovelId;
  }

  function findNovel(id) {
    return PLOT[id] || PLOT.changyecheng;
  }

  // ---------- 主演横滑 ----------
  function renderCast(novel) {
    var wrap = $('#pl-cast-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    novel.cast.forEach(function (c) {
      var card = el('div', { class: 'pl-cast-card' }, [
        el('div', { class: 'pl-cast-cover', style: 'background:' + c.bg }, [c.emoji]),
        el('div', { class: 'pl-cast-name' }, [c.name]),
        el('div', { class: 'pl-cast-alias' }, [c.alias])
      ]);
      wrap.appendChild(card);
    });
  }

  // ---------- Banner ----------
  function renderBanner(novel) {
    var wrap = $('#pl-banner');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!novel.ads.length) { wrap.style.display = 'none'; return; }
    wrap.style.display = '';
    novel.ads.forEach(function (a) {
      var card = el('div', { class: 'pl-banner-card' }, [
        el('span', { class: 'pl-banner-badge' }, [a.badge]),
        el('span', { class: 'pl-banner-emoji' }, [a.emoji]),
        el('div', { class: 'pl-banner-title' }, [a.title]),
        el('div', { class: 'pl-banner-sub' }, [a.sub]),
        el('div', { class: 'pl-banner-period' }, ['活动时间 ' + a.period])
      ]);
      wrap.appendChild(card);
    });
  }

  // ---------- 互动区 ----------
  function renderInteract(novel) {
    var wrap = $('#pl-interact-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    var posts = novel.interact[currentInteractTab] || [];
    posts.forEach(function (p) {
      var card = el('div', { class: 'pl-post-card' }, [
        el('div', { class: 'pl-post-head' }, [
          el('span', { class: 'pl-post-avatar' }, [p.avatar]),
          el('div', { class: 'pl-post-meta' }, [
            el('div', { class: 'pl-post-user' }, [p.user]),
            el('div', { class: 'pl-post-time' }, [p.time])
          ])
        ]),
        el('div', { class: 'pl-post-content' }, [p.content]),
        el('div', { class: 'pl-post-badge' }, ['来自 ' + p.badge])
      ]);
      card.addEventListener('click', function () {
        showToast('ok', '互动帖', 'v5.21+ 即将开放');
      });
      wrap.appendChild(card);
    });
    if (!posts.length) {
      wrap.appendChild(el('div', { class: 'pl-empty' }, ['暂无互动']));
    }
  }

  // ---------- 交流区 ----------
  function renderGroups(novel) {
    var wrap = $('#pl-groups');
    if (!wrap) return;
    wrap.innerHTML = '';
    novel.groups.forEach(function (g) {
      var card = el('div', { class: 'pl-group-card' }, [
        el('span', { class: 'pl-group-emoji' }, [g.emoji]),
        el('div', { class: 'pl-group-name' }, [g.name]),
        el('div', { class: 'pl-group-info' }, [
          el('span', { class: 'pl-group-price' }, [g.price + '花']),
          el('span', { class: 'pl-group-members' }, [g.members + ' 成员'])
        ]),
        el('div', { class: 'pl-group-cta' }, [g.type === 'vip' ? '进群' : '查看'])
      ]);
      card.addEventListener('click', function () {
        showToast('warn', '加入群', 'v5.21+ 即将开放');
      });
      wrap.appendChild(card);
    });
  }

  // ---------- 角色表白 Tab ----------
  function renderRoles(novel) {
    var wrap = $('#pl-roles-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!novel.roles.length) {
      wrap.appendChild(el('div', { class: 'pl-empty' }, ['暂无角色数据']));
      return;
    }
    novel.roles.forEach(function (r, idx) {
      var card = el('div', { class: 'pl-role-card' }, [
        el('div', { class: 'pl-role-rank' }, ['No.' + (idx + 1)]),
        el('span', { class: 'pl-role-emoji' }, [r.emoji]),
        el('div', { class: 'pl-role-body' }, [
          el('div', { class: 'pl-role-name' }, [r.name]),
          el('div', { class: 'pl-role-stat' }, [r.lineCount + ' 台词 · ' + r.fansCount + ' 应援']),
          el('div', { class: 'pl-role-line' }, ['"' + r.topLine + '"'])
        ])
      ]);
      wrap.appendChild(card);
    });
  }

  // ---------- 榜单 Tab ----------
  function renderRanks(novel) {
    var wrap = $('#pl-ranks-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!novel.ranks.length) {
      wrap.appendChild(el('div', { class: 'pl-empty' }, ['暂无榜单数据']));
      return;
    }
    novel.ranks.forEach(function (rk) {
      var section = el('div', { class: 'pl-rank-section' }, [
        el('div', { class: 'pl-rank-title' }, [rk.type])
      ]);
      rk.items.forEach(function (it, idx) {
        section.appendChild(el('div', { class: 'pl-rank-row' }, [
          el('span', { class: 'pl-rank-num pl-rank-num-' + (idx < 3 ? 'top' : 'normal') }, [String(idx + 1)]),
          el('span', { class: 'pl-rank-emoji' }, [it.emoji]),
          el('span', { class: 'pl-rank-name' }, [it.name]),
          el('span', { class: 'pl-rank-score' }, [String(it.score)])
        ]));
      });
      wrap.appendChild(section);
    });
  }

  // ---------- Tab 切换 ----------
  function setTab(tabId) {
    currentTab = tabId;
    $$('.pl-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    $$('.pl-pane').forEach(function (p) {
      p.style.display = p.getAttribute('data-pane') === tabId ? '' : 'none';
    });
  }

  function setInteractTab(type) {
    currentInteractTab = type;
    var novel = findNovel(currentNovelId);
    $$('.pl-interact-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-interact') === type);
    });
    renderInteract(novel);
  }

  // ---------- 底部操作栏 ----------
  function bindActionBar(novel) {
    var likeBtn = $('#pl-act-like');
    if (likeBtn) {
      var liked = false;
      likeBtn.addEventListener('click', function () {
        liked = !liked;
        if (liked) novel.stats.likes += 1;
        else novel.stats.likes -= 1;
        $('#pl-act-like-count').textContent = novel.stats.likes;
        likeBtn.classList.toggle('liked', liked);
        showToast(liked ? 'ok' : 'warn', liked ? '已点赞' : '已取消', '');
      });
    }
    var favBtn = $('#pl-act-fav');
    if (favBtn) favBtn.addEventListener('click', function () {
      showToast('ok', '收藏', 'v5.21+ 即将开放');
    });
    var buyBtn = $('#pl-act-buy');
    if (buyBtn) buyBtn.addEventListener('click', function () {
      // V20-I 审查修复：原跳 '../creator-center.html' 为 404 断链；购买流程 v5.21+ 即将开放
      showToast('warn', '购买', 'v5.21+ 即将开放');
    });
    var cmtBtn = $('#pl-act-cmt');
    if (cmtBtn) cmtBtn.addEventListener('click', function () {
      showToast('warn', '互动评论', 'v5.21+ 即将开放');
    });
    var startBtn = $('#pl-act-start');
    if (startBtn) startBtn.addEventListener('click', function () {
      window.location.href = 'plot-runner.html?novel=' + currentNovelId;
    });
  }

  // ---------- Tab 事件 ----------
  function bindTabs() {
    $$('.pl-tab').forEach(function (t) {
      t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); });
    });
    $$('.pl-interact-tab').forEach(function (t) {
      t.addEventListener('click', function () { setInteractTab(t.getAttribute('data-interact')); });
    });
  }

  // ---------- Toast ----------
  function showToast(kind, title, msg) {
    var t = $('#lj-toast');
    if (!t) return;
    t.className = 'lj-toast ' + kind;
    $('#lj-toast-title').textContent = title || '';
    $('#lj-toast-msg').textContent = msg || '';
    t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // ---------- 主渲染 ----------
  function mount() {
    getQuery();
    var novel = findNovel(currentNovelId);

    // 顶栏标题
    var titleEl = $('#pl-novel-title');
    if (titleEl) titleEl.textContent = novel.title;

    renderCast(novel);
    renderBanner(novel);
    renderInteract(novel);
    renderGroups(novel);
    renderRoles(novel);
    renderRanks(novel);
    bindActionBar(novel);
    bindTabs();
    setTab('detail');
    setInteractTab('selected');

    // 5 Tab 注入（如果存在）
    if (window.LJTabbar && typeof window.LJTabbar.mount === 'function') {
      window.LJTabbar.mount(currentNovelId === 'shenhuihuisheng' ? 'world' : 'world');
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.LJPlotDetail = {
    __mounted: true,
    showToast: showToast,
    setTab: setTab
  };
})();