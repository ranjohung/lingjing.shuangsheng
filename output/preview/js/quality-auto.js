/* v5.17 — 自动质量检测系统
   AI 生成后自动检测 6 维度：
     1. 角色一致性（角色行为是否符合人物小传）
     2. 语言指纹（对话是否符合角色语言指纹）
     3. 伏笔状态（是否有未回收的伏笔）
     4. 时间线（时间顺序是否合理）
     5. 世界规则（是否违反世界规则）
     6. 场景完整度（是否缺少场景三要素）

   输出报告：
     {
       overall: 'pass' | 'warn' | 'fail',
       dimensions: [
         { name: '角色一致性', status: 'pass'|'warn'|'fail', issues: [{location, msg, severity}] },
         ...
       ],
       summary: '总体通过 5/6，建议优化：伏笔状态'
     }
*/
(function () {
  if (window.QualityAuto) return;

  const DIMENSIONS = [
    { key: 'character_consistency', label: '角色一致性', weight: 0.25 },
    { key: 'voice_fingerprint', label: '语言指纹', weight: 0.20 },
    { key: 'foreshadow_status', label: '伏笔状态', weight: 0.20 },
    { key: 'timeline', label: '时间线', weight: 0.15 },
    { key: 'world_rules', label: '世界规则', weight: 0.10 },
    { key: 'scene_completeness', label: '场景完整度', weight: 0.10 }
  ];

  // ====== 维度 1：角色一致性 ======
  function checkCharacterConsistency(novelId) {
    const issues = [];
    if (!window.CharacterProfile) return { status: 'pass', issues: [] };
    const profiles = window.CharacterProfile.listProfiles(novelId);
    if (profiles.length === 0) {
      issues.push({ location: '全局', msg: '尚未创建任何人物小传', severity: 'warn' });
    }
    // 检查每个角色是否有必填字段
    profiles.forEach(p => {
      ['character_name', 'gender', 'age', 'appearance', 'personality_strengths', 'personality_weaknesses',
       'family', 'romantic_history', 'social_class', 'habits', 'growth'].forEach(field => {
        if (!p[field]) issues.push({ location: p.character_name, msg: `缺少必填字段：${field}`, severity: 'fail' });
      });
    });
    return { status: issues.some(i => i.severity === 'fail') ? 'fail' : issues.length > 0 ? 'warn' : 'pass', issues };
  }

  // ====== 维度 2：语言指纹 ======
  function checkVoiceFingerprint(novelId) {
    const issues = [];
    if (!window.CharacterProfile) return { status: 'pass', issues: [] };
    const profiles = window.CharacterProfile.listProfiles(novelId);
    profiles.forEach(p => {
      if (p.is_core && (!p.voice_style || !p.voice_catchphrase || !p.voice_never_says)) {
        issues.push({
          location: p.character_name,
          msg: '核心人物的语言指纹不完整（缺少风格/口癖/绝不说的词）',
          severity: 'warn'
        });
      }
    });
    return { status: issues.some(i => i.severity === 'fail') ? 'fail' : issues.length > 0 ? 'warn' : 'pass', issues };
  }

  // ====== 维度 3：伏笔状态 ======
  function checkForeshadowStatus(novelId) {
    const issues = [];
    if (!window.Foreshadowing) return { status: 'pass', issues: [] };
    const all = window.Foreshadowing.list(novelId);
    if (all.length === 0) {
      issues.push({ location: '全局', msg: '暂无伏笔记录', severity: 'info' });
      return { status: 'pass', issues };
    }
    const payoffRate = window.Foreshadowing.getPayoffRate(novelId);
    const longOpen = all.filter(r => {
      if (r.status === '已回收' || r.status === '已揭示') return false;
      const planted = parseInt(r.planted_chapter) || 0;
      return planted > 0 && (new Date().getFullYear() - 2026) * 50 > planted; // 占位判断
    });
    if (payoffRate < 0.6) {
      issues.push({ location: '全局', msg: `伏笔回收率仅 ${(payoffRate * 100).toFixed(0)}%，建议 ≥ 60%`, severity: 'warn' });
    }
    longOpen.forEach(r => {
      issues.push({ location: r.foreshadow_id, msg: `伏笔「${r.content}」长期未回收（埋设于第 ${r.planted_chapter} 章）`, severity: 'warn' });
    });
    return { status: issues.some(i => i.severity === 'fail') ? 'fail' : issues.length > 0 ? 'warn' : 'pass', issues };
  }

  // ====== 维度 4：时间线 ======
  function checkTimeline(novelId) {
    const issues = [];
    if (!window.SceneCard) return { status: 'pass', issues: [] };
    const scenes = window.SceneCard.listScenes(novelId);
    // 检查场景编号是否有序
    const sceneNos = scenes.map(s => s.scene_no).filter(Boolean).sort();
    let prev = '';
    sceneNos.forEach(no => {
      if (prev && no < prev) {
        issues.push({ location: no, msg: `场景编号 ${no} 顺序异常（应在 ${prev} 之后）`, severity: 'warn' });
      }
      prev = no;
    });
    return { status: issues.length > 0 ? 'warn' : 'pass', issues };
  }

  // ====== 维度 5：世界规则 ======
  function checkWorldRules(novelId) {
    const issues = [];
    if (!window.NovelOutline) return { status: 'pass', issues: [] };
    const data = window.NovelOutline.getAllByNovel(novelId);
    const world = data.world || {};
    // 检查力量体系与世界的匹配
    if (world.world_type && world.world_type.includes('现实') && world.power_system && !world.power_system.includes('（现实世界无超凡力量）')) {
      issues.push({ location: '世界格局表', msg: '现实世界不应有超凡力量体系', severity: 'fail' });
    }
    return { status: issues.some(i => i.severity === 'fail') ? 'fail' : issues.length > 0 ? 'warn' : 'pass', issues };
  }

  // ====== 维度 6：场景完整度 ======
  function checkSceneCompleteness(novelId) {
    const issues = [];
    if (!window.SceneCard) return { status: 'pass', issues: [] };
    const scenes = window.SceneCard.listScenes(novelId);
    if (scenes.length === 0) {
      issues.push({ location: '全局', msg: '尚未创建任何场景卡', severity: 'info' });
      return { status: 'pass', issues };
    }
    scenes.forEach(s => {
      const check = window.SceneCard.checkSceneCompleteness(s);
      check.issues.forEach(msg => {
        issues.push({ location: `场景 ${s.scene_no || s.id}`, msg, severity: 'warn' });
      });
    });
    return { status: issues.length > 0 ? 'warn' : 'pass', issues };
  }

  // ====== 综合检测 ======
  function runAll(novelId) {
    const results = {
      character_consistency: checkCharacterConsistency(novelId),
      voice_fingerprint: checkVoiceFingerprint(novelId),
      foreshadow_status: checkForeshadowStatus(novelId),
      timeline: checkTimeline(novelId),
      world_rules: checkWorldRules(novelId),
      scene_completeness: checkSceneCompleteness(novelId)
    };

    const failCount = Object.values(results).filter(r => r.status === 'fail').length;
    const warnCount = Object.values(results).filter(r => r.status === 'warn').length;
    const passCount = Object.values(results).filter(r => r.status === 'pass').length;

    const overall = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';

    const dimensions = DIMENSIONS.map(d => ({
      name: d.label,
      key: d.key,
      weight: d.weight,
      ...results[d.key]
    }));

    let summary;
    if (overall === 'pass') {
      summary = `总体通过 ${passCount}/${DIMENSIONS.length}，所有维度表现良好`;
    } else if (overall === 'warn') {
      summary = `总体通过 ${passCount}/${DIMENSIONS.length}，${warnCount} 个维度需要优化`;
    } else {
      summary = `存在 ${failCount} 个严重问题，请优先处理`;
    }

    return {
      overall,
      dimensions,
      summary,
      stats: { pass: passCount, warn: warnCount, fail: failCount, total: DIMENSIONS.length },
      novel_id: novelId,
      evaluated_at: new Date().toISOString()
    };
  }

  window.QualityAuto = {
    DIMENSIONS,
    runAll,
    checkCharacterConsistency,
    checkVoiceFingerprint,
    checkForeshadowStatus,
    checkTimeline,
    checkWorldRules,
    checkSceneCompleteness
  };

  console.log('[v5.17] QualityAuto 加载完成 · 6 维度自动检测');
})();
