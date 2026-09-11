/* =================================================================
 * 灵境 · 双生 V20.0 — 公版库逻辑层
 * 功能：3 Tab + 概览卡 + 双列瀑布流 + 4 种排序 + 详情 modal
 * ================================================================= */
(function () {
  'use strict';
  if (window.LJPubDom && window.LJPubDom.__mounted) return;

  var PD = window.PUBLIC_DOMAIN_DATA;
  var el = function (tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (children) (Array.isArray(children) ? children : [children]).forEach(function (c) {
      if (c == null) return;
      if (typeof c === 'string' || typeof c === 'number') e.appendChild(document.createTextNode(String(c)));
      else e.appendChild(c);
    });
    return e;
  };
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var currentTab = 'zh';
  var currentSort = 'integrity';

  // ---------- 概览卡 ----------
  function renderStats() {
    var stats = PD.stats;
    var bar = $('#pd-stats');
    if (!bar) return;
    bar.innerHTML = '';
    var items = [
      { label: '总计', val: stats.total + ' 本', sub: '完整下载 ' + stats.downloaded + '/' + stats.total },
      { label: '平均保留率', val: stats.avgKeepRate + '%', sub: '原文 ≥ 95% 标准' },
      { label: '平均字数', val: stats.avgWords + ' 万', sub: '公版内容规模' },
      { label: '自动收费点', val: stats.totalMonetization, sub: '平均 ' + stats.avgPrice + ' 灵晶/章' }
    ];
    items.forEach(function (it) {
      bar.appendChild(el('div', { class: 'pd-stat-item' }, [
        el('div', { class: 'pd-stat-label' }, [it.label]),
        el('div', { class: 'pd-stat-val' }, [it.val]),
        el('div', { class: 'pd-stat-sub' }, [it.sub])
      ]));
    });
  }

  // ---------- 瀑布流书籍卡 ----------
  function renderCard(b) {
    var pct = Math.round(b.integrity.keepRate * 100);
    var conclusion = b.integrity.conclusion;
    var conclusionBadge = conclusion === 'pass'
      ? el('span', { class: 'pd-card-badge pd-badge-pass' }, ['✅ ' + pct + '%'])
      : (conclusion === 'suspect' ? el('span', { class: 'pd-card-badge pd-badge-warn' }, ['⚠️ ' + pct + '%'])
                                  : el('span', { class: 'pd-card-badge pd-badge-fail' }, ['✗ ' + pct + '%']));

    return el('div', { class: 'pd-card', 'data-id': b.id }, [
      el('div', { class: 'pd-card-cover', style: 'background:' + b.cover }, [
        el('span', { class: 'pd-card-emoji' }, [b.emoji]),
        conclusionBadge
      ]),
      el('div', { class: 'pd-card-body' }, [
        el('div', { class: 'pd-card-title' }, [b.title]),
        el('div', { class: 'pd-card-author' }, [b.author + ' · ' + b.category]),
        el('div', { class: 'pd-card-meta' }, [
          el('span', null, [b.integrity.chapters + ' 章']),
          el('span', null, [Math.round(b.integrity.words / 10000) + ' 万字']),
          el('span', null, [b.source])
        ]),
        el('div', { class: 'pd-card-mon' }, [
          el('span', { class: 'pd-mon-badge' }, ['💎 自动']),
          el('span', { class: 'pd-mon-info' }, [
            (b.monetization.chapterLocks + b.monetization.choiceLocks + b.monetization.bonusLocks) + ' 个节点 · ' + b.monetization.avgPrice + ' 灵晶/章'
          ])
        ]),
        el('button', { class: 'pd-card-detail', 'data-id': b.id }, ['查看详情 →'])
      ])
    ]);
  }

  // ---------- 列表渲染 ----------
  function getCurrentBooks() {
    var books = currentTab === 'zh' ? PD.getByLang('zh')
              : currentTab === 'en' ? PD.getByLang('en')
              : PD.books;
    return sortBooks(books.slice(), currentSort);
  }

  function sortBooks(arr, by) {
    if (by === 'integrity') arr.sort(function (a, b) { return b.integrity.keepRate - a.integrity.keepRate; });
    else if (by === 'words') arr.sort(function (a, b) { return b.integrity.words - a.integrity.words; });
    else if (by === 'chapters') arr.sort(function (a, b) { return b.integrity.chapters - a.integrity.chapters; });
    else if (by === 'price') arr.sort(function (a, b) { return a.monetization.avgPrice - b.monetization.avgPrice; });
    return arr;
  }

  function renderList() {
    var grid = $('#pd-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var books = getCurrentBooks();
    if (!books.length) {
      grid.appendChild(el('div', { class: 'pd-empty' }, ['暂无数据']));
      return;
    }
    books.forEach(function (b) { grid.appendChild(renderCard(b)); });
    // 绑定详情按钮
    $$('.pd-card-detail').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        showDetail(btn.getAttribute('data-id'));
      });
    });
    // 卡片点击也打开
    $$('.pd-card').forEach(function (card) {
      card.addEventListener('click', function () { showDetail(card.getAttribute('data-id')); });
    });
  }

  // ---------- Tab 切换 ----------
  function setTab(tabId) {
    currentTab = tabId;
    $$('.pd-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    renderList();
  }

  // ---------- 排序 ----------
  function setSort(sortBy) {
    currentSort = sortBy;
    $$('.pd-sort-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-sort') === sortBy);
    });
    renderList();
  }

  // ---------- 详情 modal ----------
  function showDetail(id) {
    var b = PD.getById(id);
    if (!b) return;
    var modal = $('#pd-detail-modal');
    if (!modal) return;
    var pct = Math.round(b.integrity.keepRate * 100);
    var total = b.monetization.chapterLocks + b.monetization.choiceLocks + b.monetization.bonusLocks;
    modal.innerHTML = '';
    modal.classList.add('open');
    modal.appendChild(el('div', { class: 'pd-detail-card' }, [
      el('div', { class: 'pd-detail-cover', style: 'background:' + b.cover }, [
        el('span', { class: 'pd-detail-emoji' }, [b.emoji]),
        el('button', { class: 'pd-detail-close', onclick: 'document.getElementById("pd-detail-modal").classList.remove("open")' }, ['✕'])
      ]),
      el('div', { class: 'pd-detail-body' }, [
        el('h3', null, [b.title]),
        el('div', { class: 'pd-detail-author' }, [b.author + ' · ' + b.category + ' · ' + b.source]),

        el('div', { class: 'pd-detail-section-title' }, ['完整性校验报告']),
        el('div', { class: 'pd-detail-integrity' }, [
          renderIntegrityRow('文件大小', b.integrity.size + ' KB', 'pass'),
          renderIntegrityRow('章节数', b.integrity.chapters + ' 章', 'pass'),
          renderIntegrityRow('总字数', Math.round(b.integrity.words / 10000) + ' 万字', 'pass'),
          renderIntegrityRow('原文保留率', pct + '%', b.integrity.conclusion)
        ]),

        el('div', { class: 'pd-detail-section-title' }, ['自动收费点（系统生成）']),
        el('div', { class: 'pd-detail-mon' }, [
          el('div', { class: 'pd-mon-stat' }, [
            el('span', null, ['章节锁']),
            el('b', null, [String(b.monetization.chapterLocks)])
          ]),
          el('div', { class: 'pd-mon-stat' }, [
            el('span', null, ['选择锁']),
            el('b', null, [String(b.monetization.choiceLocks)])
          ]),
          el('div', { class: 'pd-mon-stat' }, [
            el('span', null, ['番外锁']),
            el('b', null, [String(b.monetization.bonusLocks)])
          ]),
          el('div', { class: 'pd-mon-stat' }, [
            el('span', null, ['总计 / 平均价格']),
            el('b', null, [total + ' 个 / ' + b.monetization.avgPrice + ' 灵晶'])
          ])
        ]),

        el('div', { class: 'pd-detail-actions' }, [
          el('button', { class: 'pd-detail-action-secondary', onclick: 'window.LJPubDom.closeDetail()' }, ['关闭']),
          el('button', { class: 'pd-detail-action-primary', onclick: 'window.LJPubDom.enterPlot("' + b.id + '")' }, ['进入小说世界 →'])
        ])
      ])
    ]));
  }

  function renderIntegrityRow(label, val, conclusion) {
    var ico = conclusion === 'pass' ? '✅' : (conclusion === 'suspect' ? '⚠️' : '✗');
    var cls = conclusion === 'pass' ? 'pd-i-pass' : (conclusion === 'suspect' ? 'pd-i-warn' : 'pd-i-fail');
    return el('div', { class: 'pd-i-row ' + cls }, [
      el('span', { class: 'pd-i-ico' }, [ico]),
      el('span', { class: 'pd-i-label' }, [label]),
      el('span', { class: 'pd-i-val' }, [val])
    ]);
  }

  function closeDetail() {
    var modal = $('#pd-detail-modal');
    if (modal) modal.classList.remove('open');
  }

  function enterPlot(id) {
    closeDetail();
    // 三国演义 → 专属小说世界（卷制 + 双轨道具）
    if (id === 'sanguoyanyi') {
      window.location.href = 'sanguo-world.html';
      return;
    }
    // V20-I 审查修复：其余公版书尚未建世界，明确提示而不是跳到错误内容
    var book = ((window.PUBLIC_DOMAIN_DATA && window.PUBLIC_DOMAIN_DATA.books) || []).filter(function (b) { return b.id === id; })[0];
    var name = book ? book.title : '该作品';
    showWorldToast('「' + name + '」小说世界制作中 · v5.21+ 即将开放');
  }

  // V20-I：轻量 toast（公版库页原本无 toast 组件）
  function showWorldToast(msg) {
    var old = document.getElementById('pd-world-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = 'pd-world-toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:9999;'
      + 'background:rgba(26,26,46,.92);border:1px solid rgba(255,255,255,.18);color:#fff;'
      + 'padding:10px 18px;border-radius:999px;font-size:13px;backdrop-filter:blur(8px);'
      + 'box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:86vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .4s';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 420);
    }, 2200);
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    $$('.pd-tab').forEach(function (t) {
      t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); });
    });
    $$('.pd-sort-btn').forEach(function (b) {
      b.addEventListener('click', function () { setSort(b.getAttribute('data-sort')); });
    });
    // 点击 modal 背景关闭
    var modal = $('#pd-detail-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDetail();
      });
    }
  }

  // ---------- 主渲染 ----------
  function mount() {
    renderStats();
    bindEvents();
    setTab('zh');
    setSort('integrity');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.LJPubDom = {
    __mounted: true,
    showDetail: showDetail,
    closeDetail: closeDetail,
    enterPlot: enterPlot,
    setTab: setTab,
    setSort: setSort
  };
})();