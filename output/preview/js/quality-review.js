/* v5.14 — 质量审核引擎（5 维度 + 硬性门槛 + S/A/B/C/D 等级）
   评估维度（5 维）：
     1. 叙事质量(30%)：流畅度/连贯性/节奏/伏笔兑现率
     2. 角色质量(25%)：一致性/成长弧光/对话自然度
     3. 文学质量(20%)：表现力/感染力/创新性
     4. AI 味检测(15%)：AI味指数/陈词滥调/总结体
     5. 合规性(10%)：敏感词/价值观/版权风险
   字数门槛：短篇 8000 / 中篇 30000 / 长篇 80000
   硬性门槛：合规通过 / AI味 ≤40 / 伏笔兑现率 ≥60% / 字数达标
   等级：S(≥4.5) / A(4.0-4.4) / B(3.5-3.9) / C(3.0-3.4) / D(<3.0)
*/
(function () {
  if (window.QualityReview) return;

  // ====== 字数门槛 ======
  const WORD_LIMITS = [
    { tier: 'short',  name: '短篇', min: 8000,  max: 29999, chapters: '4-5章' },
    { tier: 'medium', name: '中篇', min: 30000, max: 79999, chapters: '15-20章' },
    { tier: 'long',   name: '长篇', min: 80000, max: Infinity, chapters: '40-50章' }
  ];

  // ====== 敏感词库（精简版，仅演示） ======
  const SENSITIVE_WORDS = [
    '色情', '裸体', '性行为', '强暴', '吸毒', '制毒', '爆炸物',
    '习近平', '毛泽东', '邓小平', '江泽民', '胡锦涛', '温家宝',
    // 政治
    '反动', '颠覆', '政变', '台独', '港独', '疆独', '藏独',
    '六四', '天安门事件'
  ];

  // ====== AI 味短语库（高 AI 味短语） ======
  const AI_PHRASES = [
    '总之', '综上所述', '由此可见', '不难发现', '显而易见',
    '令人深思', '发人深省', '耐人寻味', '意味深长', '引人入胜',
    '不禁让人', '不由得', '让人不禁', '此刻,', '此时此刻,',
    '命运的齿轮', '命运的安排', '冥冥之中', '上天似乎',
    '仿佛在诉说着', '仿佛在告诉我们', '似乎在暗示', '似乎在预示',
    '这个故事告诉我们', '或许这就是', '也许这就是', '也许这正是',
    '在那一刻,', '就在那一瞬间,', '时间仿佛静止', '世界仿佛静止',
    '他的眼中闪烁着', '她的眼中流露出', '眼神中透着', '眼神中带着',
    '内心深处,', '心底深处,', '灵魂深处,', '在灵魂的深处',
    '某种难以言喻', '一种莫名的', '一股难以名状', '一种无法言说的',
    '他深知', '她深知', '他明白', '她明白',
    '他知道,', '她知道,', '他清楚,', '她清楚,',
    '这不仅仅是', '这不仅是', '这已不仅仅是',
    '回顾历史', '展望未来', '从古至今', '自古以来'
  ];

  // ====== 评估：字数 ======
  function evalWordCount(text) {
    const chars = text.length;
    let tier = null;
    for (const w of WORD_LIMITS) {
      if (chars >= w.min && chars <= w.max) { tier = w; break; }
    }
    if (!tier && chars < 8000) tier = { tier: 'too_short', name: '不足', min: 0, max: 7999, chapters: '需补充' };
    if (!tier && chars >= 80000) tier = WORD_LIMITS[2];
    return { chars, tier, passed: tier?.tier !== 'too_short' };
  }

  // ====== 评估：合规（敏感词） ======
  function evalCompliance(text) {
    const hits = [];
    for (const w of SENSITIVE_WORDS) {
      if (text.includes(w)) hits.push(w);
    }
    return {
      passed: hits.length === 0,
      hits,
      score: hits.length === 0 ? 1.0 : Math.max(0, 1 - hits.length * 0.3)
    };
  }

  // ====== 评估：AI 味（纯规则） ======
  function evalAIFlavor(text) {
    if (!text || text.length < 100) return { score: 0, phrases: [], cliche: 0, summary: 0 };
    let phraseHits = 0;
    const matchedPhrases = [];
    for (const p of AI_PHRASES) {
      const re = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const m = text.match(re);
      if (m) {
        phraseHits += m.length;
        matchedPhrases.push({ phrase: p, count: m.length });
      }
    }
    // 每千字 1 个 AI 短语 = 1 分
    const aiFlavorIndex = Math.min(100, Math.round((phraseHits / text.length) * 1000));
    // 陈词滥调比例
    const cliche = +(phraseHits / (text.length / 100)).toFixed(2);
    // 总结体比例：检查"总之/综上/可见"等
    const summaryWords = ['总之', '综上所述', '由此可见', '不难发现', '显而易见'];
    let summaryHits = 0;
    for (const w of summaryWords) {
      const re = new RegExp(w, 'g');
      const m = text.match(re);
      if (m) summaryHits += m.length;
    }
    const summaryRatio = +(summaryHits / (text.length / 100)).toFixed(2);

    return {
      score: aiFlavorIndex,
      phrases: matchedPhrases.sort((a, b) => b.count - a.count).slice(0, 10),
      cliche,
      summary: summaryRatio
    };
  }

  // ====== 评估：叙事质量（启发式） ======
  function evalNarrative(novel) {
    const chapters = novel.novel?.chapters || [];
    if (chapters.length === 0) return { score: 0, fluidity: 0, coherence: 0, pacing: 0, payoff: 0 };
    // 1. 流畅度：句子平均长度
    const allText = chapters.map(c => c.text || '').join('\n');
    const sentences = allText.split(/[。！？!?\.]/).filter(s => s.trim().length > 0);
    const avgSentLen = sentences.length > 0 ? allText.length / sentences.length : 0;
    // 理想 12-25 字
    const fluidity = avgSentLen >= 12 && avgSentLen <= 25 ? 4
                    : avgSentLen >= 8 && avgSentLen <= 30 ? 3
                    : 2;
    // 2. 连贯性：章节长度方差（低 = 稳定）
    const lens = chapters.map(c => (c.text || '').length);
    const mean = lens.reduce((s, n) => s + n, 0) / lens.length;
    const variance = lens.reduce((s, n) => s + (n - mean) ** 2, 0) / lens.length;
    const std = Math.sqrt(variance);
    const cv = mean > 0 ? std / mean : 1;  // 变异系数
    const coherence = cv < 0.5 ? 4 : cv < 1 ? 3 : 2;
    // 3. 节奏：场景切换密度（用 \n\n 段落分隔）
    const paragraphs = allText.split(/\n\n+/).filter(p => p.trim().length > 0);
    const paraDensity = allText.length / Math.max(1, paragraphs.length);
    const pacing = paraDensity > 60 && paraDensity < 200 ? 4
                  : paraDensity > 30 && paraDensity < 400 ? 3
                  : 2;
    // 4. 伏笔兑现率（启发式）：首章关键词在后几章出现率
    let payoff = 0;
    if (chapters.length >= 2) {
      const firstWords = (chapters[0].text || '').match(/[\u4e00-\u9fa5]{2,4}/g) || [];
      const uniqueFirst = [...new Set(firstWords)].slice(0, 30);
      const restText = chapters.slice(1).map(c => c.text || '').join('\n');
      const recalled = uniqueFirst.filter(w => restText.includes(w));
      payoff = uniqueFirst.length > 0 ? recalled.length / uniqueFirst.length : 0.5;
    }
    const score = (fluidity * 0.3 + coherence * 0.3 + pacing * 0.2 + payoff * 5 * 0.2);

    return {
      score: +score.toFixed(2),
      fluidity, coherence, pacing,
      payoff: +payoff.toFixed(3),
      avgSentLen: +avgSentLen.toFixed(1),
      paragraphCount: paragraphs.length,
      chapterCount: chapters.length
    };
  }

  // ====== 评估：角色质量 ======
  function evalCharacter(novel) {
    const chars = novel.chars || [];
    const chapters = novel.novel?.chapters || [];
    if (chars.length === 0) return { score: 0, consistency: 0, growth: 0, dialogue: 0 };
    const allText = chapters.map(c => c.text || '').join('\n');
    // 1. 一致性：每个角色在每章是否出现
    const chapterCount = chapters.length;
    const consistencyList = chars.map(ch => {
      let count = 0;
      for (const c of chapters) {
        if ((c.text || '').includes(ch.name)) count++;
      }
      return { name: ch.name, count, ratio: chapterCount > 0 ? count / chapterCount : 0 };
    });
    const consistency = consistencyList.length > 0
      ? consistencyList.reduce((s, c) => s + (c.ratio > 0.2 ? 1 : 0.5), 0) / consistencyList.length * 4
      : 0;
    // 2. 成长弧光（启发式）：用"他/她 + 情绪/动作" 词的密度
    const growthKeywords = ['决定', '明白', '领悟', '决定要', '不再', '开始', '成长', '改变', '释怀', '原谅'];
    let growthHits = 0;
    for (const k of growthKeywords) {
      const m = allText.match(new RegExp(k, 'g'));
      if (m) growthHits += m.length;
    }
    const growth = Math.min(4, growthHits / Math.max(1, allText.length / 1000));
    // 3. 对话自然度：对话标记（" " "" ：)密度
    const dialogues = (allText.match(/["「『][^"」』]{2,30}["」』]/g) || []).length;
    const dialogueDensity = dialogues / Math.max(1, allText.length / 1000);
    const dialogue = Math.min(4, dialogueDensity);

    const score = consistency * 0.4 + growth * 0.3 + dialogue * 0.3;

    return {
      score: +score.toFixed(2),
      consistency: +consistency.toFixed(2),
      growth: +growth.toFixed(2),
      dialogue: +dialogue.toFixed(2),
      consistencyList
    };
  }

  // ====== 评估：文学质量（启发式） ======
  function evalLiterary(novel) {
    const chapters = novel.novel?.chapters || [];
    if (chapters.length === 0) return { score: 0, expression: 0, emotion: 0, innovation: 0 };
    const allText = chapters.map(c => c.text || '').join('\n');
    // 1. 表现力：形容词/副词丰富度
    const expressiveWords = (allText.match(/[\u4e00-\u9fa5]{2,3}(地|的|然|如)/g) || []).length;
    const expression = Math.min(4, expressiveWords / Math.max(1, allText.length / 1000) * 0.8);
    // 2. 感染力：情感词密度
    const emotionWords = ['爱', '恨', '思', '念', '悲', '喜', '怒', '愁', '伤', '痛', '泪', '笑', '心跳', '心酸', '心动'];
    let emoHits = 0;
    for (const w of emotionWords) {
      const m = allText.match(new RegExp(w, 'g'));
      if (m) emoHits += m.length;
    }
    const emotion = Math.min(4, emoHits / Math.max(1, allText.length / 1000) * 0.6);
    // 3. 创新性：独特词比例
    const tokens = (allText.match(/[\u4e00-\u9fa5]{2,4}/g) || []);
    const unique = new Set(tokens);
    const uniqueRatio = tokens.length > 0 ? unique.size / tokens.length : 0;
    const innovation = uniqueRatio * 5;

    const score = expression * 0.4 + emotion * 0.3 + innovation * 0.3;

    return {
      score: +Math.min(4, score).toFixed(2),
      expression: +expression.toFixed(2),
      emotion: +emotion.toFixed(2),
      innovation: +innovation.toFixed(2)
    };
  }

  // ====== 主评估 ======
  function evaluate(novel) {
    if (!novel || !novel.novel) throw new Error('[QualityReview] novel 无效');
    const chapters = novel.novel?.chapters || [];
    const allText = chapters.map(c => c.text || '').join('\n');

    // 1. 字数
    const wc = evalWordCount(allText);
    // 2. 合规
    const cmp = evalCompliance(allText);
    // 3. AI 味
    const ai = evalAIFlavor(allText);
    // 4. 叙事
    const narr = evalNarrative(novel);
    // 5. 角色
    const char = evalCharacter(novel);
    // 6. 文学
    const lit = evalLiterary(novel);

    // 5 维加权
    const narrativeScore = narr.score;
    const characterScore = char.score;
    const literaryScore = lit.score;
    const aiFlavorScore = ai.score;
    const complianceScore = cmp.score * 5;  // 0-1 → 0-5

    // 综合分（按权重）：叙事 30% + 角色 25% + 文学 20% + AI味(15%倒置) + 合规(10%)
    const aiFlavorNorm = Math.max(0, 5 - aiFlavorScore * 0.1);  // AI 味越高分越低
    const total = (narrativeScore * 0.30 + characterScore * 0.25
                 + literaryScore * 0.20 + aiFlavorNorm * 0.15
                 + complianceScore * 0.10);
    const totalRounded = +total.toFixed(2);

    // 等级
    let grade;
    if (totalRounded >= 4.5) grade = 'S';
    else if (totalRounded >= 4.0) grade = 'A';
    else if (totalRounded >= 3.5) grade = 'B';
    else if (totalRounded >= 3.0) grade = 'C';
    else grade = 'D';

    // 硬性门槛
    const hardGates = {
      compliance: cmp.passed,
      aiFlavor: ai.score <= 40,
      payoff: narr.payoff >= 0.6,
      wordCount: wc.tier?.tier !== 'too_short'
    };
    const allHardGatesPass = Object.values(hardGates).every(Boolean);

    // 状态
    let status;
    if (!allHardGatesPass) {
      status = 'rejected';
    } else if (totalRounded >= 3.5) {
      status = 'passed';
    } else if (totalRounded >= 3.0) {
      status = 'needs_revision';
    } else {
      status = 'rejected';
    }

    // 驳回原因
    const rejectionReasons = [];
    if (!hardGates.compliance) rejectionReasons.push(`合规检测不通过：命中敏感词 ${cmp.hits.join('、')}`);
    if (!hardGates.aiFlavor) rejectionReasons.push(`AI 味指数过高：${ai.score}（需 ≤40）`);
    if (!hardGates.payoff) rejectionReasons.push(`伏笔兑现率不足：${(narr.payoff*100).toFixed(0)}%（需 ≥60%）`);
    if (!hardGates.wordCount) rejectionReasons.push(`字数不足：${wc.chars}字（${wc.tier?.name === '不足' ? '需 ≥8000字' : '字数未达' + (wc.tier?.min || 0)}）`);
    if (totalRounded < 3.0) rejectionReasons.push(`综合评分过低：${totalRounded}/5.0（需 ≥3.0）`);

    // 改进建议
    const improvements = [];
    if (narr.fluidity < 3) improvements.push(`叙事流畅度偏低（${narr.fluidity}/5），平均句长 ${narr.avgSentLen} 字，建议调整句子长短`);
    if (narr.coherence < 3) improvements.push(`章节长度不均（CV=${(variance(novel.novel?.chapters || [])/100).toFixed(1)}），建议稳定章节节奏`);
    if (narr.payoff < 0.6) improvements.push(`伏笔兑现率 ${(narr.payoff*100).toFixed(0)}% 偏低，建议在后续章节呼应开头设定的关键意象`);
    if (char.consistency < 3) improvements.push('部分角色出场过少，建议增强配角戏份');
    if (char.dialogue < 2) improvements.push('对话密度偏低，建议增加对话场景');
    if (lit.expression < 2) improvements.push('文字表现力可加强，多用动作/环境描写代替直白叙述');
    if (ai.score > 30) improvements.push(`AI 味指数 ${ai.score} 偏高，高频词：${ai.phrases.slice(0, 3).map(p => p.phrase).join('、')}，建议人工润色`);
    if (improvements.length === 0) improvements.push('作品质量良好，建议保持当前风格继续创作');

    // 报告
    const report = {
      id: window.DB?.uuid ? window.DB.uuid() : 'qr-' + Date.now(),
      novel_id: novel.novel.id,
      narrative_score: narrativeScore,
      character_score: characterScore,
      literary_score: literaryScore,
      ai_flavor_score: ai.score,
      compliance_status: cmp.passed ? 'pass' : 'fail',
      word_count: wc.chars,
      foreshadow_payoff_rate: narr.payoff,
      total_score: totalRounded,
      grade,
      status,
      rejection_reasons: rejectionReasons,
      improvement_suggestions: improvements,
      evaluated_at: window.DB?.now ? window.DB.now() : new Date().toISOString()
    };

    // 落库
    if (window.DB?.quality?.put) window.DB.quality.put(report);

    // 审核记录
    if (window.DB?.reviews?.put) {
      window.DB.reviews.put({
        novel_id: novel.novel.id,
        reviewer_type: 'auto',
        review_stage: 'auto_check',
        result: status === 'passed' ? 'pass' : status === 'rejected' ? 'reject' : 'needs_revision',
        notes: `总分 ${totalRounded}, 等级 ${grade}, 硬性门槛 ${allHardGatesPass ? '通过' : '不通过'}`
      });
      if (status === 'needs_revision') {
        window.DB.reviews.put({
          novel_id: novel.novel.id,
          reviewer_type: 'ai',
          review_stage: 'ai_evaluation',
          result: 'needs_revision',
          notes: `综合分 ${totalRounded}（C级），需作者修改`
        });
      }
    }

    return { report, wc, cmp, ai, narr, char, lit, hardGates, allHardGatesPass };
  }

  function variance(chapters) {
    if (chapters.length === 0) return 0;
    const lens = chapters.map(c => (c.text || '').length);
    const mean = lens.reduce((s, n) => s + n, 0) / lens.length;
    return lens.reduce((s, n) => s + (n - mean) ** 2, 0) / lens.length;
  }

  // ====== 工具：格式化分数 ======
  function fmtScore(s, max = 5) {
    const fill = Math.round((s / max) * 10);
    return '★'.repeat(fill) + '☆'.repeat(10 - fill) + ` ${s.toFixed(1)}/${max}`;
  }
  function gradeColor(grade) {
    return { S: '#7cf6c0', A: '#6ec6ff', B: '#f6a6d8', C: '#ffd980', D: '#ff7e8a' }[grade] || '#fff';
  }
  function statusLabel(status) {
    return {
      passed: { label: '✅ 通过', color: '#7cf6c0' },
      needs_revision: { label: '⚠ 需修改', color: '#ffd980' },
      rejected: { label: '❌ 驳回', color: '#ff7e8a' },
      pending: { label: '⏳ 待审核', color: '#8b7cf6' }
    }[status] || { label: status, color: '#fff' };
  }

  // ====== 工具：报告格式化（用于 UI） ======
  function buildReportCard(evalResult) {
    const { report, wc, cmp, ai, narr, char, lit, allHardGatesPass } = evalResult;
    const sl = statusLabel(report.status);
    return {
      totalScore: report.total_score,
      grade: report.grade,
      gradeColor: gradeColor(report.grade),
      statusLabel: sl.label,
      statusColor: sl.color,
      dimensions: [
        { name: '叙事质量', score: report.narrative_score, weight: 30, detail: narr },
        { name: '角色质量', score: report.character_score, weight: 25, detail: char },
        { name: '文学质量', score: report.literary_score, weight: 20, detail: lit },
        { name: 'AI 味检测', score: 5 - report.ai_flavor_score * 0.1, weight: 15, detail: ai, inverted: true },
        { name: '合规性', score: report.compliance_status === 'pass' ? 5 : 0, weight: 10, detail: cmp }
      ],
      hardGates: [
        { name: '合规性', passed: cmp.passed, detail: cmp.hits.length === 0 ? '无敏感词' : `命中 ${cmp.hits.join('、')}` },
        { name: 'AI 味', passed: ai.score <= 40, detail: `${ai.score} / 40` },
        { name: '伏笔兑现', passed: narr.payoff >= 0.6, detail: `${(narr.payoff*100).toFixed(0)}% / 60%` },
        { name: '字数', passed: wc.tier?.tier !== 'too_short', detail: `${wc.chars} 字` }
      ],
      allHardGatesPass,
      rejectionReasons: report.rejection_reasons,
      improvements: report.improvement_suggestions,
      wordCount: wc
    };
  }

  window.QualityReview = {
    evaluate, evalWordCount, evalCompliance, evalAIFlavor, evalNarrative, evalCharacter, evalLiterary,
    buildReportCard, fmtScore, gradeColor, statusLabel,
    WORD_LIMITS, SENSITIVE_WORDS, AI_PHRASES
  };
  console.log('[v5.14] QualityReview 加载完成 · 5 维度评估 · S/A/B/C/D 等级');
})();