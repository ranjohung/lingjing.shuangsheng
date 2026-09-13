/* =====================================================================
 * V20-V · 通用小说世界引擎 · 行内标注解析器
 *
 * txt 行内标注格式（用户 V20-T 决策）：
 *   ## 第N章 · 标题       → 章节点（自动建章节）
 *   ### 场景：场景名       → 场景（同章可有多个）
 *   「角色」对话            → 角色对话
 *   「旁白」叙述            → 旁白
 *   {道具:name}             → 道具（自动入背包 + 场景可点击）
 *   {人物:name}             → 人物（场景可点击）
 *   [选项A|选项B|选项C]     → 选项按钮
 *   【收费章节：N灵晶】    → 收费点（V20-Q 货币体系）
 *   其他文字                → 旁白叙述
 *
 * 输出 JSON：
 *   {
 *     title: "小说标题",
 *     chapters: [
 *       {
 *         title: "第一章 · ...",
 *         cost: 0|20|30,
 *         scenes: [
 *           {
 *             name: "山间小路",
 *             blocks: [
 *               {type:'paid_gate', cost:20},
 *               {type:'scene_name', name:'溪边小亭'},
 *               {type:'dialog', character:'白衣女子', text:'...'},
 *               {type:'narration', text:'...'},
 *               {type:'item', name:'古琴'},
 *               {type:'npc', name:'白衣女子'},
 *               {type:'choice', options:['拾取古琴','继续前行']}
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ===================================================================== */
(function () {
  function parseNovel(txt) {
    var lines = String(txt || '').replace(/\r\n/g, '\n').split('\n');
    var out = { title: '未命名小说', chapters: [] };
    var curChap = null;
    var curScene = null;
    var titleTaken = false;

    function ensureChap() {
      if (!curChap) {
        curChap = { title: '未命名章节', cost: 0, scenes: [], _titlePending: false };
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

      // 小说总标题（# 单个井号）
      if (!titleTaken && /^#\s+/.test(line) && !/^##/.test(line)) {
        out.title = line.replace(/^#\s+/, '').trim();
        titleTaken = true;
        continue;
      }
      // 章节（## 两个井号）
      if (/^##\s+/.test(line)) {
        var cTitle = line.replace(/^##\s+/, '').trim();
        curChap = { title: cTitle, cost: 0, scenes: [], _titlePending: false };
        out.chapters.push(curChap);
        curScene = null;
        continue;
      }
      // 场景（### 三个井号）
      if (/^###\s+/.test(line)) {
        ensureChap();
        var sName = line.replace(/^###\s+/, '').replace(/^场景[:：]\s*/, '').trim() || '默认场景';
        curScene = { name: sName, blocks: [] };
        curChap.scenes.push(curScene);
        continue;
      }
      // 收费点
      var costMatch = line.match(/^【收费章节[：:]\s*(\d+)\s*灵晶】/);
      if (costMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curChap.cost = parseInt(costMatch[1], 10) || 0;
        curScene.blocks.push({ type: 'paid_gate', cost: curChap.cost });
        continue;
      }
      // 选项
      var choiceMatch = line.match(/^\[(.+?)\]/);
      if (choiceMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        var opts = choiceMatch[1].split('|').map(function (s) { return s.trim(); }).filter(Boolean);
        if (opts.length) curScene.blocks.push({ type: 'choice', options: opts });
        continue;
      }
      // 道具
      var itemMatch = line.match(/^\{道具[：:](.+?)\}/);
      if (itemMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curScene.blocks.push({ type: 'item', name: itemMatch[1].trim() });
        continue;
      }
      // 人物
      var npcMatch = line.match(/^\{人物[：:](.+?)\}/);
      if (npcMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curScene.blocks.push({ type: 'npc', name: npcMatch[1].trim() });
        continue;
      }
      // 角色对话
      var dlgMatch = line.match(/^「([^」]+)」(.+)$/);
      if (dlgMatch) {
        ensureChap();
        if (!curScene) ensureScene('默认场景');
        curScene.blocks.push({ type: 'dialog', character: dlgMatch[1].trim(), text: dlgMatch[2].trim() });
        continue;
      }
      // 旁白（其余文字）
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

  window.LJNovelParser = { parseNovel: parseNovel, flatBlocks: flatBlocks };
})();