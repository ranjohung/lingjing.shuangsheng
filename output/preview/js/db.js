/* v5.17 — 统一数据层（17 张表 schema + localStorage 持久化）
   v5.14 11 张表：
     1. novel_copyright_tiers    — 版权分层记录
     2. adaptation_licenses      — 改编授权记录
     3. adaptation_revenue_records — 改编收益记录
     4. creator_monetization_points — 作者收费点
     5. creator_earnings          — 作者收益
     6. novel_quality_reports     — 质量评估报告
     7. novel_review_records      — 审核记录
     8. content_reports           — 侵权举报
     9. tax_records               — 税务记录
    10. aml_monitoring            — 反洗钱监控
    11. ai_helper_usage          — AI 辅助填表使用记录
   v5.17 新增 6 张（小说辅助模拟器）：
    12. novel_outline            — 大纲要素表（基础信息/世界格局/主线情节/章节细纲）
    13. character_profiles       — 人物小传（核心10要素+次要5要素+语言指纹）
    14. scene_cards              — 场景卡（场景三要素+目标/冲突/情绪/关键细节）
    15. dialogue_cards           — 对话场景卡（双方/场景/目标/关系/基调/关键信息）
    16. ai_questions             — AI 格外提问记录（12 类模板）
    17. foreshadowing_tracker    — 伏笔台账（编号/埋设/回收/类型/重要度/状态）
   抽象层：window.DB.{table}.{list/get/put/delete/query}
   持久化：localStorage 优先，IndexedDB 镜像（保留接口供日后接入）
*/
(function () {
  if (window.DB) return;

  const PREFIX = 'lingjing_v517_';
  const VERSION = 'v5.18.0-V17G';

  // ====== 11 张表 schema ======
  const SCHEMAS = {
    novel_copyright_tiers: {
      key: 'id',
      fields: ['id', 'novel_id', 'ai_generated_ratio', 'author_modified_ratio',
               'table_completion_ratio', 'ai_question_usage_ratio',
               'tier', 'tier_name', 'export_price', 'commercial_price',
               'certificate_text', 'evaluated_at', 'created_at']
    },
    adaptation_licenses: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'license_type', 'license_level',
               'licensee_name', 'license_fee', 'creator_share_ratio', 'platform_service_fee_ratio',
               'license_start', 'license_end', 'status', 'contract_file_url', 'created_at', 'updated_at']
    },
    adaptation_revenue_records: {
      key: 'id',
      fields: ['id', 'license_id', 'revenue_type', 'gross_amount',
               'creator_share', 'platform_share', 'recorded_at']
    },
    creator_monetization_points: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'point_type', 'point_name',
               'point_description', 'price', 'trigger_condition', 'effect',
               'is_active', 'created_at', 'updated_at']
    },
    creator_earnings: {
      key: 'id',
      fields: ['id', 'creator_id', 'novel_id', 'source_type', 'source_id',
               'gross_amount', 'platform_share', 'creator_share',
               'status', 'created_at']
    },
    novel_quality_reports: {
      key: 'id',
      fields: ['id', 'novel_id', 'narrative_score', 'character_score', 'literary_score',
               'ai_flavor_score', 'compliance_status', 'word_count', 'foreshadow_payoff_rate',
               'total_score', 'grade', 'status', 'rejection_reasons', 'improvement_suggestions',
               'evaluated_at', 'created_at']
    },
    novel_review_records: {
      key: 'id',
      fields: ['id', 'novel_id', 'reviewer_type', 'reviewer_id', 'review_stage',
               'result', 'notes', 'created_at']
    },
    content_reports: {
      key: 'id',
      fields: ['id', 'target_novel_id', 'reporter_id', 'report_type', 'description',
               'evidence_url', 'priority', 'status', 'handled_by', 'handled_at', 'created_at']
    },
    tax_records: {
      key: 'id',
      fields: ['id', 'payer_id', 'related_novel_id', 'tax_type', 'taxable_amount',
               'tax_rate', 'tax_amount', 'period', 'created_at']
    },
    aml_monitoring: {
      key: 'id',
      fields: ['id', 'user_id', 'transaction_type', 'amount', 'risk_score',
               'trigger_reason', 'status', 'reviewed_by', 'created_at']
    },
    ai_helper_usage: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'field_key', 'field_category',
               'generated_count', 'accepted_count', 'modified_count',
               'created_at', 'updated_at']
    },
    // ===== v5.17 新增 6 张表（小说辅助模拟器） =====
    novel_outline: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'section', 'field_key', 'field_label',
               'field_category', 'value', 'ai_generated', 'ai_modified', 'human_filled',
               'order_idx', 'created_at', 'updated_at']
    },
    character_profiles: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'character_name', 'character_role',
               'is_core', 'gender', 'age', 'appearance', 'personality_strengths',
               'personality_weaknesses', 'family', 'romantic_history', 'social_class',
               'habits', 'growth', 'minor_relation', 'minor_personality',
               'minor_background', 'minor_role', 'voice_style', 'voice_catchphrase',
               'voice_sentence_len', 'voice_common_words', 'voice_never_says',
               'created_at', 'updated_at']
    },
    scene_cards: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'scene_no', 'scene_title',
               'location', 'time_setting', 'characters_present', 'scene_goal',
               'core_conflict', 'scene_type', 'emotion_curve_start', 'emotion_curve_end',
               'key_details', 'scene_ending', 'linked_foreshadowing', 'created_at', 'updated_at']
    },
    dialogue_cards: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'scene_no', 'speaker_a', 'speaker_b',
               'scene_context', 'dialogue_goal', 'relationship', 'emotion_tone',
               'key_info', 'principle_oral', 'principle_subtext', 'principle_voice',
               'principle_brevity', 'principle_useful', 'created_at', 'updated_at']
    },
    ai_questions: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'question_type', 'target_ref',
               'question_text', 'options_json', 'recommendation', 'explanation',
               'accepted_version', 'created_at']
    },
    foreshadowing_tracker: {
      key: 'id',
      fields: ['id', 'novel_id', 'creator_id', 'foreshadow_id', 'content',
               'planted_chapter', 'expected_recover_chapter', 'foreshadow_type',
               'importance', 'status', 'recovered_chapter', 'created_at', 'updated_at']
    },
    // ===== v5.20 新增 4 张表（心屿 · 陪伴功能区） =====
    heart_island_characters: {
      key: 'id',
      fields: ['id', 'user_id', 'character_id', 'character_name', 'character_avatar',
               'personality_json', 'source_type', 'source_world_id', 'source_novel_id',
               'dual_status', 'intimacy_level', 'intimacy_stage',
               'trust', 'intimacy', 'familiarity', 'respect', 'attraction',
               'understanding', 'shared_history',
               'voice_id', 'daily_attitude', 'cover_gradient',
               'is_active', 'last_interaction_at', 'created_at', 'updated_at']
    },
    dual_soul_bringout_records: {
      key: 'id',
      fields: ['id', 'user_id', 'character_id', 'character_name',
               'source_world_id', 'source_novel_id',
               'brought_out_at', 'bring_out_cost', 'intimacy_at_bringout',
               'dual_status', 'memory_synced',
               'unlocked_skins', 'unlocked_cg', 'unlocked_voicepacks',
               'created_at', 'updated_at']
    },
    daily_interactions: {
      key: 'id',
      fields: ['id', 'user_id', 'character_id', 'interaction_type',
               'content', 'duration_seconds', 'intimacy_gain',
               'mood_before', 'mood_after', 'location', 'created_at']
    },
    proactive_behaviors: {
      key: 'id',
      fields: ['id', 'character_id', 'user_id', 'behavior_type',
               'content', 'is_read', 'read_at',
               'trigger_source', 'created_at']
    },
    // ===== V17-G 创作者分成阶梯（追加 2 张表） =====
    creator_tiers: {
      key: 'id',
      fields: ['id', 'tier_code', 'tier_name', 'tier_emoji', 'share_ratio',
               'threshold_revenue', 'threshold_word_count', 'threshold_rating',
               'threshold_months', 'threshold_other',
               'privileges', 'obligations', 'evaluation_period', 'created_at']
    },
    creator_tier_history: {
      key: 'id',
      fields: ['id', 'creator_id', 'from_tier', 'to_tier', 'change_type',
               'reason', 'evidence', 'effective_at', 'created_at']
    }
  };

  // ====== V17-G 创作者分成阶梯种子数据（5 档） ======
  const SEED_CREATOR_TIERS = [
    {
      id: 'tier-L1-bronze', tier_code: 'L1', tier_name: '青铜创作者', tier_emoji: '🥉',
      share_ratio: 50,
      threshold_revenue: 0, threshold_word_count: 0, threshold_rating: 0,
      threshold_months: 0, threshold_other: '注册创作者 + 发布 1 部作品',
      privileges: '平台基础曝光 / 收益结算 / 社区基础权限',
      obligations: '遵守平台创作规范 / 不得违规发布',
      evaluation_period: '即时（注册即生效）',
      created_at: now()
    },
    {
      id: 'tier-L2-silver', tier_code: 'L2', tier_name: '白银创作者', tier_emoji: '🥈',
      share_ratio: 60,
      threshold_revenue: 50000, threshold_word_count: 80000, threshold_rating: 7.5,
      threshold_months: 0, threshold_other: '累计流水 ≥ 500 元 + 完本或稳定连载',
      privileges: '优先客服 / 作品专题页推荐 / 数据看板',
      obligations: '保持稳定更新（每月 ≥ 1 万字）/ 不得断更超过 14 天',
      evaluation_period: '每月 1 日',
      created_at: now()
    },
    {
      id: 'tier-L3-gold', tier_code: 'L3', tier_name: '黄金创作者', tier_emoji: '🥇',
      share_ratio: 70,
      threshold_revenue: 200000, threshold_word_count: 150000, threshold_rating: 8.0,
      threshold_months: 0, threshold_other: '月流水 ≥ 2000 元 + 评分 ≥ 8.0 + 独家发布',
      privileges: '首页推荐位 / 专属编辑对接 / 灵玉月福利',
      obligations: '独家发布 / 不得在竞品平台同步更新 / 配合平台活动',
      evaluation_period: '每月 1 日 + 季度复评',
      created_at: now()
    },
    {
      id: 'tier-L4-diamond', tier_code: 'L4', tier_name: '钻石创作者', tier_emoji: '💎',
      share_ratio: 75,
      threshold_revenue: 500000, threshold_word_count: 300000, threshold_rating: 8.5,
      threshold_months: 3, threshold_other: '稳定更新 3 个月 + 阅读时长 ≥ 30 分钟 + 无违规',
      privileges: '创作者沙龙 / 改编优先权 / 灵晶季度大奖 / VIP 客服',
      obligations: '稳定更新 3 个月 / 阅读均时长 ≥ 30 分钟 / 严格零违规',
      evaluation_period: '每月 1 日 + 季度复评 + 年度签约',
      created_at: now()
    },
    {
      id: 'tier-L5-legend', tier_code: 'L5', tier_name: '传奇创作者', tier_emoji: '🏆',
      share_ratio: 80,
      threshold_revenue: 1000000, threshold_word_count: 500000, threshold_rating: 9.0,
      threshold_months: 6, threshold_other: '平台主动签约 + 独家 + 月更新 ≥ 5 万字 + 完本承诺 + 版权授权清晰',
      privileges: '保底收入 / 影视改编直通 / IP 孵化 / 年度盛典席位',
      obligations: '月更新 ≥ 5 万字 / 完本承诺 / 配合平台运营 / 版权授权清晰',
      evaluation_period: '年度签约评审',
      created_at: now()
    }
  ];

  // ====== 工具：UUID + 时间 ======
  function uuid() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function now() { return new Date().toISOString(); }

  // ====== localStorage 读写 ======
  function readTable(name) {
    try {
      const raw = localStorage.getItem(PREFIX + name);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) { console.warn('[DB] read fail', name, e); return []; }
  }
  function writeTable(name, rows) {
    try { localStorage.setItem(PREFIX + name, JSON.stringify(rows)); }
    catch (e) { console.error('[DB] write fail', name, e); }
  }

  // ====== 通用 CRUD ======
  function list(name) {
    const schema = SCHEMAS[name];
    if (!schema) throw new Error('[DB] unknown table: ' + name);
    return readTable(name);
  }
  function get(name, id) {
    const schema = SCHEMAS[name];
    if (!schema) throw new Error('[DB] unknown table: ' + name);
    return readTable(name).find(r => r[schema.key] === id) || null;
  }
  function query(name, filterFn) {
    return list(name).filter(filterFn);
  }
  function queryByField(name, field, value) {
    return list(name).filter(r => r[field] === value);
  }
  function put(name, row) {
    const schema = SCHEMAS[name];
    if (!schema) throw new Error('[DB] unknown table: ' + name);
    const rows = readTable(name);
    const existingIdx = row[schema.key] ? rows.findIndex(r => r[schema.key] === row[schema.key]) : -1;
    const now_iso = now();
    if (existingIdx >= 0) {
      // 更新
      const merged = { ...rows[existingIdx], ...row };
      if (schema.fields.includes('updated_at')) merged.updated_at = now_iso;
      rows[existingIdx] = merged;
      writeTable(name, rows);
      return merged;
    } else {
      // 新建
      const created = { ...row };
      if (!created[schema.key]) created[schema.key] = uuid();
      if (schema.fields.includes('created_at') && !created.created_at) created.created_at = now_iso;
      if (schema.fields.includes('updated_at') && !created.updated_at) created.updated_at = now_iso;
      rows.push(created);
      writeTable(name, rows);
      return created;
    }
  }
  function remove(name, id) {
    const schema = SCHEMAS[name];
    if (!schema) throw new Error('[DB] unknown table: ' + name);
    const rows = readTable(name);
    const filtered = rows.filter(r => r[schema.key] !== id);
    writeTable(name, filtered);
    return filtered.length !== rows.length;
  }
  function clear(name) { writeTable(name, []); }
  function count(name) { return list(name).length; }
  // 批量
  function putBatch(name, rows) {
    const all = list(name);
    const merged = [...all];
    for (const r of rows) {
      const idx = r[SCHEMAS[name].key] ? merged.findIndex(x => x[SCHEMAS[name].key] === r[SCHEMAS[name].key]) : -1;
      if (idx >= 0) merged[idx] = { ...merged[idx], ...r };
      else merged.push(r);
    }
    writeTable(name, merged);
  }

  // ====== 初始化 + 元信息 ======
  function info() {
    return {
      version: VERSION,
      tables: Object.keys(SCHEMAS).map(n => ({
        name: n,
        count: count(n),
        key: SCHEMAS[n].key,
        fields: SCHEMAS[n].fields.length
      }))
    };
  }
  function reset() {
    Object.keys(SCHEMAS).forEach(n => clear(n));
    console.log('[DB] 已清空所有表');
  }

  // ====== 暴露 API ======
  const ALIAS_MAP = {
    copyright: 'novel_copyright_tiers',
    licenses: 'adaptation_licenses',
    licenseRevenues: 'adaptation_revenue_records',
    monetization: 'creator_monetization_points',
    earnings: 'creator_earnings',
    quality: 'novel_quality_reports',
    reviews: 'novel_review_records',
    reports: 'content_reports',
    tax: 'tax_records',
    aml: 'aml_monitoring',
    aiUsage: 'ai_helper_usage',
    // v5.17 新增别名（语义化，更易记）
    outline: 'novel_outline',
    profile: 'character_profiles',
    scene: 'scene_cards',
    dialogue: 'dialogue_cards',
    question: 'ai_questions',
    foreshadow: 'foreshadowing_tracker',
    // V17-G 创作者分成阶梯
    tiers: 'creator_tiers',
    tierHistory: 'creator_tier_history'
  };

  function buildTableAPI(tableName) {
    return {
      list: () => list(tableName),
      get: (id) => get(tableName, id),
      put: (row) => put(tableName, row),
      remove: (id) => remove(tableName, id),
      query: (filterFn) => query(tableName, filterFn),
      queryBy: (field, value) => queryByField(tableName, field, value),
      count: () => count(tableName),
      clear: () => clear(tableName),
      putBatch: (rows) => putBatch(tableName, rows)
    };
  }

  const API = {};
  for (const tbl of Object.keys(SCHEMAS)) {
    API[tbl] = buildTableAPI(tbl);
  }
  // 暴露别名（语义化）
  for (const [alias, tbl] of Object.entries(ALIAS_MAP)) {
    API[alias] = buildTableAPI(tbl);
  }

  window.DB = {
    ...API,
    _schemas: SCHEMAS,
    _version: VERSION,
    info, reset,
    uuid, now
  };

  // ====== V17-G 种子初始化（首次访问自动写入） ======
  if (!readTable('creator_tiers').length) {
    writeTable('creator_tiers', SEED_CREATOR_TIERS);
    console.log('[V17-G] 创作者分成阶梯 5 档种子数据已写入');
  }

  console.log('[v5.18-V17G] DB 加载完成 · 19 表 schema（含 creator_tiers + tier_history）· localStorage 持久化');
})();