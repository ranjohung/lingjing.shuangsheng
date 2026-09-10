/* v5.14 — AI 辅助填表系统
   5 类 22 字段模板库 + 规则生成引擎
   不接真 LLM，使用规则 + 模板库
   保留 window.AIHelper.generate(fieldKey, ctx) 供日后接真 LLM
   选项数量动态控制：使用次数 ≤5 给 2-3；5-20 给 3-4；>20 给 4-5
*/
(function () {
  if (window.AIHelper) return;

  // ====== 22 字段模板库 ======
  const FIELD_TEMPLATES = {
    // ---- 基础信息 ----
    book_title: {
      key: 'book_title',
      category: 'basic',
      label: '书名',
      gen: (ctx) => {
        const themes = ctx.themes || ['命运', '记忆', '剑', '长夜', '春风', '深渊', '星辰'];
        const adjs = ['孤', '残', '深', '未央', '已逝', '将明', '无声', '无尽'];
        const nouns = ['城', '歌', '卷', '梦', '约', '录', '图', '辞'];
        return shuffleAndPick([...themes, ...themes.map(t => t + adjs[Math.floor(Math.random()*adjs.length)]), ...themes.map(t => adjs[Math.floor(Math.random()*adjs.length)] + t), ...themes.flatMap(t => nouns.map(n => t + n))], 5);
      },
      suggestions: ['《长夜将明》', '《记忆残卷》', '《剑与谎》', '《无声的约》', '《孤城记》']
    },
    book_synopsis: {
      key: 'book_synopsis',
      category: 'basic',
      label: '一句话简介',
      gen: (ctx) => [
        `一个${ctx.mc || '失去记忆'}的${ctx.role || '修士'}发现，整个${ctx.world || '修仙世界'}的历史都是被人改写的。`,
        `${ctx.mc || '她'}曾以为${ctx.world || '这个世界'}是${ctx.mood || '温柔的'}，直到一个${ctx.role || '修士'}用${ctx.weapon || '一柄残剑'}打碎了所有的${ctx.theme || '谎言'}。`,
        `当${ctx.mc || '他'}从${ctx.time || '十年昏迷'}中醒来，${ctx.world || '他熟悉的一切'}都不再是他记忆中的模样。`,
        `${ctx.role || '一只被遗忘的妖'}，踏上了寻找${ctx.mc || '被篡改的真相'}的旅程。`,
        `所有人都说${ctx.theme || '她'}已经死了。可${ctx.role || '他'}亲眼看到——她从火里走出来。`
      ]
    },
    book_theme: {
      key: 'book_theme',
      category: 'basic',
      label: '主题',
      gen: () => shuffleAndPick([
        '成长与代价', '真相与谎言', '自由与束缚', '爱与复仇', '记忆与遗忘',
        '命运与抗争', '权力与正义', '理想与现实', '生与死', '人性与兽性'
      ], 5)
    },
    book_tone: {
      key: 'book_tone',
      category: 'basic',
      label: '基调',
      gen: () => shuffleAndPick([
        '沉重', '紧张', '轻松幽默', '沉重中带希望', '黑暗幽默',
        '温暖治愈', '悲壮', '史诗', '悬疑', '清新'
      ], 5)
    },
    // ---- 世界格局 ----
    power_system: {
      key: 'power_system',
      category: 'world',
      label: '力量体系',
      gen: (ctx) => {
        const sys = (ctx.worldType || 'xianxia');
        if (sys === 'xianxia' || sys === 'qihuan') {
          return shuffleAndPick([
            '炼气→筑基→金丹→元婴→化神→大乘',
            '武徒→武者→武师→武宗→武王→武帝',
            '灵士→灵师→灵宗→灵尊→灵圣',
            '妖修：开灵→化形→渡劫→大成',
            '剑修：剑气→剑意→剑心→剑域'
          ], 4);
        } else if (sys === 'kehuan' || sys === 'saibo') {
          return shuffleAndPick([
            '觉醒者 F→E→D→C→B→A→S',
            '基因强化 一阶→九阶',
            '机械融合 Ⅰ→Ⅸ',
            '念动力 1-9 级',
            '超体进化 微观→宏观'
          ], 4);
        } else if (sys === 'xiandai' || sys === 'xiaoyuan' || sys === 'xiawu') {
          return shuffleAndPick([
            '武者：外劲→内劲→化境→宗师',
            '古武：明劲→暗劲→化劲→丹劲',
            '异能：觉醒→强化→觉醒者',
            '修真在都市：炼气→筑基→金丹',
            '特工：青铜→白银→黄金→钻石'
          ], 4);
        }
        return ['未知类型，使用通用体系'];
      }
    },
    core_conflict: {
      key: 'core_conflict',
      category: 'world',
      label: '核心冲突',
      gen: (ctx) => shuffleAndPick([
        '灵气枯竭，各大势力争夺最后资源',
        '皇朝与宗门争夺统治权',
        '上古封印松动，妖魔蠢蠢欲动',
        '新王崛起，旧秩序摇摇欲坠',
        '跨位面入侵，文明存亡一线',
        '科技失控，AI 觉醒',
        '病毒蔓延，全球隔离',
        '外星降临，第一类接触'
      ], 5)
    },
    factions: {
      key: 'factions',
      category: 'world',
      label: '主要势力',
      gen: (ctx) => shuffleAndPick([
        '天剑宗（正道）', '幽冥教（邪道）', '皇朝（世俗权力）',
        '魔道联盟', '妖族联盟', '中立商会', '隐世家族', '星际联邦', '反抗军',
        '机械教廷', '旧神教会', '反抗 AI 的地下组织'
      ], 5)
    },
    // ---- 人物小传 ----
    char_personality: {
      key: 'char_personality',
      category: 'character',
      label: '性格特点',
      gen: (ctx) => {
        const role = ctx.role || 'support';
        if (role === 'main') {
          return shuffleAndPick([
            '外冷内热，话少但句句重',
            '乐观坚韧，越挫越勇',
            '沉默寡言，行动胜于言语',
            '古灵精怪，关键时刻靠谱',
            '温润如玉，藏锋守拙',
            '热血冲动，正义感爆棚'
          ], 5);
        } else if (role === 'antag') {
          return shuffleAndPick([
            '高智商、极重义气、但易走极端',
            '表面温和、内心冷酷、极度洁癖',
            '理想主义者、偏执、自我牺牲倾向',
            '玩世不恭、玩弄人心、视规则为无物',
            '童年创伤、复仇驱动、不可理喻',
            '冷血算计、没有感情、只为结果'
          ], 5);
        } else {
          return shuffleAndPick([
            '忠厚老实、默默守护',
            '智慧深沉、辅佐型',
            '亦正亦邪、关键时反水',
            '天真烂漫、心地善良',
            '风趣幽默、调节气氛',
            '暗恋主角、深情守护'
          ], 5);
        }
      }
    },
    char_secret: {
      key: 'char_secret',
      category: 'character',
      label: '核心秘密',
      gen: (ctx) => {
        const role = ctx.role || 'support';
        if (role === 'antag') {
          return shuffleAndPick([
            '他的真实身份是主角的兄弟',
            '他篡改世界历史的动机是为了复活某人',
            '他知道世界的真相，但选择沉默',
            '他早已死去，现在活着的是傀儡',
            '他是上一代失败的英雄，转世归来',
            '他爱主角，但只能用伤害表达'
          ], 5);
        } else {
          return shuffleAndPick([
            '他暗藏一份能颠覆世界格局的证据',
            '他的家族世代守护一个被遗忘的誓言',
            '他的身世与反派有神秘关联',
            '他能听到来自未来的声音',
            '他身上被刻下了远古的诅咒',
            '他与主角在某个前世曾相遇'
          ], 5);
        }
      }
    },
    char_speech: {
      key: 'char_speech',
      category: 'character',
      label: '语言指纹',
      gen: (ctx) => shuffleAndPick([
        '短句为主，极少超过 10 字，常用"没必要""无聊"',
        '喜欢用反问句，话中有话，从不直接回答',
        '说话文绉绉，喜欢引用典故',
        '大量使用语气词和口头禅',
        '沉默是常态，开口必伤人',
        '讲话快、思维跳跃、容易跑题',
        '声音低沉、语速慢、每个字都像在掂量'
      ], 5)
    },
    // ---- 场景卡 ----
    scene_goal: {
      key: 'scene_goal',
      category: 'scene',
      label: '场景目标',
      gen: () => shuffleAndPick([
        '让主角获得第一个线索',
        '建立主角与角色的信任关系',
        '制造一个悬念，让读者想继续读',
        '展示世界观的一个关键侧面',
        '为主角设置一个即将到来的威胁',
        '让反派正式登场并展示实力',
        '揭示一个被埋藏已久的真相',
        '为主角安排一次关键的两难抉择'
      ], 5)
    },
    scene_emotion: {
      key: 'scene_emotion',
      category: 'scene',
      label: '情绪曲线',
      gen: () => shuffleAndPick([
        '平静好奇 → 震惊警惕',
        '轻松愉快 → 骤然紧张',
        '压抑沉闷 → 爆发愤怒',
        '温柔浪漫 → 暗藏杀机',
        '惊恐万状 → 冷静应对',
        '欢聚一堂 → 突生变故',
        '回忆温馨 → 回到残酷现实',
        '沉默对峙 → 一方先开口'
      ], 5)
    },
    scene_detail: {
      key: 'scene_detail',
      category: 'scene',
      label: '关键细节',
      gen: () => shuffleAndPick([
        '酒馆的木门声、老板擦拭杯子的动作',
        '雨水打在窗户上的声音、杯中晃动的酒液',
        '远处传来的钟声、桌上未写完的信',
        '风中飘落的花瓣、墙角一盆枯萎的植物',
        '一只流浪猫、孩子哭闹的声音',
        '刀刃反射的光、地面未干的血迹',
        '屏幕微光、键盘敲击声、墙上的钟',
        '月光、虫鸣、远处若有若无的笛声'
      ], 5)
    },
    // ---- 对话卡 ----
    dialogue_goal: {
      key: 'dialogue_goal',
      category: 'dialogue',
      label: '对话目标',
      gen: () => shuffleAndPick([
        '透露主角身世线索',
        '建立角色间的信任',
        '制造冲突和误解',
        '试探对方的真实想法',
        '在言谈中埋下伏笔',
        '挑明两人之间的关系',
        '让一个真相浮出水面',
        '为下一次相遇铺垫'
      ], 5)
    },
    dialogue_tone: {
      key: 'dialogue_tone',
      category: 'dialogue',
      label: '情绪基调',
      gen: () => shuffleAndPick([
        '表面平静，暗流涌动',
        '轻松幽默，但话中有话',
        '激烈对峙，情绪爆发',
        '温柔低语，暧昧缱绻',
        '冷漠疏离，几乎没有温度',
        '故作轻松，掩饰紧张',
        '欲言又止，话到嘴边收回',
        '毫不犹豫，干脆利落'
      ], 5)
    },
    dialogue_info: {
      key: 'dialogue_info',
      category: 'dialogue',
      label: '关键信息',
      gen: () => shuffleAndPick([
        '"主角的过去与某个组织有关"',
        '"反派已经知道主角的身份"',
        '"这个世界的历史被人篡改过"',
        '"眼前这个人不像他表现的那样简单"',
        '"二十年前的那场灾难其实是人祸"',
        '"某样东西失而复得，但代价巨大"',
        '"他藏了一个不能说出口的秘密"',
        '"在所有人之中，只有主角能改变结局"'
      ], 5)
    },
    // ---- 收费点 ----
    point_name: {
      key: 'point_name',
      category: 'monetize',
      label: '收费点名称',
      gen: (ctx) => {
        const t = ctx.type || 'chapter_lock';
        const map = {
          chapter_lock: ['命运转折点', '真相揭露', '生死抉择', '命运之夜', '高潮对决'],
          extra_lock: ['番外·初见', '番外·十年之约', '番外·他日重逢', '番外·另一面'],
          route_lock: ['专属·TA 的心', '专属·暗恋笔记', '专属·HE 路线', '专属·BE 路线'],
          hidden_lock: ['隐藏·真相之盒', '隐藏·隐藏结局', '隐藏·彩蛋', '隐藏·小剧场'],
          true_end_lock: ['真结局·破晓', '真结局·圆满', '真结局·真相反转'],
          affection_item: ['温柔一击', '心动一吻', '玫瑰花束', '手写情书'],
          char_card: ['限定卡牌·初见', '限定卡牌·并肩', '限定卡牌·永恒', '稀有卡牌·神秘'],
          cg_card: ['CG·初遇', 'CG·告白', 'CG·决战', 'CG·永别'],
          costume: ['华服·新春', '华服·盛夏', '华服·婚嫁', '华服·夜行'],
          title: ['称号·命运之子', '称号·破局者', '称号·传奇玩家', '称号·剧情大师']
        };
        return shuffleAndPick(map[t] || ['自定义商品'], 5);
      }
    },
    // ---- 适配 v5.12 novel 字段 ----
    chapter_title: {
      key: 'chapter_title',
      category: 'chapter',
      label: '章节标题',
      gen: (ctx) => {
        const adj = ['春风', '秋月', '夜雨', '长亭', '故人', '归途', '浮生', '烟火', '山河', '故里', '长夜', '黎明'];
        const noun = ['度曲', '流泻', '重逢', '约定', '救赎', '对弈', '诀别', '一梦', '无言', '独行'];
        return shuffleAndPick([
          ...adj.map(a => `第${ctx.idx || '一'}章 ${a}${noun[Math.floor(Math.random()*noun.length)]}`),
          ...adj.flatMap(a => noun.map(n => `${a}${n}`))
        ], 5);
      }
    },
    highlight_keyword: {
      key: 'highlight_keyword',
      category: 'chapter',
      label: '高光关键词',
      gen: () => shuffleAndPick([
        '初遇', '重逢', '告白', '误会', '真相', '背叛', '牺牲', '决裂', '和解', '约定',
        '死亡', '重生', '觉醒', '传承', '誓言', '秘密', '相遇', '离别', '战斗', '胜利'
      ], 5)
    }
  };

  function shuffleAndPick(arr, n) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }

  // ====== 选项数量动态控制 ======
  function optionCount(usageCount) {
    if (usageCount < 5) return Math.min(3, 3);          // 新手 2-3
    if (usageCount < 20) return 4;                       // 中等 3-4
    return 5;                                            // 熟练 4-5
  }

  // ====== 核心生成 API ======
  /**
   * 生成指定字段的选项
   * @param {string} fieldKey - 字段 key
   * @param {Object} ctx - 上下文（已填写字段 + 题材等）
   * @param {number} count - 想要几个选项
   * @returns {Array<string>} 选项数组
   */
  function generate(fieldKey, ctx = {}, count) {
    const template = FIELD_TEMPLATES[fieldKey];
    if (!template) return [];
    const all = template.gen(ctx || {});
    // 移除重复
    const unique = [...new Set(all)];
    const n = count || optionCount(getUsageCount());
    return unique.slice(0, n);
  }

  // ====== 使用统计 ======
  function getUsageCount() {
    if (!window.DB?.aiUsage) return 0;
    return window.DB.aiUsage.count();
  }
  function recordUsage(fieldKey, ctx = {}, accepted = false, modified = false) {
    if (!window.DB?.aiUsage?.put) return null;
    const existing = window.DB.aiUsage.queryBy('field_key', fieldKey);
    const record = existing.length > 0 ? existing[0] : {
      novel_id: ctx.novelId || 'global',
      creator_id: ctx.creatorId || 'anonymous',
      field_key: fieldKey,
      field_category: FIELD_TEMPLATES[fieldKey]?.category || 'unknown',
      generated_count: 0,
      accepted_count: 0,
      modified_count: 0
    };
    record.generated_count = (record.generated_count || 0) + 1;
    if (accepted) record.accepted_count = (record.accepted_count || 0) + 1;
    if (modified) record.modified_count = (record.modified_count || 0) + 1;
    record.novel_id = ctx.novelId || record.novel_id || 'global';
    record.creator_id = ctx.creatorId || record.creator_id || 'anonymous';
    return window.DB.aiUsage.put(record);
  }

  // ====== UI 组件：弹层渲染 ======
  /**
   * 在指定容器渲染 AI 弹层（选项 + 换一批 + 我来说）
   * @returns {Object} {pick(label), reroll(), close(), setFreeInput(value)}
   */
  function renderModal(fieldKey, ctx, container, callbacks = {}) {
    const template = FIELD_TEMPLATES[fieldKey];
    if (!template) {
      console.warn('[AIHelper] 未知字段：', fieldKey);
      return null;
    }
    const currentCtx = { ...ctx };
    let currentOptions = generate(fieldKey, currentCtx);

    function rerenderOptions() {
      currentOptions = generate(fieldKey, currentCtx);
      optsEl.innerHTML = currentOptions.map((o, i) => `
        <button class="ai-opt" data-idx="${i}">
          <span class="ai-opt-num">${i + 1}</span>
          <span class="ai-opt-label">${escapeHtml(o)}</span>
        </button>`).join('');
      optsEl.querySelectorAll('.ai-opt').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const label = currentOptions[idx];
          recordUsage(fieldKey, currentCtx, true, false);
          if (callbacks.onPick) callbacks.onPick(label);
          close();
        };
      });
    }

    container.innerHTML = `
      <div class="ai-modal-mask">
        <div class="ai-modal-card">
          <div class="ai-modal-head">
            <div class="ai-modal-title">🤖 帮我写 · ${escapeHtml(template.label)}</div>
            <div class="ai-modal-sub">基于已填写信息生成 ${currentOptions.length} 个选项</div>
          </div>
          <div class="ai-modal-body">
            <div class="ai-opts" id="ai-opts-${fieldKey}"></div>
            <div class="ai-free-input">
              <textarea class="ai-textarea" id="ai-free-${fieldKey}" placeholder="我自己的想法…（可选）" rows="2"></textarea>
              <div class="ai-actions">
                <button class="ai-btn" id="ai-reroll-${fieldKey}">🔄 换一批</button>
                <button class="ai-btn primary" id="ai-free-submit-${fieldKey}">📝 用我的话</button>
                <button class="ai-btn" id="ai-cancel-${fieldKey}">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const optsEl = container.querySelector(`#ai-opts-${fieldKey}`);
    rerenderOptions();
    container.querySelector(`#ai-reroll-${fieldKey}`).onclick = () => {
      recordUsage(fieldKey, currentCtx, false, false);
      rerenderOptions();
    };
    container.querySelector(`#ai-free-submit-${fieldKey}`).onclick = () => {
      const v = container.querySelector(`#ai-free-${fieldKey}`).value.trim();
      if (!v) {
        alert('请先输入你的想法');
        return;
      }
      recordUsage(fieldKey, currentCtx, true, true);
      if (callbacks.onPick) callbacks.onPick(v);
      close();
    };
    container.querySelector(`#ai-cancel-${fieldKey}`).onclick = close;
    container.querySelector('.ai-modal-mask').onclick = (e) => {
      if (e.target.classList.contains('ai-modal-mask')) close();
    };

    function close() {
      container.innerHTML = '';
      if (callbacks.onClose) callbacks.onClose();
    }
    return { close, reroll: () => rerenderOptions() };
  }

  // ====== 工具 ======
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function listFields() { return Object.keys(FIELD_TEMPLATES); }
  function getFieldMeta(key) { return FIELD_TEMPLATES[key] || null; }

  // ====== 暴露 API ======
  window.AIHelper = {
    generate, renderModal, recordUsage, getUsageCount, optionCount,
    listFields, getFieldMeta,
    FIELD_TEMPLATES
  };
  console.log('[v5.14] AIHelper 加载完成 · 22 字段模板库 · 规则生成引擎');
})();