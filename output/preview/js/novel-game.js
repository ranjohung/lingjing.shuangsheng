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
  /* ---------- V20-W 角色模板 + loadBook ---------- */
  var STORE_KEY = 'lingjing_v520_novel_game_state';
  var COIN_KEY = 'lingjing_v520_wallet';

  var state = {
    book: null,        // 解析后的小说
    bookHash: '',      // title + 第一章前 30 字 hash
    bookId: '',        // V20-W：公版 id（taohuayuan/sanguoyanyi/hongloumeng/...）
    chapIdx: 0,
    blockIdx: 0,
    sceneItems: [],    // 当前场景道具 [name,...]
    sceneNpcs: [],     // 当前场景人物 [name,...]
    inventory: {},     // 背包 {name: count}
    paidChaps: {},     // 已付章节 {idx: true}
    pendingPaidChap: -1, // 当前待付费章节
    player: null,      // V20-W：玩家角色 {id, name, desc, emoji, custom}
    awaitingRole: -1   // V20-W：正在等待角色选择的章节 idx，-1 表示没有
  };

  // V20-W：每部公版小说的可选主角模板（同一小说共用一个世界，进去前选主角）
  var BOOK_CHARACTERS = {
    taohuayuan: [
      { id: 'yuren', name: '渔人', desc: '原文主角 · 武陵人', emoji: '🎣' },
      { id: 'taohuawushi', name: '桃花武士', desc: '守护桃源的隐士', emoji: '🗡️' },
      { id: 'youlvbin', name: '游旅', desc: '迷路进入奇境的旅人', emoji: '🧳' }
    ],
    sanguoyanyi: [
      { id: 'liubei', name: '刘备', desc: '仁德之君 · 桃园之主', emoji: '👑' },
      { id: 'guanyu', name: '关羽', desc: '义薄云天 · 武圣', emoji: '⚔️' },
      { id: 'zhangfei', name: '张飞', desc: '勇猛无双 · 万人敌', emoji: '🐯' },
      { id: 'zhugeliang', name: '诸葛亮', desc: '智多星 · 鞠躬尽瘁', emoji: '🪶' },
      { id: 'caocao', name: '曹操', desc: '治世之能臣', emoji: '🗡️' },
      { id: 'zhaoyun', name: '赵云', desc: '一身是胆 · 子龙', emoji: '🐎' },
      { id: 'lvbu', name: '吕布', desc: '三国第一武将', emoji: '⚔️' }
    ],
    hongloumeng: [
      { id: 'jiabaoyu', name: '贾宝玉', desc: '怡红公子 · 通灵宝玉', emoji: '🪷' },
      { id: 'lindaiyu', name: '林黛玉', desc: '潇湘妃子 · 知己', emoji: '🌸' },
      { id: 'xuebaochai', name: '薛宝钗', desc: '蘅芜君 · 端庄', emoji: '🌺' },
      { id: 'wangxifeng', name: '王熙凤', desc: '凤辣子 · 精明', emoji: '💎' },
      { id: 'xuebaochai', name: '史湘云', desc: '豪爽 · 憨直', emoji: '🍃' }
    ],
    xiyouji: [
      { id: 'sunjian', name: '孙悟空', desc: '齐天大圣 · 七十二变', emoji: '🐒' },
      { id: 'tangseng', name: '唐三藏', desc: '金蝉子 · 取经人', emoji: '📿' },
      { id: 'zhubajie', name: '猪八戒', desc: '天蓬元帅 · 憨直', emoji: '🐖' },
      { id: 'shaseng', name: '沙僧', desc: '卷帘大将 · 沉稳', emoji: '🌊' },
      { id: 'baimalongma', name: '白龙马', desc: '西海三太子', emoji: '🐉' }
    ],
    shuihuzhuan: [
      { id: 'songjiang', name: '宋江', desc: '及时雨 · 梁山泊主', emoji: '📜' },
      { id: 'wusong', name: '武松', desc: '行者 · 景阳冈打虎', emoji: '🐯' },
      { id: 'luzhishen', name: '鲁智深', desc: '花和尚 · 力拔垂杨柳', emoji: '🪓' },
      { id: 'linchong', name: '林冲', desc: '豹子头 · 八十万禁军教头', emoji: '🐺' },
      { id: 'lijiu', name: '李逵', desc: '黑旋风 · 手执双斧', emoji: '🪓' }
    ],
    liaozhai: [
      { id: 'shusheng', name: '书生', desc: '落魄书生 · 夜宿荒宅', emoji: '📖' },
      { id: 'xiake', name: '侠客', desc: '仗剑天涯 · 行侠仗义', emoji: '🗡️' },
      { id: 'daoshi', name: '道士', desc: '驱邪伏妖 · 玄门正宗', emoji: '☯️' },
      { id: 'yizhaimaster', name: '义庄主人', desc: '掌管义庄 · 阴阳交界', emoji: '🏮' }
    ]
  };

  // V20-W：URL 参数 `?book=hongloumeng` 自动加载对应公版 txt
  var BOOK_FILES = {
    hongloumeng: 'corpus/books/hongloumeng.txt',
    sanguoyanyi: 'corpus/books/sanguoyanyi.txt',
    xiyouji: 'corpus/books/xiyouji.txt',
    shuihuzhuan: 'corpus/books/shuihuzhuan.txt',
    liaozhai: 'corpus/books/liaozhai.txt'
  };

  // V20-X：内嵌 fallback（corpus 文件不在时直接用）
  var EMBEDDED_BOOKS = {
    hongloumeng: [
      '# 红楼梦',
      '',
      '## 甄士隐梦幻识通灵',
      '',
      '当日地陷东南，这东南一隅有处曰姑苏，有城曰阊门者，最是红尘中一二等富贵风流之地。',
      '',
      '这阊门外有个十里街，街内有个仁清巷，巷内有个古庙，因地方窄狭，人皆呼作葫芦庙。',
      '',
      '庙旁住着一家乡宦，姓甄名费，字士隐。嫡妻封氏，情性贤淑，深明礼义。家中虽不甚富贵，然本地便也推他为望族了。',
      '',
      '## 贾雨村夤缘复旧职',
      '【收费章节：15灵晶】',
      '',
      '如今且说雨村，因那年士隐赠银之后，他于十六日便起身赴京。大比之期，十分得意，中了进士，',
      '',
      '选了外班，知县之任。便自候了两年，足足补了金陵应天府之缺。',
      '',
      '## 林黛玉进贾府',
      '【收费章节：20灵晶】',
      '',
      '且说黛玉自那日弃舟登岸时，便有荣国府打发了轿子并拉行李车辆伺候。',
      '',
      '黛玉扶着婆子的手，进了垂花门，两边是抄手游廊，当中是穿堂，当地放着一个紫檀架子大理石屏风。',
      '',
      '转过屏风，小小三间厅，厅后便是正房大院。正面五间上房，皆是雕梁画栋，两边穿山游廊厢房，挂着各色鹦鹉画眉等雀鸟。'
    ].join('\n'),
    sanguoyanyi: [
      '# 三国演义',
      '',
      '## 桃园三结义',
      '',
      '话说天下大势，分久必合，合久必分。周末七国分争，并入于秦。',
      '',
      '及秦灭之后，楚、汉分争，并入于汉。汉朝自高祖斩白蛇而起义，一统天下。',
      '',
      '光武中兴，传至献帝，遂分为三国。推其致乱之由，殆始于桓、灵二帝。',
      '',
      '宴桃园豪杰三结义，斩黄巾英雄首立功。',
      '',
      '## 张翼德怒鞭督邮',
      '【收费章节：15灵晶】',
      '',
      '且说玄德军马到县，安民已毕，与众将相议进取之策。',
      '',
      '张飞曰：「吾观曹操之众，骁勇无比，若以数千之众与之交锋，必败矣。」',
      '',
      '## 议温明董卓叱丁原',
      '【收费章节：20灵晶】',
      '',
      '却说张飞与众官相见已毕，辞别玄德，引本部军马，前至郯城，安民已毕，',
      '',
      '玄德乃令关云长、张翼飞领本部军马，往迎曹操。'
    ].join('\n'),
    xiyouji: [
      '# 西游记',
      '',
      '## 灵根育孕源流出',
      '',
      '盖闻天地之数，有十二万九千六百年为一元。将一元分为十二会，乃子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥之十二支也。',
      '',
      '且子乃兹萌于上也，午乃兹长于下也，卯乃茁壮于左也，酉乃成熟于右也。',
      '',
      '此乃天地之数，阴阳之理也。',
      '',
      '## 悟彻天罡数',
      '【收费章节：15灵晶】',
      '',
      '心何如？澄如止水；意何如？寂若寒潭。',
      '',
      '此乃修行之要诀，成道之玄机。',
      '',
      '## 八卦炉中逃大圣',
      '【收费章节：20灵晶】',
      '',
      '那祖居于东胜神洲，海外有一国土，名曰傲来国。国近大海，海中有一座名山，唤为花果山。',
      '',
      '此山乃十洲之祖脉，三岛之来龙，自开清浊而立，鸿蒙判后而成。'
    ].join('\n'),
    shuihuzhuan: [
      '# 水浒传',
      '',
      '## 张天师祈禳瘟疫',
      '',
      '话说大宋仁宗天子在位，嘉祐三年三月三日五更三点，天子驾坐紫宸殿，受百官朝贺。',
      '',
      '但见：祥云迷凤阁，瑞气罩龙楼。含烟御柳拂旌旗，带露宫花迎剑戟。',
      '',
      '天香影里，玉簪珠履聚丹墀；仙乐声中，绣袄锦衣扶御驾。',
      '',
      '## 王庆因奸吃官司',
      '【收费章节：15灵晶】',
      '',
      '且说王庆为因心中气忿，欲寻事路，趁夜跳过墙去，到王三店铺里来敲王三的门。',
      '',
      '王三见是王庆，便道：「哥哥，甚风吹得到此？」',
      '',
      '## 燕青智扑擎天柱',
      '【收费章节：20灵晶】',
      '',
      '话说燕青在天王堂内，正要睡觉，忽听外面有人说话。便悄悄出来听时，却是徐宁、刘唐、',
      '',
      '阮小二、阮小五、阮小七、吕方、郭盛八个人，正在那里商议火攻之计。'
    ].join('\n'),
    liaozhai: [
      '# 聊斋志异',
      '',
      '## 考城隍',
      '',
      '我顺治十年，赴考城隍，见殿上有阎王公案，案上堆着文卷甚多。',
      '',
      '有宋公者，亦在考中，时已年迈，须发浩然。我以问之曰：「翁亦应试耶？」',
      '',
      '宋曰：「我前世为某县令，因某案枉杀一人，今来受审。」',
      '',
      '## 聂小倩',
      '【收费章节：15灵晶】',
      '',
      '宁采臣，浙人，性慷爽，廉隅自重。每对人言：「生平无二色。」',
      '',
      '适赴金华，至北郭，解装兰若。寺中殿塔壮丽，然蓬蒿没人，似绝行踪。',
      '',
      '## 画皮',
      '【收费章节：20灵晶】',
      '',
      '太原王生，早行，遇一女郎，抱襁独奔，甚艰于步。',
      '',
      '生趋而追之，问所从来。曰：「妾，父母俱亡，兄嫂莫依，将适一人，以远行耳。」',
      '',
      '生于马上弛担，以己所乘马载之而归。'
    ].join('\n')
  };

  function loadBook(bookId) {
    var src = BOOK_FILES[bookId];
    if (!src) { toast('warn', '加载失败', '未知公版 id：' + bookId); return; }
    var loading = toast('ok', '载入中', '正在解析 ' + bookId);
    fetch(src)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (txt) {
        try {
          state.bookId = bookId;
          var book = window.LJNovelParser.parseOriginalNovel(txt);
          if (!book.chapters || !book.chapters.length) {
            throw new Error('解析无章节');
          }
          book.author = book.author || ({hongloumeng:'曹雪芹',sanguoyanyi:'罗贯中',xiyouji:'吴承恩',shuihuzhuan:'施耐庵',liaozhai:'蒲松龄'}[bookId] || '公版作者');
          state.book = book;
          state.bookHash = hashStr(book.title + '_' + (book.chapters[0].title || ''));
          $('#ng-title').textContent = book.title;
          $('#ng-splash-title').textContent = book.title;
          $('#ng-splash-author').textContent = book.author + ' · ' + book.chapters.length + ' 章';
          $('#ng-splash-start').textContent = '▶ 开始阅读';
          updateChaptersBtn();
          showSplash();
          toast('ok', '解析完成', book.chapters.length + ' 章 · ' + bookId);
        } catch (e) {
          toast('warn', '解析失败', String(e).slice(0, 60));
        }
      })
      .catch(function (e) {
        // corpus 文件不存在 → 用内嵌 4 大名著 fallback
        var fb = EMBEDDED_BOOKS[bookId];
        if (fb) {
          try {
            var book = window.LJNovelParser.parseOriginalNovel(fb);
            book.author = book.author || ({hongloumeng:'曹雪芹',sanguoyanyi:'罗贯中',xiyouji:'吴承恩',shuihuzhuan:'施耐庵',liaozhai:'蒲松龄'}[bookId] || '公版作者');
            state.bookId = bookId;
            state.book = book;
            state.bookHash = hashStr(book.title + '_' + (book.chapters[0].title || ''));
            $('#ng-title').textContent = book.title;
            $('#ng-splash-title').textContent = book.title;
            $('#ng-splash-author').textContent = book.author + ' · ' + book.chapters.length + ' 章';
            $('#ng-splash-start').textContent = '▶ 开始阅读';
            updateChaptersBtn();
            showSplash();
            toast('ok', '已加载', book.chapters.length + ' 章 · ' + book.author);
          } catch (e2) {
            toast('warn', '加载失败', String(e2).slice(0, 50));
          }
        } else {
          toast('warn', '载入失败', bookId + ' · ' + String(e).slice(0, 50));
        }
      });
  }

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
    var onStage = (name === 'stage' || name === 'reader');
    $('#ng-stage').classList.toggle('active', onStage);
    // V20-X 模式分流：reader = 长滚动阅读 / stage = 旧对话流（demo 用）
    $('#ng-reader').style.display = name === 'reader' ? 'block' : 'none';
    $('#ng-dialog').style.display = name === 'stage' ? 'block' : 'none';
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
      updateChaptersBtn();
      // V20-W2：解析完成 → 直接进 stage（默认主角为 BOOK_CHARACTERS 第一项）
      autoAssignPlayer();
      showMode('stage');
      startChapter(0);
      toast('ok', '解析完成', book.chapters.length + ' 章 · ' + sourceLabel);
    } catch (e) {
      toast('warn', '解析异常', String(e).slice(0, 60));
    }
  }

  /* 默认玩家（无角色选择 UI · 进入游戏即主角） */
  function autoAssignPlayer() {
    var bookId = state.bookId || 'taohuayuan';
    var chars = BOOK_CHARACTERS[bookId] || BOOK_CHARACTERS.taohuayuan;
    var p = chars[0];
    state.player = { id: p.id, name: p.name, desc: p.desc, emoji: p.emoji, custom: false };
    state.traits = [];
  }

  /* ---------- 顶栏章节按钮（读档） ---------- */
  function updateChaptersBtn() {
    var btn = $('#ng-btn-chapters');
    var has = false;
    if (state.bookHash) {
      try { has = !!localStorage.getItem(STORE_KEY + '_' + state.bookHash + '_progress'); } catch (e) {}
    }
    btn.style.display = has ? 'grid' : 'none';
  }
  $('#ng-btn-chapters').addEventListener('click', function () {
    if (!state.book) return;
    showMode('chapters');
    renderChapterList();
  });

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

  /* ---------- 进入章节（V20-W：先弹角色选择页，选完才进 stage） ---------- */
  function enterChapter(idx) {
    var chap = state.book.chapters[idx];
    state.chapIdx = idx;
    state.awaitingRole = idx;
    state.pendingPaidChap = -1;

    // 收费章节：未付先弹付费门（角色选择页后置，等付费完成才选）
    if (chap.cost && !state.paidChaps[idx]) {
      state.pendingPaidChap = idx;
      $('#ng-paid-chap').textContent = chap.title;
      $('#ng-paid-price').innerHTML = chap.cost + ' <small>灵晶</small>';
      $('#ng-paid').classList.add('open');
      return;
    }
    showCharacterPicker(idx);
  }

  function showCharacterPicker(chapIdx) {
    var bookId = state.bookId || '';
    var chars = BOOK_CHARACTERS[bookId] || BOOK_CHARACTERS.taohuayuan;
    // 单 char（如桃花源只有 1 个默认）则跳过 picker 直接进 stage
    if (chars.length <= 1 && !state.player) {
      state.player = { id: chars[0].id, name: chars[0].name, desc: chars[0].desc, emoji: chars[0].emoji, custom: false };
      state.awaitingRole = -1;
      startChapter(chapIdx);
      return;
    }
    $('#cm-book').textContent = state.book.title + ' · 公版';
    var grid = $('#ng-char-grid');
    grid.innerHTML = '';
    // 渲染模板角色卡（含 selected 标记）
    chars.forEach(function (c, i) {
      var sel = state.player && state.player.id === c.id;
      var card = el('div', { class: 'ng-char-card' + (sel ? ' selected' : '') });
      card.innerHTML =
        '<div class="cc-check">✓</div>' +
        '<div class="cc-emoji">' + c.emoji + '</div>' +
        '<div class="cc-name">' + c.name + '</div>' +
        '<div class="cc-desc">' + c.desc + '</div>';
      card.addEventListener('click', function () {
        state.player = { id: c.id, name: c.name, desc: c.desc, emoji: c.emoji, custom: false };
        $('#cm-start').disabled = false;
        grid.querySelectorAll('.ng-char-card').forEach(function (n) { n.classList.remove('selected'); });
        card.classList.add('selected');
        hideCustomInput();
      });
      grid.appendChild(card);
    });
    // 自定义角色卡（输入名字 + emoji）
    var customCard = el('div', { class: 'ng-char-card ng-char-custom' });
    customCard.innerHTML =
      '<div class="cc-check">✓</div>' +
      '<div class="cc-emoji" id="cc-custom-emoji">🧑</div>' +
      '<input class="ng-char-input" id="cc-custom-name" placeholder="自定义名字 + 选 🧑/👩/🧙..." maxlength="8" />';
    customCard.addEventListener('click', function (e) {
      if (e.target.id === 'cc-custom-name' || e.target.id === 'cc-custom-emoji') return;
      var name = ($('#cc-custom-name').value || '').trim();
      var emoji = ($('#cc-custom-emoji').textContent || '').trim() || '🧑';
      if (!name) { toast('warn', '请输入角色名', '1-8 字'); return; }
      state.player = { id: 'custom', name: name, desc: '自定义角色 · ' + emoji, emoji: emoji, custom: true };
      $('#cm-start').disabled = false;
      grid.querySelectorAll('.ng-char-card').forEach(function (n) { n.classList.remove('selected'); });
      customCard.classList.add('selected');
    });
    grid.appendChild(customCard);

    // 自定义 emoji 切换
    var emojiPick = el('div', { class: 'cc-emoji-picker' });
    // emoji 选择行（额外插入到 grid 末尾）
    var pickerRow = el('div', { style: 'grid-column:span 2;display:flex;gap:6px;justify-content:center;margin-top:4px' });
    ['🧑','👩','🧙','👨','👴','🧝','⚔️','📖'].forEach(function (e) {
      var b = el('button', { class: 'ng-inline-choice', style: 'padding:4px 10px;font-size:16px' }, e);
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        $('#cc-custom-emoji').textContent = e;
      });
      pickerRow.appendChild(b);
    });
    grid.appendChild(pickerRow);

    // 默认禁用开始按钮
    if (!state.player) $('#cm-start').disabled = true;
    else $('#cm-start').disabled = false;

    $('#ng-char-mask').classList.add('open');
  }

  function hideCustomInput() { /* noop visual hint handled in CSS */ }

  $('#cm-close').addEventListener('click', function () {
    $('#ng-char-mask').classList.remove('open');
    state.awaitingRole = -1;
  });
  $('#cm-back').addEventListener('click', function () {
    $('#ng-char-mask').classList.remove('open');
    state.awaitingRole = -1;
    showMode('chapters');
  });
  $('#cm-start').addEventListener('click', function () {
    if (!state.player) { toast('warn', '请先选择角色', ''); return; }
    $('#ng-char-mask').classList.remove('open');
    var idx = state.awaitingRole;
    state.awaitingRole = -1;
    startChapter(idx);
  });
  function startChapter(idx) {
    state.chapIdx = idx;
    state.blockIdx = 0;
    state.sceneItems = [];
    state.sceneNpcs = [];
    refreshCoins();
    var chap = state.book && state.book.chapters ? state.book.chapters[idx] : null;
    if (!chap) {
      toast('warn', '章节不存在', 'idx=' + idx);
      showMode('chapters');
      renderChapterList();
      return;
    }
    // V20-X 模式分流：原文章节用长滚动阅读（reader），带 scenes 的 demo 用旧 chat-flow（stage）
    var isLegacy = chap.scenes && chap.scenes.length;
    if (isLegacy) {
      showMode('stage');
      renderNextBlock();
    } else {
      showMode('reader');
      renderChapterReader(chap, idx);
    }
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

  /* ---------- 渲染下一 block（V20-W：选项嵌入对话框，无下半独立选项区） ---------- */
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

    // 场景切换：清状态 + 清旧 hotzone
    if (b.type === 'scene_name') {
      $('#ng-scene-name').textContent = b.name;
      state.sceneItems = [];
      state.sceneNpcs = [];
      var scene = $('#ng-scene');
      scene.querySelectorAll('.ng-hot').forEach(function (n) { n.remove(); });
    }

    var dlg = $('#ng-dialog');
    var speaker = dlg.querySelector('.speaker');
    var text = dlg.querySelector('.text');
    var inlineEl = $('#ng-inline-choices');
    var hintEl = $('#ng-next-hint');

    // 1. 主文本（dialog/narration/paid_gate/system）
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

    // 2. 嵌入式选项（dialog 内底栏）
    inlineEl.innerHTML = '';
    var hasChoices = (b.type === 'choice');

    if (b.type === 'choice') {
      // 选项文本作为金色 inline-choice 按钮嵌在 dialog 底部
      b.options.forEach(function (opt, i) {
        var btn = el('button', { class: 'ng-inline-choice' }, opt);
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          toast('ok', '选择', opt);
          state.blockIdx++;
          renderNextBlock();
        });
        inlineEl.appendChild(btn);
      });
    } else if (b.type === 'item') {
      // 道具入背包 + 场景 hotzone（hotzone 自动可点击交互）
      state.inventory[b.name] = (state.inventory[b.name] || 0) + 1;
      addHotzone(b.name, 'item', '🎁', { left: 18 + Math.random() * 60, top: 30 + Math.random() * 35 });
      speaker.textContent = '获得道具';
      text.textContent = '「' + b.name + '」已收入背包（场景中可点击查看）';
    } else if (b.type === 'npc') {
      // 人物 hotzone 自动入场景
      state.sceneNpcs.push(b.name);
      addHotzone(b.name, 'npc', '👤', { left: 50 + Math.random() * 30, top: 38 + Math.random() * 30 });
      speaker.textContent = '遇见人物';
      text.textContent = '「' + b.name + '」出现在场景中（可点击对话/互动）';
    }

    // 3. 推进提示：dialog 可点击（无选项时）
    var dialogAdvanceable = !hasChoices;
    dlg.classList.toggle('dialog-clickable', dialogAdvanceable);
    hintEl.style.display = dialogAdvanceable ? 'block' : 'none';
  }

  /* 对话框整体点击推进（当无选项时）*/
  var ngDialogEl = $('#ng-dialog');
  ngDialogEl.addEventListener('click', function () {
    if (ngDialogEl.classList.contains('dialog-clickable')) {
      state.blockIdx++;
      renderNextBlock();
    }
  });

  /* ---------- 场景 hotzone（V20-W：点 hotzone 弹场景内 modal，不再用底部抽屉） ---------- */
  function addHotzone(name, kind, ico, pos) {
    var scene = $('#ng-scene');
    var hot = el('div', { class: 'ng-hot' + (kind === 'npc' ? ' npc' : '') });
    hot.innerHTML = '<span class="ico">' + ico + '</span>' + name;
    hot.style.left = pos.left + '%';
    hot.style.top = pos.top + '%';
    hot.dataset.kind = kind;
    hot.dataset.name = name;
    hot.dataset.ico = ico;
    hot.addEventListener('click', function (e) {
      e.stopPropagation();
      openHotModal(hot);
    });
    scene.appendChild(hot);
  }

  function openHotModal(hot) {
    var kind = hot.dataset.kind; // 'item' | 'npc'
    var name = hot.dataset.name;
    var ico = hot.dataset.ico;
    var card = $('#ng-hot-modal-card');
    card.className = 'ng-hot-modal' + (kind === 'npc' ? ' hot-npc' : '');
    $('#ng-hot-modal-ico').textContent = ico || (kind === 'npc' ? '👤' : '🎁');
    $('#ng-hot-modal-name').textContent = name;
    $('#ng-hot-modal-kind').textContent = kind === 'npc' ? '人物' : '道具';
    $('#ng-hot-modal-desc').textContent = kind === 'npc'
      ? '可与 ' + name + ' 对话 / 互动'
      : '可点击查看 / 操作 ' + name;

    var acts = $('#ng-hot-modal-actions');
    acts.innerHTML = '';

    if (kind === 'npc') {
      acts.appendChild(makeHotBtn('💬 与 ' + name + ' 对话', 'primary', function () {
        closeHotModal();
        toast('ok', '对话', name + ' 望着你，欲言又止');
      }));
      acts.appendChild(makeHotBtn('🎁 赠送礼物', 'gold', function () {
        closeHotModal();
        var inv = Object.keys(state.inventory);
        if (inv.length === 0) { toast('warn', '背包空', '暂无可赠送的道具'); return; }
        toast('ok', '赠送', '赠送了「' + inv[0] + '」给 ' + name);
      }));
      acts.appendChild(makeHotBtn('🚶 离开', '', function () { closeHotModal(); }));
    } else {
      acts.appendChild(makeHotBtn('🔍 仔细查看', 'primary', function () {
        closeHotModal();
        toast('ok', '查看', name + ' · 纹理古朴，似有故事');
      }));
      acts.appendChild(makeHotBtn('🎒 已入背包', '', function () {
        closeHotModal();
        toast('ok', '背包', name + ' × ' + (state.inventory[name] || 0));
      }));
      acts.appendChild(makeHotBtn('✕ 丢弃', 'gold', function () {
        closeHotModal();
        if (state.inventory[name]) { state.inventory[name]--; if (state.inventory[name] <= 0) delete state.inventory[name]; }
        hot.remove();
        toast('warn', '已丢弃', name);
      }));
    }

    $('#ng-hot-modal').classList.add('open');
  }
  function makeHotBtn(txt, kind, handler) {
    var cls = 'hm-btn' + (kind ? (' ' + kind) : '');
    var btn = el('button', { class: cls }, txt);
    btn.addEventListener('click', function (e) { e.stopPropagation(); handler(); });
    return btn;
  }
  function closeHotModal() { $('#ng-hot-modal').classList.remove('open'); }
  $('#ng-hot-modal-close').addEventListener('click', function (e) { e.stopPropagation(); closeHotModal(); });
  $('#ng-hot-modal').addEventListener('click', function (e) {
    if (e.target === $('#ng-hot-modal')) closeHotModal();
  });

  /* 工具抽屉：仅 FAB 工具按钮使用（背包 / 存档提示 / 帮助）
     hotzone 已切到场景内 modal，故 openDrawer 入口不再被 hotzone 调用 */
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
    // V20-X：游戏中退出 → 回到 splash（再选「继续/重新」）
    if (state.book && state.bookHash) {
      showMode('upload');
      showSplash();
    } else {
      showSplash();
    }
  });

  /* ---------- 文件上传 ---------- */
  $('#ng-file').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function (ev) { loadTxt(ev.target.result, f.name); };
    reader.readAsText(f, 'utf-8');
  });

  /* ---------- 示例加载（V20-X：原文章节格式 · 走 parseOriginalNovel） ---------- */
  $('#ng-demo').addEventListener('click', function () { loadDemo(); });

