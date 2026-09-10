/* v5.17 — AI 格外提问系统
   当作者对某个点不满意或需要更精细的控制时，
   可通过"格外提问"让 AI 针对性地输出。

   12 类提问模板（4 大类）：
     场景类（3）：
       1. 场景描写 2. 场景过渡 3. 场景氛围
     角色类（4）：
       4. 角色出场 5. 角色内心 6. 角色成长 7. 角色关系
     对话类（3）：
       8. 对话重写 9. 对话设计 10. 金句设计
     情节类（4）：
       11. 转折设计 12. 伏笔设计 13. 冲突升级 14. 节奏调整

   AI 响应格式（JSON）：
     {
       question_type: 'scene_description',
       target: '场景1.1',
       options: [
         { version: 'A', content: '版本A内容...', style: '紧张' },
         { version: 'B', content: '版本B内容...', style: '压抑' },
         { version: 'C', content: '版本C内容...', style: '悬疑' }
       ],
       recommendation: '推荐版本B，因为...',
       explanation: '三个版本的区别在于...'
     }
   作者可以选择一个版本直接替换，也可以将多个版本融合修改。
*/
(function () {
  if (window.AIQuestion) return;

  // ====== 12 类提问模板 ======
  const TEMPLATES = {
    scene_description: {
      category: 'scene',
      label: '场景描写',
      template: '请用 {length} 字描写 {location} 在 {time} 的氛围，要求突出 {emotion}，重点描写 {detail}',
      slots: ['length', 'location', 'time', 'emotion', 'detail'],
      sample: '请用 200 字描写 长夜城 傍晚 的氛围，要求突出 紧张压抑，重点描写 木门声与陌生人手上的戒指'
    },
    scene_transition: {
      category: 'scene',
      label: '场景过渡',
      template: '请写一个从 {scene_a} 到 {scene_b} 的过渡段落，要求自然、不超过 {length} 字',
      slots: ['scene_a', 'scene_b', 'length'],
      sample: '请写一个从 酒馆 到 暗巷 的过渡段落，要求自然、不超过 100 字'
    },
    scene_atmosphere: {
      category: 'scene',
      label: '场景氛围',
      template: '请重写这段场景，增加 {tone} 的氛围，用环境描写烘托情绪',
      slots: ['tone'],
      sample: '请重写这段场景，增加 紧张 的氛围，用环境描写烘托情绪'
    },
    character_entrance: {
      category: 'character',
      label: '角色出场',
      template: '请设计 {character} 的首次出场，要求在 {scene} 中，通过 {method} 展现其 {trait}',
      slots: ['character', 'scene', 'method', 'trait'],
      sample: '请设计 林霜晚 的首次出场，要求在 长夜城夜宴 中，通过 一个动作 展现其 冷漠疏离'
    },
    character_inner: {
      category: 'character',
      label: '角色内心',
      template: '请写一段 {character} 的内心独白，在 {context} 下，体现 {emotion} 和 {conflict}',
      slots: ['character', 'context', 'emotion', 'conflict'],
      sample: '请写一段 反派 的内心独白，在 决战前夜 下，体现 矛盾 和 自我怀疑'
    },
    character_growth: {
      category: 'character',
      label: '角色成长',
      template: '请设计一个让 {character} 从 {state_a} 转变到 {state_b} 的关键事件',
      slots: ['character', 'state_a', 'state_b'],
      sample: '请设计一个让 主角 从 软弱逃避 转变到 坚定面对 的关键事件'
    },
    character_relationship: {
      category: 'character',
      label: '角色关系',
      template: '请写一段 {char_a} 和 {char_b} 的互动，体现他们关系从 {phase_a} 到 {phase_b} 的变化',
      slots: ['char_a', 'char_b', 'phase_a', 'phase_b'],
      sample: '请写一段 主角 和 女主 的互动，体现他们关系从 陌生人 到 挚友 的变化'
    },
    dialogue_rewrite: {
      category: 'dialogue',
      label: '对话重写',
      template: '请重写这段对话，要求更口语化，增加潜台词，符合 {character} 的语言指纹',
      slots: ['character'],
      sample: '请重写这段对话，要求更口语化，增加潜台词，符合 反派 的语言指纹'
    },
    dialogue_design: {
      category: 'dialogue',
      label: '对话设计',
      template: '请设计一段 {char_a} 和 {char_b} 的对话，场景是 {scene}，要达成 {goal}',
      slots: ['char_a', 'char_b', 'scene', 'goal'],
      sample: '请设计一段 主角 和 神秘人 的对话，场景是 酒馆深夜，要达成 试探对方身份'
    },
    golden_line: {
      category: 'dialogue',
      label: '金句设计',
      template: '请为 {character} 设计一句可截图传播的金句，体现 {theme}',
      slots: ['character', 'theme'],
      sample: '请为 反派 设计一句可截图传播的金句，体现 命运与抗争'
    },
    plot_twist: {
      category: 'plot',
      label: '转折设计',
      template: '请在 {event} 中设计一个意外转折，要求出人意料但合理',
      slots: ['event'],
      sample: '请在 主角营救师父 中设计一个意外转折，要求出人意料但合理'
    },
    foreshadow_design: {
      category: 'plot',
      label: '伏笔设计',
      template: '请在 {chapter} 中埋下一个关于 {topic} 的伏笔，要求在 {recover_chapter} 回收',
      slots: ['chapter', 'topic', 'recover_chapter'],
      sample: '请在 第 3 章 中埋下一个关于 神秘戒指 的伏笔，要求在 第 12 章 回收'
    },
    conflict_escalation: {
      category: 'plot',
      label: '冲突升级',
      template: '请将 {conflict} 升级，增加 {obstacle}，让主角面临更难的抉择',
      slots: ['conflict', 'obstacle'],
      sample: '请将 主角vs反派 升级，增加 时间限制，让主角面临更难的抉择'
    },
    pacing_adjust: {
      category: 'plot',
      label: '节奏调整',
      template: '这段剧情节奏太 {issue}，请 {action}，保持 {core_event} 不变',
      slots: ['issue', 'action', 'core_event'],
      sample: '这段剧情节奏太 慢，请 压缩到 5 个场景内，保持 决战 高潮不变'
    }
  };

  // ====== 12 类模板的 mock 生成（返回 3 个不同风格版本） ======
  function mockGenerate(questionType, slots, ctx) {
    const templates = {
      scene_description: () => {
        const len = parseInt(slots.length) || 200;
        const loc = slots.location || '未知地点';
        const time = slots.time || '傍晚';
        const emo = slots.emotion || '紧张';
        const detail = slots.detail || '环境细节';
        return [
          { version: 'A', content: `（${len}字·${emo}版）\n${loc}的${time}，${emo}的气息如潮水般涌来。${detail}在暮色中若隐若现，仿佛一个被遗忘的秘密正在苏醒。`, style: '紧张' },
          { version: 'B', content: `（${len}字·${emo}版）\n${time}的${loc}笼罩在一层薄薄的雾气中。${emo}像一根看不见的线，牵扯着每一个角落。${detail}被刻意强调，让人无法忽视它的存在。`, style: '压抑' },
          { version: 'C', content: `（${len}字·${emo}版）\n${loc}在${time}显得格外安静，安静得让人不安。${emo}不是来自外部，而是从内部、从每一个细枝末节中渗出。${detail}成了这个场景唯一的呼吸。`, style: '悬疑' }
        ];
      },
      scene_transition: () => [
        { version: 'A', content: `主角推开门，眼前的景象让他一怔。上一秒还身处${slots.scene_a || '酒馆'}，下一秒却已在${slots.scene_b || '暗巷'}。`, style: '硬切' },
        { version: 'B', content: `从${slots.scene_a || '酒馆'}出来时，主角并未注意到身后那双眼。直到他转入${slots.scene_b || '暗巷'}，才感觉有人在跟踪。`, style: '自然' },
        { version: 'C', content: `${slots.scene_a || '酒馆'}的喧嚣被抛在身后，${slots.scene_b || '暗巷'}的死寂接踵而来。主角的步伐在两种氛围之间逐渐加快。`, style: '意象' }
      ],
      scene_atmosphere: () => [
        { version: 'A', content: `重新渲染：所有光源都被调暗至原来的 60%，${slots.tone || '紧张'}的氛围立即笼罩全场。`, style: '光影' },
        { version: 'B', content: `加入一组反衬镜头：表面越是平静，${slots.tone || '紧张'}的暗流越是汹涌。`, style: '反差' },
        { version: 'C', content: `用一组特写强调：每一个呼吸、每一次心跳都被放大，${slots.tone || '紧张'}的感觉由此被无限拉伸。`, style: '感官' }
      ],
      character_entrance: () => [
        { version: 'A', content: `（动作出场）\n${slots.character || '角色'}走进${slots.scene || '场景'}，没有任何招呼，目光扫过众人后径直坐下。${slots.trait || '冷漠'}的气质让所有人下意识屏住了呼吸。`, style: '动作' },
        { version: 'B', content: `（对话出场）\n${slots.character || '角色'}尚未现身，声音已从${slots.scene || '场景'}深处传来。一句简短的话便让${slots.trait || '冷漠'}的特征呼之欲出。`, style: '对话' },
        { version: 'C', content: `（他人反应出场）\n${slots.character || '角色'}还未到${slots.scene || '场景'}，周围的人已经开始低声议论。通过他人之口，${slots.trait || '冷漠'}的形象被一一勾勒出来。`, style: '侧面' }
      ],
      character_inner: () => [
        { version: 'A', content: `（理性独白）\n${slots.character || '角色'}在${slots.context || '情境'}中反复推演每一种可能。${slots.emotion || '情绪'}被压抑在最深处，只有${slots.conflict || '矛盾'}在胸口隐隐作痛。`, style: '克制' },
        { version: 'B', content: `（感性独白）\n${slots.context || '情境'}让${slots.character || '角色'}无法再伪装。${slots.emotion || '情绪'}像溃堤的洪水倾泻而出，${slots.conflict || '矛盾'}在心底撕扯。`, style: '爆发' },
        { version: 'C', content: `（梦境独白）\n${slots.character || '角色'}在${slots.context || '情境'}中恍惚入梦。梦里有另一版本的自己在诉说着${slots.emotion || '情绪'}与${slots.conflict || '矛盾'}。`, style: '象征' }
      ],
      character_growth: () => [
        { version: 'A', content: `（他人牺牲事件）\n为了保护${slots.character || '角色'}，一位至亲或挚友付出了生命。这次失去让${slots.character || '角色'}从${slots.state_a || '软弱'}转变为${slots.state_b || '坚定'}。`, style: '失去' },
        { version: 'B', content: `（背叛事件）\n${slots.character || '角色'}最信任的人突然背叛了他。这次背叛让他从${slots.state_a || '软弱'}成长为${slots.state_b || '坚定'}。`, style: '背叛' },
        { version: 'C', content: `（自我实现事件）\n${slots.character || '角色'}在一次生死关头独立完成了一件不可能的事。从这次成功中，他真正完成了从${slots.state_a || '软弱'}到${slots.state_b || '坚定'}的蜕变。`, style: '自我' }
      ],
      character_relationship: () => [
        { version: 'A', content: `（事件推进）\n${slots.char_a || 'A'}和${slots.char_b || 'B'}在一次共同危机中并肩作战。从${slots.phase_a || '陌生人'}到${slots.phase_b || '挚友'}的转变在战斗中悄然发生。`, style: '共患难' },
        { version: 'B', content: `（日常深化）\n通过一次次看似平凡的相处，${slots.char_a || 'A'}和${slots.char_b || 'B'}的关系从${slots.phase_a || '陌生人'}逐渐升温到${slots.phase_b || '挚友'}。`, style: '细水长流' },
        { version: 'C', content: `（冲突暴露）\n一次激烈的冲突反而让${slots.char_a || 'A'}和${slots.char_b || 'B'}看清了彼此的真实面目，关系从${slots.phase_a || '陌生人'}跨越到${slots.phase_b || '挚友'}。`, style: '冲突' }
      ],
      dialogue_rewrite: () => [
        { version: 'A', content: `（口语化）\n"……行。" ${slots.character || '角色'}点了点头，转身走开。\n"你去哪？"\n"……关你什么事。"`, style: '短句' },
        { version: 'B', content: `（潜台词）\n"你今天回来得比平时晚。" ${slots.character || '角色'}没有抬头。\n"……路上堵。"\n"嗯。"`, style: '暗示' },
        { version: 'C', content: `（人设强化）\n${slots.character || '角色'}淡淡扫了对方一眼，"……有意思。"\n仅仅三个字，比任何长篇大论都更有分量。`, style: '个性化' }
      ],
      dialogue_design: () => [
        { version: 'A', content: `（${slots.goal || '试探'}）\n${slots.char_a || 'A'}：${slots.scene || '场景'}里很安静。\n${slots.char_b || 'B'}：你想问什么？\n${slots.char_a || 'A'}：……你到底是谁？\n${slots.char_b || 'B'}：我是谁，取决于你想要我成为谁。`, style: '试探' },
        { version: 'B', content: `（${slots.goal || '试探'}）\n${slots.char_b || 'B'}：${slots.scene || '场景'}里只有我们两个，你不觉得这是个巧合吗？\n${slots.char_a || 'A'}：巧合？我从不信巧合。\n${slots.char_b || 'B'}：……那就更好了。`, style: '反客为主' },
        { version: 'C', content: `（${slots.goal || '试探'}）\n${slots.char_a || 'A'}：你为什么帮我？\n${slots.char_b || 'B'}：……\n${slots.char_a || 'A'}：你不说我不会继续。\n${slots.char_b || 'B'}：好。我帮你，是因为我也想看到结局。`, style: '留白' }
      ],
      golden_line: () => [
        { version: 'A', content: `"${slots.character || '角色'}：所谓的命运，不过是强者写给弱者的谎言。"`, style: '力量型' },
        { version: 'B', content: `"${slots.character || '角色'}：你以为你在反抗命运，其实你只是在按它画好的路线走。"`, style: '哲思型' },
        { version: 'C', content: `"${slots.character || '角色'}：我不信命，我只信——我自己。"`, style: '宣言型' }
      ],
      plot_twist: () => [
        { version: 'A', content: `（身份反转）\n${slots.event || '事件'}进行到一半，主角突然发现他要救的人其实就是要杀他的人。`, style: '身份' },
        { version: 'B', content: `（牺牲反转）\n${slots.event || '事件'}中本应活下来的关键人物突然离世，所有计划被打乱。`, style: '牺牲' },
        { version: 'C', content: `（真相反转）\n${slots.event || '事件'}揭示的真相与主角此前相信的完全相反，他不得不重新审视自己所有选择。`, style: '真相' }
      ],
      foreshadow_design: () => [
        { version: 'A', content: `（物件伏笔）\n${slots.chapter || '本章'}中，主角在旧物中发现一枚从未见过的${slots.topic || '主题'}徽章。它将在${slots.recover_chapter || '回收章节'}成为破局关键。`, style: '物件' },
        { version: 'B', content: `（语言伏笔）\n${slots.chapter || '本章'}中，一位配角不经意的一句话里暗藏了关于${slots.topic || '主题'}的线索。这句话将在${slots.recover_chapter || '回收章节'}被读者重新想起。`, style: '语言' },
        { version: 'C', content: `（规则伏笔）\n${slots.chapter || '本章'}中，主角通过某种特殊方式违反了一条世界${slots.topic || '规则'}，看似无关紧要，实则在${slots.recover_chapter || '回收章节'}改变了战局。`, style: '规则' }
      ],
      conflict_escalation: () => [
        { version: 'A', content: `（时间限制）\n${slots.conflict || '冲突'}原本势均力敌，但${slots.obstacle || '新障碍'}让主角必须在 24 小时内破局，否则将失去一切。`, style: '时间' },
        { version: 'B', content: `（道德两难）\n${slots.conflict || '冲突'}中加入了${slots.obstacle || '道德困境'}，主角必须在两个他珍视的人之间做出选择。`, style: '道德' },
        { version: 'C', content: `（信息失衡）\n${slots.conflict || '冲突'}中${slots.obstacle || '信息差'}让主角一直误解对手的真实意图，直到最后一刻才发现真相。`, style: '信息' }
      ],
      pacing_adjust: () => [
        { version: 'A', content: `（${slots.action || '调整'}）\n将${slots.issue || '节奏问题'}的 5 个场景合并为 2 个，保留${slots.core_event || '核心事件'}，减少过渡描写。`, style: '压缩' },
        { version: 'B', content: `（${slots.action || '调整'}）\n在原有 5 个场景之间加入 3 个过渡场景，扩展${slots.core_event || '核心事件'}前后的人物内心与环境描写。`, style: '扩展' },
        { version: 'C', content: `（${slots.action || '调整'}）\n保持场景数量不变，但通过加快/放慢镜头节奏来调整${slots.issue || '节奏问题'}，让${slots.core_event || '核心事件'}更具张力。`, style: '镜头' }
      ]
    };

    const gen = templates[questionType];
    if (!gen) return [];
    return gen();
  }

  // ====== 提交提问，返回 3 版本 + recommendation + explanation ======
  function askQuestion(novelId, questionType, slots, targetRef, customText) {
    const options = mockGenerate(questionType, slots, {});
    const result = {
      question_type: questionType,
      target: targetRef || '',
      question_text: customText || TEMPLATES[questionType]?.template || '',
      options,
      recommendation: options.length > 1 ? `推荐版本 ${options[1].version}（${options[1].style}），因为它最贴合剧情氛围` : '',
      explanation: `三个版本分别在节奏、情感密度、个性化三个维度上做了不同处理。版本 A 强调${options[0]?.style || ''}，版本 B 强调${options[1]?.style || ''}，版本 C 强调${options[2]?.style || ''}。`,
      created_at: new Date().toISOString()
    };

    // 持久化
    if (window.DB && window.DB.question) {
      window.DB.question.put({
        novel_id: novelId || 'self',
        creator_id: 'self',
        ...result,
        options_json: JSON.stringify(options),
        accepted_version: null
      });
    }

    return result;
  }

  // 列出历史提问
  function listQuestions(novelId) {
    if (!window.DB || !window.DB.question) return [];
    return window.DB.question.list()
      .filter(r => r.novel_id === novelId)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }

  // 接受某个版本
  function acceptVersion(questionId, version) {
    if (!window.DB || !window.DB.question) return null;
    return window.DB.question.put({ id: questionId, accepted_version: version });
  }

  window.AIQuestion = {
    TEMPLATES,
    askQuestion,
    listQuestions,
    acceptVersion
  };

  console.log('[v5.17] AIQuestion 加载完成 · 12 类提问模板');
})();
