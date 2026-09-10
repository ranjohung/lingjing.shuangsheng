/* v5.12 — plotTree 标准 schema
   一个完整小说→沉浸剧情游戏的剧情树
*/
window.PLOT_SCHEMA = {
  novel: {
    id: 'string',
    title: 'string',
    author: 'string',
    genre: 'genreId',         // 题材 id (对应 GENRES_LIBRARY)
    keywords: 'string[]',     // 自动匹配的关键词命中
    cover: 'string|null',     // 封面图 URL
    uploadedAt: 'iso-date',
    text: 'string',           // 原文（按章分块）
    chapters: 'chapter[]'
  },
  chapter: {
    id: 'c-1',
    title: 'string',          // '第一章 雨夜' / 'Chapter 1'
    heading: 'string',        // 原始 heading
    index: 'number',
    text: 'string'            // 该章节原文
  },
  char: {
    id: 'string',             // 'kfc-lin-shuangwan'
    name: 'string',           // '林霜晚'
    role: 'main|support|antag',  // 主角/配角/反派
    firstMention: 'chapterId',
    mentions: 'number',       // 提及次数
    portrait: 'string|null',  // 立绘 URL（自动从 SD 或占位）
    affinity: 'number'        // 初始亲密度
  },
  highlight: {               // 高光片段
    id: 'string',
    chapterId: 'string',
    keyword: 'string',        // 命中的关键词
    excerpt: 'string',        // 该段关键文字
    pos: 'number'             // 在原文中的 char 位置
  },
  sceneHint: {               // 场景关键字
    keywords: 'string[]',    // 匹配的关键词组
    place: 'string',          // 推断的场所
    mood: 'rainy|sunny|night|cyber|forest|...'
  },
  node: {                    // 游戏剧情节点
    id: 'string',             // 'c1-intro'
    chapterId: 'string',
    charIds: 'string[]',      // 出场的角色
    speaker: 'string',        // 主说话者
    text: 'string',           // 文字
    isMain: 'bool',           // 是否主线（每章至少一个）
    isHighlight: 'bool',      // 是否高光
    sceneKey: 'string|null',  // 关联背景 sceneHints key
    bg: 'string|null',        // 背景图 URL
    choices: 'choice[]'       // 2-4 个选项
  },
  choice: {
    label: 'string',
    next: 'nodeId|null',      // 下一节点
    effects: {                 // 选项对数值/好感度的影响
      trust: 'number?',
      intimacy: 'number?',
      reputation: 'number?',
      flags: 'string[]?'      // 设置剧情 flag
    }
  },
  ending: {                  // 结局
    id: 'string',
    rarity: 'common|rare|epic|legendary',
    title: 'string',
    scene: 'string',
    quote: 'string',
    deltas: { trust: 'number', intimacy: 'number' }
  }
};

// 工具函数：创建空 plotTree
window.createEmptyPlot = function(novelId, genre, title, author) {
  return {
    novel: {
      id: novelId,
      title: title,
      author: author || '匿名',
      genre: genre,
      keywords: [],
      cover: null,
      uploadedAt: new Date().toISOString(),
      text: '',
      chapters: []
    },
    chars: [],
    highlights: [],
    sceneHints: {},
    nodes: {},
    endings: {},
    flags: {}
  };
};

console.log('[v5.12] plot-schema 加载完成');
