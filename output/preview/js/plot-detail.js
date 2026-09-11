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

  // ---------- V20-J 游玩路由：专属小说世界 ----------
  var WORLD_ROUTES = {
    sanguoyanyi: 'sanguo-world.html', // 三国演义 · 120 回卷制世界（V20-H）
    pd2: 'sanguo-world.html'          // 灵境解读三国 → 三国演义小说世界
  };

  // ---------- V20-J 内置详情（专属小说世界作品） ----------
  function buildExtra(id) {
    if (id === 'sanguoyanyi') {
      return {
        id: 'sanguoyanyi',
        title: '三国演义 · 小说世界',
        author: '罗贯中（公版）',
        tags: ['公版名著', '古风', '战争权谋'],
        summary: '120 回全本卷制阅读 · 桃园结义、群雄逐鹿、三分天下。卷一免费开放，全书券 128 灵晶（省 42%），阅读券可享 10 灵玉单卷。灵玉每日签到 +10。',
        cover: 'linear-gradient(160deg,#6B2737,#B8863B)',
        emoji: '📖',
        stats: { likes: 1286, favs: 592, comments: 143, reads: 25830 },
        cast: [], ads: [], groups: [], roles: [], ranks: [],
        interact: { selected: [], latest: [] }
      };
    }
    return null;
  }

  function findNovel(id) {
    if (PLOT[id]) return PLOT[id];
    var extra = buildExtra(id);
    if (extra) return extra;
    // 世界页卡片（world-data.js）通用详情回退 —— 不再错误回退到长夜城
    if (window.WORLD_DATA) {
      var lists = [window.WORLD_DATA.FEATURED, window.WORLD_DATA.HOT, window.WORLD_DATA.NEW_DONE, window.WORLD_DATA.PUBLIC_DOMAIN];
      for (var i = 0; i < lists.length; i++) {
        var hit = (lists[i] || []).filter(function (c) { return c.id === id; })[0];
        if (hit) {
          var parts = [];
          if (hit.desc) parts.push(hit.desc);
          if (hit.wordCount) parts.push(hit.wordCount);
          return {
            id: hit.id, title: hit.title, author: hit.author,
            tags: [hit.catName || '小说世界'],
            summary: (parts.join(' · ') || '灵境小说世界作品') + '。点击下方「▶ 游玩」进入小说世界。',
            cover: hit.cov, emoji: hit.emoji,
            stats: {
              likes: Math.round(hit.score * 100), favs: Math.round(hit.score * 40),
              comments: Math.round(hit.score * 8), reads: Math.round(hit.score * 2600)
            },
            cast: [], ads: [], groups: [], roles: [], ranks: [],
            interact: { selected: [], latest: [] }
          };
        }
      }
    }
    // 未知作品：占位提示（保持页面可用，不显示错误内容）
    return {
      id: id, title: '作品详情', author: '—', tags: [],
      summary: '该作品信息暂缺 · 通用小说世界引擎 v5.21+ 即将开放',
      cover: 'linear-gradient(160deg,#1A1A2E,#16213E)', emoji: '📖',
      stats: { likes: 0, favs: 0, comments: 0, reads: 0 },
      cast: [], ads: [], groups: [], roles: [], ranks: [],
      interact: { selected: [], latest: [] }
    };
  }

  // ---------- V20-J 介绍大图 hero ----------
  function renderHero(novel) {
    var hero = $('#pl-hero');
    if (!hero) return;
    if (novel.cover) hero.style.background = novel.cover;
    var emoji = $('#pl-hero-emoji');
    if (emoji) emoji.textContent = novel.emoji || '📖';
    var title = $('#pl-hero-title');
    if (title) title.textContent = novel.title || '作品详情';
    var sub = $('#pl-hero-sub');
    if (sub) sub.textContent = (novel.author && novel.author !== '—') ? (novel.author + ' · 小说世界') : '小说世界';
    var tags = $('#pl-hero-tags');
    if (tags) {
      tags.innerHTML = '';
      (novel.tags || []).forEach(function (t) {
        tags.appendChild(el('span', { class: 'pl-hero-tag' }, [t]));
      });
    }
    var stats = $('#pl-hero-stats');
    if (stats && novel.stats) {
      stats.innerHTML = '';
      var cells = [
        [String(novel.stats.reads.toLocaleString()), '在读'],
        [String(novel.stats.likes.toLocaleString()), '点赞'],
        [String(novel.stats.favs.toLocaleString()), '收藏'],
        [String(novel.stats.comments), '评论']
      ];
      cells.forEach(function (c) {
        stats.appendChild(el('div', {}, [
          el('b', {}, [c[0]]),
          el('span', {}, [c[1]])
        ]));
      });
    }
    var sum = $('#pl-hero-summary');
    if (sum) sum.textContent = novel.summary || '';
  }

  // ---------- 主演横滑 ----------
  function renderCast(novel) {
    var wrap = $('#pl-cast-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!novel.cast || !novel.cast.length) {
      wrap.appendChild(el('div', { class: 'pl-empty' }, ['主演资料整理中 · v5.21+ 即将开放']));
      return;
    }
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
      // V20-J 游玩路由：专属世界直入正式游戏；其余交运行器（未接入时出提示页）
      if (WORLD_ROUTES[currentNovelId]) {
        window.location.href = WORLD_ROUTES[currentNovelId];
        return;
      }
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

    renderHero(novel);
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

    // V20-J：点赞数初始化（原为静态 707）
    var likeCount = $('#pl-act-like-count');
    if (likeCount) likeCount.textContent = String(novel.stats.likes);

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