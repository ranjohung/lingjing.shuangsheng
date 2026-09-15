/* v5.17 — 人物小传系统
   核心人物 10 要素（缺一不可）：
     ① 姓名（全名/昵称/外号）
     ② 性别
     ③ 年龄
     ④ 外形（身高/体型/显著特征）
     ⑤ 性格特点（优点 + 缺点分列）
     ⑥ 家庭关系（上两代+下两代+社会历史背景）
     ⑦ 感情经历（重大爱情/友情/亲情）
     ⑧ 社会阶层（决定说话风格和着装）
     ⑨ 生活习惯（区分角色的行为习惯）
     ⑩ 成长经历（影响性格形成的关键事件）
   次要人物 5 要素（简化版）：
     ① 姓名 ② 与主角的关系 ③ 核心性格 ④ 一句话背景 ⑤ 在故事中的作用
   人物语言指纹（对话设计的核心）：
     - 风格（粗/雅/毒舌/冷淡/热情）
     - 口癖（独特的口头禅）
     - 句长偏好（长句/短句）
     - 常用词
     - 绝不会说的词
   验收标准：读者不看名字，只看台词，就能知道是谁在说话。
*/
(function () {
  if (window.CharacterProfile) return;

  // ====== 核心 10 要素 ======
  const CORE_10 = [
    { key: 'name', label: '① 姓名', hint: '全名 / 昵称 / 外号（例：朴仲基，原名山口正雄）', required: true },
    { key: 'gender', label: '② 性别', hint: '男 / 女 / 其他', required: true },
    { key: 'age', label: '③ 年龄', hint: '具体岁数（例：28 岁）', required: true },
    { key: 'appearance', label: '④ 外形', hint: '身高/体型/显著特征（例：178cm，瘦弱但有力，左眼角有旧伤疤）', required: true },
    { key: 'personality_strengths', label: '⑤ 性格（优点）', hint: '优点列出（高毅力/高智商/极重义气）', required: true },
    { key: 'personality_weaknesses', label: '⑤ 性格（缺点）', hint: '缺点列出（洁癖强迫症/易走极端）', required: true },
    { key: 'family', label: '⑥ 家庭关系', hint: '上两代+下两代，结合社会历史背景', required: true },
    { key: 'romantic_history', label: '⑦ 感情经历', hint: '重大爱情/友情/亲情经历', required: true },
    { key: 'social_class', label: '⑧ 社会阶层', hint: '决定说话风格和着装（例：上流社会，军事家族与商业望族的后代）', required: true },
    { key: 'habits', label: '⑨ 生活习惯', hint: '与其他角色区分的行为习惯（例：洁癖严重，战斗时会因洁癖分心）', required: true },
    { key: 'growth', label: '⑩ 成长经历', hint: '影响性格形成的关键事件（祖父影响/父亲高压教育/朋友悲剧）', required: true }
  ];

  // ====== 次要 5 要素 ======
  const MINOR_5 = [
    { key: 'minor_relation', label: '与主角的关系', hint: '师父/挚友/仇人/路人', required: true },
    { key: 'minor_personality', label: '核心性格', hint: '2-3 个关键词', required: true },
    { key: 'minor_background', label: '一句话背景', hint: 'ta 是谁', required: true },
    { key: 'minor_role', label: '在故事中的作用', hint: '推动剧情/提供信息/制造冲突', required: true }
  ];

  // ====== 语言指纹 ======
  const VOICE_FINGERPRINT = [
    { key: 'voice_style', label: '风格', hint: '粗 / 雅 / 毒舌 / 冷淡 / 热情', required: true },
    { key: 'voice_catchphrase', label: '口癖', hint: '独特的口头禅（"嗯。" "随便。"）', required: true },
    { key: 'voice_sentence_len', label: '句长偏好', hint: '长句 / 短句 / 中长句', required: true },
    { key: 'voice_common_words', label: '常用词', hint: '常出现的词汇（"没必要" "无聊"）', required: true },
    { key: 'voice_never_says', label: '绝不会说的词', hint: '不会出现的表达（绝不会说"我觉得""也许""可能"）', required: true }
  ];

  // ====== AI 生成规则 ======
  const FIELD_GEN = {
    name: () => shuffleAndPick([
      '朴仲基（原名山口正雄）', '孙悟空', '裴长缨', '沈昼', '楚无言', '白九卿',
      '段青鸢', '苏慕白', '温如言', '叶孤城'
    ], 5),
    gender: () => ['男', '女', '其他（自设）'],
    age: () => shuffleAndPick(['18 岁', '22 岁', '28 岁', '35 岁', '42 岁', '56 岁', '70 岁'], 3),
    appearance: () => shuffleAndPick([
      '身高 178cm，瘦弱但有力，左眼角有旧伤疤',
      '身高 165cm，温婉清秀，右手腕有胎记',
      '身高 182cm，魁梧沉稳，下巴有刀痕',
      '身高 170cm，苍白阴郁，黑发过肩',
      '身高 160cm，明艳张扬，眼尾一颗泪痣'
    ], 3),
    personality_strengths: () => shuffleAndPick([
      '高毅力、高智商、极重义气',
      '温柔体贴、洞察人心、永不放弃',
      '冷静理性、战略眼光、绝对忠诚',
      '勇敢果断、富有感染力、天生的领袖',
      '幽默风趣、心思细腻、极强的共情能力'
    ], 3),
    personality_weaknesses: () => shuffleAndPick([
      '洁癖强迫症、易走极端',
      '过度依赖他人、害怕被抛弃',
      '冷漠疏离、不善表达情感',
      '冲动鲁莽、不计后果',
      '完美主义、自我要求过高'
    ], 3),
    family: () => shuffleAndPick([
      '祖父是战争狂热分子，父亲是和平主义者，母亲是韩国商人家庭出身',
      '父亲是朝廷重臣，母亲早逝，继母对她视如己出，妹妹性格叛逆',
      '父亲是江湖游医，母亲是大家闺秀，弟弟性格懦弱',
      '孤儿出身，被师父收养，从不知父母是谁',
      '父母双全，姐姐远嫁海外，弟弟是纨绔子弟'
    ], 3),
    romantic_history: () => shuffleAndPick([
      '中学时期最好的朋友被打成植物人，他单挑群氓致人死亡后跑路，从此不再相信任何人',
      '暗恋师兄多年却从未说出口，亲眼目睹师兄战死',
      '被初恋背叛，从此不相信爱情，与所有异性保持距离',
      '有过一段失败的婚姻，前妻出轨导致他性情大变',
      '从未恋爱，把所有热情都投入到事业中'
    ], 3),
    social_class: () => shuffleAndPick([
      '上流社会，军事家族与商业望族的后代',
      '中层阶级，小康之家，靠读书改变命运',
      '底层出身，靠自己摸爬滚打',
      '世家子弟，含着金汤匙出生',
      '江湖草莽，不受世俗礼法约束'
    ], 3),
    habits: () => shuffleAndPick([
      '洁癖严重，对污垢之物敬而远之，战斗时会因洁癖分心',
      '思考时会用手指敲桌面，每天必须午睡否则会崩溃',
      '随身带一本空白笔记本，记下所有观察到的细节',
      '睡前必须喝一杯温牛奶，房间里不能有任何镜子',
      '紧张时会不自觉地数呼吸，每分钟恰好 16 次'
    ], 3),
    growth: () => shuffleAndPick([
      '祖父的影响、父亲的高压教育、朋友的悲剧',
      '幼年目睹父母被害，从此立志复仇',
      '童年时期被霸凌，靠读书考上名校逆袭',
      '少年时期因战乱流离失所，看尽人间疾苦',
      '从小被当作继承人培养，压抑了所有个人喜好'
    ], 3),
    minor_relation: () => shuffleAndPick([
      '主角的师父', '主角的挚友', '主角的宿敌', '主角的同事', '主角的家人', '路人'
    ], 4),
    minor_personality: () => shuffleAndPick([
      '沉稳、慈悲', '狡黠、贪婪', '憨厚、忠诚', '高傲、孤僻', '热情、单纯', '阴沉、偏执'
    ], 4),
    minor_background: () => shuffleAndPick([
      '退役老兵，曾是主角的救命恩人',
      '神秘商人，掌握关键情报',
      '宫廷内应，潜伏多年',
      '江湖郎中，医术高明',
      '街头乞丐，却身怀绝技',
      '书院先生，饱读诗书'
    ], 4),
    minor_role: () => shuffleAndPick([
      '推动剧情', '提供关键信息', '制造冲突', '衬托主角', '形成对照', '提供笑点'
    ], 3),
    voice_style: () => shuffleAndPick([
      '冷淡、简洁', '温和、文雅', '粗犷、直白', '毒舌、刻薄', '热情、奔放', '沉稳、有分量'
    ], 4),
    voice_catchphrase: () => shuffleAndPick([
      '"嗯。" "随便。"', '"这样啊。" "然后呢？"', '"走开。" "别烦我。"',
      '"哎呀。" "有趣。"', '"您说得对。" "承蒙夸奖。"', '"哼。" "无聊。"'
    ], 4),
    voice_sentence_len: () => shuffleAndPick(['短句为主，极少超过 10 字', '中长句，结构工整', '长句，逻辑严密', '长短结合，节奏感强'], 3),
    voice_common_words: () => shuffleAndPick([
      '"没必要" "无聊" "随便" "嗯"', '"承蒙" "赐教" "请" "敢问"', '"走开" "烦" "滚" "闭嘴"',
      '"哎呀" "有趣" "真好" "太棒了"', '"您说得对" "承蒙夸奖" "愧不敢当"', '"哼" "无聊" "可笑"'
    ], 3),
    voice_never_says: () => shuffleAndPick([
      '绝不会说"我觉得""也许""可能"这类犹豫词',
      '绝不说不雅的脏话',
      '绝不直接表达爱意，永远用行动暗示',
      '绝不道歉，哪怕是自己错了',
      '绝不提及自己过去的伤心事'
    ], 3)
  };

  function shuffleAndPick(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  function optionCount(usageCount) {
    if (usageCount < 5) return 2 + Math.floor(Math.random() * 2);
    if (usageCount < 20) return 3 + Math.floor(Math.random() * 2);
    return 4 + Math.floor(Math.random() * 2);
  }

  function generateOptions(fieldKey, ctx, usageCount) {
    const gen = FIELD_GEN[fieldKey];
    if (!gen) return [];
    const all = gen(ctx || {});
    const n = optionCount(usageCount || 0);
    return all.slice(0, n);
  }

  // ====== 数据持久化 ======
  function saveProfile(novelId, profileData) {
    if (!window.DB || !window.DB.profile) return null;
    const all = window.DB.profile.list();
    const existing = all.find(r => r.novel_id === novelId && r.character_name === profileData.character_name);
    const row = {
      id: existing?.id,
      novel_id: novelId,
      creator_id: 'self',
      ...profileData
    };
    return window.DB.profile.put(row);
  }

  function listProfiles(novelId) {
    if (!window.DB || !window.DB.profile) return [];
    return window.DB.profile.list().filter(r => r.novel_id === novelId);
  }

  function getProfile(novelId, name) {
    return listProfiles(novelId).find(r => r.character_name === name) || null;
  }

  // 角色一致性检测（用于自动质量检测）
  function checkConsistency(profile, dialogue) {
    if (!profile || !dialogue) return { ok: true, issues: [] };
    const issues = [];
    // 检测绝不说的词
    const neverWords = (profile.voice_never_says || '').split(/[，。、；]/).map(s => s.trim()).filter(Boolean);
    neverWords.forEach(w => {
      if (w && w.length > 2 && dialogue.includes(w.replace(/^绝不/, '').replace(/^不会/, ''))) {
        issues.push({ field: 'voice_never_says', msg: `台词中出现角色不会说的词：${w}` });
      }
    });
    return { ok: issues.length === 0, issues };
  }

  // ====== 暴露 API ======
  window.CharacterProfile = {
    CORE_10,
    MINOR_5,
    VOICE_FINGERPRINT,
    generateOptions,
    optionCount,
    saveProfile,
    listProfiles,
    getProfile,
    checkConsistency
  };

  console.log('[v5.17] CharacterProfile 加载完成 · 核心 10 要素 + 次要 5 要素 + 语言指纹');
})();
