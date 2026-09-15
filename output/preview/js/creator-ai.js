/* =====================================================================
 * 灵境 · 双生 — V23 创作功能区 AI 候选生成器 (creator-ai.js)
 * 铁律 #19：不接真 LLM（mock + AIHelper 钩子）；AI 候选恒 3-5 + 换一批 + 我来说
 * 用法：CreatorAI.candidates(kind, ctx, offset) -> [{icon,name,detail}] 4-5 条
 *       CreatorAI.rotate()  内部换一批偏移自增
 * ===================================================================== */
window.CreatorAI = (function () {
  var offset = 0;

  /* ---------- 候选池（按 kind 分组，每池 >=6 条保证换一批有新内容）---------- */
  var POOLS = {
    charName: [
      { icon: '🌙', name: '苏晚吟', detail: '清冷琴师，话少但每句都落在心上' },
      { icon: '🔥', name: '洛九野', detail: '街头出身的刀客，嘴硬心软' },
      { icon: '❄️', name: '顾栖霜', detail: '世家嫡女，外冷内热，极重承诺' },
      { icon: '🌿', name: '沈青梧', detail: '药庐学徒，温柔且观察力惊人' },
      { icon: '⚡', name: '祁夜', detail: '夜行侠盗，只在雨天出现' },
      { icon: '🌊', name: '温叙白', detail: '说书人，把秘密都藏进故事里' }
    ],
    charBackstory: [
      { icon: '🏔️', name: '山中来客', detail: '幼年随隐士学艺，下山寻找身世线索，目标明确但恐惧被抛弃' },
      { icon: '🏮', name: '灯楼旧事', detail: '在灯楼长大，见过无数离别，渴望一个不会走的人；秘密是替人保管着一封信' },
      { icon: '⚔️', name: '败军遗孤', detail: '父辈战败后隐姓埋名，练武只为有朝一日洗雪；恐惧重蹈覆辙' },
      { icon: '🌊', name: '渡口人家', detail: '在渡口撑船十几年，听尽南来北往的故事，梦想写一本自己的书' },
      { icon: '🕯️', name: '守夜人', detail: '世代守着城中灯塔，习惯孤独却害怕黑暗；心底藏着一个未兑现的约定' },
      { icon: '🎼', name: '失声的歌者', detail: '曾是名动一城的歌者，一夜失声后隐居；渴望重新开口唱一次' }
    ],
    charSecret: [
      { icon: '🔐', name: '身世之谜', detail: '真实姓氏被刻意隐瞒，与城中望族有血缘纠葛' },
      { icon: '📜', name: '代守之诺', detail: '替已故之人保管一件遗物，到期之日即是离别之时' },
      { icon: '🌙', name: '夜间身份', detail: '白日与夜里判若两人，夜间在做一件不可告人却正义的事' },
      { icon: '💔', name: '旧创', detail: '曾因自己的一次犹豫失去重要之人，从此不再让自己犹豫' },
      { icon: '🗝️', name: '钥匙', detail: '手里有一把不知道开哪扇门的钥匙，是唯一的遗物' }
    ],
    fingerprintStyle: [
      { icon: '❄️', name: '冷淡', detail: '句子简短，少用语气词，情感藏在动词里' },
      { icon: '🔥', name: '毒舌', detail: '嘴上不饶人，但关键时刻永远靠得住' },
      { icon: '🌿', name: '温和', detail: '语速平缓，善用比喻，从不把话说死' },
      { icon: '📖', name: '文绉绉', detail: '爱引半句旧诗，正经里带着点自嘲' },
      { icon: '⚡', name: '热情', detail: '感叹号很多，情绪来得快也去得快' }
    ],
    scene: [
      { icon: '🌧️', name: '和TA一起看一场雨', detail: '开场：屋檐下偶遇，TA把伞倾向你这边；选择点3个；结局：雨停各自归家但都回头了；关系+2' },
      { icon: '🏮', name: '灯会走散', detail: '开场：人潮中手被冲开；选择点4个；结局：在许愿灯下重逢；关系+3' },
      { icon: '🍵', name: '深夜茶铺', detail: '开场：打烊前TA留了一盏灯；选择点3个；结局：天亮时互道了真名；关系+2' },
      { icon: '❄️', name: '初雪之约', detail: '开场：TA说初雪时要一起做一件事；选择点5个；结局：雪落时如约而至；关系+4' },
      { icon: '🗡️', name: '并肩一战', detail: '开场：巷口被围，TA把后背交给你；选择点3个；结局：背靠背突围；关系+5' },
      { icon: '🌊', name: '海边拾贝', detail: '开场：退潮后TA捡到一枚会响的贝壳；选择点4个；结局：贝壳被串成一对风铃；关系+3' }
    ],
    event: [
      { icon: '🌫️', name: 'TA今天遇到了一件烦心事', detail: '触发：亲密度≥30且上次互动>1天；TA主动发来低落的消息；用户3个回应选项；结果：倾听后关系+3' },
      { icon: '🌤️', name: '清晨的第一句话', detail: '触发：每日首次进入；TA分享昨夜奇怪的梦；2个回应；结果：关系+1' },
      { icon: '🍲', name: 'TA做多了饭', detail: '触发：亲密度≥40；TA以"做多了"为借口邀你吃饭；3个回应；结果：关系+2' },
      { icon: '🌧️', name: 'TA在雨天想起旧事', detail: '触发：雨天+剧情碎片f1已解锁；TA欲言又止；3个回应；结果：解锁新碎片' },
      { icon: '🎁', name: 'TA准备了小礼物', detail: '触发：周目第7天；TA塞给你一个纸包；2个回应；结果：关系+2' }
    ],
    fragment: [
      { icon: '🧸', name: 'TA的童年记忆', detail: '解锁：亲密度≥60；内容：一段老宅院的可互动回忆；2个回应；影响：解锁隐藏对话' },
      { icon: '⚔️', name: '那一战之后', detail: '解锁：完成场景"并肩一战"；内容：TA养伤时的独白；3个回应；影响：TA对你卸下防备' },
      { icon: '📖', name: '未寄出的信', detail: '解锁：亲密度≥80；内容：TA写了一半的信；2个回应；影响：揭示代守之诺秘密' },
      { icon: '🌙', name: '失眠夜的自白', detail: '解锁：完成事件"雨天旧事"；内容：凌晨三点的心事；3个回应；影响：关系上限+10' },
      { icon: '🗺️', name: 'TA藏起来的地图', detail: '解锁：共同任务完成后；内容：一张标注了故乡的旧地图；2个回应；影响：开启新支线' }
    ],
    mission: [
      { icon: '🗝️', name: '帮TA找到丢失的东西', detail: '目标：找回遗失的旧怀表；节点3个：当铺线索→巷口追逐→桥洞真相；奖励：关系+5·解锁新互动' },
      { icon: '🏮', name: '一起布置灯会摊位', detail: '目标：在灯会前搭好摊位；节点4个：选位置→扎灯架→写灯谜→等客来；奖励：关系+4' },
      { icon: '🌧️', name: '雨夜护送', detail: '目标：把TA平安送回城东；节点3个：借伞→绕开积水巷→门口道别；奖励：关系+3' },
      { icon: '🍲', name: '复刻TA记忆里的味道', detail: '目标：做出TA童年吃过的那碗甜汤；节点4个：问配方→寻食材→失败一次→成功；奖励：关系+6·解锁碎片' },
      { icon: '📜', name: '帮TA完成一个约定', detail: '目标：替TA兑现多年前答应别人的事；节点5个；奖励：关系+8·解锁IF线索' }
    ],
    post: [
      { icon: '✍️', name: '创作日常', detail: '今天写完第三章，主角在雨里站了很久——我也陪他站了很久。各位晚安。' },
      { icon: '📢', name: '更新预告', detail: '本周六晚八点，《长夜城》卷二第一章准时上架！评论区抽3位读者送灵念卡。' },
      { icon: '🎨', name: '设定分享', detail: '放了张世界观地图的局部：临安十二巷的灯，一盏一个故事。' },
      { icon: '💬', name: '读者互动', detail: '投票：你们希望下一章先写巷口的追杀，还是先写茶铺的重逢？' },
      { icon: '🌙', name: '深夜碎碎念', detail: '写到主角说"我不走了"的时候，自己先哭了。这行字改了七遍。' }
    ],
    card: [
      { icon: '✨', name: '灵念 · 拾光', detail: '普通 · 「拾起一段被遗忘的时光」收藏后心屿背景泛起旧照片般的暖黄' },
      { icon: '🌟', name: '灵念 · 听雨', detail: '稀有 · 「雨声会替你记住想说的话」设为背景后页面有细雨音效' },
      { icon: '🌠', name: '灵念 · 灯引', detail: '史诗 · 「迷路时，总有一盏灯朝你亮」分享给好友双方各得关系值+1' },
      { icon: '🌌', name: '灵念 · 双生影', detail: '传说 · 「世上另一个你，正走在你未选的路上」限定动作：影分身回眸' },
      { icon: '💫', name: '灵念 · 长夜将明', detail: '限定 · 「最长的夜也挡不住天亮」卡面随真实时间在深夜泛起晨光' }
    ],
    agentBehavior: [
      { icon: '⏰', name: '早安唤醒', detail: '触发：每日7:00-9:00首次上线；动作：TA用角色口吻道早安；模板：今天也请多指教' },
      { icon: '🌧️', name: '雨天关心', detail: '触发：天气API返回雨天；动作：提醒带伞；模板：路上滑，走慢一点' },
      { icon: '🎂', name: '生日惊喜', detail: '触发：用户生日当天；动作：TA筹备一场小惊喜；模板：闭上眼，数到三' },
      { icon: '📚', name: '连载提醒', detail: '触发：关注的小说更新；动作：TA第一时间来报信；模板：更新了！我先去排队' },
      { icon: '🌙', name: '晚安仪式', detail: '触发：每日23:00后；动作：互道晚安并总结今天；模板：今天辛苦了，梦里见' }
    ],
    mediaDesc: [
      { icon: '🎨', name: '月下剑客', detail: '白衣少年持剑立于古寺残垣，月光如水银洒落，樱花随风飘零' },
      { icon: '💜', name: '赛博少女', detail: '霓虹全息投影中蓝发少女触碰虚拟蝴蝶，数据流环绕' },
      { icon: '🐉', name: '龙骑士', detail: '黑甲骑士乘巨龙穿越雷云，远方燃烧的城池，史诗构图' },
      { icon: '🏔️', name: '仙侠意境', detail: '水墨风白衣仙人独坐孤峰，云海翻涌远处瀑布如练' },
      { icon: '🏮', name: '临安雨巷', detail: '青石板雨巷尽头一盏暖黄灯笼，人物背影撑伞回眸' }
    ],
    suggest: [
      { icon: '📉', name: '章节退出率偏高', detail: '第4章退出率28%，建议把关键冲突提前到章首300字内' },
      { icon: '💞', name: '角色好感增长慢', detail: '林清雪的好感获取仅为主线，建议增加2条日常互动支线' },
      { icon: '⏱️', name: '平均游玩时长短', detail: '平均4.2分钟，低于同类30%；建议在世界入口加一段60秒沉浸引导' },
      { icon: '🔁', name: '回头率可挖', detail: '7日回访率41%；建议对未解锁碎片用户推送一次剧情提醒' },
      { icon: '🌟', name: '优势保持', detail: '完读率92%远超均值，当前节奏策略建议保持' }
    ]
  };

  /* ---------- 领域词根（用于组合派生，保证"换一批"不重样）---------- */
  var AIHELPER = window.AIHelper || null; // 若全局 AIHelper 存在则走其钩子（铁律 #19 预留）

  function slice(kind, n) {
    var pool = POOLS[kind] || [];
    if (!pool.length) return [];
    var out = [];
    var base = (offset * 2) % pool.length;
    for (var i = 0; i < n && i < pool.length; i++) {
      out.push(pool[(base + i) % pool.length]);
    }
    return out;
  }

  /**
   * 取候选
   * @param {string} kind 池名（见 POOLS）
   * @param {object} ctx  上下文（预留：如角色名注入 detail）
   * @param {number} n    候选数 3-5，默认 4
   */
  function candidates(kind, ctx, n) {
    n = Math.min(5, Math.max(3, n || 4));
    if (AIHELPER && typeof AIHELPER.candidates === 'function') {
      try {
        var ext = AIHELPER.candidates(kind, ctx, n);
        if (ext && ext.length) return ext.slice(0, n);
      } catch (e) {}
    }
    var list = slice(kind, n).map(function (x) {
      var item = { icon: x.icon, name: x.name, detail: x.detail };
      if (ctx && ctx.charName && item.detail.indexOf('TA') >= 0) {
        item.detail = item.detail.split('TA').join(ctx.charName);
      }
      return item;
    });
    return list;
  }
  function rotate() { offset = (offset + 1) % 3; return offset; }
  function poolNames() { return Object.keys(POOLS); }

  return { candidates: candidates, rotate: rotate, poolNames: poolNames };
})();
