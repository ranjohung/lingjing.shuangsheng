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
    // 控制 banner / 四大金刚 / quick-grid 可见性（同人区/搜索时简化）
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
        else if (action === 'calendar') showToast('warn', '更新日历', '即将开放');
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
      var card = el('a', { class: 'ds-wf-card', href: 'discover.html?id=' + c.id }, [
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
    } else {
      renderDefault(main);
    }
  }

  function renderDefault(main) {
    // 3 板块标题 + 双列瀑布流
    var secTitle = '';
    if (currentSub === 'home') secTitle = '编辑推荐';
    else if (currentSub === 'rank') secTitle = '本周榜单';
    else if (currentSub === 'xinyu') secTitle = '心屿推荐';
    else if (currentSub === 'welfare') secTitle = '限时福利';
    else if (currentSub === 'chuangshibei') secTitle = '创世杯作品';

    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, [secTitle]),
      el('div', { class: 'ds-board-sort' }, [
        el('span', { class: 'ds-sort' + (currentFilter.sort === 'ly' ? ' active' : '') }, ['本周灵韵']),
        el('span', { class: 'ds-sort' + (currentFilter.sort === 'rq' ? ' active' : '') }, ['本周人气'])
      ])
    ]));

    var allCards = window.WORLD_DATA.FEATURED.concat(window.WORLD_DATA.HOT).concat(window.WORLD_DATA.NEW_DONE);
    var grid = el('div', { class: 'ds-waterfall' });
    renderWaterfall(allCards.slice(0, 12), grid, {});
    main.appendChild(grid);

    // 第二板块（热门佳作）
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

    // 第三板块（最新完结）
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

  function renderTonggren(main) {
    main.appendChild(el('div', { class: 'ds-board-head' }, [
      el('div', { class: 'ds-board-title' }, ['同人区 · 公版作品']),
      el('div', { class: 'ds-board-sort' }, [
        el('span', { class: 'ds-sort active' }, ['公版优先']),
        el('span', { class: 'ds-sort' }, ['全部'])
      ])
    ]));
    var grid = el('div', { class: 'ds-waterfall' });
    renderWaterfall(window.WORLD_DATA.PUBLIC_DOMAIN, grid, { publicDomain: true });
    main.appendChild(grid);
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

  // ---------- 分类侧边栏 ----------
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
          // 关闭侧边栏，进入筛选结果
          closeDrawer();
          showToast('ok', '筛选 · ' + cat.name + ' / ' + sub.name, '即将开放');
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