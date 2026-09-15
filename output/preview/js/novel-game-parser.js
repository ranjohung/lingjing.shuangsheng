/* =====================================================================
 * V20-X · 通用小说世界引擎解析器（不删减原文章节）
 *
 * V20-V 旧版（parseNovel）保留向后兼容：
 *   ## 章名 / ### 场景：名 / 「角色」对话 / {道具:..} / {人物:..} / [选项|选项] / 【收费章节：N灵晶】
 *
 * 新版（parseOriginalNovel）严格按原小说结构：
 *   - 章节标题天然识别：第N回 / 第N章 / Chapter N / CHAPTER N / 卷N / 第N卷 / 第X部 / 首行无标识时按段分章
 *   - 章节内 = 原文全文保留（不切场景、不解析选项/道具标注）
 *   - 段落切分仅按空行（视觉分段，不改写）
 *   - 标题识别全局：第一章 / 第 1 章 / 第1回 等
 *
 * 输出 JSON：
 *   {
 *     title: "...", chapters: [
 *       { title:"...", paragraphs:["原文段1","原文段2",...], cost: 0|20|30 }
 *     ]
 *   }
 *
 * 人物 / 物品提取（用于 hotzone 工具型显示）：
 *   - 章节文本中匹配「【XX】」/「XX道」/「XX曰」格式 → 角色名
 *   - 章节文本中匹配「XX剑」「XX瓶」「XX图」等具名词 → 物品名
 *   - 实际抽取交给 novel-game.js 的 extractEntities() 处理（基于章节文本）
 * ===================================================================== */
