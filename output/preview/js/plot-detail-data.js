/* =================================================================
 * 灵境 · 双生 V19.0 — plot-detail 详情页数据层
 * 来源：用户 2026-09-11 提供 17 张截图
 * 第三方产品名已 0 替换（"我在古代开乐坊" 是剧情内容保留为 demo）
 * ================================================================= */
(function () {
  'use strict';

  var NOVEL_DETAIL = {
    xiyouji: {
      id: 'xiyouji',
      title: '西游记',
      author: '公版',
      tags: ['神魔', '取经', '古典'],
      summary: '混沌初分，鸿蒙始判。东胜神洲傲来国花果山出一石猴，拜师学艺，得号悟空。其后护唐僧西天取经，历九九八十一难。',
      cover: 'linear-gradient(135deg,#2E3A6E,#4A3A8C)',
      emoji: '🐵',
      stats: { likes: 707, favs: 312, comments: 89, reads: 12450 },
      cast: [
        { roleId: 'wukong', name: '孙悟空', emoji: '🐵', bg: 'linear-gradient(160deg,#FFB6C1,#FF8C94)', alias: '特别参演：齐天大圣' },
        { roleId: 'bajie', name: '猪八戒', emoji: '🐷', bg: 'linear-gradient(160deg,#E8D5FF,#C9A8E8)', alias: '特别参演：天蓬元帅' },
        { roleId: 'sha', name: '沙悟净', emoji: '⚔️', bg: 'linear-gradient(160deg,#FFE4B5,#FFA07A)', alias: '特别参演：卷帘大将' },
        { roleId: 'tangseng', name: '唐僧', emoji: '📿', bg: 'linear-gradient(160deg,#FFD700,#FFA500)', alias: '特别参演：三藏法师' }
      ],
      ads: [
        { id: 'public-domain', title: '公版名著计划', sub: '自动生成为世界 · 可沉浸游玩', period: '全年', emoji: '📖', badge: '公版' }
      ],
      interact: {
        selected: [
          { id: 'p1', user: '灵境书友', avatar: '📖', time: '09-13 22:19', content: '花果山第一回读完，自动生成的水帘洞场景太棒了。', badge: '灵境' },
          { id: 'p2', user: '西游行者', avatar: '🐵', time: '09-13 19:42', content: '#反馈 世界地图里"齐天府"热点点击很顺畅', badge: '灵境' },
          { id: 'p3', user: '公版引路人', avatar: '🏮', time: '09-13 15:30', content: '求继续编译红楼、水浒的全套资产', badge: '灵境' }
        ],
        latest: [
          { id: 'p4', user: '水帘洞游客', avatar: '🌊', time: '09-14 09:12', content: '#反馈 Blender 花果山 3D 场景加载正常', badge: '灵境' },
          { id: 'p5', user: '取经人', avatar: '📿', time: '09-14 08:45', content: '今日签到，第 47 天', badge: '灵境' }
        ]
      },
      groups: [
        { id: 'g-vip', name: '公版名著VIP交流群', emoji: '💎', type: 'vip', price: 520, members: 1287 },
        { id: 'g-gift', name: '西游角色礼包群', emoji: '🎁', type: 'gift', price: 36, members: 892 }
      ],
      roles: [
        { name: '孙悟空', emoji: '🐵', lineCount: 128, fansCount: 3421, topLine: '皇帝轮流做，明年到我家。' },
        { name: '猪八戒', emoji: '🐷', lineCount: 96, fansCount: 2156, topLine: '大师兄，师父被妖怪抓走了！' },
        { name: '唐僧', emoji: '📿', lineCount: 84, fansCount: 1892, topLine: '悟空，休得无礼。' }
      ],
      ranks: [
        { type: '灵韵榜', items: [
          { name: '孙悟空', score: 9.85, emoji: '🐵' },
          { name: '唐僧', score: 9.72, emoji: '📿' },
          { name: '猪八戒', score: 9.61, emoji: '🐷' }
        ]},
        { type: '人气榜', items: [
          { name: '西游记', score: 98762, emoji: '🐵' },
          { name: '三国演义', score: 87521, emoji: '⚔️' },
          { name: '红楼梦', score: 72394, emoji: '🌸' }
        ]}
      ]
    },
    hongloumeng: {
      id: 'hongloumeng',
      title: '红楼梦',
      author: '公版',
      tags: ['世情', '家族', '古典'],
      summary: '开辟鸿蒙，谁为情种？都只为风月情浓。大观园中，木石前盟与金玉良缘纠葛一场。',
      cover: 'linear-gradient(160deg,#E94560,#C95B9C)',
      emoji: '🌸',
      stats: { likes: 423, favs: 198, comments: 56, reads: 8721 },
      cast: [
        { roleId: 'daiyu', name: '林黛玉', emoji: '🌸', bg: 'linear-gradient(160deg,#87CEEB,#4682B4)', alias: '特别参演：绛珠仙草' },
        { roleId: 'baochai', name: '薛宝钗', emoji: '🌺', bg: 'linear-gradient(160deg,#4682B4,#2F4F4F)', alias: '特别参演：蘅芜君' }
      ],
      ads: [],
      interact: { selected: [], latest: [] },
      groups: [],
      roles: [],
      ranks: []
    }
  };

  window.PLOT_DETAIL_DATA = NOVEL_DETAIL;
})();