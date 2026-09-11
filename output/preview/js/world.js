/* =================================================================
 * 灵境 · 双生 V17.0 — 世界功能区交互层
 * 数据源：window.WORLD_DATA（world-data.js）
 * 暴露：window.LJWorld.{goSubNav, openDrawer, closeDrawer, filter, search, goSub}
 * 挂载：DOMContentLoaded → window.LJWorld.init()
 * ================================================================= */
(function () {
  'use strict';
  if (window.LJWorld && window.LJWorld.__mounted) return;

  // ---------- 当前子导航 ----------
  var currentSub = 'home'; // home | rank | xinyu | welfare | chuangshibei | tongren | search
  var currentFilter = { board: 'featured', sort: 'ly' }; // board: featured/hot/new_done, sort: ly(灵韵)/rq(人气)

  // ---------- 工具 ----------
  function $(s, p) { return (p || document).querySelector(s); }
  function $$(s, p) { return Array.prototype.slice.call((p || document).querySelectorAll(s)); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach(function (c) {
      if (typeof c === 'string') n.appendChild(document.createTextNode(c));
      else if (c) n.appendChild(c);
    });
    return n;
  }

  // ---------- 子导航切换 ----------
  function setSubNav(id) {
    currentSub = id;
    $$('.ds-sub-nav .ds-sn').forEach(function (n) {
      n.classList.toggle('active', n.getAttribute('data-sn') === id);
    });
    // 控制搜索框可见性（仅 search 子项）
    var searchBox = $('#ds-search-box');
    if (searchBox) searchBox.style.display = (id === 'search') ? 'flex' : 'none';
    // 控制分类侧边栏快捷按钮可见性
    var catTrigger = $('#ds-cat-trigger');
    if (catTrigger) catTrigger.style.display = (id === 'tongren') ? 'none' : '';
    // 控制 banner / 四大金刚 / quick-grid 可见性（仅同人区/搜索时简化）
    var banner = $('#ds-banner');
    var qg = $('#ds-quick-grid');
    var simple = (id === 'tongren' || id === 'search');
    if (banner) banner.style.display = simple ? 'none' : '';
    if (qg) qg.style.display = simple ? 'none' : '';
    // 切换内容容器
    renderContent();
  }

  // ---------- Banner 轮播 ----------
  var bannerTimer = null;
  var bannerIndex = 0;
  function startBanner() {
    stopBanner();
    var banners = window.WORLD_DATA.BANNERS;
    var track = $('#ds-banner-track');
    var dots = $('#ds-banner-dots');
    if (!track || !dots || banners.length < 2) return;
    bannerTimer = setInterval(function () {
      bannerIndex = (bannerIndex + 1) % banners.length;
      updateBanner();
    }, 5000);
  }
  function stopBanner() {
    if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null; }
  }
  function updateBanner() {
    var track = $('#ds-banner-track');
    if (track) track.style.transform = 'translateX(-' + (bannerIndex * 100) + '%)';
    $$('.ds-banner-dot').forEach(function (d, i) {
      d.classList.toggle('active', i === bannerIndex);
    });
  }
  function bindBanner() {
    var banners = window.WORLD_DATA.BANNERS;
    var track = $('#ds-banner-track');
    var dots = $('#ds-banner-dots');
    if (!track || !dots) return;
    // 渲染 slides
    track.innerHTML = '';
    banners.forEach(function (b) {
      track.appendChild(el('a', { class: 'ds-banner-slide', href: b.href }, [
        el('div', { class: 'ds-bs-bg', style: 'background:' + b.gradient }),
        el('div', { class: 'ds-bs-mask' }),
        el('div', { class: 'ds-bs-content' }, [
          el('div', { class: 'ds-bs-emoji' }, [b.emoji]),
          el('div', { class: 'ds-bs-title' }, [b.title]),
          el('div', { class: 'ds-bs-sub' }, [b.subtitle])
        ])
      ]));
    });
    // 渲染 dots
    dots.innerHTML = '';
    banners.forEach(function (b, i) {
      var d = el('span', { class: 'ds-banner-dot' + (i === 0 ? ' active' : ''), 'data-i': i });
      d.addEventListener('click', function () { bannerIndex = i; updateBanner(); stopBanner(); startBanner(); });
      dots.appendChild(d);
    });
    // 触摸滑动（最小实现）
    var startX = 0;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stopBanner(); }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) {
        bannerIndex = (bannerIndex + (dx < 0 ? 1 : -1) + banners.length) % banners.length;
        updateBanner();
      }
      startBanner();
    });
    startBanner();
  }

  // ---------- 四大金刚 ----------
  function bindQuickGrid() {
    var btns = $$('.ds-qg-item');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var action = b.getAttribute('data-action');
        if (action === 'cat') openDrawer();
        else if (action === 'calendar') { currentSub = 'calendar'; setSubNav('calendar'); }
        else if (action === 'classic') { currentSub = 'tongren'; setSubNav('tongren'); }
        else if (action === 'create') { window.location.href = 'creator-center.html'; }
      });
    });
  }

  // ---------- 渲染瀑布流 ----------
  function renderWaterfall(cards, container, opts) {
    opts = opts || {};
    container.innerHTML = '';
    cards.forEach(function (c) {
      // V20-J：卡片（介绍页图片）点击 → 详细介绍页；游玩在详情页内进入正式游戏
      var card = el('a', { class: 'ds-wf-card', href: 'plot-detail.html?novel=' + c.id }, [
        el('div', { class: 'ds-wf-cov', style: 'background:' + c.cov }, [
          el('span', { class: 'ds-wf-emoji' }, [c.emoji]),
          c.isNew ? el('span', { class: 'ds-corner-tag ds-tag-new' }, ['新作']) : null,
          c.isDone ? el('span', { class: 'ds-corner-tag ds-tag-done' }, ['完结']) : null,
          opts.publicDomain ? el('span', { class: 'ds-corner-tag ds-tag-pd' }, ['公版']) : null
        ]),
        el('div', { class: 'ds-wf-body' }, [
          el('div', { class: 'ds-wf-title' }, [c.title]),
          el('div', { class: 'ds-wf-author' }, ['by ' + c.author]),
          el('div', { class: 'ds-wf-tags' }, [
            el('span', { class: 'ds-wf-tag', style: 'color:' + window.WORLD_DATA.tagColor(c.catName) }, [c.catName])
          ]),
          // V20-L 设计文档 §3.4：卡片含一句话简介
          c.desc ? el('div', { class: 'ds-wf-desc' }, [c.desc]) : null,
          el('div', { class: 'ds-wf-meta' }, [
            el('span', { class: 'ds-wf-score' }, ['⭐ ' + c.score.toFixed(1)]),
            el('span', { class: 'ds-wf-wc' }, [c.wordCount])
          ])
        ])
      ]);
      container.appendChild(card);
    });
  }

  // ---------- 渲染内容容器 ----------
  function renderContent() {
    var main = $('#ds-main');
    if (!main) return;
    main.innerHTML = '';

    if (currentSub === 'tongren') {
      renderTonggren(main);
    } else if (currentSub === 'search') {
      renderSearch(main);
    } else if (currentSub === 'xinyu') {
      renderXinyuTui(main);
    } else if (currentSub === 'welfare') {
      renderWelfare(main);
    } else if (currentSub === 'chuangshibei') {
      renderChuangshibei(main);
    } else if (currentSub === 'rank') {
      renderRank(main);
    } else if (currentSub === 'calendar') {
      renderCalendarView(main);
    } else if (currentSub === 'filter') {
      renderFilterPage(main, currentFilter.catId, currentFilter.subId);
    } else {
      renderDefault(main);
    }
  }

  // ---------- 排行榜 ----------
  // ---------- 排行榜（V20-K：10 榜单 Tab · 参考主流小说 App 榜单体系） ----------
  var currentRank = 'rq';
  function renderRank(main) {
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['排行榜']),
      el('div', { class: 'ds-board-sub' }, ['十大榜单 · 每周一 05:00 更新'])
    ]));
    // 榜单 Tab（横向滚动）
    var tabs = el('div', { class: 'rank-tabs' });
    window.WORLD_DATA.RANKS.forEach(function (r) {
      tabs.appendChild(el('span', {
        class: 'rank-tab' + (currentRank === r.id ? ' active' : ''),
        'data-rank': r.id
      }, [r.icon + ' ' + r.name]));
    });
    main.appendChild(tabs);

    // 当前榜单作品集（新书/完本/付费/免费/同人/新晋完结榜 = 先过滤再排序）
    var all = window.WORLD_DATA.FEATURED.concat(window.WORLD_DATA.HOT).concat(window.WORLD_DATA.NEW_DONE);
    var pool = all;
    if (currentRank === 'new') pool = all.filter(function (c) { return c.isNew; });
    else if (currentRank === 'xinjin') pool = all.filter(function (c) { return c.isDone; });
    else if (currentRank === 'done') pool = all.filter(function (c) { return c.isDone; });
    else if (currentRank === 'fee') pool = all.filter(function (c) { return c.price > 0; });
    else if (currentRank === 'free') pool = all.filter(function (c) { return c.price === 0; });
    else if (currentRank === 'tongren') pool = all.filter(function (c) { return c.cat === 'mingxing'; });
    var sorted = sortCards(pool, currentRank);

    var list = el('div', { class: 'rank-list' });
    if (!sorted.length) {
      list.appendChild(el('div', { class: 'ds-empty' }, ['该榜单暂无作品，换个榜单看看']));
    }
    sorted.slice(0, 10).forEach(function (w, idx) {
      var row = el('div', { class: 'rank-row' }, [
        el('div', { class: 'rank-num rank-num-' + (idx < 3 ? 'top' : 'normal') }, [String(idx + 1)]),
        el('div', { class: 'rank-cov', style: 'background:' + w.cov }, [w.emoji]),
        el('div', { class: 'rank-body' }, [
          el('div', { class: 'rank-title' }, [w.title]),
          el('div', { class: 'rank-meta' }, [w.author + ' · ⭐ ' + w.score.toFixed(1) + ' · 本周灵韵 ' + (w.score * 100 | 0)])
        ])
      ]);
      list.appendChild(row);
    });
    main.appendChild(list);
  }

  // ---------- 更新日历（V17.0 §2.3 四大金刚-更新日历）----------
  function renderCalendarView(main) {
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['更新日历']),
      el('div', { class: 'ds-board-sub' }, ['近期作品更新 · 时间轴'])
    ]));
    var calendar = window.WORLD_DATA.CALENDAR;
    var list = el('div', { class: 'cal-list' });
    calendar.forEach(function (item) {
      var row = el('div', { class: 'cal-item' }, [
        el('div', { class: 'cal-date' }, [
          el('div', { class: 'cal-date-d' }, [item.date]),
          el('div', { class: 'cal-date-l' }, [item.label])
        ]),
        el('div', { class: 'cal-works' }, item.works.map(function (w) {
          return el('div', { class: 'cal-work' }, [w]);
        }))
      ]);
      list.appendChild(row);
    });
    main.appendChild(list);
  }

  // ---------- 筛选结果页（V17.0 §2.6）----------
  // 顶部排序"本周灵韵 | 本周人气" + 5 维筛选 chip + 双列瀑布流
  var filterState = {
    sort: 'ly',  // ly / rq / shoucang / pingfen / zishu / gengxin / fabu / pinglun
    status: 'all',
    level: 'all',
    words: 'all',
    price: 'all',
    attr: 'all',
    year: 'all'
  };

  function applyFilter(cards) {
    return cards.filter(function (c) {
      if (filterState.status !== 'all' && c.status !== filterState.status) return false;
      if (filterState.level !== 'all' && c.level !== filterState.level) return false;
      // V20-K：字数 8 档（wc 单位 = 万字）
      var w = c.wc || 0;
      if (filterState.words === 'w0' && w >= 3) return false;
      if (filterState.words === 'w1' && (w < 3 || w >= 10)) return false;
      if (filterState.words === 'w2' && (w < 10 || w >= 30)) return false;
      if (filterState.words === 'w3' && (w < 30 || w >= 50)) return false;
      if (filterState.words === 'w4' && (w < 50 || w >= 100)) return false;
      if (filterState.words === 'w5' && (w < 100 || w >= 200)) return false;
      if (filterState.words === 'w6' && w < 200) return false;
      // V20-K：价格 6 档（含免费 / 200 以上）
      if (filterState.price === 'free' && c.price !== 0) return false;
      if (filterState.price === 'p0' && (c.price === 0 || c.price > 50)) return false;
      if (filterState.price === 'p1' && (c.price < 51 || c.price > 100)) return false;
      if (filterState.price === 'p2' && (c.price < 101 || c.price > 200)) return false;
      if (filterState.price === 'p3' && c.price <= 200) return false;
      // V20-K：热门属性
      if (filterState.attr !== 'all' && (c.attrs || []).indexOf(filterState.attr) === -1) return false;
      // V20-K：年份（含 2023 及更早）
      if (filterState.year === 'older') { if ((c.year || 2026) > 2023) return false; }
      else if (filterState.year !== 'all' && String(c.year) !== filterState.year) return false;
      return true;
    });
  }

  // ---------- V20-K：通用排序（筛选页 + 排行榜共用） ----------
  function sortCards(list, sid) {
    var arr = list.slice();
    var byScore = function (a, b) { return b.score - a.score; };
    switch (sid) {
      case 'rq':       return arr.sort(function (a, b) { return (b.score * 900 + b.wc * 3) - (a.score * 900 + a.wc * 3); });
      case 'shoucang': return arr.sort(function (a, b) { return (b.score * 260) - (a.score * 260); });
      case 'pingfen':  return arr.sort(byScore);
      case 'zishu':    return arr.sort(function (a, b) { return (b.wc || 0) - (a.wc || 0); });
      case 'gengxin':  return arr.sort(function (a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || (b.year - a.year) || byScore(a, b); });
      case 'fabu':     return arr.sort(function (a, b) { return (b.year - a.year) || byScore(a, b); });
      case 'pinglun':  return arr.sort(function (a, b) { return (b.score * 12) - (a.score * 12); });
      case 'resou':    return arr.sort(function (a, b) { return (b.score * 700 + b.wc * 7) - (a.score * 700 + a.wc * 7); });
      // V20-L 设计文档六榜：Fans / 综合 / 勤更 / 稀有卡
      case 'fans':     return arr.sort(function (a, b) { return (b.score * 800 + b.wc * 5) - (a.score * 800 + a.wc * 5); });
      case 'zh':       return arr.sort(function (a, b) { return (b.score * 600 + b.wc * 4 + (b.isDone ? 300 : 0)) - (a.score * 600 + a.wc * 4 + (a.isDone ? 300 : 0)); });
      case 'qingeng':  return arr.sort(function (a, b) { return ((b.isNew ? 1 : 0) * 500 + b.score * 300 + (b.status === 'ing' ? 200 : 0)) - ((a.isNew ? 1 : 0) * 500 + a.score * 300 + (a.status === 'ing' ? 200 : 0)); });
      case 'xika':     return arr.sort(function (a, b) { return ((b.attrs || []).length * 400 + b.score * 100) - ((a.attrs || []).length * 400 + a.score * 100); });
      default:         return arr.sort(function (a, b) { return (b.score * 1000) - (a.score * 1000); }); // ly 本周灵韵
    }
  }

  function renderFilterPage(main, catId, subId) {
    var cats = window.WORLD_DATA.CATEGORIES;
    var cat = null, sub = null;
    cats.forEach(function (c) {
      if (c.id === catId) {
        cat = c;
        c.children.forEach(function (s) { if (s.id === subId) sub = s; });
      }
    });
    var title = cat ? (cat.name + ' / ' + (sub ? sub.name : '')) : '全部分类';

    // 面包屑 + 顶部排序（V20-K：数据驱动 8 种排序，横向滚动）
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, [title])
    ]));
    var sortBar = el('div', { class: 'filter-sort-bar' });
    window.WORLD_DATA.SORTS.forEach(function (s) {
      sortBar.appendChild(el('span', {
        class: 'filter-sort-item' + (filterState.sort === s.id ? ' active' : ''),
        'data-sort': s.id
      }, [s.name]));
    });
    sortBar.appendChild(el('button', { class: 'filter-back', 'data-action': 'back-home' }, ['‹ 返回']));
    main.appendChild(sortBar);

    // 6 维筛选（V20-K：+ 热门属性）
    var dims = [
      { key: 'status', label: '作品状态', data: window.WORLD_DATA.FILTERS.status },
      { key: 'level',  label: '作品等级', data: window.WORLD_DATA.FILTERS.level },
      { key: 'words',  label: '作品字数', data: window.WORLD_DATA.FILTERS.words },
      { key: 'price',  label: '灵晶定价', data: window.WORLD_DATA.FILTERS.price },
      { key: 'attr',   label: '热门属性', data: window.WORLD_DATA.FILTERS.attr },
      { key: 'year',   label: '发布时间', data: window.WORLD_DATA.FILTERS.year }
    ];
    dims.forEach(function (dim) {
      var row = el('div', { class: 'filter-dim-row' }, [
        el('span', { class: 'filter-dim-label' }, [dim.label])
      ]);
      var chips = el('div', { class: 'filter-dim-chips' });
      dim.data.forEach(function (opt) {
        var chip = el('span', {
          class: 'filter-chip' + (filterState[dim.key] === opt.id ? ' active' : ''),
          'data-dim': dim.key,
          'data-v': opt.id
        }, [opt.name]);
        chips.appendChild(chip);
      });
      row.appendChild(chips);
      main.appendChild(row);
    });

    // 取该分类下的作品
    var all = window.WORLD_DATA.FEATURED.concat(window.WORLD_DATA.HOT).concat(window.WORLD_DATA.NEW_DONE);
    var scoped = all.filter(function (c) {
      if (!catId) return true;
      if (c.cat !== catId) return false;
      if (subId && c.sub !== subId) return false;
      return true;
    });
    var filtered = sortCards(applyFilter(scoped), filterState.sort);

    // 瀑布流（可显示角标）
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['共 ' + filtered.length + ' 部作品'])
    ]));
    if (filtered.length === 0) {
      main.appendChild(el('div', { class: 'ds-empty' }, ['该筛选下暂无作品，换个条件试试']));
    } else {
      var grid = el('div', { class: 'ds-waterfall' });
      renderWaterfall(filtered, grid, { showTags: true });
      main.appendChild(grid);
    }
  }

  // ---------- 排行榜结束，下面是心屿推 ----------

  // ---------- 心屿推（V12.0 3.2）----------
  function renderXinyuTui(main) {
    var data = window.ECONOMY.XINYU_TUI;
    // 顶部：每周回响
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['每周回响']),
      el('div', { class: 'ds-board-sub' }, ['每周五 10:00 更新 · 由「引路人」产出'])
    ]));
    var echoList = el('div', { class: 'echo-list' });
    data.weeklyEcho.forEach(function (e) {
      var card = el('div', { class: 'echo-card' }, [
        el('div', { class: 'echo-head' }, [
          el('span', { class: 'echo-avatar' }, [e.avatar]),
          el('span', { class: 'echo-user' }, [e.user]),
          el('span', { class: 'echo-tag' }, ['引路人'])
        ]),
        el('div', { class: 'echo-work' }, ['推荐：《' + e.workTitle + '》']),
        el('div', { class: 'echo-review' }, [e.review])
      ]);
      echoList.appendChild(card);
    });
    main.appendChild(echoList);

    // 中间：引路人积分排行
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['引路人积分排行']),
      el('div', { class: 'ds-board-sort' }, [
        el('span', { class: 'ds-sort active' }, ['周榜']),
        el('span', { class: 'ds-sort' }, ['月榜'])
      ])
    ]));
    var ylList = el('div', { class: 'yl-rank-list' });
    data.yinluRank.forEach(function (y) {
      var row = el('div', { class: 'yl-rank-row' }, [
        el('div', { class: 'yl-rank-num yl-rank-' + y.rank }, [String(y.rank)]),
        el('span', { class: 'yl-avatar' }, [y.avatar]),
        el('div', { class: 'yl-body' }, [
          el('div', { class: 'yl-name' }, [y.user]),
          el('div', { class: 'yl-title' }, [y.title])
        ]),
        el('div', { class: 'yl-score' }, [String(y.score) + ' 灵韵'])
      ]);
      ylList.appendChild(row);
    });
    main.appendChild(ylList);

    // 底部：更多推荐
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['更多推荐']),
      el('a', { class: 'ds-board-more', href: 'discover.html' }, ['全部 ›'])
    ]));
    var grid = el('div', { class: 'ds-waterfall' });
    renderWaterfall([{ id: 'mr1', title: '《凤求凰》', author: '云间月', catName: '古风', cat: 'gufeng', sub: 'gonggu', score: 9.2, wordCount: '12.3万字', cov: 'linear-gradient(160deg,#8E5BD8,#C95B9C)', emoji: '🌸' }, { id: 'mr2', title: '《三国·吕布篇》', author: '灵境官方', catName: '古风', cat: 'gufeng', sub: 'wangquan', score: 9.0, wordCount: '24.6万字', cov: 'linear-gradient(160deg,#B8863B,#8C5A2B)', emoji: '⚔️' }], grid, {});
    main.appendChild(grid);
  }

  // ---------- 创世杯（V12.0 3.4）----------
  function renderChuangshibei(main) {
    var data = window.ECONOMY.CHUANGSHIBEI;
    // 顶部 Banner
    main.appendChild(el('div', { class: 'csb-banner' }, [
      el('div', { class: 'csb-b-emoji' }, ['🏆']),
      el('div', { class: 'csb-b-title' }, [data.banner]),
      el('div', { class: 'csb-b-period' }, [data.period + ' · 火热进行中'])
    ]));
    // 赛程标签
    main.appendChild(el('div', { class: 'csb-stage' }, [
      el('span', { class: 'csb-stage-item active' }, ['主赛场']),
      el('span', { class: 'csb-stage-item' }, ['阶段奖励'])
    ]));
    // 时间轴
    main.appendChild(el('div', { class: 'csb-timeline' }, [
      el('div', { class: 'csb-tl-item active' }, [
        el('span', { class: 'csb-tl-dot' }, ['●']),
        el('div', null, [el('div', { class: 'csb-tl-title' }, ['进行中']), el('div', { class: 'csb-tl-period' }, [data.period])])
      ]),
      el('div', { class: 'csb-tl-item' }, [
        el('span', { class: 'csb-tl-dot' }, ['○']),
        el('div', null, [el('div', { class: 'csb-tl-title' }, ['复赛']), el('div', { class: 'csb-tl-period' }, ['10.10-10.20'])])
      ]),
      el('div', { class: 'csb-tl-item' }, [
        el('span', { class: 'csb-tl-dot' }, ['○']),
        el('div', null, [el('div', { class: 'csb-tl-title' }, ['决赛']), el('div', { class: 'csb-tl-period' }, ['10.21-10.31'])])
      ])
    ]));
    // 作品榜单
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['古风 TOP100 · 当前榜单']),
      el('div', { class: 'ds-board-sort' }, [
        el('span', { class: 'ds-sort active' }, ['灵韵']),
        el('span', { class: 'ds-sort' }, ['人气'])
      ])
    ]));
    var rankList = el('div', { class: 'csb-rank-list' });
    data.rank.forEach(function (r) {
      var btn = el('button', { class: 'csb-cheer-btn' }, ['助威']);
      btn.addEventListener('click', function () {
        if (window.LJToast) window.LJToast.show('ok', '已助威', '-10 灵晶 · ' + r.workTitle);
      });
      var row = el('div', { class: 'csb-rank-row' }, [
        el('div', { class: 'csb-rank-num csb-rank-' + r.rank }, [String(r.rank)]),
        el('div', { class: 'csb-rank-cov', style: 'background:' + r.cov }, [r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank-1] : '📕']),
        el('div', { class: 'csb-rank-body' }, [
          el('div', { class: 'csb-rank-title' }, [r.workTitle]),
          el('div', { class: 'csb-rank-meta' }, [r.author + ' · 阶段灵韵 ' + r.score])
        ]),
        btn
      ]);
      rankList.appendChild(row);
    });
    main.appendChild(rankList);
    // 右侧悬浮功能入口
    var csbFloat = el('div', { class: 'csb-float' });
    var csbBtns = [
      { ico: '💬', label: '同频共振群', msg: '即将开放' },
      { ico: '📊', label: '投票记录', msg: '即将开放' },
      { ico: '💭', label: '讨论区', msg: '即将开放' }
    ];
    csbBtns.forEach(function (b) {
      var fb = el('button', { class: 'csb-fb' }, [b.ico + ' ' + b.label]);
      fb.addEventListener('click', function () {
        if (window.LJToast) window.LJToast.show('warn', b.label, b.msg);
      });
      csbFloat.appendChild(fb);
    });
    main.appendChild(csbFloat);
  }

  // ---------- 福利（V12.0 3.3）----------
  function renderWelfare(main) {
    var tiers = window.ECONOMY.RECHARGE_TIERS;
    // 顶部子标签
    main.appendChild(el('div', { class: 'wf-sub-nav' }, [
      el('span', { class: 'wf-sub active' }, ['本月福利']),
      el('span', { class: 'wf-sub' }, ['活动专区']),
      el('span', { class: 'wf-sub' }, ['限免广场']),
      el('span', { class: 'wf-sub' }, ['免费频道'])
    ]));
    // 活动 Banner
    main.appendChild(el('div', { class: 'wf-banner' }, [
      el('div', { class: 'wf-b-emoji' }, ['🎁']),
      el('div', { class: 'wf-b-title' }, ['完成充值任务，免费领取限定世界']),
      el('div', { class: 'wf-b-sub' }, ['所有付费点以「灵晶」结算（1 元 = 100 灵晶）'])
    ]));
    // 5 档充值
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['充值档位（5 档）'])
    ]));
    var tierList = el('div', { class: 'wf-tier-list' });
    tiers.forEach(function (t, idx) {
      var rechargeBtn = el('button', { class: 'wf-t-btn' }, ['去充值']);
      rechargeBtn.addEventListener('click', function () {
        if (window.LJToast) window.LJToast.show('warn', '充值 ' + t.name, '即将开放（' + t.amount + ' 元）');
      });
      var card = el('div', { class: 'wf-tier-card' + (idx === 2 ? ' wf-tier-popular' : '') }, [
        el('div', { class: 'wf-t-head' }, [
          el('span', { class: 'wf-t-name' }, [t.name]),
          el('span', { class: 'wf-t-amount' }, [t.amount + ' 元'])
        ]),
        el('div', { class: 'wf-t-reward' }, [
          el('div', null, ['💎 ' + t.lingJing + ' 灵晶']),
          el('div', null, ['🌙 ' + t.lingYu + ' 灵玉']),
          t.extra ? el('div', { class: 'wf-t-extra' }, [t.extra]) : null
        ]),
        rechargeBtn
      ]);
      tierList.appendChild(card);
    });
    main.appendChild(tierList);
    // 免费作品（限免广场）
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['限免广场 · 灵玉领'])
    ]));
    var grid = el('div', { class: 'ds-waterfall' });
    var freeCards = window.ECONOMY.FREE_WORKS.map(function (f) {
      return { id: f.id, title: f.title, author: f.author, catName: f.cat, cat: 'gufeng', sub: 'gonggu', score: 9.0, wordCount: '12万字', cov: f.cov, emoji: '🎁' };
    });
    renderWaterfall(freeCards, grid, {});
    main.appendChild(grid);
    // 底部说明
    main.appendChild(el('div', { class: 'wf-note' }, [
      '💡 灵玉可通过每日签到、完成任务免费获取；灵晶需通过充值获得（1 元 = 100 灵晶）。'
    ]));
  }

  function renderDefault(main) {
    // V17.0 §2.4：3 个独立板块，每个板块独立右侧排序

    // 板块 1：编辑推荐（§2.4.1）
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['编辑推荐']),
      el('div', { class: 'ds-board-sort' }, [
        el('span', { class: 'ds-sort active' }, ['最新']),
        el('span', { class: 'ds-sort' }, ['完结'])
      ])
    ]));
    var grid1 = el('div', { class: 'ds-waterfall' });
    renderWaterfall(window.WORLD_DATA.FEATURED, grid1, {});
    main.appendChild(grid1);

    // 板块 2：热门佳作（§2.4.2）
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['热门佳作']),
      el('div', { class: 'ds-board-sort' }, [
        el('span', { class: 'ds-sort active' }, ['近期']),
        el('span', { class: 'ds-sort' }, ['完结']),
        el('span', { class: 'ds-sort' }, ['新作']),
        el('span', { class: 'ds-sort' }, ['历史'])
      ])
    ]));
    var grid2 = el('div', { class: 'ds-waterfall' });
    renderWaterfall(window.WORLD_DATA.HOT, grid2, {});
    main.appendChild(grid2);

    // 板块 3：最新完结（§2.4.3）
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['最新完结']),
      el('div', { class: 'ds-board-sort' }, [
        el('span', { class: 'ds-sort active' }, ['最近']),
        el('span', { class: 'ds-sort' }, ['全部'])
      ])
    ]));
    var grid3 = el('div', { class: 'ds-waterfall' });
    renderWaterfall(window.WORLD_DATA.NEW_DONE, grid3, {});
    main.appendChild(grid3);
  }

  // ---------- 同人区（V17.0 §2.7：侧边栏布局 + 灵境专属术语）----------
  function renderTonggren(main) {
    var cats = [
      { id: 'gongbao', name: '公版名著', subs: [
        { id: 'hlm', name: '红楼梦' },
        { id: 'sgy', name: '三国演义' },
        { id: 'xyj', name: '西游记' },
        { id: 'shz', name: '水浒传' },
        { id: 'liaozhai', name: '聊斋志异' }
      ]},
      { id: 'tongren', name: '同人专区', subs: [
        { id: 'hnt', name: '韩流同人' },
        { id: 'omt', name: '欧美同人' },
        { id: 'ri', name: '日系同人' },
        { id: 'yingxi', name: '影视改编' }
      ]}
    ];
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['同人区 · 公版与同人']),
      el('div', { class: 'ds-board-sub' }, ['灵境专属术语 · 不出现任何国际 IP 名'])
    ]));
    // 复用 .ds-drawer 样式但作为内嵌布局（不弹层）
    var layout = el('div', { class: 'tr-layout' });
    var leftNav = el('div', { class: 'tr-left-nav' });
    var grid = el('div', { class: 'ds-waterfall' });

    var showAll = function () {
      grid.innerHTML = '';
      renderWaterfall(window.WORLD_DATA.PUBLIC_DOMAIN, grid, { publicDomain: true });
    };

    cats.forEach(function (cat, i) {
      var catHead = el('div', { class: 'tr-cat' }, [cat.name]);
      leftNav.appendChild(catHead);
      cat.subs.forEach(function (sub) {
        var tag = el('div', { class: 'tr-sub' }, [sub.name]);
        tag.addEventListener('click', function () {
          $$('.tr-sub', leftNav).forEach(function (x) { x.classList.remove('active'); });
          tag.classList.add('active');
          // 简单按 sub 字段筛选
          grid.innerHTML = '';
          var matched = window.WORLD_DATA.PUBLIC_DOMAIN.filter(function (w) { return w.sub === sub.id; });
          if (matched.length === 0) {
            grid.innerHTML = '<div class="ds-empty">该子类暂无作品</div>';
          } else {
            renderWaterfall(matched, grid, { publicDomain: true });
          }
        });
        leftNav.appendChild(tag);
      });
    });

    layout.appendChild(leftNav);
    layout.appendChild(grid);
    main.appendChild(layout);
    showAll();
  }

  function renderSearch(main) {
    var input = $('#ds-search-input');
    if (!input) return;
    var q = (input.value || '').trim().toLowerCase();
    main.innerHTML = '';
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, [q ? '搜索：' + q : '热门搜索'])
    ]));
    var allCards = window.WORLD_DATA.FEATURED.concat(window.WORLD_DATA.HOT).concat(window.WORLD_DATA.NEW_DONE).concat(window.WORLD_DATA.PUBLIC_DOMAIN);
    var matched = q ? allCards.filter(function (c) {
      return (c.title && c.title.toLowerCase().indexOf(q) > -1)
          || (c.author && c.author.toLowerCase().indexOf(q) > -1)
          || (c.catName && c.catName.indexOf(q) > -1);
    }) : allCards.slice(0, 10);
    if (matched.length === 0) {
      main.appendChild(el('div', { class: 'ds-empty' }, ['没有匹配作品，换个词试试？']));
    } else {
      var grid = el('div', { class: 'ds-waterfall' });
      renderWaterfall(matched, grid, {});
      main.appendChild(grid);
    }
  }

  // ---------- 渲染分类侧边栏 ----------
  function openDrawer() {
    var drawer = $('#ds-drawer');
    var mask = $('#ds-drawer-mask');
    if (!drawer || !mask) return;
    drawer.classList.add('open');
    mask.classList.add('open');
    renderDrawerCats();
  }
  function closeDrawer() {
    var drawer = $('#ds-drawer');
    var mask = $('#ds-drawer-mask');
    if (drawer) drawer.classList.remove('open');
    if (mask) mask.classList.remove('open');
  }
  function renderDrawerCats() {
    var list = $('#ds-drawer-cat-list');
    var tags = $('#ds-drawer-tag-list');
    if (!list || !tags) return;
    list.innerHTML = ''; tags.innerHTML = '';
    var cats = window.WORLD_DATA.CATEGORIES;
    var activeCat = cats[0];
    cats.forEach(function (c, i) {
      var item = el('div', { class: 'ds-d-cat' + (i === 0 ? ' active' : ''), 'data-id': c.id }, [c.name]);
      item.addEventListener('click', function () {
        $$('.ds-d-cat').forEach(function (x) { x.classList.remove('active'); });
        item.classList.add('active');
        activeCat = c;
        renderTags(c);
      });
      list.appendChild(item);
    });
    function renderTags(cat) {
      tags.innerHTML = '';
      cat.children.forEach(function (sub) {
        var t = el('div', { class: 'ds-d-tag', 'data-sub': sub.id }, [sub.name]);
        t.addEventListener('click', function () {
          // V17.0 §2.6：关闭侧边栏，进入筛选结果页
          closeDrawer();
          currentSub = 'filter';
          currentFilter.catId = cat.id;
          currentFilter.subId = sub.id;
          filterState = { sort: 'ly', status: 'all', level: 'all', words: 'all', price: 'all', attr: 'all', year: 'all' };
          // 让顶部 banner/金刚显示（filter 视图是搜索筛选结果页）
          var banner = $('#ds-banner');
          var qg = $('#ds-quick-grid');
          var searchBox = $('#ds-search-box');
          var catTrigger = $('#ds-cat-trigger');
          if (banner) banner.style.display = '';
          if (qg) qg.style.display = '';
          if (searchBox) searchBox.style.display = 'none';
          if (catTrigger) catTrigger.style.display = '';
          renderContent();
        });
        tags.appendChild(t);
      });
    }
    renderTags(activeCat);
  }

  // ---------- 工具 ----------
  function showToast(kind, title, msg) {
    var c = document.getElementById('toast');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast-item ' + (kind || 'ok');
    t.innerHTML = '<span class="ti"></span><span><b>' + title + '</b>' + (msg ? '<span style="opacity:.65"> · ' + msg + '</span>' : '') + '</span>';
    c.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // ---------- 初始化 ----------
  function bindEvents() {
    // 子导航
    $$('.ds-sub-nav .ds-sn').forEach(function (n) {
      n.addEventListener('click', function () { setSubNav(n.getAttribute('data-sn')); });
    });
    bindBanner();
    bindQuickGrid();
    // 侧边栏关闭
    var closeBtn = $('#ds-drawer-close');
    var mask = $('#ds-drawer-mask');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (mask) mask.addEventListener('click', closeDrawer);
    // 分类侧边栏快捷按钮（顶部）
    var trigger = $('#ds-cat-trigger');
    if (trigger) trigger.addEventListener('click', openDrawer);
    // 搜索输入（搜索子区显示后）
    var input = $('#ds-search-input');
    if (input) input.addEventListener('input', function () {
      if (currentSub === 'search') renderSearch($('#ds-main'));
    });
    // 排序切换
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('ds-sort')) {
        var group = t.parentElement;
        $$('.ds-sort', group).forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
      }
    });
    // 筛选页事件代理：8 种排序 + 6 维筛选 chip + 榜单 Tab + 返回
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      // 排行榜 Tab 切换（V20-K）
      if (t.classList && t.classList.contains('rank-tab')) {
        currentRank = t.getAttribute('data-rank');
        renderContent();
        return;
      }
      // 排序切换（本周灵韵 / 本周人气 / 收藏最多 / …）
      if (t.classList && t.classList.contains('filter-sort-item')) {
        filterState.sort = t.getAttribute('data-sort');
        renderContent();
        return;
      }
      // 返回首页
      if (t.getAttribute && t.getAttribute('data-action') === 'back-home') {
        currentSub = 'home';
        filterState = { sort: 'ly', status: 'all', level: 'all', words: 'all', price: 'all', attr: 'all', year: 'all' };
        currentFilter = { board: 'featured', sort: 'ly', catId: null, subId: null };
        setSubNav('home');
        return;
      }
      // 5 维筛选 chip
      if (t.classList && t.classList.contains('filter-chip')) {
        var dim = t.getAttribute('data-dim');
        var v = t.getAttribute('data-v');
        if (dim && v) {
          // 同一 dim 内的其他 chip 取消 active
          var chips = t.parentElement.querySelectorAll('.filter-chip');
          chips.forEach(function (x) { x.classList.remove('active'); });
          t.classList.add('active');
          filterState[dim] = v;
          renderContent();
        }
      }
    });
  }

  function init() {
    if (!window.WORLD_DATA) {
      console.error('[LJWorld] WORLD_DATA not loaded');
      return;
    }
    bindEvents();
    setSubNav('home');
  }

  window.LJWorld = {
    init: init,
    goSub: setSubNav,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    showToast: showToast,
    __mounted: true
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();