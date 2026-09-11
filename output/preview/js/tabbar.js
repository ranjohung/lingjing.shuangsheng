/* =================================================================
 * 灵境 · 双生 V17.0 — 5 Tab 全局状态管理（兼容 v6.4.1 shell-v64.css）
 * 用法：主功能区页面 <body> 末尾引入 <script src="js/tabbar.js"></script>
 *       页面任意位置预留 <div id="tabbar-mount"></div> 或 #tabbar 节点
 * 功能：
 *   1. localStorage 记忆当前 Tab（key: lingjing_v5170_current_tab）
 *   2. URL 推断当前 Tab（href 包含 home/world/heart-island/creator-center/me）
 *   3. 自动渲染 5 Tab 底部导航并高亮 active
 *   4. 点击 Tab：记忆 + 跳转对应主功能区页面
 *   5. 提供 window.LJTabbar API（go/setBadge/getCurrent）
 *   6. 兼容沉浸页豁免：plot-runner / game-3d / catalog 不调用 mount()
 * ================================================================= */
(function () {
  'use strict';

  // 防止重复挂载
  if (window.LJTabbar && window.LJTabbar.__mounted) {
    return;
  }

  // ---------- 配置 ----------
  var STORAGE_KEY = 'lingjing_v5170_current_tab';
  var TABS = [
    { id: 'home',   label: '首页', ico: '🏠', href: 'product-preview.html',  match: ['product-preview', 'home', 'index'],  klass: 't-home' },
    { id: 'world',  label: '世界', ico: '📖', href: 'library.html',          match: ['library', 'world', 'discover'],      klass: 't-world' },
    { id: 'xinyu',  label: '心屿', ico: '💬', href: 'heart-island.html',     match: ['heart-island', 'xinyu', 'chat'],     klass: 't-xinyu' },
    { id: 'create', label: '创作', ico: '✨', href: 'creator-center.html',   match: ['creator-center', 'creator', 'novel'], klass: 't-create' },
    { id: 'me',     label: '我的', ico: '👤', href: 'me.html',                match: ['me', 'profile', 'wallet'],           klass: 't-me' }
  ];

  function resolveTabHref(n) {
    var p = (window.location.pathname || '').toLowerCase();
    var inSub = p.indexOf('/output/preview/') >= 0;
    // home 永远回到根目录的 product-preview.html
    if (n === 'product-preview.html') return inSub ? '../../product-preview.html' : n;
    // 其他 tab：根 + 前缀，子目录直链
    return inSub ? n : 'output/preview/' + n;
  }

  // ---------- 工具 ----------
  function $(s, p) { return (p || document).querySelector(s); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }

  function getPath() {
    var path = window.location.pathname || '';
    return path.split('/').pop() || '';
  }

  // 根据当前 URL 推断 tab id
  function inferTabFromUrl() {
    var file = getPath().toLowerCase();
    for (var i = 0; i < TABS.length; i++) {
      var t = TABS[i];
      for (var j = 0; j < t.match.length; j++) {
        if (file.indexOf(t.match[j].toLowerCase()) !== -1) return t.id;
      }
    }
    return null;
  }

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      if (!v) return null;
      var found = TABS.some(function (t) { return t.id === v; });
      return found ? v : null;
    } catch (e) { return null; }
  }

  function writeStored(id) {
    try { localStorage.setItem(STORAGE_KEY, id); } catch (e) { /* ignore */ }
  }

  function getCurrent() {
    var fromUrl = inferTabFromUrl();
    if (fromUrl) return fromUrl;
    var stored = readStored();
    if (stored) return stored;
    return 'home';
  }

  // ---------- 渲染 ----------
  function buildTabbar(currentId) {
    var bar = el('nav', { class: 'tabbar', role: 'navigation', 'aria-label': '主功能区' });
    TABS.forEach(function (t) {
      var klass = 'tab ' + t.klass + (t.id === currentId ? ' active' : '');
      var a = el('a', { class: klass, href: resolveTabHref(t.href), 'data-tab': t.id }, [
        el('span', { class: 'ico', 'aria-hidden': 'true' }, [t.ico]),
        el('span', { class: 'lbl' }, [t.label])
      ]);
      a.addEventListener('click', function () {
        writeStored(t.id);
      });
      bar.appendChild(a);
    });
    return bar;
  }

  function findMountPoint() {
    // 跳过 product-preview.html 中的演示容器（带 data-demo="true"）
    var existing = document.querySelectorAll('.tabbar');
    for (var i = 0; i < existing.length; i++) {
      var n = existing[i];
      if (n.getAttribute && n.getAttribute('data-demo') === 'true') continue;
      return n;
    }
    return document.getElementById('tabbar-mount') || null;
  }

  function mount() {
    var mountPoint = findMountPoint();
    var currentId = getCurrent();
    writeStored(currentId);

    var bar = buildTabbar(currentId);

    if (!mountPoint) {
      // 没有预留挂载点：追加到 #app 末尾，保证 5 Tab 一定出现
      var app = document.getElementById('app') || document.body;
      app.appendChild(bar);
    } else if (mountPoint.classList && mountPoint.classList.contains('tabbar')) {
      // 已有静态 .tabbar，替换内容但保留元素
      mountPoint.innerHTML = '';
      var children = Array.prototype.slice.call(bar.childNodes);
      for (var i = 0; i < children.length; i++) mountPoint.appendChild(children[i]);
    } else {
      mountPoint.appendChild(bar);
    }

    // 给 body 加标识（便于测试与沉浸页判断）
    document.body.setAttribute('data-lj-tabbar', currentId);
    document.body.setAttribute('data-lj-tabbar-version', 'v17.0');

    return bar;
  }

  // ---------- 公开 API ----------
  function go(tabId) {
    var found = TABS.filter(function (t) { return t.id === tabId; })[0];
    if (!found) return false;
    writeStored(found.id);
    window.location.href = resolveTabHref(found.href);
    return true;
  }

  function setBadge(tabId, n) {
    var a = document.querySelector('.tabbar a[data-tab="' + tabId + '"]');
    if (!a) return;
    var oldBadge = a.querySelector('.badge');
    if (oldBadge) oldBadge.remove();
    if (n && n > 0) {
      var b = el('span', { class: 'badge' }, [String(n)]);
      a.appendChild(b);
    }
  }

  window.LJTabbar = {
    TABS: TABS,
    mount: mount,
    go: go,
    setBadge: setBadge,
    getCurrent: getCurrent,
    STORAGE_KEY: STORAGE_KEY,
    __mounted: true
  };

  // ---------- 自动挂载 ----------
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    // 沉浸页豁免：body 上有 data-page="immersive" 或路径命中豁免名单则不挂载
    var immersivePages = ['plot-runner.html', 'game-3d.html', 'catalog.html'];
    var here = getPath().toLowerCase();
    var isImmersive = immersivePages.some(function (n) { return here === n; })
      || document.body.getAttribute('data-page') === 'immersive';
    if (isImmersive) return;
    try { mount(); } catch (e) { console.error('[LJTabbar] mount failed', e); }
  });
})();