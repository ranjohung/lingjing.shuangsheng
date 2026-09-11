/* =================================================================
 * 灵境 · 双生 V18.0 — 心屿功能区数据（10 角色 + 精选 + 记忆 + 故事）
 * source_type: user_created / novel_brought_out / official
 * occupation_qa_enabled 默认 true（设置职业即可）
 * ================================================================= */
(function () {
  'use strict';
  if (window.HEART_DATA) return;

  // ---------- 10 张角色 ----------
  var CHARACTERS = [
    // [创] 我创建的（5 张）
    { id: 'c01', source_type: 'user_created', name: '苏晚', avatar: '🌙', occupation: '教师',
      stage: '熟悉', intimacy: 45,
      preview: '你来了。我刚好泡了茶，要不要一起喝？',
      occupation_qa_enabled: true },
    { id: 'c02', source_type: 'user_created', name: '林溪', avatar: '🌸', occupation: '医生',
      stage: '相识', intimacy: 28,
      preview: '记得按时吃饭，不要熬夜。',
      occupation_qa_enabled: true },
    { id: 'c03', source_type: 'user_created', name: '云歌', avatar: '🎵', occupation: '音乐人',
      stage: '亲密', intimacy: 78,
      preview: '今晚月色真好，听首歌吗？',
      occupation_qa_enabled: true },
    { id: 'c04', source_type: 'user_created', name: '阿岁', avatar: '🏮', occupation: '心理咨询师',
      stage: '知己', intimacy: 89,
      preview: '昨晚你没说完的那句话，我等到现在。要不要接着讲？',
      occupation_qa_enabled: true },
    { id: 'c05', source_type: 'user_created', name: '白泽', avatar: '🦊', occupation: '律师',
      stage: '熟识', intimacy: 56,
      preview: '下次有事，先来问问我。',
      occupation_qa_enabled: true },

    // [双] 双生角色（4 张 · 来自小说世界）
    { id: 'c06', source_type: 'novel_brought_out', name: '林清雪', avatar: '🌸', occupation: '记者',
      stage: '知己', intimacy: 72,
      preview: '今天路过一家花店，想起你说喜欢向日葵。',
      novel_id: 'shenhuihuisheng', novel_name: '深海回声',
      novel_turns: 8,
      occupation_qa_enabled: true },
    { id: 'c07', source_type: 'novel_brought_out', name: '苏念', avatar: '🌷', occupation: '心理咨询师',
      stage: '亲密', intimacy: 64,
      preview: '你最近好像有心事，要不要说说？',
      novel_id: 'changyecheng', novel_name: '长夜城',
      novel_turns: 5,
      occupation_qa_enabled: true },
    { id: 'c08', source_type: 'novel_brought_out', name: '阿宁', avatar: '🏯', occupation: '历史学者',
      stage: '熟悉', intimacy: 38,
      preview: '《三国》的故事还有很多版本，想听吗？',
      novel_id: 'sanguo', novel_name: '三国·吕布篇',
      novel_turns: 12,
      occupation_qa_enabled: true },
    { id: 'c09', source_type: 'novel_brought_out', name: '云雀', avatar: '🤖', occupation: '工程师',
      stage: '相识', intimacy: 22,
      preview: '系统刚刚完成一次自我迭代。',
      novel_id: 'saibochangye', novel_name: '赛博长夜',
      novel_turns: 3,
      occupation_qa_enabled: true },

    // [官] 官方预设（1 张 · 也算"全部"）
    { id: 'c10', source_type: 'official', name: '黛玉', avatar: '🌺', occupation: '诗人',
      stage: '知己', intimacy: 95,
      preview: '今日葬花，明日葬心。',
      novel_id: 'hongloumeng', novel_name: '红楼梦 · 灵境版',
      novel_turns: 20,
      occupation_qa_enabled: true }
  ];

  // ---------- 精选（5 张） ----------
  var FEATURED = [
    { id: 'f01', name: '锦书', avatar: '📜', occupation: '说书人', intimacy: 88,
      intro: '擅长讲故事，每个角色都有血有肉。' },
    { id: 'f02', name: '墨倾池', avatar: '🖌', occupation: '画家', intimacy: 76,
      intro: '能在画中留住你最想要的瞬间。' },
    { id: 'f03', name: '风清', avatar: '🌬', occupation: '心理咨询师', intimacy: 92,
      intro: '倾听你的每一句话，不评判。' },
    { id: 'f04', name: '南风', avatar: '☂️', occupation: '旅行作家', intimacy: 65,
      intro: '去过 50 个城市，每个城市都有故事。' },
    { id: 'f05', name: '夜白', avatar: '🌙', occupation: '天文学家', intimacy: 70,
      intro: '一起看星星吗？我能认出每一颗。' }
  ];

  // ---------- 记忆时间线（5 条） ----------
  var MEMORIES = [
    { id: 'm01', character: '林清雪', avatar: '🌸', time: '今天 14:32', type: '对话', content: '一起讨论了《红楼梦》黛玉知己结局' },
    { id: 'm02', character: '阿岁', avatar: '🏮', time: '昨天 21:10', type: '里程碑', content: '关系升级：相识 → 知己 🎉' },
    { id: 'm03', character: '苏念', avatar: '🌷', time: '3天前', type: '对话', content: '第一次聊天：你最近好像有心事' },
    { id: 'm04', character: '云歌', avatar: '🎵', time: '一周前', type: '里程碑', content: '百次对话达成 ✨' },
    { id: 'm05', character: '苏晚', avatar: '🌙', time: '两周前', type: '初次相遇', content: '你好，我是苏晚' }
  ];

  // ---------- 故事（仅 [双]）----------
  var STORIES = CHARACTERS.filter(function (c) {
    return c.source_type === 'novel_brought_out';
  }).map(function (c) {
    return {
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      novel_name: c.novel_name,
      novel_id: c.novel_id,
      novel_turns: c.novel_turns,
      progress: '已通关 ' + c.novel_turns + ' 转折点'
    };
  });

  window.HEART_DATA = {
    CHARACTERS: CHARACTERS,
    FEATURED: FEATURED,
    MEMORIES: MEMORIES,
    STORIES: STORIES
  };
})();