(function () {
  // ---- V20-X 新版：原文章节切段 ----
  // 章节标题正则集合
  var CHAPTER_PATTERNS = [
    /^##\s+(.+)$/, // demo-txt 兼容
    /^#\s+(.+)$/,
    /^第[\s ]*([0-9零一二三四五六七八九十百千万]+)[\s ]*(回|章|卷|部)\b[、：:．\. ]*(.*)$/i,
    /^第[\s ]*([0-9零一二三四五六七八九十百千万]+)[\s ]*(回|章|卷|部)\b\s*$/i,
    /^chapter[\s ]+([0-9]+|[ivxlcdm]+)\s*[:：．\. ]*(.*)$/i,
    /^CHAPTER[\s ]+([0-9]+|[IVXLCDM]+)\s*[:：．\. ]*(.*)$/,
    /^卷[\s ]*([0-9零一二三四五六七八九十百千万]+)\b[、：:．\. ]*(.*)$/i,
    /^卷[\s ]*([0-9零一二三四五六七八九十百千万]+)\b\s*$/i
  ];

  function isChapterTitle(line) {
    var t = line.trim();
    if (!t) return null;
    for (var i = 0; i < CHAPTER_PATTERNS.length; i++) {
      var m = t.match(CHAPTER_PATTERNS[i]);
      if (m) {
        // V20-X：前两个 pattern（## / # 开头）返回去掉前缀的标题
        if (i < 2) return { title: (m[1] || t).trim(), raw: m };
        return { title: t, raw: m };
      }
    }
    return null;
  }

  function parseOriginalNovel(txt) {
    var raw = String(txt || '').replace(/\r\n/g, '\n');
    var lines = raw.split('\n');
    var out = { title: '未命名小说', chapters: [] };

    // 1. 取文件首行（若是 # / ## 标识则作为标题）
    var titleFound = false;
    var i = 0;
    if (lines.length && /^#\s+/.test(lines[0].trim()) && !/^##/.test(lines[0].trim())) {
      out.title = lines[0].trim().replace(/^#\s+/, '');
      titleFound = true;
      i = 1;
    }

    var curChap = null;
    function ensureChap(title) {
      curChap = { title: title, paragraphs: [], cost: 0 };
      out.chapters.push(curChap);
    }
    function paraAppend(text) {
      if (!curChap) {
        // V22-D 修复：无任何章节标记的纯段落文本（如拼接后的原文）不能再对
        // '序章' 字符串跑 isChapterTitle（返回 null → null.title 崩溃），
        // 直接回退为「序章」章。
        var prev = lines.slice(0, i).reverse().find(isChapterTitle);
        ensureChap((prev && prev.title) || '序章');
      }
      var s = (text || '').trim();
      if (s) curChap.paragraphs.push(s);
    }

    for (; i < lines.length; i++) {
      var line = lines[i];
      var t = line.trim();
      if (!t) continue;
      var ch = isChapterTitle(t);
      if (ch) {
        ensureChap(ch.title);  // V20-X：用去掉 ## 前缀的标题
        continue;
      }
      // 收费点标记（V20-V 兼容 — 但不删减原文，仍可标）
      var costMatch = t.match(/^【收费章节[：:]\s*(\d+)\s*灵晶】/);
      if (costMatch) {
        if (curChap) curChap.cost = parseInt(costMatch[1], 10) || 0;
        continue;
      }
      // 普通段落
      paraAppend(t);
    }

    // 2. 若整篇无章节标题，按段（空行）切章兜底（demo 用）
    if (out.chapters.length === 0 || (out.chapters.length === 1 && out.chapters[0].paragraphs.length > 8)) {
      // 把全文按空行切为段，每段升级为章
      var allParas = [];
      out.chapters.forEach(function (c) { allParas = allParas.concat(c.paragraphs); });
      if (allParas.length > 8) {
        out.chapters = [];
        // 每 2-3 段合并为一章
        var n = Math.ceil(allParas.length / 3);
        for (var k = 0; k < n; k++) {
          var slice = allParas.slice(k * 3, (k + 1) * 3);
          out.chapters.push({ title: '第' + (k + 1) + ' 段', paragraphs: slice, cost: (k >= 2 ? 5 : 0) });
        }
        out.title = out.title || '通用示例';
      }
    }

    // 3. 兜底：cost 字段默认前 3 章免费
    var freeN = 2;
    out.chapters.forEach(function (c, idx) {
      if (idx > freeN && !c.cost) c.cost = 5;
    });

    // 4. 标题兜底
    if (!out.title || out.title === '未命名小说') {
      out.title = out.chapters.length ? out.chapters[0].title.split(/\s/)[0] || '通用小说' : '通用小说';
    }

    return out;
  }

  // ---- V20-V 旧版（向后兼容，仅 demo-txt 用得到）----
  function parseNovel(txt) {
    var lines = String(txt || '').replace(/\r\n/g, '\n').split('\n');
    var out = { title: '未命名小说', chapters: [] };
    var curChap = null;
    var curScene = null;
    var titleTaken = false;
    function ensureChap() {
      if (!curChap) {
        curChap = { title: '未命名章节', cost: 0, scenes: [], paragraphs: [] };
        out.chapters.push(curChap);
      }
    }
    function ensureScene(name) {
      ensureChap();
      curScene = { name: name || '默认场景', blocks: [] };
      curChap.scenes.push(curScene);
    }
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      var line = raw.trim();
      if (!line) continue;
      if (!titleTaken && /^#\s+/.test(line) && !/^##/.test(line)) {
        out.title = line.replace(/^#\s+/, '').trim();
        titleTaken = true;
        continue;
      }
      if (/^##\s+/.test(line)) {
        var cTitle = line.replace(/^##\s+/, '').trim();
        curChap = { title: cTitle, cost: 0, scenes: [], paragraphs: [] };
        out.chapters.push(curChap);
        curScene = null;
        continue;
      }
      if (/^###\s+/.test(line)) {
        ensureChap();
        var sName = line.replace(/^###\s+/, '').replace(/^场景[:：]\s*/, '').trim() || '默认场景';
        curScene = { name: sName, blocks: [] };
        curChap.scenes.push(curScene);
        continue;
      }
      var costMatch = line.match(/^【收费章节[：:]\s*(\d+)\s*灵晶】/);
      if (costMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curChap.cost = parseInt(costMatch[1], 10) || 0;
        continue;
      }
      var choiceMatch = line.match(/^\[(.+?)\]/);
      if (choiceMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        var opts = choiceMatch[1].split('|').map(function (s) { return s.trim(); }).filter(Boolean);
        if (opts.length) curScene.blocks.push({ type: 'choice', options: opts });
        continue;
      }
      var itemMatch = line.match(/^\{道具[：:](.+?)\}/);
      if (itemMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curScene.blocks.push({ type: 'item', name: itemMatch[1].trim() });
        continue;
      }
      var npcMatch = line.match(/^\{人物[：:](.+?)\}/);
      if (npcMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curScene.blocks.push({ type: 'npc', name: npcMatch[1].trim() });
        continue;
      }
      var dlgMatch = line.match(/^「([^」]+)」(.+)$/);
      if (dlgMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curScene.blocks.push({ type: 'dialog', character: dlgMatch[1].trim(), text: dlgMatch[2].trim() });
        continue;
      }
      ensureChap();
      if (!curScene) ensureScene('默认场景');
      curScene.blocks.push({ type: 'narration', text: line });
    }
    return out;
  }

  function flatBlocks(chapter) {
    var out = [];
    (chapter.scenes || []).forEach(function (s) {
      out.push({ type: 'scene_name', name: s.name });
      (s.blocks || []).forEach(function (b) { out.push(b); });
    });
    return out;
  }

  /* 章节是否使用旧版带 scenes 标注格式（V20-V demo 用） */
  function hasLegacyScenes(chapters) {
    return chapters.some(function (c) { return c.scenes && c.scenes.length; });
  }

  /* 提取章节里的实体（人物/物品）用于工具型 hotzone
     输入：paragraphs: string[]
     输出：{ npcs:[{name,firstPara}], items:[{name,firstPara}] } */
  function extractEntities(paragraphs) {
    var NPC_PATTERNS = [
      /[「【](\S{2,5})[」】][道曰云说]/g,
      /(\S{2,5})(先生|女士|公子|姑娘|大人|将军|掌门|长老|师傅|前辈|老人|老翁|夫人|公主|王子|英雄|侠客|道士|和尚|尼姑|国王|王后)/g
    ];
    var ITEM_PATTERNS = [
      /(\S{1,3})(剑|刀|枪|弓|戟|锤|匕|针|环|帕|珠|玉|瓶|壶|镜|图|书|符|丹|药|酒|茶|琴|筝|笛|箫|砚|笔|伞|扇|镯|印|令|旗|帆|灯|火|镜|钥|桥|杖|经|香|绢|丝|线|绳|琴|笛|杖|针|砖|杯|盏|碗|碟|盘|壶)/g
    ];
    var npcMap = {}, itemMap = {};
    paragraphs.forEach(function (p, idx) {
      NPC_PATTERNS.forEach(function (re) {
        re.lastIndex = 0;
        var m;
        while ((m = re.exec(p)) !== null) {
          var n = m[1] || m[0];
          if (n.length < 2 || n.length > 6) continue;
          if (!npcMap[n] && !/^(于是|但是|然而|虽然|不过|可是|因为|由于|所以)/.test(n)) {
            npcMap[n] = idx;
          }
        }
      });
      ITEM_PATTERNS.forEach(function (re) {
        re.lastIndex = 0;
        var m;
        while ((m = re.exec(p)) !== null) {
          var it = (m[1] || '') + (m[2] || '');
          if (!it || it.length > 6) continue;
          if (!itemMap[it] && !/^(于是|但是|然而|虽然|不过|可是|因为|由于|所以)/.test(it)) {
            itemMap[it] = idx;
          }
        }
      });
    });
    var npcs = Object.keys(npcMap).slice(0, 8).map(function (n) { return { name: n, firstPara: npcMap[n] }; });
    var items = Object.keys(itemMap).slice(0, 8).map(function (n) { return { name: n, firstPara: itemMap[n] }; });
    return { npcs: npcs, items: items };
  }

  window.LJNovelParser = {
    parseOriginalNovel: parseOriginalNovel,
    parseNovel: parseNovel,
    flatBlocks: flatBlocks,
    hasLegacyScenes: hasLegacyScenes,
    extractEntities: extractEntities
  };
})();
