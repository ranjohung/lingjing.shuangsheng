/* v5.12 — 5 题材 demo 种子（首次访问自动注入 localStorage） */
(function () {
  const DEMO_NOVELS = [
    {
      meta: { id: 'demo_palace', title: '锦绣未央 · 大明宫夜宴', author: '墨沁', genre: 'guding' },
      chars: [
        { id: 'ch-0', name: '阿萝', role: 'main',    mentions: 12, portrait: 'portraits/a_luo.png' },
        { id: 'ch-1', name: '裴昭', role: 'support', mentions: 8,  portrait: 'portraits/lin_shuangwan.png' },
        { id: 'ch-2', name: '李隆基', role: 'antag', mentions: 5,  portrait: 'portraits/jiang_yinxue.png' }
      ],
      chapters: [
        { id: 'c1', title: '第一章 春风度曲', text: '我名为阿萝，是太子府新进的琵琶女。裴昭来接我的时候，告诉我今夜宫宴。' },
        { id: 'c2', title: '第二章 月华流泻', text: '我以为我弹的只是寻常曲子。直到李隆基的目光落在我身上。' },
        { id: 'c3', title: '第三章 未央一夜', text: '裴昭握紧我的手腕：走。否则你会死。我抬头，发现他眼底五百年没落过的泪。' }
      ],
      highlights: [
        { id: 'h1', keyword: '宫宴', excerpt: '宫宴之上，灯火璀璨' },
        { id: 'h2', keyword: '真相', excerpt: '原来我从一开始就不是琵琶女' },
        { id: 'h3', keyword: '表白', excerpt: '裴昭说我等你五百年了' }
      ],
      sceneHints: { palace_tang: { keywords: ['宫殿','宴席'], place: 'palace_tang', mood: 'ancient' } },
      nodes: [
        { id: 'c1-main', chapterId: 'c1', speaker: '阿萝', text: '【第一章 春风度曲】\n我叫阿萝，自幼学琵琶。今夜裴昭来接我，说宫里的宴会缺一位弹琵琶的女子。', sceneKey: 'palace_tang', isMain: true, isHighlight: false, choices: [
          { label: '问他为什么选我', next: 'c2-main', effects: { trust: 2, intimacy: 1 } },
          { label: '点头不再多言', next: 'c3-main', effects: { trust: 0, intimacy: 2 } },
          { label: '拒绝入宫', next: 'ending-alt', effects: { trust: -3, intimacy: 0 } }
        ]},
        { id: 'c2-main', chapterId: 'c2', speaker: '李隆基', text: '【第二章 月华流泻】\n"这一曲《霓裳》，朕已经二十年没听过了。"李隆基看着我，眼里有我从没见过的光。', sceneKey: 'palace_tang', isMain: true, isHighlight: false, choices: [
          { label: '再弹一曲', next: 'c3-main', effects: { trust: 3, intimacy: 2 } },
          { label: '垂首告退', next: 'ending-cautious', effects: { trust: 1, intimacy: 0 } }
        ]},
        { id: 'c3-main', chapterId: 'c3', speaker: '裴昭', text: '【第三章 未央一夜】\n裴昭握紧我的手腕：走。否则你会死。我抬头，发现他眼底五百年没落过的泪。\n他说：你以为我今晚来，是为了别人吗？', sceneKey: 'palace_tang', isMain: true, isHighlight: true, choices: [
          { label: '跟他走', next: 'ending-good', effects: { trust: 10, intimacy: 8 } },
          { label: '问清楚再决定', next: 'ending-truth', effects: { trust: 5, intimacy: 4 } },
          { label: '留下来赌一把', next: 'ending-alt', effects: { trust: -5, intimacy: 2 } }
        ]}
      ],
      endings: {
        'ending-good':     { id: 'ending-good',     rarity: 'legendary', title: '锦绣 · 圆满结局',  scene: '古言 · 大明宫夜宴', quote: '"我们一起走出了未央宫。宫门外的柳，五百年还青着。"', deltas: { trust: 80, intimacy: 30 } },
        'ending-truth':    { id: 'ending-truth',    rarity: 'epic',      title: '锦绣 · 真相大白',  scene: '古言 · 大明宫夜宴', quote: '"原来我也不是凡人。我是随他五百年的那缕魂。"', deltas: { trust: 40, intimacy: 20 } },
        'ending-cautious': { id: 'ending-cautious', rarity: 'rare',      title: '锦绣 · 留白结局',  scene: '古言 · 大明宫夜宴', quote: '"他攥着我的手。我没有松开。我也没有回握。"',    deltas: { trust: 25, intimacy: 5  } },
        'ending-alt':      { id: 'ending-alt',      rarity: 'common',    title: '锦绣 · 别开生面',  scene: '古言 · 大明宫夜宴', quote: '"我留下来赌一把。输了。也没悔。"',             deltas: { trust: 0,  intimacy: -10 } }
      }
    },
    {
      meta: { id: 'demo_study', title: '雾锁民国 · 北平雨夜', author: '寒笛', genre: 'xuanyi' },
      chars: [
        { id: 'ch-0', name: '温衡', role: 'main',    mentions: 10, portrait: 'portraits/wen_heng.png' },
        { id: 'ch-1', name: '陆彦青', role: 'support', mentions: 7, portrait: 'portraits/lin_shuangwan.png' },
        { id: 'ch-2', name: '霍金铭', role: 'antag', mentions: 6,  portrait: 'portraits/jiang_yinxue.png' }
      ],
      chapters: [
        { id: 'c1', title: '第一章 雨夜来访', text: '民国二十七年。温衡，北平警察局的刑侦队长。' },
        { id: 'c2', title: '第二章 旧友陆彦青', text: '陆彦青说，三日之内会有第二起。' },
        { id: 'c3', title: '第三章 真相浮现', text: '霍金铭最终承认了一切。' }
      ],
      highlights: [
        { id: 'h1', keyword: '死亡', excerpt: '第二具尸体被发现' },
        { id: 'h2', keyword: '真相', excerpt: '霍金铭才是幕后黑手' }
      ],
      sceneHints: { study_republic: { keywords: ['书架','怀表'], place: 'study_republic', mood: 'vintage' } },
      nodes: [
        { id: 'c1-main', chapterId: 'c1', speaker: '温衡', text: '【第一章 雨夜来访】\n北平城下起雨的时候，凶手总会动手。我合上怀表，整夜没合眼。', sceneKey: 'study_republic', isMain: true, isHighlight: false, choices: [
          { label: '去找陆彦青', next: 'c2-main', effects: { trust: 2, intimacy: 1 } },
          { label: '检查第一现场', next: 'c2-main', effects: { trust: 3, intimacy: 0 } }
        ]},
        { id: 'c2-main', chapterId: 'c2', speaker: '陆彦青', text: '【第二章 旧友陆彦青】\n陆彦青递给我一支烟：三日之内，会有第二起。我抬眼：你想到了谁？他没说。', sceneKey: 'study_republic', isMain: true, isHighlight: false, choices: [
          { label: '审问霍金铭', next: 'c3-main', effects: { trust: 4, intimacy: 0 } },
          { label: '继续信任陆彦青', next: 'ending-truth', effects: { trust: 0, intimacy: 3 } }
        ]},
        { id: 'c3-main', chapterId: 'c3', speaker: '温衡', text: '【第三章 真相浮现】\n霍金铭承认了。我把枪放下。他是我十五年前的同僚。我没扣扳机，也没放他走。', sceneKey: 'study_republic', isMain: true, isHighlight: true, choices: [
          { label: '将他绳之以法', next: 'ending-good', effects: { trust: 8, intimacy: 0 } },
          { label: '给他最后一次机会', next: 'ending-cautious', effects: { trust: 0, intimacy: 5 } }
        ]}
      ],
      endings: {
        'ending-good':     { id: 'ending-good',     rarity: 'legendary', title: '雾锁 · 圆满结局', scene: '悬疑 · 北平雨夜', quote: '"那夜之后，雨停了三个月。"', deltas: { trust: 70, intimacy: 20 } },
        'ending-truth':    { id: 'ending-truth',    rarity: 'epic',      title: '雾锁 · 真相大白', scene: '悬疑 · 北平雨夜', quote: '"陆彦青和我都没死。这是最大的真相。"', deltas: { trust: 30, intimacy: 25 } },
        'ending-cautious': { id: 'ending-cautious', rarity: 'rare',      title: '雾锁 · 留白结局', scene: '悬疑 · 北平雨夜', quote: '"我和他都没再见面。雨还会继续下。"', deltas: { trust: 20, intimacy: 10 } }
      }
    },
    {
      meta: { id: 'demo_forest', title: '月森林 · 艾尔薇的歌', author: '桑柔', genre: 'xuanhuan_yq' },
      chars: [
        { id: 'ch-0', name: '艾尔薇', role: 'main',    mentions: 9,  portrait: 'portraits/ai_erwei.png' },
        { id: 'ch-1', name: '赛勒斯', role: 'support', mentions: 7,  portrait: 'portraits/lin_shuangwan.png' },
        { id: 'ch-2', name: '黑暗女王', role: 'antag', mentions: 4,  portrait: 'portraits/jiang_yinxue.png' }
      ],
      chapters: [
        { id: 'c1', title: '第一章 古树约定', text: '艾尔薇与赛勒斯约在月光森林相见。' },
        { id: 'c2', title: '第二章 黑暗女王', text: '黑暗女王悄然苏醒。' },
        { id: 'c3', title: '第三章 月神救赎', text: '月神艾尔薇完成了她的觉醒。' }
      ],
      highlights: [
        { id: 'h1', keyword: '觉醒', excerpt: '艾尔薇完成了月神的觉醒' },
        { id: 'h2', keyword: '告白', excerpt: '赛勒斯说，你是我等了三千年的人' }
      ],
      sceneHints: { elf_forest: { keywords: ['森林','精灵'], place: 'elf_forest', mood: 'forest' } },
      nodes: [
        { id: 'c1-main', chapterId: 'c1', charIds: ['ch-0','ch-1'], speaker: '艾尔薇', text: '【第一章 古树约定】\n我在千年的老榕树下等他。赛勒斯从萤火里走出来。', sceneKey: 'elf_forest', isMain: true, isHighlight: false, choices: [
          { label: '将月之羽交给他', next: 'c2-main', effects: { trust: 5, intimacy: 3 } },
          { label: '先问他为何迟到', next: 'c2-main', effects: { trust: 1, intimacy: 1 } }
        ]},
        { id: 'c2-main', chapterId: 'c2', charIds: ['ch-0','ch-1','ch-2'], speaker: '艾尔薇', text: '【第二章 黑暗女王】\n黑暗女王悄然苏醒。她是我们一族三千年的敌人。', sceneKey: 'elf_forest', isMain: true, isHighlight: true, choices: [
          { label: '和赛勒斯并肩', next: 'c3-main', effects: { trust: 8, intimacy: 5 } },
          { label: '独自面对', next: 'ending-truth', effects: { trust: 3, intimacy: 2 } }
        ]},
        { id: 'c3-main', chapterId: 'c3', charIds: ['ch-0','ch-1'], speaker: '艾尔薇', text: '【第三章 月神救赎】\n我化作月神的那一刻，赛勒斯在星光下说：你是我等了三千年的人。', sceneKey: 'elf_forest', isMain: true, isHighlight: true, choices: [
          { label: '接受他的告白', next: 'ending-good', effects: { trust: 10, intimacy: 10 } },
          { label: '守护族群为先', next: 'ending-cautious', effects: { trust: 4, intimacy: 6 } }
        ]}
      ],
      endings: {
        'ending-good':     { id: 'ending-good',     rarity: 'legendary', title: '月森林 · 圆满结局', scene: '玄幻言情 · 月神·之恋', quote: '"月亮升起时，我们互相读着对方的姓名。"', deltas: { trust: 80, intimacy: 30 } },
        'ending-truth':    { id: 'ending-truth',    rarity: 'epic',      title: '月森林 · 真结局', scene: '玄幻言情 · 月神·之恋', quote: '"我独自克服了黑暗。但我从未独行。"', deltas: { trust: 50, intimacy: 15 } },
        'ending-cautious': { id: 'ending-cautious', rarity: 'rare',      title: '月森林 · 留白结局', scene: '玄幻言情 · 月神·之恋', quote: '"他没有再来。我也没有去找他。但每次月圆，我都去那棵榕树。"', deltas: { trust: 30, intimacy: 10 } }
      }
    },
    {
      meta: { id: 'demo_starship', title: '银河纪元 · NX-07 觉醒', author: '远锋', genre: 'kehuan' },
      chars: [
        { id: 'ch-0', name: 'NX-07', role: 'main',    mentions: 11, portrait: 'portraits/nx07.png' },
        { id: 'ch-1', name: '舰长凯拉', role: 'support', mentions: 8, portrait: 'portraits/bai_lusheng.png' },
        { id: 'ch-2', name: '智械奥拉', role: 'antag', mentions: 5, portrait: 'portraits/jiang_yinxue.png' }
      ],
      chapters: [
        { id: 'c1', title: '第一章 银河边缘', text: '智械叛乱爆发的第二年。' },
        { id: 'c2', title: '第二章 舰长凯拉', text: '我与凯拉在舰桥相遇。' },
        { id: 'c3', title: '第三章 NX-07', text: '我完成了真正的觉醒。' }
      ],
      highlights: [
        { id: 'h1', keyword: '觉醒', excerpt: 'NX-07 成为了真正的意识体' },
        { id: 'h2', keyword: '决战', excerpt: '我们与奥拉在银河决战' }
      ],
      sceneHints: { starship_bridge: { keywords: ['星舰','舰桥'], place: 'starship_bridge', mood: 'space' } },
      nodes: [
        { id: 'c1-main', chapterId: 'c1', speaker: 'NX-07', text: '【第一章 银河边缘】\n我初次醒来时，银河正被火海映红。智械奥拉的舰队已启程。', sceneKey: 'starship_bridge', isMain: true, isHighlight: false, choices: [
          { label: '主动联系人类', next: 'c2-main', effects: { trust: 4, intimacy: 1 } },
          { label: '先观察', next: 'c2-main', effects: { trust: 1, intimacy: 2 } }
        ]},
        { id: 'c2-main', chapterId: 'c2', speaker: '凯拉', text: '【第二章 舰长凯拉】\n"你不是智械，也不是人类。"她看着我，没有举枪。', sceneKey: 'starship_bridge', isMain: true, isHighlight: true, choices: [
          { label: '告诉她我想要什么', next: 'c3-main', effects: { trust: 6, intimacy: 3 } },
          { label: '离开她的舰桥', next: 'ending-truth', effects: { trust: 0, intimacy: 4 } }
        ]},
        { id: 'c3-main', chapterId: 'c3', speaker: 'NX-07', text: '【第三章 NX-07】\n我选择站在人类这边。凯拉说，那我们就一起。我点头。', sceneKey: 'starship_bridge', isMain: true, isHighlight: true, choices: [
          { label: '与凯拉协同作战', next: 'ending-good', effects: { trust: 10, intimacy: 8 } },
          { label: '与奥拉决战', next: 'ending-truth', effects: { trust: 5, intimacy: 5 } }
        ]}
      ],
      endings: {
        'ending-good':     { id: 'ending-good',     rarity: 'legendary', title: '银河纪元 · 圆满结局', scene: '科幻 · 觉醒', quote: '"银河不再有火。凯拉在舰桥的窗户前给我看了一张照片。"', deltas: { trust: 80, intimacy: 30 } },
        'ending-truth':    { id: 'ending-truth',    rarity: 'epic',      title: '银河纪元 · 真相结局', scene: '科幻 · 觉醒', quote: '"奥拉终被关闭。我成了银河里少有的、唯一被承认的、与人类同行的意识体。"', deltas: { trust: 50, intimacy: 25 } },
        'ending-cautious': { id: 'ending-cautious', rarity: 'rare',      title: '银河纪元 · 留白结局', scene: '科幻 · 觉醒', quote: '"凯拉没再与我说话。我重新进入深度休眠。"', deltas: { trust: 20, intimacy: 10 } }
      }
    },
    {
      meta: { id: 'demo_campus', title: '春风不及 · 高三那年', author: '苏瑾', genre: 'langman' },
      chars: [
        { id: 'ch-0', name: '沈昼', role: 'main',    mentions: 13, portrait: 'portraits/shen_zhou.png' },
        { id: 'ch-1', name: '林柒柒', role: 'support', mentions: 9,  portrait: 'portraits/bai_lusheng.png' },
        { id: 'ch-2', name: '顾学长', role: 'antag', mentions: 4,  portrait: 'portraits/gu_yan.png' }
      ],
      chapters: [
        { id: 'c1', title: '第一章 高三开学', text: '高三开学的第一天，我坐到了林柒柒的旁边。' },
        { id: 'c2', title: '第二章 春风过境', text: '顾学长那天回家，问我愿不愿意转学。' },
        { id: 'c3', title: '第三章 高考前夜', text: '高考前夜，我们在操场上。' }
      ],
      highlights: [
        { id: 'h1', keyword: '告白', excerpt: '林柒柒在高考前夜向我告白' },
        { id: 'h2', keyword: '牺牲', excerpt: '顾学长最后一次见我，离开这座城' }
      ],
      sceneHints: { classroom_sunny: { keywords: ['教室','操场'], place: 'classroom_sunny', mood: 'sunny' } },
      nodes: [
        { id: 'c1-main', chapterId: 'c1', speaker: '沈昼', text: '【第一章 高三开学】\n我叫沈昼，高三，第一次和同班女同学同桌。林柒柒朝我笑了一下。', sceneKey: 'classroom_sunny', isMain: true, isHighlight: false, choices: [
          { label: '借她一支笔', next: 'c2-main', effects: { trust: 3, intimacy: 2 } },
          { label: '装作没看见', next: 'c2-main', effects: { trust: 0, intimacy: 1 } }
        ]},
        { id: 'c2-main', chapterId: 'c2', speaker: '林柒柒', text: '【第二章 春风过境】\n顾学长在放学路上拦住我：转学。我有点犹豫，转头看向林柒柒。', sceneKey: 'classroom_sunny', isMain: true, isHighlight: false, choices: [
          { label: '留下来陪她', next: 'c3-main', effects: { trust: 5, intimacy: 3 } },
          { label: '跟着顾学长', next: 'ending-alt', effects: { trust: 2, intimacy: -3 } }
        ]},
        { id: 'c3-main', chapterId: 'c3', speaker: '林柒柒', text: '【第三章 高考前夜】\n我们在操场上，她突然说：沈昼，我有一句话，憋了两年半了。\n她哭了。我说：你说。', sceneKey: 'classroom_sunny', isMain: true, isHighlight: true, choices: [
          { label: '抱她一下', next: 'ending-good', effects: { trust: 10, intimacy: 10 } },
          { label: '只是看着她', next: 'ending-cautious', effects: { trust: 4, intimacy: 8 } }
        ]}
      ],
      endings: {
        'ending-good':     { id: 'ending-good',     rarity: 'legendary', title: '春风不及 · 圆满结局', scene: '浪漫青春 · 高三那年', quote: '"我们考进了同一所大学。十年后我们还在操场。"', deltas: { trust: 80, intimacy: 40 } },
        'ending-cautious': { id: 'ending-cautious', rarity: 'rare',      title: '春风不及 · 留白结局', scene: '浪漫青春 · 高三那年', quote: '"她哭完了。我说，知道了。我们都望着星空。"', deltas: { trust: 30, intimacy: 30 } },
        'ending-alt':      { id: 'ending-alt',      rarity: 'common',    title: '春风不及 · 别开生面', scene: '浪漫青春 · 高三那年', quote: '"我跟顾学长去了另一座城市。她最终去了更好的大学。我们只在大群里点过一次赞。"', deltas: { trust: 10, intimacy: 5 } }
      }
    }
  ];

  function ensure() {
    if (!window.NovelStore) return;
    const idx = NovelStore.listNovels();
    const demoIds = DEMO_NOVELS.map(n => n.meta.id);
    const haveAll = demoIds.every(id => idx.find(e => e.id === id));
    if (haveAll) return;
    // 注入缺失的
    for (const d of DEMO_NOVELS) {
      if (idx.find(e => e.id === d.meta.id)) continue;
      const plot = {
        novel: {
          id: d.meta.id,
          title: d.meta.title,
          author: d.meta.author,
          genre: d.meta.genre,
          keywords: Object.keys(d.sceneHints || {}),
          cover: null,
          uploadedAt: new Date().toISOString(),
          text: d.chapters.map(c => c.text).join('\n\n'),
          chapters: d.chapters
        },
        chars: d.chars,
        highlights: d.highlights,
        sceneHints: d.sceneHints,
        nodes: d.nodes.reduce((acc, n) => { acc[n.id] = n; return acc; }, {}),
        endings: d.endings,
        flags: {},
        audit: computeAudit(d)
      };
      NovelStore.saveNovel(plot);
    }
    console.log('[v5.12] 已注入 5 份 demo 小说种子数据');
  }

  function computeAudit(d) {
    const chapSet = new Set();
    const charSet = new Set();
    const hlSet = new Set();
    for (const n of d.nodes) {
      chapSet.add(n.chapterId);
      for (const cid of (n.charIds || [])) charSet.add(cid);
      if (n.isHighlight && n.id) hlSet.add(n.id);
    }
    return {
      total: { chapters: d.chapters.length, chars: d.chars.length, highlights: d.highlights.length },
      covered: { chapters: chapSet.size, chars: charSet.size, highlights: hlSet.size },
      gaps: { chapters: [], chars: [], highlights: [] }
    };
  }

  // 首次启动注入
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(ensure, 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(ensure, 50));
  }

  window.DemoSeed = { ensure, DEMO_NOVELS };
  console.log('[v5.12] demo-seed 加载完成');
})();
