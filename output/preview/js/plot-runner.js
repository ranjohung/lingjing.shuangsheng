/* =================================================================
 * 灵境 · 双生 V18.0 — 小说世界 plot-runner 核心交互
 * 功能：30ms 打字机 + 选项悬浮 + 数值跳动 + 表情切换 + CG + 存档
 * 沉浸页豁免：底部无 5 Tab，仅左上 [← 返回]
 * ================================================================= */
(function () {
  'use strict';
  if (window.LJPlot && window.LJPlot.__mounted) return;

  // ---------- 章节数据（mock · 长夜城 + 深海回声 + 三国）----------
  var NOVELS = {
    changyecheng: {
      id: 'changyecheng',
      title: '长夜城',
      bg: 'linear-gradient(160deg,#2E3A6E,#4A3A8C)',
      bgNight: 'linear-gradient(160deg,#0a0a1a,#1a1a3e)',
      emoji: '🏯',
      chapters: [
        { id: 'ch1', title: '初入长夜城', scenes: [
          { type: 'bg', value: 'bgNight' },
          { type: 'char', speaker: 'narrator', portrait: '🌙', emotion: 'calm',
            text: '夜色沉沉，你独自一人踏入长夜城。街巷空寂，唯有远处宫灯微微明灭。' },
          { type: 'char', speaker: '林清雪', portrait: '🌸', emotion: 'happy',
            text: '你来了。我等你很久了——跟我走吧，我带你去见一个人。' },
          { type: 'choices', items: [
            { text: 'A. 跟她走', delta: { intimacy: +5, trust: +2 } },
            { text: 'B. 问她是谁', delta: { intimacy: 0, trust: +1 } },
            { text: 'C. 保持警惕', delta: { intimacy: -2, trust: +3 } }
          ]},
          { type: 'cg', title: '初遇·月下相逢',
            bg: 'linear-gradient(135deg,#E94560,#6C5CE7)' },
          { type: 'char', speaker: 'narrator', portrait: '🌙', emotion: 'calm',
            text: '——第一章完。你与林清雪的关系开启了一段羁绊。' },
          { type: 'end', chapter: 1, ending: 'good_start' }
        ]},
        { id: 'ch2', title: '御书房的对峙', scenes: [
          { type: 'bg', value: 'bg' },
          { type: 'char', speaker: '皇帝', portrait: '👑', emotion: 'angry',
            text: '大胆！谁允许你擅闯御书房的？来人——' },
          { type: 'choices', items: [
            { text: 'A. 跪下求饶', delta: { intimacy: +1, trust: 0 } },
            { text: 'B. 直面皇帝', delta: { intimacy: -1, trust: +4 } },
            { text: 'C. 转身离开', delta: { intimacy: 0, trust: +1 } }
          ]},
          { type: 'end', chapter: 2, ending: 'in_progress' }
        ]}
      ]
    },
    shenhuihuisheng: {
      id: 'shenhuihuisheng',
      title: '深海回声',
      bg: 'linear-gradient(160deg,#2E5E56,#00B894)',
      bgNight: 'linear-gradient(160deg,#0a0a1a,#1a3a3e)',
      emoji: '🌊',
      chapters: [
        { id: 'ch1', title: '海边的来电', scenes: [
          { type: 'bg', value: 'bg' },
          { type: 'char', speaker: '林清雪', portrait: '🌸', emotion: 'calm',
            text: '……你听到了吗？海的那边，有人在叫你的名字。' },
          { type: 'choices', items: [
            { text: 'A. 回答她', delta: { intimacy: +3, trust: +2 } },
            { text: 'B. 沉默', delta: { intimacy: 0, trust: +1 } }
          ]},
          { type: 'end', chapter: 1, ending: 'in_progress' }
        ]}
      ]
    },
    sanguo: {
      id: 'sanguo',
      title: '三国·吕布篇',
      bg: 'linear-gradient(160deg,#B8863B,#8C5A2B)',
      bgNight: 'linear-gradient(160deg,#2E1A1A,#4A2A1A)',
      emoji: '⚔️',
      chapters: [
        { id: 'ch1', title: '穿越成吕布', scenes: [
          { type: 'bg', value: 'bg' },
          { type: 'char', speaker: '吕布', portrait: '⚔️', emotion: 'calm',
            text: '我乃温侯吕布，你是何人？报上名来！' },
          { type: 'choices', items: [
            { text: 'A. 我是你的谋士', delta: { intimacy: +2, trust: +3 } },
            { text: 'B. 我来自千年之后', delta: { intimacy: -1, trust: +1 } },
            { text: 'C. 保持沉默', delta: { intimacy: 0, trust: +2 } }
          ]},
          { type: 'end', chapter: 1, ending: 'in_progress' }
        ]}
      ]
    },
    saibochangye: {
      id: 'saibochangye',
      title: '赛博长夜',
      bg: 'linear-gradient(160deg,#5A6B8E,#C95B9C)',
      bgNight: 'linear-gradient(160deg,#0a0a1a,#3a1a3e)',
      emoji: '🤖',
      chapters: [
        { id: 'ch1', title: '系统上线', scenes: [
          { type: 'bg', value: 'bgNight' },
          { type: 'char', speaker: '云雀', portrait: '🤖', emotion: 'happy',
            text: '欢迎回来，旅人。今天的赛博城市有什么新故事？' },
          { type: 'choices', items: [
            { text: 'A. 去看看', delta: { intimacy: +2, trust: +1 } },
            { text: 'B. 不想出门', delta: { intimacy: -1, trust: +2 } }
          ]},
          { type: 'end', chapter: 1, ending: 'in_progress' }
        ]}
      ]
    }
  };

  // 沉浸页默认选第一本
  var currentNovel = null;
  var currentChapterIdx = 0;
  var currentSceneIdx = 0;
  var sceneTypingTimer = null;
  var sceneTextShown = 0;
  var sceneFullText = '';
  var stats = { intimacy: 0, trust: 0 };
  var saves = [];

  // ---------- 工具 ----------
  function $(s, p) { return (p || document).querySelector(s); }
  function $$(s, p) { return Array.prototype.slice.call((p || document).querySelectorAll(s)); }

  // ---------- 初始化 ----------
  function init() {
    // 解析 URL 参数：?novelId=xx（v5.13 链路）/ ?novel=xx（v6.4 plot-detail 与公版库链路）
    // V20-I 审查修复：兼容两种参数名，且未知 ID 不再静默回退到《长夜城》
    var params = new URLSearchParams(window.location.search);
    var novelId = params.get('novelId') || params.get('novel') || 'changyecheng';
    currentNovel = NOVELS[novelId] || null;
    if (!currentNovel) {
      renderUnsupported(novelId);
      return;
    }
    currentChapterIdx = 0;
    currentSceneIdx = 0;
    stats = { intimacy: 0, trust: 0 };
    loadSaves();
    bindUI();
    renderScene();
    setTimeout(function () {
      if (window.LJToast) window.LJToast.show('ok', '剧情已加载', currentNovel.title + ' · 第一章');
    }, 600);
  }

  // V20-I：未知小说 ID 的明确提示页（不再加载错误的默认小说）
  function renderUnsupported(novelId) {
    var title = novelId;
    try {
      if (window.NovelStore && window.NovelStore.loadNovel) {
        var p = window.NovelStore.loadNovel(novelId);
        if (p && p.novel && p.novel.title) title = p.novel.title;
      }
    } catch (e) {}
    var esc = String(title).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
    var stage = $('#plot-stage');
    if (stage) {
      stage.insertAdjacentHTML('beforeend',
        '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#1A1A2E,#16213E);z-index:60;">'
        + '<div style="text-align:center;padding:36px 28px;max-width:300px;color:#fff;">'
        + '<div style="font-size:44px;margin-bottom:14px;">📖</div>'
        + '<div style="font-size:17px;font-weight:700;margin-bottom:8px;">「' + esc + '」</div>'
        + '<div style="font-size:13px;color:rgba(255,255,255,.68);line-height:1.9;margin-bottom:22px;">该小说暂未接入此运行器<br>通用小说世界引擎 v5.21+ 即将开放</div>'
        + '<a href="library.html" style="display:inline-block;padding:10px 28px;border-radius:999px;background:#E94560;color:#fff;font-size:14px;text-decoration:none;font-weight:600;">返回题材库</a>'
        + '</div></div>');
    }
  }

  function bindUI() {
    // 点击屏幕推进
    var stage = $('#plot-stage');
    if (stage) stage.addEventListener('click', function () { advanceScene(); });
    // 工具栏
    var tColl = $('#plot-collapse');
    if (tColl) tColl.addEventListener('click', function () {
      if (window.LJToast) window.LJToast.show('warn', '收起工具栏', '点击屏幕任意位置恢复');
    });
    var tMenu = $('#plot-menu');
    if (tMenu) tMenu.addEventListener('click', toggleSystemMenu);
    // V20-L 设计文档 §7.2：灵境平台标识按钮（🔮）
    var tBrand = $('#plot-brand');
    if (tBrand) tBrand.addEventListener('click', function (e) {
      e.stopPropagation();
      if (window.LJToast) window.LJToast.show('info', '灵境 · 双生', '命运卡画廊 v5.21+ 即将开放');
    });
    var tWorld = $('#plot-world');
    if (tWorld) tWorld.addEventListener('click', toggleMapMode);
    var tFav = $('#plot-fav');
    if (tFav) tFav.addEventListener('click', function () {
      if (window.LJToast) window.LJToast.show('ok', '已收藏', currentNovel.title);
    });
    var tShare = $('#plot-share');
    if (tShare) tShare.addEventListener('click', function () {
      if (window.LJToast) window.LJToast.show('warn', '分享', '即将开放');
    });
    var tShot = $('#plot-shot');
    if (tShot) tShot.addEventListener('click', function () {
      if (window.LJToast) window.LJToast.show('ok', '截图已保存', '到相册');
    });
    // 功能按钮
    $$('.plot-func').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var fn = b.getAttribute('data-fn');
        if (fn === 'auto') {
          if (window.LJToast) window.LJToast.show('warn', '自动模式', '即将开放');
        } else if (fn === 'speed') {
          if (window.LJToast) window.LJToast.show('warn', '快进', '即将开放');
        } else if (fn === 'save') {
          openSavePanel();
        } else if (fn === 'load') {
          openLoadPanel();
        } else if (fn === 'history') {
          if (window.LJToast) window.LJToast.show('warn', '回放', '即将开放');
        }
      });
    });
    // 返回箭头
    var back = $('#plot-back');
    if (back) back.addEventListener('click', function () {
      if (window.history.length > 1) window.history.back();
      else window.location.href = 'library.html';
    });
    // V20-L §7.4：地图建筑 / 人物交互
    bindMapEvents();
  }

  // ---------- 渲染场景 ----------
  function renderScene() {
    var chapter = currentNovel.chapters[currentChapterIdx];
    var scene = chapter.scenes[currentSceneIdx];
    if (!scene) { onChapterEnd(); return; }

    if (scene.type === 'bg') {
      var bgEl = $('#plot-bg');
      if (bgEl) {
        var bgMap = { bg: currentNovel.bg, bgNight: currentNovel.bgNight };
        bgEl.style.background = bgMap[scene.value] || currentNovel.bg;
      }
      currentSceneIdx++;
      renderScene();
    } else if (scene.type === 'char') {
      renderCharScene(scene);
    } else if (scene.type === 'choices') {
      renderChoices(scene);
    } else if (scene.type === 'cg') {
      renderCG(scene);
    } else if (scene.type === 'end') {
      onChapterEnd(scene);
    }
  }

  function renderCharScene(scene) {
    var portraitEl = $('#plot-portrait');
    var nameEl = $('#plot-name');
    var textEl = $('#plot-text');
    var contEl = $('#plot-continue');
    var choicesEl = $('#plot-choices');

    // 立绘
    if (portraitEl) {
      portraitEl.textContent = scene.portrait || currentNovel.emoji;
      portraitEl.style.opacity = '1';
      portraitEl.style.filter = 'none';
    }
    if (nameEl) nameEl.textContent = scene.speaker === 'narrator' ? '旁白' : scene.speaker;

    // 对话文字（打字机 30ms/字）
    if (textEl) {
      textEl.textContent = '';
      sceneFullText = scene.text;
      sceneTextShown = 0;
      if (sceneTypingTimer) clearInterval(sceneTypingTimer);
      sceneTypingTimer = setInterval(function () {
        sceneTextShown++;
        textEl.textContent = sceneFullText.slice(0, sceneTextShown);
        if (sceneTextShown >= sceneFullText.length) {
          clearInterval(sceneTypingTimer);
          sceneTypingTimer = null;
          if (contEl) contEl.style.opacity = '1';
        }
      }, 30);
    }
    // 隐藏选项区
    if (choicesEl) choicesEl.innerHTML = '';
    // 继续箭头（点击屏幕推进）
    if (contEl) contEl.style.opacity = '0';
  }

  // 点击屏幕推进（文字未完成 → 全显；完成 → 下一场景）
  function advanceScene() {
    if (sceneTypingTimer) {
      clearInterval(sceneTypingTimer);
      sceneTypingTimer = null;
      var textEl = $('#plot-text');
      if (textEl) textEl.textContent = sceneFullText;
      var contEl = $('#plot-continue');
      if (contEl) contEl.style.opacity = '1';
      return;
    }
    var contEl = $('#plot-continue');
    if (contEl) contEl.style.opacity = '0';
    currentSceneIdx++;
    renderScene();
  }

  // ---------- 选项 ----------
  function renderChoices(scene) {
    var choicesEl = $('#plot-choices');
    var textEl = $('#plot-text');
    var nameEl = $('#plot-name');
    var portraitEl = $('#plot-portrait');

    if (textEl) textEl.textContent = '—— 请选择 ——';
    if (nameEl) nameEl.textContent = '选择';
    if (portraitEl) portraitEl.style.opacity = '0.5';

    if (!choicesEl) return;
    choicesEl.innerHTML = '';
    scene.items.forEach(function (item, idx) {
      var btn = document.createElement('div');
      btn.className = 'plot-choice';
      btn.textContent = item.text;
      btn.style.animationDelay = (idx * 0.1) + 's';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        applyDelta(item.delta);
        choicesEl.innerHTML = '';
        currentSceneIdx++;
        renderScene();
      });
      choicesEl.appendChild(btn);
    });
  }

  function applyDelta(delta) {
    var popup = $('#plot-popup');
    if (!popup) return;
    popup.innerHTML = '';
    Object.keys(delta).forEach(function (k) {
      var v = delta[k];
      if (v === 0) return;
      var sign = v > 0 ? '+' : '';
      var item = document.createElement('div');
      item.className = 'plot-popup-item ' + (v > 0 ? 'pop-up' : 'pop-down');
      item.textContent = sign + v + ' ' + (k === 'intimacy' ? '亲密' : '信任');
      popup.appendChild(item);
      stats[k] = (stats[k] || 0) + v;
      setTimeout(function () { item.remove(); }, 2000);
    });
    // 更新属性面板
    updateAttr();
  }

  function updateAttr() {
    var intEl = $('#attr-intimacy');
    var truEl = $('#attr-trust');
    if (intEl) intEl.textContent = stats.intimacy || 0;
    if (truEl) truEl.textContent = stats.trust || 0;
  }

  // ---------- CG 全屏 ----------
  function renderCG(scene) {
    var cgEl = $('#plot-cg');
    if (!cgEl) return;
    cgEl.style.background = scene.bg || currentNovel.bg;
    cgEl.querySelector('.cg-title').textContent = scene.title;
    cgEl.classList.add('open');
    setTimeout(function () {
      cgEl.classList.remove('open');
      currentSceneIdx++;
      renderScene();
    }, 2200);
  }

  // ---------- 章节结束 / 自动存档 ----------
  function onChapterEnd(scene) {
    if (scene && scene.chapter) {
      // 自动存档
      autoSave(scene.chapter);
      if (window.LJToast) {
        window.LJToast.show('ok', '章节完成', '第 ' + scene.chapter + ' 章 · 已自动存档');
      }
      // 进入下一章或结局
      if (currentChapterIdx < currentNovel.chapters.length - 1) {
        currentChapterIdx++;
        currentSceneIdx = 0;
        renderScene();
      } else {
        // 显示结局
        showEnding(scene.ending || 'good_start');
      }
    } else {
      // 已是结局
      showEnding('good_start');
    }
  }

  function showEnding(ending) {
    var endingNames = {
      good_start: 'GE · 好结局',
      in_progress: '继续中',
      bad: 'BE · 坏结局',
      true: 'TE · 真结局',
      hidden: 'HE · 隐藏结局',
      character: 'CE · 角色结局',
      world: 'WE · 世界结局'
    };
    if (window.LJToast) {
      window.LJToast.show('ok', '结局达成', endingNames[ending] || ending);
    }
  }

  // ---------- 系统菜单 ----------
  function toggleSystemMenu() {
    var menu = $('#plot-system-menu');
    if (!menu) return;
    menu.classList.toggle('open');
  }

  // ---------- 存档 / 读档 ----------
  var SAVES_KEY = 'lingjing_v5170_plot_saves';
  function loadSaves() {
    try {
      var raw = localStorage.getItem(SAVES_KEY);
      saves = raw ? JSON.parse(raw) : [];
    } catch (e) { saves = []; }
  }
  function persistSaves() {
    try { localStorage.setItem(SAVES_KEY, JSON.stringify(saves)); } catch (e) {}
  }
  function autoSave(chapter) {
    var slot = saves.findIndex(function (s) { return s.slot === 0; });
    var entry = {
      slot: 0,
      novelId: currentNovel.id,
      chapter: chapter,
      time: new Date().toISOString(),
      stats: JSON.parse(JSON.stringify(stats))
    };
    if (slot >= 0) saves[slot] = entry;
    else saves.unshift(entry);
    persistSaves();
  }
  function openSavePanel() {
    var menu = $('#plot-system-menu');
    if (menu) menu.classList.remove('open');
    var panel = $('#plot-save-panel');
    if (!panel) return;
    panel.classList.add('open');
    var grid = panel.querySelector('.save-grid');
    if (grid) {
      grid.innerHTML = '';
      for (var i = 0; i < 10; i++) {
        var s = saves[i];
        var slot = document.createElement('div');
        slot.className = 'save-slot' + (s ? ' filled' : '');
        if (s) {
          slot.innerHTML = '<b>槽 ' + (i + 1) + '</b><span>' + (s.novelId) + '</span><span>第 ' + s.chapter + ' 章</span>';
        } else {
          slot.innerHTML = '<b>槽 ' + (i + 1) + '</b><span>空</span>';
        }
        slot.addEventListener('click', function () { closePanel(); });
        grid.appendChild(slot);
      }
    }
  }
  function openLoadPanel() {
    openSavePanel();
    if (window.LJToast) window.LJToast.show('warn', '读档', '点击存档槽恢复');
  }
  function closePanel() {
    var panel = $('#plot-save-panel');
    if (panel) panel.classList.remove('open');
  }

  // ---------- 地图模式 ----------
  function toggleMapMode() {
    var stage = $('#plot-stage');
    if (!stage) return;
    stage.classList.toggle('map-mode');
    if (stage.classList.contains('map-mode')) {
      if (window.LJToast) window.LJToast.show('ok', '进入地图探索', '点击建筑进入子场景 · 点击人物互动');
      // 恢复立绘隐藏
      var portraitEl = $('#plot-portrait');
      if (portraitEl) portraitEl.style.opacity = '0';
      // 关闭互动菜单残留
      closeInteractMenu();
    } else {
      renderScene();
    }
  }

  // ---------- V20-L 设计文档 §7.4：点击建筑进入子场景 ----------
  function enterBuilding(name) {
    // 停掉进行中的打字机，避免覆盖子场景文案
    if (sceneTypingTimer) { clearInterval(sceneTypingTimer); sceneTypingTimer = null; }
    var stage = $('#plot-stage');
    if (stage) stage.classList.remove('map-mode');
    // 子场景：切换背景 + 一句场景文案 + 选项
    var bgEl = $('#plot-bg');
    if (bgEl) bgEl.style.background = currentNovel.bgNight || currentNovel.bg;
    var nameEl = $('#plot-name');
    var textEl = $('#plot-text');
    if (nameEl) nameEl.textContent = '旁白';
    if (textEl) {
      textEl.textContent = '你来到了【' + name + '】。这里人来人往，似乎藏着不少故事……';
    }
    var portraitEl = $('#plot-portrait');
    if (portraitEl) portraitEl.style.opacity = '1';
    if (window.LJToast) window.LJToast.show('ok', '进入子场景', name);
  }

  // ---------- V20-L 设计文档 §7.4：点击人物弹互动菜单（对话/送礼/邀约/攻略） ----------
  function openInteractMenu(charName) {
    var menu = $('#plot-interact-menu');
    if (!menu) return;
    var nameEl = menu.querySelector('#pim-name');
    if (nameEl) nameEl.textContent = charName;
    menu.classList.add('open');
  }
  function closeInteractMenu() {
    var menu = $('#plot-interact-menu');
    if (menu) menu.classList.remove('open');
  }
  function handleInteract(charName, act) {
    closeInteractMenu();
    if (act === 'talk') {
      // 对话：退出地图，进入一段人物对话（先停打字机）
      if (sceneTypingTimer) { clearInterval(sceneTypingTimer); sceneTypingTimer = null; }
      var stage = $('#plot-stage');
      if (stage) stage.classList.remove('map-mode');
      var nameEl = $('#plot-name');
      var textEl = $('#plot-text');
      if (nameEl) nameEl.textContent = charName;
      if (textEl) textEl.textContent = '「' + charName + '：你竟然找到这里来了。有什么事吗？」';
      var portraitEl = $('#plot-portrait');
      if (portraitEl) portraitEl.style.opacity = '1';
    } else if (act === 'gift') {
      stats.intimacy += 3;
      if (window.LJToast) window.LJToast.show('ok', '送礼成功', charName + ' · 亲密 +3');
      updateAttr();
    } else if (act === 'invite') {
      if (window.LJToast) window.LJToast.show('warn', '邀约', charName + ' 说今晚有事 · 多聊聊再试试');
    } else if (act === 'strategy') {
      if (window.LJToast) window.LJToast.show('info', '攻略进度', charName + ' · 好感 46/100 · 继续加油');
    }
  }
  function bindMapEvents() {
    // 建筑 → 子场景
    $$('.plot-map-bldg').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        enterBuilding(b.getAttribute('data-b') || '未知地点');
      });
    });
    // 人物 → 互动菜单
    $$('.plot-map-char').forEach(function (c) {
      c.addEventListener('click', function (e) {
        e.stopPropagation();
        openInteractMenu(c.getAttribute('data-c') || '路人');
      });
    });
    var pimClose = $('#pim-close');
    if (pimClose) pimClose.addEventListener('click', function (e) { e.stopPropagation(); closeInteractMenu(); });
    $$('.plot-interact-menu .pim-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var nameEl = $('#pim-name');
        handleInteract(nameEl ? nameEl.textContent : '路人', btn.getAttribute('data-iact'));
      });
    });
  }

  window.LJPlot = {
    init: init,
    advanceScene: advanceScene,
    toggleSystemMenu: toggleSystemMenu,
    toggleMapMode: toggleMapMode,
    enterBuilding: enterBuilding,
    openInteractMenu: openInteractMenu,
    __mounted: true
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();