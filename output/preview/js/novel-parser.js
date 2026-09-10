/* v5.12 — 小说规则解析引擎（前端 JS，无 LLM）
   滑动窗口 2-3 字 + 高信度位置提示 + 章节标题排除 + 邻字合并
*/
(function () {
  // ===== 章节分段 =====
  function splitChapters(text) {
    if (!text || text.length < 10) return [{ id: 'c1', title: '第1节', heading: '', index: 0, text }];
    const lines = text.split(/[\n\r]+/);
    const chapterRe = /^\s*(第[一二三四五六七八九十百千零〇两\d]+[\s章回卷篇集部节][^\n]*|Chapter\s*\d+[^\n]*|CHAPTER\s*\d+[^\n]*|序章|终章|尾声|后记|外传[^\n]*)\s*$/i;
    const chs = []; let buf = []; let curTitle = '序章'; let curHeading = '序章'; let curIndex = 1;
    for (const line of lines) {
      if (chapterRe.test(line.trim())) {
        if (buf.length) {
          chs.push({ id: 'c' + curIndex, title: curTitle, heading: curHeading, index: curIndex, text: buf.join('\n').trim() });
          curIndex++;
        }
        curTitle = line.trim() || (curIndex + '章');
        curHeading = curTitle;
        buf = [];
      } else {
        buf.push(line);
      }
    }
    if (buf.length || chs.length === 0) {
      chs.push({ id: 'c' + curIndex, title: curTitle, heading: curHeading, index: curIndex, text: buf.join('\n').trim() });
    }
    return chs.length ? chs : [{ id: 'c1', title: '正文', heading: '', index: 1, text }];
  }

  // ===== 角色识别 — 仅 2-3 字 =====
  const STOP_NAMES = new Set([
    '什么','怎么','为何','为什么','这里','那里','此时','彼时','甚是','正是','可是','不料','原来','难道','或许','大约','忽然','突然','立刻','马上','片刻','半晌','看着','听了','说道','指了','心想','想到','再看','默默','偶然','神秘','悠悠','飘飘','淡淡','轻轻','缓缓','静静',
    '没有','可以','一个','一种','一些','这个','那个','这样','那样','现在','以后','以前','之后','之前','已经','还在','应该','必须','可能','所以','因此','因为','如果','虽然','然而','但是','不过','并且','以及',
    '开始','结束','继续','一时间','一会儿','一切','一直','一定','一样','一边','一面','一部分','如何','还有','不可能',
    '不是','就是','还是','也是','只是','甚至','比如','例如','自己','别人','大家','我们','你们','他们','她们','它们','这次','那次',
    '我叫','你是','他是','她是','就是','只是','终于','接着','陆家嘴','一开始','一招','一抬',
    '端着酒杯','大学时候','工作','时候','说是','点头','走来说话','的时候','时候'
  ]);

  function extractNames(text, maxNames = 30) {
    const chunks = text.match(/[\u4e00-\u9fa5]+/g) || [];
    const freq = new Map();
    for (const ch of chunks) {
      if (ch.length < 2) continue;
      // 仅 2-3 字滑动窗口
      for (let i = 0; i < ch.length; i++) {
        const maxLen = Math.min(3, ch.length - i);
        for (let len = 2; len <= maxLen; len++) {
          const w = ch.substr(i, len);
          if (STOP_NAMES.has(w)) continue;
          if (/^第[一二三四五六七八九十百千万零]+/.test(w)) continue;
          freq.set(w, (freq.get(w) || 0) + 1);
        }
      }
    }
    // 高信度位置加分
    const hintedNames = new Set();
    const nameHints = [
      /我叫([\u4e00-\u9fa5]{2,4})/g,
      /他叫([\u4e00-\u9fa5]{2,4})/g,
      /她叫([\u4e00-\u9fa5]{2,4})/g
    ];
    for (const re of nameHints) {
      let m; while ((m = re.exec(text)) !== null) {
        const name = m[1];
        if (STOP_NAMES.has(name)) continue;
        if (!freq.has(name)) freq.set(name, 0);
        freq.set(name, freq.get(name) + 5);
        hintedNames.add(name);
      }
    }
    // 章节标题行 — 用于排除假阳性
    const chapterTitles = new Set();
    const chapterLineRe = /^第[一二三四五六七八九十百千万零\d]+章\s*([^\n]+)/gm;
    let cm; while ((cm = chapterLineRe.exec(text)) !== null) {
      const t = cm[1].trim();
      for (let i = 0; i <= t.length - 2; i++) {
        for (let len = 2; len <= Math.min(3, t.length - i); len++) {
          chapterTitles.add(t.substr(i, len));
        }
      }
    }
    // 排序+过滤
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    const filtered = sorted.filter(([n, c]) => (c >= 2) || (hintedNames.has(n) && c >= 1));
    // body 出现次数（除章节标题外）
    const bodyText = text.replace(/第[一二三四五六七八九十百千万零\d]+章[^\n]*\n?/g, '');
    const bodyChunks = bodyText.match(/[\u4e00-\u9fa5]+/g) || [];
    const bodyHas = (name) => bodyChunks.some(ch => ch.indexOf(name) >= 0);
    // 去重
    const result = [];
    for (const [n, c] of filtered) {
      if (result.length >= maxNames) break;
      let subsumed = false;
      for (const r of result) {
        if (r.name.length < n.length && n.indexOf(r.name) >= 0 && c <= r.count + 2) { subsumed = true; break; }
        if (n.length < r.name.length && r.name.indexOf(n) >= 0 && c <= r.count) { subsumed = true; break; }
      }
      if (subsumed) continue;
      if (chapterTitles.has(n) && !bodyHas(n)) continue;
      result.push({ name: n, count: c });
    }
    // 合并：对 2-3 字候选 + 1 字生成 3-4 字名（合并必须 ≥ 2 次出现）
    const finalResult = result.slice();
    for (const a of result) {
      if (a.name.length !== 2 && a.name.length !== 3) continue;
      const reTry = new RegExp(a.name + '([一-龥])', 'g');
      let m;
      while ((m = reTry.exec(text)) !== null) {
        const combined = a.name + m[1];
        if (combined.length > 4) continue;
        if (STOP_NAMES.has(combined)) continue;
        const rawCount = freq.get(combined);
        if (!rawCount || rawCount < 2) continue;  // 合并必须出现 ≥ 2 次
        const combinedScore = rawCount + 5;
        const exactIdx = finalResult.findIndex(x => x.name === combined);
        if (exactIdx >= 0) {
          if (combinedScore > finalResult[exactIdx].count) finalResult[exactIdx].count = combinedScore;
          continue;
        }
        const subsumedByIdx = finalResult.findIndex(x => x.name !== combined && x.name.indexOf(combined) >= 0);
        if (subsumedByIdx >= 0) continue;
        finalResult.push({ name: combined, count: combinedScore });
      }
    }
    finalResult.sort((a, b) => b.count - a.count);
    return finalResult.slice(0, maxNames);
  }

  // ===== 高光关键词 =====
  const HIGHLIGHT_KW = [
    { kw: '决战', badge: '决战' }, { kw: '告白', badge: '告白' },
    { kw: '表白', badge: '告白' }, { kw: '重生', badge: '重生' },
    { kw: '穿越', badge: '穿越' }, { kw: '变身', badge: '变身' },
    { kw: '觉醒', badge: '觉醒' }, { kw: '化身', badge: '化身' },
    { kw: '继位', badge: '登基' }, { kw: '登基', badge: '登基' },
    { kw: '复仇', badge: '复仇' }, { kw: '报仇', badge: '复仇' },
    { kw: '死亡', badge: '生死' }, { kw: '死去', badge: '生死' },
    { kw: '牺牲', badge: '牺牲' }, { kw: '大战', badge: '决战' },
    { kw: '始祖', badge: '揭秘' }, { kw: '发现', badge: '揭秘' },
    { kw: '真相', badge: '揭秘' }, { kw: '秘密', badge: '揭秘' },
    { kw: '结婚', badge: '成婚' }, { kw: '成婚', badge: '成婚' },
    { kw: '埋伏', badge: '遭遇' }, { kw: '遇袭', badge: '遭遇' },
    { kw: '中毒', badge: '危机' }, { kw: '中计', badge: '危机' },
    { kw: '突破', badge: '突破' }, { kw: '飞升', badge: '飞升' },
    { kw: '复活', badge: '复活' }, { kw: '解救', badge: '解救' },
    { kw: '终局', badge: '决战' }, { kw: '拥抱', badge: '告白' },
    { kw: '赌', badge: '抉择' }
  ];

  function findHighlights(text) {
    const out = [];
    for (const h of HIGHLIGHT_KW) {
      const re = new RegExp(h.kw, 'g');
      let m;
      while ((m = re.exec(text)) !== null) {
        const start = Math.max(0, m.index - 80);
        const end = Math.min(text.length, m.index + 80);
        out.push({
          id: 'hl-' + out.length,
          keyword: h.kw,
          badge: h.badge,
          pos: m.index,
          excerpt: text.slice(start, end).replace(/\s+/g, ' ').trim()
        });
        if (out.length >= 30) break;
      }
    }
    return out;
  }

  // ===== 场景关键词 =====
  const SCENE_KW = [
    { kw: ['凉亭','雨夜','远山','灯笼'], scene: 'pavilion_night', mood: 'rainy' },
    { kw: ['教室','走廊','课桌','阳光','操场'], scene: 'classroom_sunny', mood: 'sunny' },
    { kw: ['霓虹','高楼','街道','摩天','招牌'], scene: 'neon_street', mood: 'cyber' },
    { kw: ['客厅','沙发','落地灯','茶几','暖灯'], scene: 'livingroom_warm', mood: 'warm' },
    { kw: ['飞剑','仙山','云海','古松','祭坛'], scene: 'xianxia_peak', mood: 'mystic' },
    { kw: ['宫殿','宴席','丝绸','红柱','团扇'], scene: 'palace_tang', mood: 'ancient' },
    { kw: ['书架','怀表','雨','电灯','古书'], scene: 'study_republic', mood: 'vintage' },
    { kw: ['森林','古树','精灵','萤火','小溪','遗迹'], scene: 'elf_forest', mood: 'forest' },
    { kw: ['星舰','舰桥','舷窗','操控台','光环'], scene: 'starship_bridge', mood: 'space' },
    { kw: ['咖啡馆','咖啡','街角','橱窗'], scene: 'cafe_dusk', mood: 'warm' },
    { kw: ['墓园','墓地','黑夜','月光','枯树'], scene: 'graveyard_night', mood: 'dark' },
    { kw: ['战场','军营','营帐','烽火'], scene: 'battle_field', mood: 'epic' },
    { kw: ['学院','魔法','塔楼','魔法阵'], scene: 'magic_academy', mood: 'fantasy' },
    { kw: ['飞船','太空舱','星空','银河'], scene: 'space_cabin', mood: 'space' },
    { kw: ['投行','写字楼','陆家嘴','办公室','酒会'], scene: 'cafe_dusk', mood: 'urban' },
    { kw: ['婚礼','订婚'], scene: 'palace_tang', mood: 'warm' }
  ];

  function matchScenes(text) {
    const matched = [];
    for (const sk of SCENE_KW) {
      let count = 0;
      for (const kw of sk.kw) {
        const re = new RegExp(kw, 'g');
        const m = text.match(re);
        if (m) count += m.length;
      }
      if (count >= 1) matched.push({ ...sk, count });
    }
    matched.sort((a, b) => b.count - a.count);
    return matched;
  }

  function pickOrTruncate(text, max = 60) {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return t.slice(0, max).replace(/[,，。 ;；]+$/, '') + '…';
  }
  function pickFirstSentence(text, max = 60) {
    const m = text.match(/[^。！？.!?\n]{1,80}/);
    if (!m) return pickOrTruncate(text, max);
    return pickOrTruncate(m[0], max);
  }

  // ===== 主函数 =====
  function parse(text, opts = {}) {
    const title = (opts.title || '未命名小说').slice(0, 100);
    const author = opts.author || '匿名';
    const genreId = opts.genre || matchBestGenreId(text, title);
    const chapters = splitChapters(text);
    const nameFreq = extractNames(text, 30);
    const chars = nameFreq.slice(0, 12).map((n, i) => ({
      id: 'ch-' + i,
      name: n.name,
      role: i === 0 ? 'main' : 'support',
      firstChapter: chapters[0]?.id,
      mentions: n.count,
      portrait: null,
      affinity: 50
    }));
    const highlights = findHighlights(text);
    const sceneMatches = matchScenes(text);
    const sceneHints = {};
    for (const sm of sceneMatches) {
      sceneHints[sm.scene] = { keywords: sm.kw, place: sm.scene, mood: sm.mood };
    }
    const nodes = {};
    let nodeIdx = 0;

    for (const ch of chapters) {
      const id = ch.id + '-main';
      const speaker = chars[0]?.name || '旁白';
      const para = (ch.text || '').split(/[\n\r]+/).filter(s => s.trim()).slice(0, 2).join(' ').trim();
      const speakerLine = para ? pickFirstSentence(para, 50) : '【' + ch.title + '】\n故事继续。';
      const chapterHighlight = highlights.find(h => (ch.text || '').indexOf(h.keyword) >= 0);
      const sceneKey = sceneMatches[0]?.scene || null;
      nodes[id] = {
        id: id,
        chapterId: ch.id,
        charIds: chars.slice(0, Math.min(3, chars.length)).map(c => c.id),
        speaker: speaker,
        text: '【' + ch.title + '】\n' + speakerLine,
        isMain: true,
        isHighlight: !!chapterHighlight,
        sceneKey: sceneKey,
        bg: null,
        choices: [
          { label: '继续前进', next: ((chapters[chapters.indexOf(ch) + 1]?.id || '') + '-main') || 'ending-good', effects: { trust: 2, intimacy: 1 } },
          { label: '停下来观察', next: 'hl-' + (nodeIdx) + '-' + ch.id, effects: { trust: 0, intimacy: 2, flags: ['cautious'] } },
          { label: '换个方向', next: 'ending-alt', effects: { trust: -1, intimacy: 1, flags: ['alt-path'] } }
        ]
      };
      nodeIdx++;
    }
    for (const hl of highlights.slice(0, 12)) {
      const id = 'hl-' + nodeIdx;
      let belongChapter = chapters[0]?.id;
      for (const ch of chapters) {
        if ((ch.text || '').indexOf(hl.keyword) >= 0) belongChapter = ch.id;
      }
      nodes[id] = {
        id: id,
        chapterId: belongChapter,
        charIds: chars.slice(0, 2).map(c => c.id),
        speaker: chars[Math.random() < 0.5 ? 0 : 1]?.name || '旁白',
        text: '【高光 · ' + hl.badge + '】\n"' + hl.excerpt + '"',
        isMain: false,
        isHighlight: true,
        sceneKey: sceneMatches[1 % sceneMatches.length]?.scene || sceneMatches[0]?.scene || null,
        bg: null,
        choices: [
          { label: '正面回应', next: 'ending-good', effects: { trust: 3, intimacy: 3 } },
          { label: '保持距离', next: 'ending-cautious', effects: { trust: 0, intimacy: 1 } },
          { label: '追问详情', next: 'ending-truth', effects: { trust: 1, intimacy: 2, reputation: 2 } }
        ]
      };
      nodeIdx++;
    }
    const genreLabel = opts.genreLabel || '';
    const endings = {
      'ending-good':     { id: 'ending-good',     rarity: 'legendary', title: title + ' · 圆满结局', scene: (genreLabel || '主线 · 信任 80+'), quote: '"我们一起，走完了这条路。"', deltas: { trust: 50, intimacy: 20 } },
      'ending-normal':   { id: 'ending-normal',   rarity: 'epic',      title: title + ' · 平凡相守', scene: (genreLabel || '普通结局 · 信任 40'),  quote: '"没有惊天动地，但每一天，都有你。"', deltas: { trust: 20, intimacy: 10 } },
      'ending-cautious': { id: 'ending-cautious', rarity: 'rare',      title: title + ' · 留白结局', scene: (genreLabel || '支线 · 信任 50/好感 70'), quote: '"门虚掩着。我没有推开。我也不知道，下一次会是什么时候。"', deltas: { trust: 0, intimacy: 5 } },
      'ending-truth':    { id: 'ending-truth',    rarity: 'epic',      title: title + ' · 真相大白', scene: (genreLabel || '主线 · 真结局'), quote: '"原来，所有答案都在那一行。"', deltas: { trust: 10, intimacy: 15 } },
      'ending-alt':      { id: 'ending-alt',      rarity: 'common',    title: title + ' · 别开生面', scene: (genreLabel || '岔路结局'), quote: '"我没选你说的那条路。但我也没后悔。"', deltas: { trust: -10, intimacy: 0 } }
    };
    if (chars.length >= 1) chars[0].role = 'main';
    if (chars.length >= 4) chars[chars.length - 1].role = 'antag';
    for (const c of chars) {
      if (/[魔鬼杀反恶仇敌暗隐黑]/i.test(c.name) && c.role !== 'main') { c.role = 'antag'; break; }
    }
    const novelObj = {
      id: opts._novelId || ('n_' + Date.now() + '_' + Math.floor(Math.random() * 9999)),
      title: title,
      author: author,
      genre: genreId,
      keywords: (sceneMatches || []).map(s => s.kw.slice(0, 2).join('/')).slice(0, 3),
      cover: null,
      uploadedAt: new Date().toISOString(),
      text: text.length > 5000 ? text.slice(0, 5000) + '\n...[truncated...]' : text,
      chapters: chapters.map(c => ({ id: c.id, title: c.title, heading: c.heading, index: c.index, text: c.text.slice(0, 800) + (c.text.length > 800 ? '...' : '') }))
    };
    const audit = runAudit({ chars, highlights, chapters, nodes: nodes, endings });
    return { novel: novelObj, chars, highlights, sceneHints, nodes, endings, flags: {}, audit };
  }

  function runAudit(plot) {
    const nodeList = Array.isArray(plot.nodes) ? plot.nodes : Object.values(plot.nodes || {});
    const nodesById = Array.isArray(plot.nodes) ? Object.fromEntries(plot.nodes.map(n => [n.id, n])) : (plot.nodes || {});
    const chaptersCovered = new Set();
    const charsCovered = new Set();
    const highlightsCovered = new Set();
    // 统计每章节出现的角色和高光
    for (const n of nodeList) {
      chaptersCovered.add(n.chapterId);
      for (const cid of (n.charIds||[])) charsCovered.add(cid);
      if (n.isHighlight) {
        const hl = (plot.highlights || []).find(h => (n.text||'').indexOf(h.excerpt) >= 0);
        if (hl) highlightsCovered.add(hl.id);
      }
    }
    // === 自动修复：未覆盖角色强制并入最近章节节点 ===
    for (const c of plot.chars) {
      if (!charsCovered.has(c.id)) {
        const targetChapter = c.firstChapter || plot.chapters[plot.chapters.length - 1]?.id;
        const targetNode = nodesById[targetChapter + '-main'];
        if (targetNode) {
          targetNode.charIds = Array.from(new Set([...(targetNode.charIds||[]), c.id]));
          charsCovered.add(c.id);
        }
      }
    }
    // === 自动修复：未覆盖高光强制并入最近章节主线 ===
    for (const hl of plot.highlights || []) {
      if (!highlightsCovered.has(hl.id)) {
        const targetChapter = (() => {
          for (const ch of plot.chapters) {
            if ((ch.text || '').indexOf(hl.keyword) >= 0) return ch.id;
          }
          return plot.chapters[plot.chapters.length - 1]?.id;
        })();
        const targetNode = nodesById[targetChapter + '-main'];
        if (targetNode) {
          targetNode.isHighlight = true;
          highlightsCovered.add(hl.id);
        }
      }
    }
    return {
      total: { chapters: plot.chapters.length, chars: plot.chars.length, highlights: (plot.highlights||[]).length },
      covered: { chapters: chaptersCovered.size, chars: charsCovered.size, highlights: highlightsCovered.size },
      gaps: {
        chapters: plot.chapters.map(c => c.id).filter(id => !chaptersCovered.has(id)),
        chars: plot.chars.filter(c => !charsCovered.has(c.id)).map(c => c.name),
        highlights: (plot.highlights||[]).filter(h => !highlightsCovered.has(h.id)).map(h => h.keyword)
      }
    };
  }

  function matchBestGenreId(text, title = '') {
    if (!window.matchGenre) return 'xianxia';
    const r = window.matchGenre(text, title);
    return (r && r.top && r.top.score > 0) ? r.top.id : 'xianxia';
  }

  window.NovelParser = { parse, splitChapters, extractNames, findHighlights, matchScenes, runAudit };
  console.log('[v5.12] novel-parser 加载完成');
})();
