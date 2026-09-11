/* =================================================================
 * 灵境 · 双生 V19.0 — plot-detail 详情页数据层
 * 来源：用户 2026-09-11 提供 17 张截图
 * 第三方产品名已 0 替换（"我在古代开乐坊" 是剧情内容保留为 demo）
 * ================================================================= */
(function () {
  'use strict';

  var NOVEL_DETAIL = {
    changyecheng: {
      id: 'changyecheng',
      title: '长夜城',
      author: '墨白',
      tags: ['古风', '权谋', '女主成长'],
      summary: '夜色沉沉，你独自一人踏入长夜城。街巷空寂，唯有远处宫灯微微明灭。林清雪正等你归来——',
      cover: 'linear-gradient(135deg,#2E3A6E,#4A3A8C)',
      emoji: '🏯',
      stats: { likes: 707, favs: 312, comments: 89, reads: 12450 },
      // 主演横滑（图 1）
      cast: [
        { roleId: 'linqingxue', name: '裴桃', emoji: '🌸', bg: 'linear-gradient(160deg,#FFB6C1,#FF8C94)', alias: '特别参演：小桃神' },
        { roleId: 'shenyiran', name: '沈怡然', emoji: '👩', bg: 'linear-gradient(160deg,#E8D5FF,#C9A8E8)', alias: '特别参演：小曜神' },
        { roleId: 'longwaner', name: '龙婉儿', emoji: '👧', bg: 'linear-gradient(160deg,#FFE4B5,#FFA07A)', alias: '特别参演：反方' },
        { roleId: 'fubaiwan', name: '付百万', emoji: '💰', bg: 'linear-gradient(160deg,#FFD700,#FFA500)', alias: '特别参演：贪财猴琐' }
      ],
      // 中部 banner（图 1）
      ads: [
        { id: 'spring-festival', title: '优惠限时享', sub: '累计充值送福利', period: '2.8 - 3.15', emoji: '🎊', badge: '限时' }
      ],
      // 互动区（图 1）
      interact: {
        selected: [
          { id: 'p1', user: '茄孓萌萌哒', avatar: '🍆', time: '08-07 22:19', content: '应大家要求，本次实体福利扩大一下：8月8日晚 24:00', badge: '灵境' },
          { id: 'p2', user: '不负如来不负卿', avatar: '🌙', time: '08-07 19:42', content: '#反馈 #bug 进入第七章存档读档有概率闪退', badge: '灵境' },
          { id: 'p3', user: '南风知我意', avatar: '🌿', time: '08-07 15:30', content: '裴桃线结局太虐了，求作者出番外', badge: '灵境' }
        ],
        latest: [
          { id: 'p4', user: '夜半听风', avatar: '🌌', time: '08-08 09:12', content: '#反馈 #bug 新角色付百万对话选项缺一', badge: '灵境' },
          { id: 'p5', user: '风起时想你', avatar: '🍃', time: '08-08 08:45', content: '今日签到，第 47 天', badge: '灵境' }
        ]
      },
      // 作品交流区（图 1）
      groups: [
        { id: 'g-vip', name: '520花VIP交流群', emoji: '💎', type: 'vip', price: 520, members: 1287 },
        { id: 'g-gift', name: '36花礼包群', emoji: '🎁', type: 'gift', price: 36, members: 892 }
      ],
      // 角色表白（图 1 Tab 2）
      roles: [
        { name: '裴桃', emoji: '🌸', lineCount: 128, fansCount: 3421, topLine: '你来了。我等你很久了——跟我走吧。' },
        { name: '沈怡然', emoji: '👩', lineCount: 96, fansCount: 2156, topLine: '我不准你独自去长夜城。' },
        { name: '付百万', emoji: '💰', lineCount: 84, fansCount: 1892, topLine: '老爷我说的话你可敢听？' }
      ],
      // 榜单（图 1 Tab 3）
      ranks: [
        { type: '灵韵榜', items: [
          { name: '裴桃', score: 9.85, emoji: '🌸' },
          { name: '沈怡然', score: 9.72, emoji: '👩' },
          { name: '林清雪', score: 9.61, emoji: '❄️' }
        ]},
        { type: '人气榜', items: [
          { name: '长夜城', score: 98762, emoji: '🏯' },
          { name: '深海回声', score: 87521, emoji: '🌊' },
          { name: '三国·吕布篇', score: 72394, emoji: '⚔️' }
        ]}
      ]
    },
    shenhuihuisheng: {
      id: 'shenhuihuisheng',
      title: '深海回声',
      author: '苏晚',
      tags: ['现代', '奇幻', '海洋'],
      summary: '海的那边，有人在叫你的名字……',
      cover: 'linear-gradient(160deg,#2E5E56,#00B894)',
      emoji: '🌊',
      stats: { likes: 423, favs: 198, comments: 56, reads: 8721 },
      cast: [
        { roleId: 'mermaid', name: '苏晚', emoji: '🧜‍♀️', bg: 'linear-gradient(160deg,#87CEEB,#4682B4)', alias: '特别参演：小海神' },
        { roleId: 'captain', name: '林船长', emoji: '⚓', bg: 'linear-gradient(160deg,#4682B4,#2F4F4F)', alias: '特别参演：反方' }
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