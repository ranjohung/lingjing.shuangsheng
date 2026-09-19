
(function(){
  'use strict';

  // ============ 初始化 ============
  function init() {
    var Canon = window.NovelWorldCanon;
    var Runtime = window.NovelWorldRuntime;
    var Stage = window.NovelWorldStage;

    // 初始化 Runtime
    Runtime.init();
    Stage.init();
    Stage.setupStageClick();

    // 注册 CANON_CHAPTER_END 处理器
    Canon.setChapterEndHandler(function(chapter, hasNext, resolve) {
      showChapterEndOverlay(chapter, hasNext, resolve);
    });

    // 注册 SHOW_SYSTEM_MESSAGE（如果未注册）
    if (!Runtime.getRegisteredActions().includes('SHOW_SYSTEM_MESSAGE')) {
      Runtime.registerAction('SHOW_SYSTEM_MESSAGE', function(p, ctrl) {
        Stage.showSystemMessage(p.text || '');
        ctrl.advance();
      });
    }

    Canon.registerCanonActions();

    // 全局函数：返回章节列表
    window.__canonGoChapters = function() {
      document.getElementById('canon-stage-screen').classList.remove('show');
      document.getElementById('canon-chapter-list').classList.add('show');
      Stage.clearDialogue();
    };

    // 渲染书库
    renderBookSelect();

    // V27: preview=1 作者预览模式（work-editor 发起，返回键回编辑器）
    try {
      var __pqs = __LJ_QS__ || '';
      if (/(?:^|&)preview=1/.test(__pqs)) {
        window.__ljPreviewMode = true;
        var __pvbar = document.getElementById('lj-preview-bar');
        if (__pvbar) {
          __pvbar.classList.add('show');
          __pvbar.querySelector('.pv-back').addEventListener('click', function () {
            __ljPreviewBack();
          });
        }
      }
    } catch (e) {}

    // V3.0: ?book= / &chapter= 直达（shell buildDoc 注入 __LJ_QS__）
    try {
      var QS = __LJ_QS__ || '';
      var pm = /book=([a-z]+)/.exec(QS);
      var cm = /chapter=(\d+)/.exec(QS);
      if (pm) {
        var bid = pm[1];
        Canon.loadWorld(bid, function (result) {
          if (!result) return;
          document.getElementById('canon-book-select').style.display = 'none';
          document.getElementById('canon-chapter-list').classList.add('show');
          renderChapterList();
          if (cm) startReading(parseInt(cm[1], 10));
        });
      }
    } catch (e) {}
  }

  // ============ 书库选择 ============
  function renderBookSelect() {
    var Canon = window.NovelWorldCanon;
    var books = Canon.getBooks();
    var grid = document.getElementById('canon-book-grid');
    grid.innerHTML = '';
    books.forEach(function(b) {
      var card = document.createElement('div');
      card.className = 'canon-book-card';
      card.innerHTML =
        '<div class="cov" style="background:' + b.cov + '">' + b.emoji + '</div>' +
        '<h3>' + b.title + '</h3>' +
        '<div class="au">作者：' + b.author + '</div>' +
        '<div class="tag">公版名著</div>' +
        '<div class="lock">SHA-256 Lock</div>';
      card.addEventListener('click', function() {
        selectBook(b.id);
      });
      grid.appendChild(card);
    });
  }

  // ============ 选择书目 ============
  function selectBook(bookId) {
    var Canon = window.NovelWorldCanon;
    document.getElementById('canon-book-select').style.display = 'none';
    document.getElementById('canon-chapter-list').classList.add('show');

    Canon.loadWorld(bookId, function(result) {
      if (!result) {
        alert('数据加载失败');
        return;
      }
      renderChapterList();
    });
  }

  // ============ 章节列表 ============
  function renderChapterList() {
    var Canon = window.NovelWorldCanon;
    var meta = Canon.getMeta() || {};
    var chapters = Canon.getChapters();
    var hashInfo = Canon.getHashInfo();

    document.getElementById('canon-cl-title').textContent =
      (meta.title || '未知') + ' · 章节目录';

    var lockEl = document.getElementById('canon-cl-lock');
    if (hashInfo.verified) {
      lockEl.innerHTML = 'Canon Lock: <span>SHA-256 Verified</span> · ' + hashInfo.hashed + '/' + hashInfo.totalAnchors + ' 段已锁定';
    } else {
      lockEl.innerHTML = 'Canon Lock: <span style="color:#ff9800">校验中…</span> · ' + hashInfo.hashed + '/' + hashInfo.totalAnchors + ' 段';
    }

    var grid = document.getElementById('canon-chapter-grid');
    grid.innerHTML = '';
    chapters.forEach(function(ch) {
      var card = document.createElement('div');
      card.className = 'canon-chapter-card';
      card.innerHTML =
        '<div class="ch-num">第 ' + ch.num + ' 回</div>' +
        '<div class="ch-preview">' + (ch.firstText || '') + '…</div>' +
        '<div class="ch-meta">' + ch.count + ' 段原文</div>';
      card.addEventListener('click', function() {
        startReading(ch.num);
      });
      grid.appendChild(card);
    });
  }

  // ============ 开始阅读 ============
  function startReading(chapter) {
    var Canon = window.NovelWorldCanon;
    var Stage = window.NovelWorldStage;

    document.getElementById('canon-chapter-list').classList.remove('show');
    document.getElementById('canon-stage-screen').classList.add('show');

    // 确保舞台已初始化
    if (!Stage._LAYERS || !Stage._LAYERS().bg) {
      Stage.init();
      Stage.setupStageClick();
    }

    Canon.playChapter(chapter);
  }

  // ============ 章节结束导航 ============
  function showChapterEndOverlay(chapter, hasNext, resolve) {
    var Stage = window.NovelWorldStage;
    var sysLayer = document.getElementById('lj-sys-layer');
    if (!sysLayer) return resolve('chapters');

    var overlay = document.createElement('div');
    overlay.className = 'canon-end-overlay';
    var card = document.createElement('div');
    card.className = 'canon-end-card';

    var btns = '';
    if (window.__ljPreviewMode) {
      btns += '<button class="primary" data-act="back-edit">← 返回编辑器</button>';
    }
    if (hasNext) {
      if (btns) {
        btns += '<button data-act="next">继续阅读下一回 →</button>';
      } else {
        btns = '<button class="primary" data-act="next">继续阅读下一回 →</button>';
      }
    }
    btns += '<button data-act="restart">重新阅读本章</button>';
    btns += '<button data-act="chapters">返回章节目录</button>';

    card.innerHTML =
      '<h3>第 ' + chapter + ' 回 · 完</h3>' +
      '<div class="end-actions">' + btns + '</div>';
    overlay.appendChild(card);
    sysLayer.appendChild(overlay);
    sysLayer.style.display = 'flex';

    overlay.querySelectorAll('button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.dataset.act === 'back-edit') {
          overlay.remove();
          if (!sysLayer.querySelector('.canon-end-overlay') && !sysLayer.querySelector('.lj-menu-overlay')) {
            sysLayer.style.display = 'none';
          }
          __ljPreviewBack();
          return;
        }
        overlay.remove();
        if (!sysLayer.querySelector('.canon-end-overlay') && !sysLayer.querySelector('.lj-menu-overlay')) {
          sysLayer.style.display = 'none';
        }
        resolve(btn.dataset.act);
      });
    });
  }

  // ============ V27: 返回编辑器（弹 shell LJ_BACK_STACK） ============
  function __ljPreviewBack() {
    try { parent.postMessage({ lj: 'back' }, '*'); } catch (e) { try { history.back(); } catch (e2) {} }
  }
  window.__ljPreviewBack = __ljPreviewBack;

  // ============ 返回书库 ============
  window.__canonBackToBooks = function() {
    document.getElementById('canon-chapter-list').classList.remove('show');
    document.getElementById('canon-book-select').style.display = 'flex';
  };

  // ============ 启动 ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
