/* =====================================================================
 * V20-V · 通用小说世界引擎 · 控制器
 *
 * 数据流：
 *   txt → parseNovel() → {title, chapters[]} → 显示章节列表
 *   章节 → 检查 cost → 未付弹付费 → 付费后 flatBlocks() 逐 block 渲染
 *   block 类型：
 *     paid_gate  → 已付则跳过，未付则锁住
 *     scene_name → 切场景（更新场景图 + 道具 hotzone）
 *     narration  → 旁白（淡入）
 *     dialog     → 角色对话
 *     item       → 道具入背包 + 场景 hotzone
 *     npc        → 人物 hotzone
 *     choice     → 选项按钮（点击推进索引）
 *
 * 存档：
 *   lingjing_v520_novel_game_{bookHash}  → {chapIdx, blockIdx, sceneItems, inv}
 * ===================================================================== */
(function () {
  var STORE_KEY = 'lingjing_v520_novel_game_state';
  var COIN_KEY = 'lingjing_v520_wallet';

  var state = {
    book: null,        // 解析后的小说
    bookHash: '',      // title + 第一章前 30 字 hash
    chapIdx: 0,
    blockIdx: 0,
    sceneItems: [],    // 当前场景道具 [name,...]
    sceneNpcs: [],     // 当前场景人物 [name,...]
    inventory: {},     // 背包 {name: count}
    paidChaps: {},     // 已付章节 {idx: true}
    pendingPaidChap: -1 // 当前待付费章节
  };

  /* ---------- 工具 ---------- */
  function $(s) { return document.querySelector(s); }
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) for (var k in props) {
      if (k === 'class') n.className = props[k];
      else if (k === 'style') n.style.cssText = props[k];
      else if (k === 'onclick') n.addEventListener('click', props[k]);
      else n.setAttribute(k, props[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return 'b' + Math.abs(h).toString(36);
  }
  function toast(kind, title, msg) {
    var c = $('#ng-toast');
    var t = el('div', { class: 'ng-toast-item ' + (kind || 'ok') });
    t.innerHTML = '<span class="dot"></span><span><b>' + title + '</b>' + (msg ? '<span style="opacity:.65"> · ' + msg + '</span>' : '') + '</span>';
    c.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }
  function getCoins() {
    try {
      var raw = JSON.parse(localStorage.getItem(COIN_KEY) || '{}');
      return { crystal: raw.crystal || 0, jade: raw.jade || 0 };
    } catch (e) { return { crystal: 0, jade: 0 }; }
  }
  function setCoins(c) {
    try { localStorage.setItem(COIN_KEY, JSON.stringify(c)); } catch (e) {}
    var cn = $('#ng-crystal'), jd = $('#ng-jade');
    if (cn) cn.textContent = c.crystal;
    if (jd) jd.textContent = c.jade;
  }
  function refreshCoins() {
    var c = getCoins();
    var cn = $('#ng-crystal'), jd = $('#ng-jade');
    if (cn) cn.textContent = c.crystal;
    if (jd) jd.textContent = c.jade;
  }
  function spendCrystal(n) {
    var c = getCoins();
    if (c.crystal < n) return false;
    c.crystal -= n;
    setCoins(c);
    return true;
  }

  /* ---------- 模式切换 ---------- */
  function showMode(name) {
    $('#ng-upload-view').style.display = name === 'upload' ? 'flex' : 'none';
    $('#ng-chapters-view').style.display = name === 'chapters' ? 'block' : 'none';
    $('#ng-stage').classList.toggle('active', name === 'stage');
  }

  /* ---------- 上传/加载 ---------- */
  function loadTxt(text, sourceLabel) {
    try {
      var book = window.LJNovelParser.parseNovel(text);
      if (!book.chapters.length) {
        toast('warn', '解析失败', '未识别到任何章节');
        return;
      }
      state.book = book;
      state.bookHash = hashStr(book.title + '_' + (book.chapters[0].title || ''));
      $('#ng-title').textContent = book.title;
      renderChapterList();
      showMode('chapters');
      toast('ok', '解析完成', book.chapters.length + ' 章 · ' + sourceLabel);
    } catch (e) {
      toast('warn', '解析异常', String(e).slice(0, 60));
    }
  }

  /* ---------- 章节列表 ---------- */
  function renderChapterList() {
    var grid = $('#ng-ch-grid');
    grid.innerHTML = '';
    var totalCost = state.book.chapters.reduce(function (s, c) { return s + (c.cost || 0); }, 0);
    var freeCount = state.book.chapters.filter(function (c) { return !c.cost; }).length;
    var stat = $('#ng-book-stat');
    stat.textContent = state.book.chapters.length + ' 章 · ' + freeCount + ' 免费';
    stat.className = 'badge ' + (freeCount === state.book.chapters.length ? 'free' : '');
    $('#ng-book-title').textContent = state.book.title;

    state.book.chapters.forEach(function (c, idx) {
      var card = el('div', { class: 'ng-ch-card' + (c.cost && !state.paidChaps[idx] ? ' locked' : '') });
      card.appendChild(el('div', { class: 'no' }, '第 ' + (idx + 1) + ' 章'));
      card.appendChild(el('div', { class: 'ttl' }, c.title));
      var tag;
      if (!c.cost) tag = el('span', { class: 'tag free' }, '免费');
      else if (state.paidChaps[idx]) tag = el('span', { class: 'tag' }, '已解锁');
      else tag = el('span', { class: 'tag' }, '🔒 ' + c.cost + ' 灵晶');
      card.appendChild(tag);
      card.addEventListener('click', function () { enterChapter(idx); });
      grid.appendChild(card);
    });
  }

  /* ---------- 进入章节 ---------- */
  function enterChapter(idx) {
    var chap = state.book.chapters[idx];
    state.chapIdx = idx;
    state.blockIdx = 0;
    state.sceneItems = [];
    state.sceneNpcs = [];

    // 收费章节：未付弹付费
    if (chap.cost && !state.paidChaps[idx]) {
      state.pendingPaidChap = idx;
      $('#ng-paid-chap').textContent = chap.title;
      $('#ng-paid-price').innerHTML = chap.cost + ' <small>灵晶</small>';
      $('#ng-paid').classList.add('open');
      return;
    }
    startChapter(idx);
  }
  function startChapter(idx) {
    state.chapIdx = idx;
    state.blockIdx = 0;
    state.sceneItems = [];
    state.sceneNpcs = [];
    showMode('stage');
    refreshCoins();
    renderNextBlock();
  }
  $('#ng-paid-cancel').addEventListener('click', function () {
    $('#ng-paid').classList.remove('open');
    state.pendingPaidChap = -1;
  });
  $('#ng-paid-pay').addEventListener('click', function () {
    var idx = state.pendingPaidChap;
    if (idx < 0) return;
    var cost = state.book.chapters[idx].cost;
    if (!spendCrystal(cost)) {
      toast('warn', '灵晶不足', '需要 ' + cost + ' 灵晶');
      return;
    }
    state.paidChaps[idx] = true;
    try { localStorage.setItem(STORE_KEY + '_' + state.bookHash, JSON.stringify({ paid: state.paidChaps })); } catch (e) {}
    $('#ng-paid').classList.remove('open');
    state.pendingPaidChap = -1;
    toast('ok', '解锁成功', state.book.chapters[idx].title);
    startChapter(idx);
  });

  /* ---------- 渲染下一 block ---------- */
  function renderNextBlock() {
    var blocks = window.LJNovelParser.flatBlocks(state.book.chapters[state.chapIdx]);
    if (state.blockIdx >= blocks.length) {
      // 章节结束 → 回到列表
      toast('ok', '章节完成', state.book.chapters[state.chapIdx].title);
      setTimeout(function () { showMode('chapters'); renderChapterList(); }, 800);
      return;
    }
    var b = blocks[state.blockIdx];
    var pct = Math.round((state.blockIdx + 1) / blocks.length * 100);
    $('#ng-prog-bar').style.width = pct + '%';

    // 场景切换
    if (b.type === 'scene_name') {
      $('#ng-scene-name').textContent = b.name;
      state.sceneItems = [];
      state.sceneNpcs = [];
      // 重渲染场景图区（清除旧 hotzone）
      var scene = $('#ng-scene');
      scene.querySelectorAll('.ng-hot').forEach(function (n) { n.remove(); });
    }

    // 渲染对话框
    var dlg = $('#ng-dialog');
    var speaker = dlg.querySelector('.speaker');
    var text = dlg.querySelector('.text');
    if (b.type === 'dialog') {
      speaker.textContent = b.character;
      speaker.className = 'speaker npc';
      text.textContent = b.text;
      text.className = 'text npc';
    } else if (b.type === 'narration') {
      speaker.textContent = '旁白';
      speaker.className = 'speaker nar';
      text.textContent = b.text;
      text.className = 'text';
    } else if (b.type === 'paid_gate') {
      // 已付则跳过；此处默认已付（前置付费弹窗）
      speaker.textContent = '系统';
      speaker.className = 'speaker';
      text.textContent = '已解锁本章节（' + b.cost + ' 灵晶）';
      text.className = 'text';
    } else {
      speaker.textContent = '系统';
      speaker.className = 'speaker';
      text.textContent = '继续阅读……';
      text.className = 'text';
    }

    // 渲染选项区
    var choices = $('#ng-choices');
    choices.innerHTML = '';

    if (b.type === 'choice') {
      // 多个选项按钮
      b.options.forEach(function (opt, i) {
        var cls = i === 1 ? 'ng-choice alt' : 'ng-choice';
        var btn = el('button', { class: cls }, opt);
        btn.addEventListener('click', function () {
          toast('ok', '选择', opt);
          state.blockIdx++;
          renderNextBlock();
        });
        choices.appendChild(btn);
      });
      // 加一个"继续"按钮（兜底）
      var cont = el('button', { class: 'ng-choice alt' }, '继续');
      cont.addEventListener('click', function () { state.blockIdx++; renderNextBlock(); });
      choices.appendChild(cont);
    } else if (b.type === 'item') {
      // 自动入背包 + 场景 hotzone
      state.inventory[b.name] = (state.inventory[b.name] || 0) + 1;
      addHotzone(b.name, 'item', '🎁', { left: 20 + Math.random() * 60, top: 30 + Math.random() * 40 });
      speaker.textContent = '获得道具';
      text.textContent = '「' + b.name + '」已收入背包';
      var cont = el('button', { class: 'ng-choice' }, '继续');
      cont.addEventListener('click', function () { state.blockIdx++; renderNextBlock(); });
      choices.appendChild(cont);
    } else if (b.type === 'npc') {
      state.sceneNpcs.push(b.name);
      addHotzone(b.name, 'npc', '👤', { left: 50 + Math.random() * 30, top: 40 + Math.random() * 30 });
      speaker.textContent = '遇见人物';
      text.textContent = '「' + b.name + '」出现在场景中';
      var cont2 = el('button', { class: 'ng-choice' }, '继续');
      cont2.addEventListener('click', function () { state.blockIdx++; renderNextBlock(); });
      choices.appendChild(cont2);
    } else if (b.type === 'paid_gate') {
      var cont3 = el('button', { class: 'ng-choice' }, '继续阅读');
      cont3.addEventListener('click', function () { state.blockIdx++; renderNextBlock(); });
      choices.appendChild(cont3);
    } else {
      // 默认继续按钮
      var cont4 = el('button', { class: 'ng-choice' }, '继续 ›');
      cont4.addEventListener('click', function () { state.blockIdx++; renderNextBlock(); });
      choices.appendChild(cont4);
    }
  }

  /* ---------- 场景 hotzone ---------- */
  function addHotzone(name, kind, ico, pos) {
    var scene = $('#ng-scene');
    var hot = el('div', { class: 'ng-hot' + (kind === 'npc' ? ' npc' : '') });
    hot.innerHTML = '<span class="ico">' + ico + '</span>' + name;
    hot.style.left = pos.left + '%';
    hot.style.top = pos.top + '%';
    hot.addEventListener('click', function (e) {
      e.stopPropagation();
      openDrawer(name, kind);
    });
    scene.appendChild(hot);
  }
  function openDrawer(name, kind) {
    $('#ng-drawer-title').textContent = kind === 'npc' ? '人物交互 · ' + name : '道具交互 · ' + name;
    var body = $('#ng-drawer-body');
    body.innerHTML = '';
    if (kind === 'npc') {
      body.appendChild(el('div', { class: 'ng-npc-action' }, '💬 与 ' + name + ' 对话'));
      body.appendChild(el('div', { class: 'ng-npc-action' }, '🎁 赠送礼物'));
      body.appendChild(el('div', { class: 'ng-npc-action' }, '🚶 离开'));
    } else {
      body.appendChild(el('div', { class: 'ng-item', style: 'grid-column:span 4;font-size:13px' }, '🎁 ' + name));
      body.appendChild(el('div', { class: 'ng-npc-action' }, '🔍 仔细查看'));
      body.appendChild(el('div', { class: 'ng-npc-action' }, '🎒 放入背包'));
      body.appendChild(el('div', { class: 'ng-npc-action' }, '📦 丢弃'));
    }
    $('#ng-drawer').classList.add('open');
  }
  $('#ng-drawer-close').addEventListener('click', function () {
    $('#ng-drawer').classList.remove('open');
  });
  $('#ng-drawer').addEventListener('click', function (e) {
    if (e.target.id === 'ng-drawer') $('#ng-drawer').classList.remove('open');
  });

  /* ---------- 背包 FAB ---------- */
  $('#ng-fab-backpack').addEventListener('click', function () {
    $('#ng-drawer-title').textContent = '🎒 我的背包';
    var body = $('#ng-drawer-body');
    body.innerHTML = '';
    var names = Object.keys(state.inventory);
    if (!names.length) {
      body.appendChild(el('div', { class: 'ng-empty' }, '背包空空如也'));
    } else {
      var grid = el('div', { class: 'ng-items' });
      names.forEach(function (n) {
        grid.appendChild(el('div', { class: 'ng-item' }, [
          el('span', { class: 'ico' }, '🎁'),
          n,
          state.inventory[n] > 1 ? (' ×' + state.inventory[n]) : ''
        ]));
      });
      body.appendChild(grid);
    }
    $('#ng-drawer').classList.add('open');
  });

  /* ---------- 存档 FAB ---------- */
  $('#ng-fab-save').addEventListener('click', function () {
    try {
      var snap = {
        book: { title: state.book.title, chapters: state.book.chapters.length },
        chapIdx: state.chapIdx, blockIdx: state.blockIdx,
        inventory: state.inventory, paid: state.paidChaps
      };
      localStorage.setItem(STORE_KEY + '_' + state.bookHash + '_progress', JSON.stringify(snap));
      toast('ok', '存档成功', state.book.chapters[state.chapIdx].title);
    } catch (e) { toast('warn', '存档失败', String(e).slice(0, 40)); }
  });

  /* ---------- 返回目录 ---------- */
  $('#ng-btn-home').addEventListener('click', function () {
    if (state.book) { showMode('chapters'); }
    else { showMode('upload'); }
  });

  /* ---------- 文件上传 ---------- */
  $('#ng-file').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (ev) { loadTxt(ev.target.result, f.name); };
    reader.readAsText(f, 'utf-8');
  });

  /* ---------- 示例加载（V20-V：内嵌文本，file:// / GitHub Pages 通用） ---------- */
  $('#ng-demo').addEventListener('click', function () { loadDemo(); });

  var DEMO_TEXT = [
    '# 桃花源记 · 通用示例',
    '## 第一章 · 初入桃花源',
    '### 场景：山间小路',
    '你沿着蜿蜒小路走进深山，两旁桃花盛开，落英缤纷。',
    '',
    '{道具:古琴}',
    '一棵桃树下放着一把古琴，琴弦在风中轻颤。',
    '[拾取古琴|继续前行]',
    '',
    '{人物:白衣女子}',
    '一位白衣女子正坐在溪边抚琴，神情淡然。',
    '[上前问好|悄悄离开]',
    '',
    '你往前走了几步，琴声悠扬入耳，令人心旷神怡。',
    '',
    '## 第二章 · 琴声问答',
    '【收费章节：20灵晶】',
    '',
    '### 场景：溪边小亭',
    '白衣女子抬眼望向你，微微一笑。',
    '',
    '「白衣女子」公子来此何事？可是被琴声引来？',
    '[自我介绍|请教琴艺|转身离去]',
    '',
    '「你」在下姓陆，久居山外，闻琴声而来。',
    '「白衣女子」山外之事我已多年不闻，公子可否告知一二？',
    '[讲述山外繁华|沉默不语|问其身世]',
    '',
    '「白衣女子」我本京城官家之女，因战乱流落至此。',
    '[赠予银两以助其返乡|留在此处陪伴|询问山中奇景]',
    '',
    '## 第三章 · 山中奇景',
    '【收费章节：20灵晶】',
    '',
    '### 场景：山谷深处',
    '白衣女子引你走入山谷深处，但见奇花异草遍布，仙气缭绕。',
    '',
    '{道具:玉佩}',
    '地上落有一块碧绿玉佩，雕刻精细。',
    '[拾取玉佩|继续前行]',
    '',
    '{人物:山中老翁}',
    '一位白发老翁坐在石上，正闭目养神。',
    '[上前问候|静坐其旁|绕道而行]',
    '',
    '「山中老翁」年轻人，来此何干？',
    '[寻访桃花源|寻找世外仙境|误入此地]',
    '',
    '## 第四章 · 老翁赠言',
    '【收费章节：20灵晶】',
    '',
    '### 场景：石亭',
    '',
    '「山中老翁」你我有缘，赠你一言。',
    '[聆听教诲|婉言谢绝|请问仙道]',
    '',
    '「山中老翁」世间万物皆有定数，强求无益。',
    '「山中老翁」回去吧，莫再停留。',
    '[拜谢离去|坚持留下|询问更多]',
    '',
    '## 第五章 · 归途',
    '### 场景：来时小路',
    '你沿原路返回，回头望去，山谷已隐入云雾。',
    '',
    '{道具:古琴}',
    '那把古琴仍在桃树下，似在等人。',
    '[取回古琴|就此离去]',
    '',
    '桃花纷纷落下，山风徐徐。',
    '',
    '## 终章 · 后会有期',
    '【收费章节：30灵晶】',
    '',
    '### 场景：云深不知处',
    '数年后，你再寻此地，已不见桃花源踪迹。',
    '唯有那把古琴，琴音依旧。',
    '',
    '[完结]'
  ].join('\n');

  function loadDemo() {
    loadTxt(DEMO_TEXT, '示例 · 桃花源记');
  }

  /* ---------- 帮助弹窗 ---------- */
  $('#ng-btn-help').addEventListener('click', function () {
    $('#ng-drawer-title').textContent = '行内标注说明';
    $('#ng-drawer-body').innerHTML =
      '<div style="line-height:1.8;font-size:13px">' +
      '<div><b style="color:var(--gold)">## 章节标题</b> · 自动建章节</div>' +
      '<div><b style="color:var(--gold)">### 场景：名</b> · 切场景（道具/人物 hotzone 重置）</div>' +
      '<div><b style="color:var(--gold)">「角色」对话</b> · 角色对话（紫色）</div>' +
      '<div><b style="color:var(--gold)">「旁白」叙述</b> · 旁白（淡色）</div>' +
      '<div><b style="color:var(--gold)">{道具:古琴}</b> · 道具自动入背包 + 场景可点击</div>' +
      '<div><b style="color:var(--gold)">{人物:女子}</b> · 人物 hotzone 可点击交互</div>' +
      '<div><b style="color:var(--gold)">[选项A|选项B]</b> · 选项按钮（点击推进）</div>' +
      '<div><b style="color:var(--gold)">【收费章节：20灵晶】</b> · 收费点（20 灵晶解锁）</div>' +
      '</div>';
    $('#ng-drawer').classList.add('open');
  });

  /* ---------- 初始 ---------- */
  function init() {
    // 预置钱包（若无）
    if (!localStorage.getItem(COIN_KEY)) {
      setCoins({ crystal: 100, jade: 10 });
    } else {
      refreshCoins();
    }
    // ?demo=1 自动加载桃花源示例（来自 product-preview / 主页横幅入口）
    var qs = location.search || '';
    if (/[?&]demo=1\b/.test(qs)) {
      loadDemo();
      return;
    }
    showMode('upload');
  }

  window.LJNovelGame = {
    state: function () { return state; },
    loadTxt: loadTxt,
    parseNovel: function (t) { return window.LJNovelParser.parseNovel(t); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();