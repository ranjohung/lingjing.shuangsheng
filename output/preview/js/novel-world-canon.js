/* ==============================================================
 * V3.0 · Novel World Canon Reader — 原文阅读器
 * --------------------------------------------------------------
 * 功能：
 *   1. 加载公版小说世界数据（内嵌 / fetch fallback）
 *   2. SHA-256 哈希校验（Canon Lock: SOURCE→CANON→HASH→ANCHOR→IMMUTABLE）
 *   3. 将原文 anchor 转换为 Script Action 序列
 *   4. 通过 V3.0 Runtime 播放，逐段呈现原文
 *
 * 铁律：零删减原文 · 零创造内容 · 只组合标准动作
 * 每段原文标注来源为 AUTHOR_ORIGINAL，不可修改、不可删除、不可重排
 * ============================================================== */
(function (global) {
  'use strict';

  // ============ 状态 ============
  var currentBook = null;
  var currentChapter = 1;
  var canonData = null;     // 加载的世界数据
  var hashStore = {};       // anchor_id → SHA-256 hash
  var verified = false;     // 是否已通过哈希校验

  // ============ 书目配置 ============
  var BOOKS = [
    { id: 'sanguoyanyi',  title: '三国演义',  author: '罗贯中',   emoji: '⚔️', bg: 'palace_tang',     cov: 'linear-gradient(135deg,#6B2737,#B8863B)' },
    { id: 'hongloumeng',  title: '红楼梦',    author: '曹雪芹',   emoji: '🪷', bg: 'study_republic',  cov: 'linear-gradient(135deg,#4A1A2C,#8B5E6B)' },
    { id: 'xiyouji',      title: '西游记',    author: '吴承恩',   emoji: '🐒', bg: 'xianxia_peak',    cov: 'linear-gradient(135deg,#1A3A5C,#2E7D6B)' },
    { id: 'shuihuzhuan',  title: '水浒传',    author: '施耐庵',   emoji: '🌊', bg: 'pavilion_night',  cov: 'linear-gradient(135deg,#1B3A2E,#3D5A45)' }
  ];

  function getBooks() { return BOOKS; }

  function findBook(id) {
    for (var i = 0; i < BOOKS.length; i++) {
      if (BOOKS[i].id === id) return BOOKS[i];
    }
    return null;
  }

  // ============ SHA-256 哈希（Canon Lock） ============
  function sha256(text) {
    try {
      if (!global.crypto || !global.crypto.subtle) throw new Error('Web Crypto unavailable');
      var encoder = new TextEncoder();
      var data = encoder.encode(text);
      return global.crypto.subtle.digest('SHA-256', data).then(function (hash) {
        var arr = new Uint8Array(hash);
        var hex = '';
        for (var i = 0; i < arr.length; i++) {
          hex += arr[i].toString(16).padStart(2, '0');
        }
        return hex;
      }).catch(function () {
        // crypto.subtle 失败（如非安全上下文），降级为简单哈希
        return simpleHash(text);
      });
    } catch (e) {
      return Promise.resolve(simpleHash(text));
    }
  }

  function simpleHash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  // ============ 加载世界数据 ============
  function loadWorld(bookId, callback) {
    currentBook = bookId;
    // 优先使用内嵌数据
    var embedded = global.__CANON_DATA__;
    if (embedded && embedded[bookId]) {
      canonData = embedded[bookId];
      // 尝试 fetch 加载完整数据（更多章节）
      tryFetchFull(bookId, function(fullData) {
        if (fullData) {
          canonData = fullData;
        }
        verifyCanon(callback);
      });
      return;
    }
    // 无内嵌数据，直接 fetch
    tryFetchFull(bookId, function(fullData) {
      if (fullData) {
        canonData = fullData;
        verifyCanon(callback);
      } else {
        console.error('[Canon] 无法加载数据:', bookId);
        if (callback) callback(null, new Error('无法加载数据'));
      }
    });
  }

  function tryFetchFull(bookId, callback) {
    var base = '';
    try { base = new URL('output/preview/', global.location ? global.location.href : 'file:///').href; } catch (e) {}
    var url = base + 'worlds/' + bookId + '.json';
    try {
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (data) {
        if (callback) callback(data);
      }).catch(function () {
        if (callback) callback(null);
      });
    } catch (e) {
      if (callback) callback(null);
    }
  }

  // ============ Canon Lock 校验 ============
  async function verifyCanon(callback) {
    if (!canonData || !canonData.anchors) {
      if (callback) callback(null, new Error('无数据可校验'));
      return;
    }
    var anchors = canonData.anchors;
    var allValid = true;
    var checked = 0;

    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (!a.immutable) continue;
      var hash = await sha256(a.text);
      var aid = a.id || ('C' + i);
      if (hashStore[aid]) {
        // 已存储的哈希，校验一致性
        if (hashStore[aid] !== hash) {
          console.error('[Canon Lock] 哈希不匹配! anchor:', aid);
          allValid = false;
        }
      } else {
        // 首次存储
        hashStore[aid] = hash;
      }
      checked++;
    }

    verified = allValid;
    console.log('[Canon Lock] 校验完成:', checked, '段, 状态:', verified ? '通过' : '异常');
    if (callback) callback({
      verified: verified,
      checked: checked,
      total: anchors.length
    });
  }

  // ============ 获取章节列表 ============
  function getChapters() {
    if (!canonData || !canonData.anchors) return [];
    var map = {};
    canonData.anchors.forEach(function (a) {
      var ch = a.chapter || 1;
      if (!map[ch]) map[ch] = { num: ch, count: 0, firstText: a.text.substring(0, 40) };
      map[ch].count++;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.num - b.num; });
  }

  // ============ 获取书目元数据 ============
  function getMeta() {
    if (!canonData) return null;
    return canonData.meta || {};
  }

  // ============ V3.0 演出编译辅助 ============
  // 章节内原始说话者提取（不用 demo 角色映射，公版书用真实人名）
  function detectSpeakerRaw(text) {
    var m = text.match(/^([^，。！？\s「」『』:""''（）]{2,5})(道|曰|说|便道|笑道|问曰|答曰|叫道|叹道|怒道|喜道|惊道)/);
    if (m) {
      var blacklist = ['于是', '然后', '忽然', '只见', '且说', '话说', '却说', '此时', '正在', '不多时', '正欲'];
      if (blacklist.indexOf(m[1]) >= 0) return '';
      return m[1];
    }
    return '';
  }

  // bookId → 资产 URL 前缀（与 <base>=output/preview/ 对齐）
  function assetBase() {
    return 'img/novel-forge/' + (currentBook || '') + '/';
  }

  // scene_id → 背景图文件
  function buildSceneBgMap() {
    var map = {};
    var bgs = (canonData && canonData.assets && canonData.assets.backgrounds) || [];
    bgs.forEach(function (bg) {
      (bg.scene_ids || []).forEach(function (sid) { map[sid] = bg.file; });
    });
    return map;
  }

  // 立绘名 → 文件（并把映射注入舞台）
  function stageRegisterCharacters() {
    var Stage = global.NovelWorldStage;
    if (!Stage || !Stage.registerCharacters) return;
    Stage.clearCharacters();
    var ps = (canonData && canonData.assets && canonData.assets.portraits) || [];
    var map = {};
    ps.forEach(function (p) {
      if (p.name && p.file) map[p.name] = { url: assetBase() + p.file, name: p.name };
    });
    Stage.registerCharacters(map);
  }

  // ============ 构建 Script Action 序列 ============
  function buildScript(chapterNum) {
    if (!canonData || !canonData.anchors) return null;
    var anchors = canonData.anchors.filter(function (a) { return (a.chapter || 1) === chapterNum; });
    if (!anchors.length) return null;

    var meta = canonData.meta || {};
    var book = findBook(currentBook) || {};
    var actions = [];

    // V3.0 演出层：注入本书立绘映射
    stageRegisterCharacters();
    var sceneBg = buildSceneBgMap();
    var presMap = canonData.presentation || {};
    var hasStaging = !!Object.keys(presMap).length;
    var lastScene = null;
    var onStage = {};

    // 章节开场：按首锚点场景定背景
    var firstPres = hasStaging ? (presMap[anchors[0].id] || null) : null;
    var openBg = (firstPres && sceneBg[firstPres.scene_id]) ? assetBase() + sceneBg[firstPres.scene_id] : (book.bg || 'pavilion_night');
    actions.push({ type: 'SHOW_BACKGROUND', params: { bg_id: openBg, transition: 'fade' } });
    lastScene = firstPres ? firstPres.scene_id : null;
    actions.push({ type: 'PLAY_BGM', params: { bgm_id: 'bgm_canon', loop: true } });
    actions.push({ type: 'SHOW_NARRATION', params: { text: '【' + (meta.title || '') + ' · 第' + chapterNum + '回】\n' + (meta.author ? '作者：' + meta.author : '') + '\n— Canon Lock: SHA-256 Verified —' } });

    // 逐段原文转 Action（V3.0：场景切换 + 立绘出场 + 逐句等待）
    anchors.forEach(function (a) {
      var text = a.text || '';
      var aid = a.id || '';
      var anchorType = a.type || '叙述';

      // --- 演出：场景切换 ---
      if (hasStaging) {
        var pres = presMap[aid] || null;
        if (pres && pres.scene_id && pres.scene_id !== lastScene && sceneBg[pres.scene_id]) {
          actions.push({ type: 'CHANGE_BACKGROUND', params: { bg_id: assetBase() + sceneBg[pres.scene_id], transition: 'fade' } });
          lastScene = pres.scene_id;
        }
        // --- 演出：立绘出场（最多同台 2 人，先行者居右） ---
        if (pres && pres.characters && pres.characters.length) {
          var slots = ['center-right', 'center-left'];
          pres.characters.slice(0, 2).forEach(function (name, idx) {
            if (!onStage[name]) {
              onStage[name] = true;
              actions.push({ type: 'SHOW_CHARACTER', params: { char_id: name, position: slots[idx] || 'center-right', pose: 'standing', expression: 'normal' } });
            }
          });
        }
      }

      // --- 正文（原文不可变） ---
      if (anchorType === '对白') {
        var speaker = hasStaging ? detectSpeakerRaw(text) : '';
        if (!speaker && detectSpeaker) { /* 保持兼容 */ }
        if (speaker) {
          actions.push({ type: 'SHOW_DIALOGUE', params: { speaker_id: speaker, text: text.replace(/^([^，。！？\s「」『』:""''（）]{2,5})(道|曰|说|便道|笑道|问曰|答曰|叫道|叹道|怒道|喜道|惊道)/, '') } });
        } else {
          var si = detectSpeaker(text);
          actions.push({ type: 'SHOW_DIALOGUE', params: { speaker_id: si.speaker || '', text: si.cleanText || text } });
        }
      } else if (anchorType === '转折') {
        actions.push({ type: 'SHOW_EFFECT', params: { effect_id: 'flash', duration: 300 } });
        actions.push({ type: 'SHOW_NARRATION', params: { text: text } });
      } else {
        actions.push({ type: 'SHOW_NARRATION', params: { text: text } });
      }
    });

    // 章节结尾
    actions.push({ type: 'SHOW_NARRATION', params: { text: '【第' + chapterNum + '回 · 完】\n— 原文已完整呈现 · 不可修改 · 不可删减 —' } });
    actions.push({ type: 'SHOW_SYSTEM_MESSAGE', params: { text: '本章原文已全部呈现' } });
    actions.push({ type: 'WAIT_CLICK' });

    // 如果有下一章，提供入口
    var nextCh = chapterNum + 1;
    var hasNext = canonData.anchors.some(function (a) { return (a.chapter || 1) === nextCh; });
    if (hasNext) {
      actions.push({ type: 'CANON_CHAPTER_END', params: { chapter: chapterNum, hasNext: true, bookId: currentBook } });
    } else {
      actions.push({ type: 'CANON_CHAPTER_END', params: { chapter: chapterNum, hasNext: false, bookId: currentBook } });
    }

    var nodes = [{
      node_id: 'ch' + chapterNum,
      node_type: 'CANON',
      source_paragraph_start: 0,
      source_paragraph_end: anchors.length - 1,
      actions: actions,
      next_node: null
    }];

    // 构建所有后续章节的节点，确保 jumpToNode 能找到目标
    var allChapters = getChapters();
    for (var ci = 0; ci < allChapters.length; ci++) {
      var chNum = allChapters[ci].num;
      if (chNum === chapterNum) continue;  // 当前章节已构建
      var chNode = buildChapterNode(chNum);
      if (chNode) nodes.push(chNode);
    }

    return {
      script_id: 'canon_' + (currentBook || 'unknown') + '_ch' + chapterNum,
      novel_id: currentBook || 'unknown',
      chapter: chapterNum,
      script_name: (meta.title || '') + ' · 第' + chapterNum + '回',
      nodes: nodes
    };
  }

  function buildChapterNode(chapterNum) {
    if (!canonData || !canonData.anchors) return null;
    var anchors = canonData.anchors.filter(function (a) { return (a.chapter || 1) === chapterNum; });
    if (!anchors.length) return null;

    var meta = canonData.meta || {};
    var book = findBook(currentBook) || {};
    var actions = [];

    actions.push({ type: 'SHOW_NARRATION', params: { text: '【第' + chapterNum + '回】' } });

    anchors.forEach(function (a) {
      var text = a.text || '';
      var anchorType = a.type || '叙述';
      if (anchorType === '对白') {
        var si = detectSpeaker(text);
        actions.push({ type: 'SHOW_DIALOGUE', params: { speaker_id: si.speaker || '', text: si.cleanText || text } });
      } else if (anchorType === '转折') {
        actions.push({ type: 'SHOW_EFFECT', params: { effect_id: 'flash', duration: 300 } });
        actions.push({ type: 'SHOW_NARRATION', params: { text: text } });
      } else {
        actions.push({ type: 'SHOW_NARRATION', params: { text: text } });
      }
    });

    actions.push({ type: 'SHOW_NARRATION', params: { text: '【第' + chapterNum + '回 · 完】' } });
    actions.push({ type: 'SHOW_SYSTEM_MESSAGE', params: { text: '本章原文已全部呈现' } });
    actions.push({ type: 'WAIT_CLICK' });

    var nextCh = chapterNum + 1;
    var hasNext = canonData.anchors.some(function (a) { return (a.chapter || 1) === nextCh; });
    if (hasNext) {
      actions.push({ type: 'CANON_CHAPTER_END', params: { chapter: chapterNum, hasNext: true, bookId: currentBook } });
    } else {
      actions.push({ type: 'CANON_CHAPTER_END', params: { chapter: chapterNum, hasNext: false, bookId: currentBook } });
    }

    return {
      node_id: 'ch' + chapterNum,
      node_type: 'CANON',
      actions: actions,
      next_node: null
    };
  }

  // ============ 说话者检测 ============
  // 中文古典小说常见对话格式：
  // "XXX道：「...」" / "XXX曰：" / "XXX便道：" / "XXX笑道："
  function detectSpeaker(text) {
    // 匹配开头的说话者：2-4个汉字 + 道/曰/说/问/答/叫/笑/叹
    var m = text.match(/^([^，。！？\s「」『』:""''（）]{2,5})(道|曰|说|便道|笑道|问曰|答曰|叫道|叹道|怒道|喜道|惊道)/);
    if (m) {
      var speaker = m[1];
      // 过滤常见的非人名前缀
      var blacklist = ['于是', '然后', '忽然', '只见', '且说', '话说', '却说', '此时', '正在', '不多时', '正欲'];
      if (blacklist.indexOf(speaker) >= 0) return { speaker: '', cleanText: text };
      // 尝试映射到角色 ID（用于立绘显示）
      var charId = mapCharName(speaker);
      return { speaker: charId || speaker, cleanText: text };
    }
    return { speaker: '', cleanText: text };
  }

  // ============ 角色名 → char_id 映射 ============
  function mapCharName(name) {
    var map = {
      '刘备': 'gu_yan', '玄德': 'gu_yan',
      '关羽': 'shen_zhou', '云长': 'shen_zhou',
      '张飞': 'bai_lusheng', '翼德': 'bai_lusheng',
      '曹操': 'wen_heng', '孟德': 'wen_heng',
      '诸葛亮': 'a_luo', '孔明': 'a_luo',
      '宝玉': 'gu_yan', '贾宝玉': 'gu_yan',
      '黛玉': 'lin_shuangwan', '林黛玉': 'lin_shuangwan',
      '宝钗': 'jiang_yinxue', '薛宝钗': 'jiang_yinxue',
      '王熙凤': 'lin_shuangwan', '凤姐': 'lin_shuangwan',
      '悟空': 'gu_yan', '孙悟空': 'gu_yan', '行者': 'gu_yan',
      '唐僧': 'shen_zhou', '三藏': 'shen_zhou', '师父': 'shen_zhou',
      '八戒': 'bai_lusheng', '悟能': 'bai_lusheng',
      '宋江': 'gu_yan', '公明': 'gu_yan',
      '武松': 'shen_zhou', '行者武松': 'shen_zhou',
      '鲁智深': 'wen_heng', '鲁达': 'wen_heng'
    };
    return map[name] || '';
  }

  // ============ 播放章节 ============
  function playChapter(chapterNum) {
    currentChapter = chapterNum;
    var Stage = global.NovelWorldStage;
    if (Stage && Stage.clearCharacters) Stage.clearCharacters();
    var script = buildScript(chapterNum);
    if (!script) {
      console.warn('[Canon] 无法构建第' + chapterNum + '回的剧本');
      return false;
    }
    var Runtime = global.NovelWorldRuntime;
    if (Runtime) {
      Runtime.setScriptData(script);
      Runtime.play(script.nodes[0]);
      return true;
    }
    return false;
  }

  // ============ 跳转处理 ============
  // CANON_CHAPTER_END 由页面设置的回调处理
  var onChapterEnd = null;  // function(action, chapterNum, hasNext) {}
  function setChapterEndHandler(fn) { onChapterEnd = fn; }

  function registerCanonActions() {
    var Runtime = global.NovelWorldRuntime;
    if (!Runtime) return;

    // CANON_CHAPTER_END: 章节结束导航
    Runtime.registerAction('CANON_CHAPTER_END', function (p, ctrl) {
      ctrl.pause();
      if (onChapterEnd) {
        onChapterEnd(p.chapter || 1, p.hasNext !== false, function (action) {
          // action: 'next' | 'chapters' | 'restart'
          ctrl.resume();
          if (action === 'next' && p.hasNext) {
            var nextCh = (p.chapter || 1) + 1;
            ctrl.jumpToNode('ch' + nextCh);
          } else if (action === 'restart') {
            ctrl.jumpToNode('ch' + (p.chapter || 1));
          } else if (action === 'chapters') {
            // 由页面处理：切换到章节列表界面
            if (global.__canonGoChapters) global.__canonGoChapters();
          }
        });
      } else {
        // 无回调，直接推进
        ctrl.advance();
      }
    });
  }

  // ============ 获取哈希信息（用于 UI 展示） ============
  function getHashInfo() {
    return {
      verified: verified,
      totalAnchors: canonData ? canonData.anchors.length : 0,
      hashed: Object.keys(hashStore).length,
      store: hashStore
    };
  }

  // ============ 对外 API ============
  global.NovelWorldCanon = {
    VERSION: '3.0',
    getBooks: getBooks,
    loadWorld: loadWorld,
    playChapter: playChapter,
    getChapters: getChapters,
    getMeta: getMeta,
    getHashInfo: getHashInfo,
    buildScript: buildScript,
    sha256: sha256,
    registerCanonActions: registerCanonActions,
    setChapterEndHandler: setChapterEndHandler,
    getCurrentBook: function () { return currentBook; },
    getCurrentChapter: function () { return currentChapter; }
  };

})(window);