var DEMO_TEXT = [
    '# 桃花源记',
    '',
    '## 桃源初探',
    '',
    '晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。',
    '',
    '忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。渔人甚异之，复前行，欲穷其林。',
    '',
    '林尽水源，便得一山，山有小口，仿佛若有光。便舍船，从口入。',
    '',
    '初极狭，才通人。复行数十步，豁然开朗。土地平旷，屋舍俨然，有良田美池桑竹之属。阡陌交通，鸡犬相闻。',
    '',
    '其中往来种作，男女衣着，悉如外人。黄发垂髫，并怡然自乐。',
    '',
    '## 桃源问讯',
    '【收费章节：20灵晶】',
    '',
    '见渔人，乃大惊，问所从来。具答之。便要还家，设酒杀鸡作食。',
    '',
    '村中闻有此人，咸来问讯。自云先世避秦时乱，率妻子邑人来此绝境，不复出焉，遂与外人间隔。',
    '',
    '问今是何世，乃不知有汉，无论魏晋。此人一一为具言所闻，皆叹惋。',
    '',
    '## 离去之情',
    '【收费章节：20灵晶】',
    '',
    '余人为设酒馔，亦数世矣。不足为外人道也。既出，得其船，便扶向路，处处志之。',
    '',
    '及郡下，诣太守，说如此。太守即遣人随其往，寻向所志，遂迷不复得路。',
    '',
    '## 高士探访',
    '【收费章节：25灵晶】',
    '',
    '南阳刘子骥，高尚士也，闻之，欣然规往。未果，寻病终。后遂无问津者。',
    '',
    '## 山高水长',
    '【收费章节：30灵晶】',
    '',
    '嗟乎！时运不齐，命途多舛。冯唐易老，李广难封。屈贾谊于长沙，非无圣主；窜梁鸿于海曲，岂乏明时。',
    '',
      '所赖君子见机，达人知命。老当益壮，宁移白首之心；穷且益坚，不坠青云之志。',
      '',
      '酌贪泉而觉爽，处涸辙以犹欢。北海虽赊，扶摇可接；东隅已逝，桑榆非晚。',
      '',
      '孟尝高洁，空余报国之情；阮籍猖狂，岂效穷途之哭！',
      '',
      '勃，三尺微命，一介书生。无路请缨，等终军之弱冠；有怀投笔，慕宗悫之长风。',
      '',
      '舍簪笏于百龄，奉晨昏于万里。非谢家之宝树，接孟氏之芳邻。',
      '',
      '他日趋庭，叨陪鲤对；今兹捧袂，喜托龙门。杨意不逢，抚凌云而自惜；钟期既遇，奏流水以何惭？'
  ].join('\n');

  function loadDemo() {
    try {
      var book = window.LJNovelParser.parseOriginalNovel(DEMO_TEXT);
      if (!book.chapters.length) {
        toast('warn', '示例解析失败', '');
        return;
      }
      // 作者标注
      book.author = '陶渊明 · 东晋';
      state.book = book;
      state.bookHash = hashStr(book.title + '_' + (book.chapters[0].title || ''));
      $('#ng-title').textContent = book.title;
      $('#ng-splash-title').textContent = book.title;
      $('#ng-splash-author').textContent = book.author + ' · ' + book.chapters.length + ' 章';
      $('#ng-splash-start').textContent = '▶ 开始阅读';
      updateChaptersBtn();
      showSplash();
      toast('ok', '示例已加载', book.chapters.length + ' 章 · 沉浸式阅读');
    } catch (e) {
      toast('warn', '示例异常', String(e).slice(0, 60));
    }
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
      autoShowEntry();
      return;
    }
    // ?book=xxx 自动加载 4 大名著之一（来自 plot-detail ▶ 游玩）
    var bookMatch = qs.match(/[?&]book=([a-z]+)/);
    if (bookMatch) {
      loadBook(bookMatch[1]);
      autoShowEntry();
      return;
    }
    showMode('upload');
    showSplash();
  }

  /* =====================================================================
   * V20-X · 3 步入口流程 + 长滚动阅读渲染
   *
   * 流程：splash → 开始阅读 → entry mask（继续/重启）→
   *   继续 → 进度列表 → 点存档 → startChapter
   *   重启 → 角色 mask（带 traits）→ 点开始 → startChapter(0)
   * 渲染：startChapter 检测 paragraphs（V20-X）vs scenes（V20-W 旧）
   *   → renderChapterReader（长滚动）/ renderNextBlock（对话流）
   * ===================================================================== */

  /* ---------- Splash 控制器 ---------- */
  function showSplash() {
    if (!state.book) {
      $('#ng-splash-title').textContent = '通用小说世界';
      $('#ng-splash-author').textContent = '沉浸式影视小说阅读 · 点击开始';
      $('#ng-splash-start').textContent = '▶ 加载示例并开始';
      return;
    }
    $('#ng-splash-title').textContent = state.book.title;
    $('#ng-splash-author').textContent = '公版 · ' + state.book.chapters.length + ' 章 · ' +
      (state.book.chapters.filter(function (c) { return !c.cost; }).length) + ' 免费';
    $('#ng-splash-start').textContent = '▶ 开始阅读';
  }

  /* ---------- Entry mask 控制器 ---------- */
  function hasAnySave() {
    if (!state.bookHash) return false;
    try { return !!localStorage.getItem(STORE_KEY + '_' + state.bookHash + '_progress'); }
    catch (e) { return false; }
  }

  function showEntryMask() {
    if (!state.book) { toast('warn', '请先加载小说', ''); return; }
    var has = hasAnySave();
    var btn = $('#ng-entry-continue');
    btn.disabled = !has;
    btn.style.opacity = has ? '1' : '.4';
    $('#ng-entry-book').textContent = state.book.title;
    $('#ng-entry-title').textContent = has ? '开启阅读' : '首次阅读';
    $('#ng-entry-subtitle').textContent = has
      ? '「继续」回到上次进度，「重新」创建新角色从第一章开始'
      : '这是你的首次阅读 · 创建角色后开启沉浸式阅读';
    $('#ng-entry-mask').classList.add('open');
  }

  function showProgressMask() {
    var list = $('#ng-progress-list');
    list.innerHTML = '';
    var saveKey = STORE_KEY + '_' + state.bookHash + '_progress';
    var raw = null;
    try { raw = localStorage.getItem(saveKey); } catch (e) {}
    if (!raw) {
      list.innerHTML = '<div class="pm-empty">暂无存档<br>请返回选择「重新开始」</div>';
    } else {
      try {
        var prog = JSON.parse(raw);
        var chapTitle = prog.chapTitle || (state.book.chapters[prog.chapIdx || 0] || {}).title || '第 ' + ((prog.chapIdx || 0) + 1) + ' 章';
        var total = state.book.chapters.length || 1;
        var pct = Math.min(100, Math.round(((prog.chapIdx || 0) + 1) / total * 100));
        var when = prog.savedAt ? new Date(prog.savedAt).toLocaleString('zh-CN', { hour12: false }) : '未知时间';
        var card = el('div', { class: 'pm-item' });
        card.innerHTML =
          '<div class="pmi-book">📖 ' + (state.book.title || '书') + ' · ' + chapTitle + '</div>' +
          '<div class="pmi-meta">上次阅读 · ' + when + '</div>' +
          '<div class="pmi-progress"><div class="pmi-progress-bar" style="width:' + pct + '%"></div></div>';
        card.addEventListener('click', function () {
          loadProgress(prog);
          $('#ng-progress-mask').classList.remove('open');
        });
        list.appendChild(card);
      } catch (e) {
        list.innerHTML = '<div class="pm-empty">存档读取失败</div>';
      }
    }
    $('#ng-progress-mask').classList.add('open');
  }

  function loadProgress(prog) {
    state.chapIdx = prog.chapIdx || 0;
    state.blockIdx = prog.blockIdx || 0;
    if (prog.inventory) state.inventory = prog.inventory;
    if (prog.paid) state.paidChaps = prog.paid;
    var chap = state.book.chapters[state.chapIdx];
    toast('ok', '继续阅读', chap ? chap.title : '存档已加载');
    startChapter(state.chapIdx);
  }

  /* ---------- 角色 mask 升级版（带属性勾选） ---------- */
  function showRoleCreateMask() {
    if (!state.book) { toast('warn', '请先加载小说', ''); return; }
    var bookId = state.bookId || 'taohuayuan';
    var chars = BOOK_CHARACTERS[bookId] || BOOK_CHARACTERS.taohuayuan;
    var grid = $('#ng-char-grid');
    grid.innerHTML = '';
    state.player = null;
    state.traits = [];
    chars.forEach(function (c) {
      var card = el('div', { class: 'ng-char-card', 'data-id': c.id });
      card.innerHTML =
        '<div class="cc-check">✓</div>' +
        '<div class="cc-emoji">' + c.emoji + '</div>' +
        '<div class="cc-name">' + c.name + '</div>' +
        '<div class="cc-desc">' + c.desc + '</div>';
      card.addEventListener('click', function () {
        state.player = { id: c.id, name: c.name, desc: c.desc, emoji: c.emoji, custom: false };
        grid.querySelectorAll('.ng-char-card').forEach(function (n) { n.classList.remove('selected'); });
        card.classList.add('selected');
        $('#cm-start').disabled = false;
        hideCustomInput(true);
      });
      grid.appendChild(card);
    });
    // 自定义卡
    var customCard = el('div', { class: 'ng-char-card ng-char-custom' });
    customCard.innerHTML =
      '<div class="cc-check">✓</div>' +
      '<div class="cc-emoji" id="cc-custom-emoji">🧑</div>' +
      '<input class="ng-char-input" id="cc-custom-name" placeholder="自定义名 (1-8字)" maxlength="8" />';
    customCard.addEventListener('click', function (e) {
      if (e.target.id === 'cc-custom-name' || e.target.id === 'cc-custom-emoji') return;
      var name = ($('#cc-custom-name').value || '').trim();
      var emoji = ($('#cc-custom-emoji').textContent || '').trim() || '🧑';
      if (!name) { toast('warn', '请输入角色名', '1-8 字'); return; }
      state.player = { id: 'custom', name: name, desc: '自定义角色 · ' + emoji, emoji: emoji, custom: true };
      $('#cm-start').disabled = false;
      grid.querySelectorAll('.ng-char-card').forEach(function (n) { n.classList.remove('selected'); });
      customCard.classList.add('selected');
    });
    // emoji 选择行
    var pickerRow = el('div', { style: 'grid-column:span 2;display:flex;gap:6px;justify-content:center;margin-top:4px' });
    ['🧑','👩','🧙','👨','👴','🧝','⚔️','📖'].forEach(function (e) {
      var b = el('button', { class: 'ng-inline-choice', style: 'padding:4px 10px;font-size:16px' }, e);
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        $('#cc-custom-emoji').textContent = e;
      });
      pickerRow.appendChild(b);
    });
    grid.appendChild(customCard);
    grid.appendChild(pickerRow);

    // 属性勾选（最多 3 个）
    var traitsEl = $('#ng-role-traits');
    if (traitsEl) {
      traitsEl.querySelectorAll('input').forEach(function (cb) {
        cb.checked = false;
        cb.parentElement.classList.remove('on');
      });
      traitsEl.querySelectorAll('label').forEach(function (lab) {
        lab.addEventListener('click', function (ev) {
          var cb = lab.querySelector('input');
          var checkedCount = traitsEl.querySelectorAll('input:checked').length;
          if (!cb.checked && checkedCount >= 3) {
            ev.preventDefault();
            toast('warn', '最多 3 个属性', '先取消一个再加');
            return;
          }
          setTimeout(function () {
            var isOn = cb.checked;
            lab.classList.toggle('on', isOn);
            if (isOn && state.traits.indexOf(cb.value) < 0) state.traits.push(cb.value);
            if (!isOn) state.traits = state.traits.filter(function (t) { return t !== cb.value; });
          }, 0);
        });
      });
    }

    $('#cm-book').textContent = state.book.title + ' · 公版';
    $('#cm-start').disabled = true;
    $('#ng-char-mask').classList.add('open');
  }

  function hideCustomInput(v) { /* noop */ }

  /* ---------- V20-Y · 段落场景配图（画面 + 字幕 · 田间记范式） ---------- */
  // 不同场景的渐变配色 + emoji（按段序号循环）
  var SCENE_PRESETS = [
    { grad: 'linear-gradient(160deg,#3B2D5C 0%,#5C3B6B 60%,#1A1A2E 100%)', emoji: '🌸', label: '桃林深处' },
    { grad: 'linear-gradient(160deg,#1A3B5C 0%,#2A5C8B 60%,#0A1A2E 100%)', emoji: '🌊', label: '溪水之畔' },
    { grad: 'linear-gradient(160deg,#5C4A2A 0%,#8B6B3B 60%,#2A1A0A 100%)', emoji: '⛰️', label: '远山云间' },
    { grad: 'linear-gradient(160deg,#3B1A4A 0%,#6B3B7B 60%,#1A0A2E 100%)', emoji: '🏯', label: '庭院深深' },
    { grad: 'linear-gradient(160deg,#1A4A3B 0%,#3B8B6B 60%,#0A2A1A 100%)', emoji: '🌲', label: '竹林幽径' },
    { grad: 'linear-gradient(160deg,#4A2A1A 0%,#8B5B3B 60%,#2A0A0A 100%)', emoji: '🕯️', label: '烛火微光' },
    { grad: 'linear-gradient(160deg,#2A2A3B 0%,#5B5B7B 60%,#0A0A2E 100%)', emoji: '🌙', label: '月色如霜' },
    { grad: 'linear-gradient(160deg,#5C3B1A 0%,#8B6B3B 60%,#2A1A0A 100%)', emoji: '🏮', label: '灯火阑珊' }
  ];
  function pickScene(idx) {
    return SCENE_PRESETS[idx % SCENE_PRESETS.length];
  }

  function highlightEntities(text) {
    if (!text) return '';
    var s = String(text);
    // 高亮「XX道」「XX曰」「XX剑」「XX玉」类实体名
    var patterns = [
      /([一-龥]{2,4})(先生|女士|公子|姑娘|大人|将军|掌门|长老|道士|和尚|太守|渔人|夫人)/g,
      /([一-龥]{1,2})(剑|刀|枪|玉|珠|瓶|镜|书|符|丹|酒|茶|琴|伞|扇|帕|镯|印|令|舟|山|林|洞)/g
    ];
    var safe = s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    patterns.forEach(function (re) {
      safe = safe.replace(re, function (m, a, b) {
        return '<span class="ng-r-entity">' + a + b + '</span>';
      });
    });
    return safe;
  }

  function renderChapterReader(chapter, idx) {
    var total = state.book.chapters.length;
    var cover = chapter.title || ('第 ' + (idx + 1) + ' 章');
    var author = state.book.author || '公版作者';
    var paidGate = chapter.cost && !state.paidChaps[idx];

    // 1. 章节封面 (stage)
    $('#ng-r-stage-bg-text').textContent = '· 第 ' + (idx + 1) + ' / ' + total + ' 章 ·';
    $('#ng-r-stage-title').textContent = cover + (paidGate ? ' 🔒' : '');
    $('#ng-r-stage-author').textContent = 'by ' + author + (chapter.cost ? ' · 解锁需 ' + chapter.cost + ' 灵晶' : '');
    $('#ng-r-stage-progress').textContent = '共 ' + (chapter.paragraphs ? chapter.paragraphs.length : 0) + ' 段';
    var cta = $('#ng-r-stage-cta');
    cta.textContent = paidGate ? '🔒 解锁章节（' + chapter.cost + ' 灵晶）' : '▶ 开始本段阅读';
    cta.onclick = function () {
      if (paidGate) {
        state.pendingPaidChap = idx;
        $('#ng-paid-chap').textContent = chapter.title;
        $('#ng-paid-price').innerHTML = chapter.cost + ' <small>灵晶</small>';
        $('#ng-paid').classList.add('open');
        return;
      }
      // 切到 body 长滚动（V20-Z：无底部 foot）
      $('#ng-r-stage').style.display = 'none';
      $('#ng-r-body').style.display = 'block';
      // 自动滚到 body 顶部
      var rd = $('#ng-reader');
      if (rd) rd.scrollTop = 0;
      // 保存进度
      saveProgress(idx, 0);
    };

    // 1.5 显示控制（CTA 隐藏 stage 后显示 body）
    $('#ng-r-stage').style.display = 'flex';
    $('#ng-r-body').style.display = 'none';

    // 2. 长滚动正文 (body · 田间记范式：画面 + 字幕)
    var body = $('#ng-r-body');
    body.innerHTML = '';
    var totalParas = (chapter.paragraphs || []).length;
    (chapter.paragraphs || []).forEach(function (p, pi) {
      var scene = pickScene(pi);
      var card = el('div', { class: 'ng-r-para', 'data-idx': pi });

      // 上半：场景图
      var img = el('div', { class: 'ng-r-para-img' });
      img.style.background = scene.grad;
      var label = el('div', { class: 'ng-r-para-img-label' }, '◆ ' + scene.label);
      var progress = el('div', { class: 'ng-r-para-img-progress' }, (pi + 1) + ' / ' + totalParas);
      var emoji = el('div', { class: 'ng-r-para-img-emoji' }, scene.emoji);
      img.appendChild(label);
      img.appendChild(progress);
      img.appendChild(emoji);

      // 左侧浮动按钮（章节选项 · 田间记范式）
      var leftActs = el('div', { class: 'ng-r-para-img-actions' });
      ['↩', '✦', '♥'].forEach(function (ic) {
        var b = el('button', { class: 'ng-r-para-img-action', title: ic }, ic);
        leftActs.appendChild(b);
      });
      img.appendChild(leftActs);

      // 右侧浮动按钮（V20-Z：✦ = 主菜单 · 收藏/截图等）
      var rightActs = el('div', { class: 'ng-r-para-img-side' });
      var menuBtn;
      [
        { ic: '⬆', t: '收起', fn: function () { var rd = $('#ng-reader'); if (rd) rd.scrollTop = 0; } },
        { ic: '✦', t: '主菜单', fn: function () { showMenu(chapter, idx); } },
        { ic: '☆', t: '收藏', fn: function () { toast('ok', '已收藏', chapter.title); } },
        { ic: '↗', t: '分享', fn: function () { toast('ok', '分享', '已复制章节标题'); } },
        { ic: '▢', t: '截图', fn: function () { toast('ok', '截图', '已保存到相册'); } }
      ].forEach(function (a) {
        var b = el('button', { class: 'ng-r-para-img-action', title: a.t }, a.ic);
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          a.fn();
        });
        if (a.t === '主菜单') menuBtn = b;
        rightActs.appendChild(b);
      });
      img.appendChild(rightActs);

      card.appendChild(img);

      // 下半：文字字幕
      var txt = el('div', { class: 'ng-r-para-text' });
      var flow = el('div', { class: 'ng-r-para-text-flow' });
      flow.innerHTML = highlightEntities(p);
      txt.appendChild(flow);
      card.appendChild(txt);

      body.appendChild(card);
    });
    if (!totalParas) {
      var empty = el('div', { class: 'ng-r-para' });
      empty.innerHTML = '<div class="ng-r-para-text" style="text-align:center;color:rgba(255,232,176,.4)">（本章无正文）</div>';
      body.appendChild(empty);
    }

    // 3. 章节导航在主菜单里（V20-Z · 无底部按钮）
    var prevBtn = $('#ng-menu-prev'), nextBtn = $('#ng-menu-next');
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= total - 1;

    // 7. 滚动到 reader 顶部
    var rd = $('#ng-reader');
    if (rd) rd.scrollTop = 0;
  }

  function triggerExtension(label, chapter, idx) {
    var ext = $('#ng-menu-extension');
    var body = $('#ng-menu-ext-body');
    var titleEl = $('#ng-menu-ext-title');
    var paras = chapter.paragraphs || [];
    var title = '';
    var content = '';
    if (label.indexOf('再读一遍') >= 0) {
      title = '◆ 回到开头';
      content = paras.length ? paras[0] : '（无内容）';
      // 滚动到第一段
      var rd = $('#ng-reader');
      if (rd) { rd.scrollTop = 0; }
    } else if (label.indexOf('人物') >= 0) {
      title = '◆ 本章出场人物';
      var ents = window.LJNovelParser.extractEntities(paras);
      content = ents.npcs.length
        ? ents.npcs.map(function (n) { return '• ' + n.name; }).join('<br>')
        : '本章无显著出场人物';
    } else if (label.indexOf('道具') >= 0) {
      title = '◆ 本章提及物品';
      var ents2 = window.LJNovelParser.extractEntities(paras);
      content = ents2.items.length
        ? ents2.items.map(function (n) { return '• ' + n.name; }).join('<br>')
        : '本章无显著道具';
    } else if (label.indexOf('感想') >= 0) {
      title = '◆ 写下感想';
      var stash = getReadingNotes(idx);
      content = '<div style="margin-bottom:6px;font-size:11px;color:rgba(255,232,176,.55)">输入感想后回车保存</div>';
      if (stash.length) {
        content += stash.map(function (n, i) { return (i + 1) + '. ' + n; }).join('<br>') + '<br>';
      }
      var noteInp = el('input', { placeholder: '输入感想后回车保存' });
      noteInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && noteInp.value.trim()) {
          saveReadingNote(idx, noteInp.value.trim());
          toast('ok', '已记录', '本章多了一条感想');
        }
      });
      titleEl.textContent = title;
      body.innerHTML = content;
      body.appendChild(noteInp);
      ext.style.display = 'block';
      return;
    }
    titleEl.textContent = title;
    body.innerHTML = content;
    ext.style.display = 'block';
  }

  /* ---------- V20-Z · 主菜单弹窗 ---------- */
  function showMenu(chapter, idx) {
    // 填人物属性
    if (state.player) {
      $('#ng-menu-emoji').textContent = state.player.emoji || '🧑';
      $('#ng-menu-name').textContent = state.player.name;
      $('#ng-menu-desc').textContent = state.player.desc || '';
    } else {
      $('#ng-menu-emoji').textContent = '🧑';
      $('#ng-menu-name').textContent = '未选择';
      $('#ng-menu-desc').textContent = '请先在角色选择中创建主角';
    }
    // 属性 traits
    var traitsEl = $('#ng-menu-traits');
    traitsEl.innerHTML = '';
    if (state.traits && state.traits.length) {
      state.traits.forEach(function (t) {
        var s = el('span', null, t);
        traitsEl.appendChild(s);
      });
    } else {
      traitsEl.appendChild(el('span', { style: 'opacity:.5' }, '无'));
    }
    // 章节导航按钮状态
    var total = state.book.chapters.length;
    $('#ng-menu-prev').disabled = idx <= 0;
    $('#ng-menu-next').disabled = idx >= total - 1;
    // 重置扩展面板
    $('#ng-menu-extension').style.display = 'none';
    $('#ng-menu-ext-body').innerHTML = '';
    // 记录当前 chapter/idx 给菜单回调用
    state._menuChap = chapter;
    state._menuIdx = idx;
    // 打开
    $('#ng-menu-mask').classList.add('open');
  }

  function hideMenu() {
    $('#ng-menu-mask').classList.remove('open');
  }

  /* ---------- 主菜单事件绑定 ---------- */
  $('#ng-menu-close').addEventListener('click', hideMenu);
  $('#ng-menu-mask').addEventListener('click', function (e) {
    if (e.target === this) hideMenu();
  });
  $('#ng-menu-prev').addEventListener('click', function () {
    if (this.disabled) return;
    hideMenu();
    var idx = state._menuIdx;
    if (idx > 0) startChapter(idx - 1);
  });
  $('#ng-menu-next').addEventListener('click', function () {
    if (this.disabled) return;
    hideMenu();
    var idx = state._menuIdx;
    var total = state.book.chapters.length;
    if (idx < total - 1) startChapter(idx + 1);
  });
  $('#ng-menu-list').addEventListener('click', function () {
    hideMenu();
    saveProgress(state._menuIdx, 0);
    showMode('chapters');
    renderChapterList();
  });
  $('#ng-menu-save').addEventListener('click', function () {
    saveProgress(state._menuIdx, 0);
    toast('ok', '存档成功', state.book.chapters[state._menuIdx].title);
  });
  $('#ng-menu-load').addEventListener('click', function () {
    hideMenu();
    showProgressMask();
  });
  $('#ng-menu-restart-para').addEventListener('click', function () {
    hideMenu();
    var rd = $('#ng-reader');
    if (rd) rd.scrollTop = 0;
  });
  $('#ng-menu-show-chars').addEventListener('click', function () {
    triggerExtension('查看人物关系', state._menuChap, state._menuIdx);
  });
  $('#ng-menu-show-items').addEventListener('click', function () {
    triggerExtension('查看道具', state._menuChap, state._menuIdx);
  });
  $('#ng-menu-add-note').addEventListener('click', function () {
    triggerExtension('写下感想', state._menuChap, state._menuIdx);
  });
  $('#ng-menu-back-home').addEventListener('click', function () {
    hideMenu();
    showMode('upload');
    showSplash();
  });

  function getReadingNotes(chapIdx) {
    try {
      var raw = localStorage.getItem(STORE_KEY + '_' + state.bookHash + '_notes_' + chapIdx);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveReadingNote(chapIdx, txt) {
    var notes = getReadingNotes(chapIdx);
    notes.push(txt);
    try { localStorage.setItem(STORE_KEY + '_' + state.bookHash + '_notes_' + chapIdx, JSON.stringify(notes)); }
    catch (e) {}
    toast('ok', '已记录', '本章多了一条感想');
  }

  /* ---------- 进度存档（V20-X：长滚动阅读专用） ---------- */
  function saveProgress(chapIdx, blockIdx) {
    if (!state.bookHash) return;
    try {
      var snap = {
        chapIdx: chapIdx,
        chapTitle: (state.book.chapters[chapIdx] || {}).title || '',
        blockIdx: blockIdx,
        totalBlocks: (state.book.chapters[chapIdx] || {}).paragraphs ? state.book.chapters[chapIdx].paragraphs.length : 0,
        inventory: state.inventory,
        paid: state.paidChaps,
        savedAt: Date.now()
      };
      localStorage.setItem(STORE_KEY + '_' + state.bookHash + '_progress', JSON.stringify(snap));
      updateChaptersBtn();
    } catch (e) {}
  }

  /* ---------- 事件绑定：splash / entry mask / progress mask ---------- */
  $('#ng-splash-start').addEventListener('click', function () {
    if (!state.book) { loadDemo(); return; }
    showEntryMask();
  });
  $('#ng-splash-pick').addEventListener('click', function () {
    $('#ng-file').click();
  });
  $('#ng-entry-back').addEventListener('click', function () {
    $('#ng-entry-mask').classList.remove('open');
  });
  $('#ng-entry-continue').addEventListener('click', function () {
    if (this.disabled) return;
    $('#ng-entry-mask').classList.remove('open');
    showProgressMask();
  });
  $('#ng-entry-restart').addEventListener('click', function () {
    $('#ng-entry-mask').classList.remove('open');
    showRoleCreateMask();
  });
  $('#ng-progress-close').addEventListener('click', function () {
    $('#ng-progress-mask').classList.remove('open');
    showEntryMask();
  });
  $('#ng-progress-back').addEventListener('click', function () {
    $('#ng-progress-mask').classList.remove('open');
    showEntryMask();
  });
  $('#cm-close').addEventListener('click', function () {
    $('#ng-char-mask').classList.remove('open');
    // 关闭后回到 entry mask（让用户能再选）
    showEntryMask();
  });
  $('#cm-back').addEventListener('click', function () {
    $('#ng-char-mask').classList.remove('open');
    showEntryMask();
  });
  // 替换原有 cm-start 绑定 → V20-X 模式直接 startChapter(0)
  $('#cm-start').onclick = function () {
    if (!state.player) { toast('warn', '请先选择角色', ''); return; }
    $('#ng-char-mask').classList.remove('open');
    // 提示属性选择（如果有）
    if (state.traits && state.traits.length) {
      toast('ok', '角色已建', state.player.name + ' · ' + state.traits.join('·'));
    }
    startChapter(0);
  };

  // V20-Z：删除回顶按钮和末尾选项（功能在主菜单里）
  // $('#ng-back-top').addEventListener('click', ...) 已删除

  // 让 loadTxt 在完成后自动弹 entry mask（V20-X 流程）
  var _origLoadTxt = loadTxt;
  loadTxt = function (text, source) {
    _origLoadTxt(text, source);
    if (state.book) {
      // 直接渲染 splash（书名+开始），用户点开始才弹 entry
      setTimeout(function () { showSplash(); }, 50);
    }
  };

  // 当 ?demo=1 / ?book=xxx 加载完后，自动弹 entry mask（用户从外部入口进来跳过 splash）
  var _autoEntryShown = false;
  function autoShowEntry() {
    if (_autoEntryShown) return;
    if (state.book && state.bookHash) {
      _autoEntryShown = true;
      setTimeout(function () { showEntryMask(); }, 250);
    } else {
      setTimeout(autoShowEntry, 200);
    }
  }

  // 老的 cm-start click 保留兼容
  var _cmStartOld = $('#cm-start').onclick;

  window.LJNovelGame = {
    state: function () { return state; },
    loadTxt: loadTxt,
    parseOriginalNovel: function (t) { return window.LJNovelParser.parseOriginalNovel(t); },
    showEntryMask: showEntryMask,
    showProgressMask: showProgressMask,
    renderChapterReader: renderChapterReader
  };

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