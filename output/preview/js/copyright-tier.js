/* v5.14 — 版权分层自动判定引擎
   输入：novel 数据 + AI 使用统计
   输出：4 级版权分层（L1 AI辅助 / L2 人机协作 / L3 作者主导 / L4 纯人工）
   判定指标：4 个（AI 占比、修改率、表格完整度、AI 提问使用率）
   定价：4 套（导出 + 商用）
   证书：根据层级动态生成文本
*/
(function () {
  if (window.CopyrightTier) return;

  // ====== 4 级定价表 ======
  const TIER_PRICING = {
    'L1': { tier: 'L1', name: 'AI 辅助',   export: 50,    commercial: 2000, color: '#ff7e8a', badge: 'AI ASSISTED' },
    'L2': { tier: 'L2', name: '人机协作',  export: 30,    commercial: 1000, color: '#f6a6d8', badge: 'HUMAN + AI' },
    'L3': { tier: 'L3', name: '作者主导',  export: 0,     commercial: 500,  color: '#6ec6ff', badge: 'AUTHOR LED' },
    'L4': { tier: 'L4', name: '纯人工',    export: 0,     commercial: 0,    color: '#7cf6c0', badge: 'PURE HUMAN' }
  };

  // ====== 4 个指标 ======
  /**
   * 计算作品的版权分层指标
   * @param {Object} novel - 小说对象（必须有 chars、chapters、nodes、endings、audit）
   * @param {Object} aiStats - AI 使用统计 {aiGeneratedChars, authorModifiedChars, totalChars, tableFieldsFilled, totalTableFields, aiQuestionCount, totalFillCount}
   * @returns {Object} {ai_generated_ratio, author_modified_ratio, table_completion_ratio, ai_question_usage_ratio, totalChars, ...}
   */
  function calcMetrics(novel, aiStats = {}) {
    // 统计总字数（所有章节文本）
    const chapters = novel.novel?.chapters || [];
    const totalChars = chapters.reduce((s, c) => s + (c.text?.length || 0), 0);
    // AI 生成字数（默认 = 总字数 - 作者修改字数 - 作者原写字数）
    const aiGen = aiStats.aiGeneratedChars ?? Math.floor(totalChars * 0.6);  // mock 默认 60%
    const authorMod = aiStats.authorModifiedChars ?? Math.floor(totalChars * 0.15);  // mock 默认 15%
    // 表格完整度
    const filled = aiStats.tableFieldsFilled ?? 18;
    const total = aiStats.totalTableFields ?? 22;
    // AI 提问使用率
    const aiQ = aiStats.aiQuestionCount ?? 0;
    const fillN = aiStats.totalFillCount ?? Math.max(filled, 1);

    return {
      ai_generated_ratio: totalChars > 0 ? +(aiGen / totalChars).toFixed(3) : 0,
      author_modified_ratio: totalChars > 0 ? +(authorMod / totalChars).toFixed(3) : 0,
      table_completion_ratio: total > 0 ? +(filled / total).toFixed(3) : 0,
      ai_question_usage_ratio: +(aiQ / fillN).toFixed(3),
      totalChars,
      aiGen,
      authorMod,
      tableFieldsFilled: filled,
      totalTableFields: total,
      aiQuestionCount: aiQ,
      totalFillCount: fillN
    };
  }

  // ====== 4 级判定规则 ======
  /**
   * 根据 4 个指标自动判定层级
   */
  function judgeTier(metrics) {
    const { ai_generated_ratio, author_modified_ratio } = metrics;
    if (ai_generated_ratio < 0.10) {
      return 'L4';  // 纯人工：AI 占比 < 10%
    } else if (ai_generated_ratio < 0.40 && author_modified_ratio > 0.50) {
      return 'L3';  // 作者主导：AI<40% + 修改>50%
    } else if (ai_generated_ratio >= 0.40 && ai_generated_ratio <= 0.70
            && author_modified_ratio >= 0.20 && author_modified_ratio <= 0.50) {
      return 'L2';  // 人机协作
    } else if (ai_generated_ratio > 0.70 && author_modified_ratio < 0.20) {
      return 'L1';  // AI 辅助
    } else {
      // 边界 case：取最接近的一档
      if (ai_generated_ratio > 0.55) return 'L2';
      if (author_modified_ratio > 0.40) return 'L3';
      return 'L1';
    }
  }

  // ====== 版权证书文本生成 ======
  function buildCertificate(tier, metrics, novel) {
    const pct = (n) => (n * 100).toFixed(1) + '%';
    const title = novel?.title || '本作品';
    const t = TIER_PRICING[tier];
    const ts = new Date().toLocaleString('zh-CN');

    const templates = {
      L1: `《${title}》版权确权证书 · L1·AI 辅助

本作品由作者在灵境平台使用 AI 辅助工具创作。
AI 生成内容占比约 ${pct(metrics.ai_generated_ratio)}，作者修改占比约 ${pct(metrics.author_modified_ratio)}，表格填写完整度 ${pct(metrics.table_completion_ratio)}。

版权归属：作者拥有使用权，平台不主张版权归属。
商用建议：如需商用，建议进行实质性修改以增强独创性，建议由专业版权律师评估。
导出价格：${t.export} 灵晶 | 商用授权：${t.commercial} 灵晶
签发时间：${ts}
灵境平台版权核验章`,

      L2: `《${title}》版权确权证书 · L2·人机协作

本作品由作者与 AI 协作完成。
AI 生成内容占比约 ${pct(metrics.ai_generated_ratio)}，作者修改占比约 ${pct(metrics.author_modified_ratio)}，体现了显著的"人类独创性智力投入"。

版权归属：作者拥有著作权，平台提供工具支持。
商用说明：可商用，但建议保留人类创作比例说明。
导出价格：${t.export} 灵晶 | 商用授权：${t.commercial} 灵晶
签发时间：${ts}
灵境平台版权核验章`,

      L3: `《${title}》版权确权证书 · L3·作者主导

本作品由作者主导创作，AI 仅做格式化与质量检查。
AI 生成内容占比约 ${pct(metrics.ai_generated_ratio)}，作者原创占比约 ${pct(1 - metrics.ai_generated_ratio)}，修改率 ${pct(metrics.author_modified_ratio)}。

版权归属：作者拥有完整著作权，平台无任何创作主张。
商用说明：可自由商用，无需额外授权。
导出价格：${t.export === 0 ? '免费' : t.export + ' 灵晶'} | 商用授权：${t.commercial === 0 ? '免费' : t.commercial + ' 灵晶'}
签发时间：${ts}
灵境平台版权核验章`,

      L4: `《${title}》版权确权证书 · L4·纯人工

本作品由作者完全独立创作完成，AI 仅用于质量检测，未参与内容生成。
作者独立撰写内容占比 ${pct(1 - metrics.ai_generated_ratio)}，AI 占比 ${pct(metrics.ai_generated_ratio)}（仅检测润色）。

版权归属：作者拥有完整著作权，平台不主张任何权利。
商用说明：完全自由商用，平台不参与分润。
导出价格：免费 | 商用授权：免费
签发时间：${ts}
灵境平台版权核验章`
    };
    return templates[tier] || templates.L1;
  }

  // ====== 主函数：评估并落库 ======
  function evaluate(novel, aiStats = {}) {
    if (!novel || !novel.novel) throw new Error('[CopyrightTier] novel 参数无效');
    const metrics = calcMetrics(novel, aiStats);
    const tier = judgeTier(metrics);
    const pricing = TIER_PRICING[tier];
    const certificate = buildCertificate(tier, metrics, novel);

    const record = {
      id: window.DB?.uuid ? window.DB.uuid() : 'ct-' + Date.now(),
      novel_id: novel.novel.id,
      ai_generated_ratio: metrics.ai_generated_ratio,
      author_modified_ratio: metrics.author_modified_ratio,
      table_completion_ratio: metrics.table_completion_ratio,
      ai_question_usage_ratio: metrics.ai_question_usage_ratio,
      tier,
      tier_name: pricing.name,
      export_price: pricing.export,
      commercial_price: pricing.commercial,
      certificate_text: certificate,
      evaluated_at: window.DB?.now ? window.DB.now() : new Date().toISOString()
    };

    // 落库
    if (window.DB?.copyright?.put) {
      window.DB.copyright.put(record);
    }

    return {
      tier,
      tierName: pricing.name,
      exportPrice: pricing.export,
      commercialPrice: pricing.commercial,
      certificate,
      metrics,
      record
    };
  }

  // ====== 工具：获取已存在记录 ======
  function getByNovel(novelId) {
    if (!window.DB?.copyright?.queryBy) return null;
    const list = window.DB.copyright.queryBy('novel_id', novelId);
    return list.length > 0 ? list[list.length - 1] : null;
  }

  // ====== 工具：列出所有 4 级定价（用于 UI 展示） ======
  function listTiers() {
    return Object.values(TIER_PRICING);
  }

  // ====== 工具：解析价格显示 ======
  function formatPrice(price) {
    return price === 0 ? '免费' : `${price} 灵晶`;
  }

  window.CopyrightTier = {
    evaluate, calcMetrics, judgeTier, buildCertificate, getByNovel, listTiers, formatPrice,
    TIER_PRICING
  };
  console.log('[v5.14] CopyrightTier 加载完成 · 4 级分层');
})();