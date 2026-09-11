/* =================================================================
 * 灵境 · 双生 V18.0 — 心屿交互层（5 子标签 + 角色卡片 + 弹窗 + 免责）
 * 数据源：window.HEART_DATA
 * ================================================================= */
(function () {
  'use strict';
  if (window.LJHeart && window.LJHeart.__mounted) return;

  // ---------- 当前状态 ----------
  var currentSub = 'accompany';
  var currentFilter = 'all'; // all / user_created / novel_brought_out

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

  // ---------- 子标签切换 ----------
  function setSub(id) {
    currentSub = id;
    $$('.heart-sn').forEach(function (n) {
      n.classList.toggle('active', n.getAttribute('data-sn') === id);
    });
    // 控制陪伴子筛选可见性
    var subfilter = $('#heart-subfilter');
    if (subfilter) subfilter.style.display = (id === 'accompany') ? 'flex' : 'none';
    // 控制"创建新角色"按钮可见性
    var createBtn = $('#heart-create');
    if (createBtn) createBtn.style.display = (id === 'accompany') ? 'flex' : 'none';
    renderContent();
  }

  // ---------- 子筛选 ----------
  function setFilter(f) {
    currentFilter = f;
    $$('#heart-subfilter .hf-chip').forEach(function (n) {
      n.classList.toggle('active', n.getAttribute('data-f') === f);
    });
    renderContent();
  }

  // ---------- 渲染角色卡片（陪伴） ----------
  function renderCharacterCard(c) {
    var sourceBadge = '';
    var sourceLabel = '';
    if (c.source_type === 'user_created') {
      sourceBadge = '<span class="src-badge src-create">[创]</span>';
      sourceLabel = '🪄 我创建';
    } else if (c.source_type === 'novel_brought_out') {
      sourceBadge = '<span class="src-badge src-shuang">[双]</span>';
      sourceLabel = '💫 双生';
    } else if (c.source_type === 'official') {
      sourceBadge = '<span class="src-badge src-official">[官]</span>';
      sourceLabel = '官方预设';
    }
    var occupationQa = c.occupation && c.occupation_qa_enabled
      ? '<span class="occ-tag">💼 ' + c.occupation + '可问答</span>' : '';
    var buttons = '<a class="card-btn card-btn-chat" href="chat.html?cid=' + c.id + '">聊天</a>';
    if (c.source_type === 'novel_brought_out') {
      buttons += '<a class="card-btn card-btn-world" href="plot-runner.html?novelId=' + c.novel_id + '&characterId=' + c.id + '">进入 TA 的世界</a>';
    }

    var card = el('div', { class: 'char-card' }, [
      el('div', { class: 'cc-left' }, [
        el('div', { class: 'cc-avatar-wrap' }, [
          el('div', { class: 'cc-avatar' }, [c.avatar]),
          el('span', { class: 'src-badge src-' + (c.source_type === 'user_created' ? 'create' : (c.source_type === 'novel_brought_out' ? 'shuang' : 'official')) }, [c.source_type === 'user_created' ? '[创]' : (c.source_type === 'novel_brought_out' ? '[双]' : '[官]')])
        ])
      ]),
      el('div', { class: 'cc-right' }, [
        el('div', { class: 'cc-name-row' }, [
          el('span', { class: 'cc-name' }, [c.name]),
          el('span', { class: 'cc-source' }, [sourceLabel])
        ]),
        el('div', { class: 'cc-meta-row' }, [
          el('span', { class: 'cc-stage' }, [c.stage]),
          el('span', { class: 'cc-dot' }, [' · ']),
          el('span', { class: 'cc-intimacy' }, ['亲密度 ' + c.intimacy])
        ]),
        el('div', { class: 'cc-preview' }, [c.preview]),
        occupationQa ? el('div', { class: 'cc-occ-row' }, [el('span', { class: 'occ-tag' }, ['💼 ' + c.occupation + '可问答'])]) : null,
        el('div', { class: 'cc-btns', html: buttons })
      ])
    ]);
    return card;
  }

  // ---------- 渲染陪伴列表 ----------
  function renderAccompany(main) {
    main.innerHTML = '';
    var all = window.HEART_DATA.CHARACTERS;
    var filtered = all;
    if (currentFilter === 'user_created') {
      filtered = all.filter(function (c) { return c.source_type === 'user_created'; });
    } else if (currentFilter === 'novel_brought_out') {
      filtered = all.filter(function (c) { return c.source_type === 'novel_brought_out'; });
    }
    if (filtered.length === 0) {
      main.appendChild(el('div', { class: 'heart-empty' }, [
        '该分类下暂无角色'
      ]));
      return;
    }
    var list = el('div', { class: 'char-list' });
    filtered.forEach(function (c) {
      list.appendChild(renderCharacterCard(c));
    });
    main.appendChild(list);
  }

  // ---------- 渲染精选（双列瀑布流） ----------
  function renderFeatured(main) {
    main.innerHTML = '';
    var grid = el('div', { class: 'featured-grid' });
    window.HEART_DATA.FEATURED.forEach(function (c) {
      var card = el('a', { class: 'feat-card', href: 'chat.html?cid=' + c.id }, [
        el('div', { class: 'fc-avatar' }, [c.avatar]),
        el('div', { class: 'fc-name' }, [c.name]),
        el('div', { class: 'fc-occ' }, ['💼 ' + c.occupation]),
        el('div', { class: 'fc-intro' }, [c.intro]),
        el('div', { class: 'fc-meta' }, ['亲密 · ' + c.intimacy])
      ]);
      grid.appendChild(card);
    });
    main.appendChild(grid);
  }

  // ---------- 渲染记忆（时间线） ----------
  function renderMemories(main) {
    main.innerHTML = '';
    var list = el('div', { class: 'mem-list' });
    window.HEART_DATA.MEMORIES.forEach(function (m) {
      var item = el('div', { class: 'mem-item' }, [
        el('span', { class: 'mi-avatar' }, [m.avatar]),
        el('div', { class: 'mi-body' }, [
          el('div', { class: 'mi-head' }, [
            el('span', { class: 'mi-name' }, [m.character]),
            el('span', { class: 'mi-type ' + (m.type === '里程碑' || m.type === '初次相遇' ? 'mi-special' : '') }, [m.type]),
            el('span', { class: 'mi-time' }, [m.time])
          ]),
          el('div', { class: 'mi-content' }, [m.content])
        ])
      ]);
      list.appendChild(item);
    });
    main.appendChild(list);
  }

  // ---------- 渲染故事（仅双生） ----------
  function renderStories(main) {
    main.innerHTML = '';
    var stories = window.HEART_DATA.STORIES;
    if (stories.length === 0) {
      main.appendChild(el('div', { class: 'heart-empty' }, ['暂无双生角色']));
      return;
    }
    var list = el('div', { class: 'story-list' });
    stories.forEach(function (s) {
      var item = el('div', { class: 'story-item' }, [
        el('div', { class: 'si-avatar' }, [s.avatar]),
        el('div', { class: 'si-body' }, [
          el('div', { class: 'si-name' }, [s.name + '  💫 双生']),
          el('div', { class: 'si-novel' }, ['来自《' + s.novel_name + '》']),
          el('div', { class: 'si-progress' }, [s.progress])
        ]),
        el('a', { class: 'si-btn', href: 'plot-runner.html?novelId=' + s.novel_id + '&characterId=' + s.id }, ['进入 TA 的世界'])
      ]);
      list.appendChild(item);
    });
    main.appendChild(list);
  }

  // ---------- 渲染搜索 ----------
  function renderSearch(main) {
    var oldInput = $('#heart-search-input');
    var oldValue = oldInput ? oldInput.value : '';
    main.innerHTML = '';
    var inputWrap = el('div', { class: 'mem-search-bar' });
    var icoSpan = el('span', { class: 'hs-ico' }, ['🔍']);
    var input = el('input', { id: 'heart-search-input', type: 'search', placeholder: '搜角色名 / 职业 / 关键词', value: oldValue });
    inputWrap.appendChild(icoSpan);
    inputWrap.appendChild(input);
    main.appendChild(inputWrap);
    // 结果容器（独立于 input wrapper，避免 input 事件重建）
    var resultArea = el('div', { id: 'heart-search-results' });
    main.appendChild(resultArea);

    function refreshResults() {
      var q = (input.value || '').trim().toLowerCase();
      var all = window.HEART_DATA.CHARACTERS.concat(window.HEART_DATA.FEATURED.map(function (f) {
        return { id: f.id, name: f.name, avatar: f.avatar, occupation: f.occupation, source_type: 'official', preview: f.intro, intimacy: f.intimacy, stage: '亲密', occupation_qa_enabled: true };
      }));
      var matched = q ? all.filter(function (c) {
        return (c.name && c.name.toLowerCase().indexOf(q) > -1)
            || (c.occupation && c.occupation.indexOf(q) > -1)
            || (c.preview && c.preview.indexOf(q) > -1);
      }) : all.slice(0, 10);
      resultArea.innerHTML = '';
      if (matched.length === 0) {
        resultArea.appendChild(el('div', { class: 'heart-empty' }, ['没有匹配角色']));
      } else {
        var grid = el('div', { class: 'char-list' });
        matched.forEach(function (c) { grid.appendChild(renderCharacterCard(c)); });
        resultArea.appendChild(grid);
      }
    }
    input.addEventListener('input', refreshResults);
    refreshResults();
  }

  function renderContent() {
    var main = $('#heart-main');
    if (!main) return;
    if (currentSub === 'accompany') renderAccompany(main);
    else if (currentSub === 'featured') renderFeatured(main);
    else if (currentSub === 'memories') renderMemories(main);
    else if (currentSub === 'stories') renderStories(main);
    else if (currentSub === 'search') renderSearch(main);
  }

  // ---------- 弹窗 ----------
  function showIntro() {
    try {
      if (localStorage.getItem('lingjing_v5170_xinyu_intro_seen') === '1') return;
    } catch (e) {}
    openDialog({
      title: '欢迎来到心屿',
      body: '<div style="text-align:left;font-size:13px;line-height:1.6">' +
        '<p style="margin-bottom:12px">心屿是你和 AI 角色共同生活的空间。这里的角色有两种来源：</p>' +
        '<div style="background:rgba(78,204,163,.1);border:1px solid rgba(78,204,163,.3);padding:12px;border-radius:8px;margin-bottom:10px">' +
        '<b style="color:var(--ok)">🪄 我创建的</b><br>' +
        '<span style="color:var(--sub);font-size:12px">你亲手创建的角色，从零开始培养关系。设定职业后，TA 可以回答相关职业问题。</span></div>' +
        '<div style="background:rgba(233,69,96,.1);border:1px solid rgba(233,69,96,.3);padding:12px;border-radius:8px;margin-bottom:12px">' +
        '<b style="color:var(--accent)">💫 双生角色</b><br>' +
        '<span style="color:var(--sub);font-size:12px">从小说世界带出的角色，保留小说中的共同记忆。除了聊天，还能带你回到 TA 的故事世界。</span></div>' +
        '<p style="margin-bottom:6px;font-weight:600">【所有角色都可以】</p>' +
        '<p style="color:var(--sub);font-size:12px">✅ 情感陪伴、聊天解闷<br>✅ 根据职业回答科普问题<br>✅ 记住你说过的话<br>✅ 关系随互动成长</p>' +
        '</div>',
      okText: '我知道了',
      onOk: function () {
        try { localStorage.setItem('lingjing_v5170_xinyu_intro_seen', '1'); } catch (e) {}
      }
    });
  }

  function openDialog(opt) {
    var mask = document.createElement('div');
    mask.className = 'heart-dialog-mask';
    var dlg = document.createElement('div');
    dlg.className = 'heart-dialog';
    dlg.innerHTML =
      '<h3>' + opt.title + '</h3>' +
      '<div class="hd-body">' + opt.body + '</div>' +
      '<button class="hd-btn">' + (opt.okText || '确认') + '</button>';
    mask.appendChild(dlg);
    document.body.appendChild(mask);
    dlg.querySelector('.hd-btn').addEventListener('click', function () {
      mask.remove();
      if (opt.onOk) opt.onOk();
    });
    // V20-B：点击空白处关闭（不再锁定用户）
    mask.addEventListener('click', function (e) {
      if (e.target === mask) mask.remove();
    });
  }

  // ---------- 初始化 ----------
  function bindEvents() {
    $$('.heart-sn').forEach(function (n) {
      n.addEventListener('click', function () { setSub(n.getAttribute('data-sn')); });
    });
    $$('#heart-subfilter .hf-chip').forEach(function (n) {
      n.addEventListener('click', function () { setFilter(n.getAttribute('data-f')); });
    });
    var createBtn = $('#heart-create');
    if (createBtn) createBtn.addEventListener('click', function () {
      if (window.LJToast) window.LJToast.show('warn', '创建新角色', '即将开放');
    });
    // 处理 #accompany hash 直接跳到陪伴
    if (window.location.hash === '#accompany') setSub('accompany');
  }

  function init() {
    if (!window.HEART_DATA) { console.error('[LJHeart] HEART_DATA not loaded'); return; }
    bindEvents();
    setSub('accompany');
    // 首次进入弹窗
    setTimeout(showIntro, 300);
  }

  window.LJHeart = {
    init: init,
    setSub: setSub,
    setFilter: setFilter,
    openDialog: openDialog,
    showIntro: showIntro,
    __mounted: true
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();