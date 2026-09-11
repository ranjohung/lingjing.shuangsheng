
function renderV17GTier() {
  if (!window.LJTier) return;
  // mock 当前创作者数据
  var metrics = { totalRevenue: 320000, totalWords: 180000, avgRating: 8.2, stableMonths: 2, hasViolation: false };
  var tiers = window.LJTier.getAll();
  var current = window.LJTier.calcTier(metrics);
  var currentIdx = 0;
  for (var i = 0; i < tiers.length; i++) if (tiers[i].tier_code === current.tier_code) currentIdx = i;
  var progress = window.LJTier.getProgress(current.tier_code, metrics);
  var thresholdText = window.LJTier.formatThreshold(current);

  var cur = document.getElementById('v17g-current-card');
  if (cur) {
    var next = currentIdx < tiers.length - 1 ? tiers[currentIdx + 1] : null;
    var nextHint = next ? ('距 L' + next.tier_code.slice(1) + ' ' + next.tier_name + ' 还差 ' + (progress < 100 ? ((100 - progress) + '% 进度') : '已满足，待复评')) : '已达顶级，享受 80% 分成';
    cur.innerHTML = '' +
      '<div class="v17g-c-emoji">' + current.tier_emoji + '</div>' +
      '<div class="v17g-c-body">' +
        '<div class="v17g-c-name">L' + current.tier_code.slice(1) + ' · ' + current.tier_name + '</div>' +
        '<div class="v17g-c-meta">' + nextHint + ' · 考核周期：' + current.evaluation_period + '</div>' +
        '<div class="v17g-progress"><div style="width:' + progress + '%"></div></div>' +
      '</div>' +
      '<div class="v17g-c-share">' +
        '<div class="v">' + current.share_ratio + '%</div>' +
        '<div class="l">作者分成比例</div>' +
      '</div>';
  }

  var ladder = document.getElementById('v17g-ladder');
  if (ladder) {
    ladder.innerHTML = '';
    for (var j = 0; j < tiers.length; j++) {
      var t = tiers[j];
      var klass = j === currentIdx ? 'current' : (j < currentIdx ? 'passed' : 'locked');
      var badge = j === currentIdx ? '<span class="badge">当前</span>' : (j < currentIdx ? '<span class="badge" style="background:#4ECCA3;color:#fff;">已过</span>' : '');
      var card = document.createElement('div');
      card.className = 'v17g-lt ' + klass;
      card.innerHTML = badge +
        '<span class="emoji">' + t.tier_emoji + '</span>' +
        '<div class="name">L' + t.tier_code.slice(1) + ' · ' + t.tier_name + '</div>' +
        '<div class="ratio">' + t.share_ratio + '%</div>' +
        '<div class="thresh">' + window.LJTier.formatThreshold(t) + '</div>';
      ladder.appendChild(card);
    }
  }
}
document.addEventListener('DOMContentLoaded', renderV17GTier);
(function () {
  let currentNovel = null;
  let currentNovelId = null;
  let currentCategory = '';

  // ====== 工具 ======
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  }
  function fmtPrice(n) { return n === 0 ? '免费' : `${n} 灵晶`; }

  // ====== 初始化 ======
  function init() {
    if (!window.DemoSeed) return;
    DemoSeed.ensure();
    renderNovelSelector();
    bindUI();
  }

  function renderNovelSelector() {
    const novels = (window.NovelStore?.listNovels?.() || []).concat([]);
    const sel = document.getElementById('novel-selector');
    if (novels.length === 0) {
      sel.innerHTML = '<div style="color:rgba(255,255,255,.5);font-size:13px;">尚无小说，请先 <a href="novel-upload.html" style="color:#ffd980;">上传小说</a> 或载入 demo</div>';
      return;
    }
    sel.innerHTML = novels.map(n => `
      <div class="selector-item" data-nid="${n.id}">
        ${escapeHtml(n.title)} <small style="color:rgba(255,255,255,.4);">(${escapeHtml(n.author)})</small>
      </div>
    `).join('');
    sel.querySelectorAll('.selector-item').forEach(el => {
      el.onclick = () => selectNovel(el.dataset.nid);
    });
    // 默认选第一个
    if (novels.length > 0) selectNovel(novels[0].id);
  }

  function selectNovel(nid) {
    currentNovelId = nid;
    currentNovel = window.NovelStore.loadNovel(nid);
    // V20-I 审查修复：null 防御（元素缺失时不再中断 renderAll）
    var curEl = document.getElementById('current-novel');
    if (curEl) curEl.textContent = currentNovel?.novel?.title || '—';
    // 标记 active
    document.querySelectorAll('.selector-item').forEach(el => {
      el.classList.toggle('active', el.dataset.nid === nid);
    });
    renderAll();
  }

  function bindUI() {
    // 分类 tab
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.onclick = () => {
        currentCategory = tab.dataset.cat;
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.toggle('active', t === tab));
        renderPointList();
      };
    });
    // 评估版权
    document.getElementById('btn-eval-copyright').onclick = () => {
      if (!currentNovel) return;
      const result = window.CopyrightTier.evaluate(currentNovel, { aiQuestionCount: 0 });
      renderTierGrid(result.record);
      renderCertificate(result);
      toast('已重新评估版权分层：' + result.tierName);
    };
    // 评估质量
    document.getElementById('btn-eval-quality').onclick = () => {
      if (!currentNovel) return;
      const result = window.QualityReview.evaluate(currentNovel);
      renderQuality(result);
      toast('已重新评估质量：' + result.report.grade + ' 级');
    };
    // 新建收费点
    document.getElementById('btn-add-point').onclick = openPointModal;
    // 新建改编授权
    document.getElementById('btn-add-license').onclick = openLicenseModal;
    // 提交上架
    document.getElementById('btn-submit-shelf').onclick = submitShelf;
  }

  // ====== 渲染：全部 ======
  function renderAll() {
    if (!currentNovel) return;
    // 1. 版权分层
    let cr = getCopyrightByNovel(currentNovelId);
    if (!cr) cr = window.CopyrightTier.evaluate(currentNovel).record;
    renderTierGrid(cr);
    renderCertificateFromRecord(cr);
    // 2. 收费点
    renderPointList();
    // 3. 收益
    renderEarnings();
    // 4. 质量
    const qualityReports = getQualityByNovel(currentNovelId);
    let quality = qualityReports.length > 0 ? qualityReports[qualityReports.length - 1] : null;
    if (!quality) {
      const r = window.QualityReview.evaluate(currentNovel);
      quality = r.report;
    }
    renderQualityFromReport(quality);
    // 5. 改编授权
    renderLicenses();
  }

  function getCopyrightByNovel(nid) {
    return window.CopyrightTier.getByNovel(nid);
  }
  function getQualityByNovel(nid) {
    if (!window.DB?.quality) return [];
    const all = window.DB.novel_quality_reports?.list?.() || window.DB._schemas?.novel_quality_reports ? (window.DB.quality && window.DB.quality.list ? window.DB.quality.list() : []) : [];
    return all.filter(r => r.novel_id === nid);
  }

  // ====== 渲染：版权分层 ======
  function renderTierGrid(record) {
    const grid = document.getElementById('tier-grid');
    const tiers = window.CopyrightTier.listTiers();
    const current = record?.tier || 'L1';
    grid.innerHTML = tiers.map(t => `
      <div class="tier-card ${t.tier === current ? 'current' : ''}" style="--tier-color:${t.color}">
        <div class="tier-badge">${t.badge}</div>
        <div class="tier-name">${escapeHtml(t.name)}</div>
        <div class="tier-rule">${tierRuleText(t.tier)}</div>
        <div class="tier-price">
          <div class="price-item">
            <div class="label">导出</div>
            <div class="value">${fmtPrice(t.export)}</div>
          </div>
          <div class="price-item">
            <div class="label">商用</div>
            <div class="value">${fmtPrice(t.commercial)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }
  function tierRuleText(t) {
    return {
      L1: 'AI 占比 > 70%，修改率 < 20%',
      L2: 'AI 占比 40-70%，修改率 20-50%',
      L3: 'AI 占比 < 40%，修改率 > 50%',
      L4: 'AI 占比 < 10%（基本无 AI 参与）'
    }[t] || '';
  }

  function renderCertificate(result) {
    document.getElementById('certificate-card').style.display = '';
    document.getElementById('certificate-text').textContent = result.certificate;
  }
  function renderCertificateFromRecord(record) {
    if (record && record.certificate_text) {
      document.getElementById('certificate-card').style.display = '';
      document.getElementById('certificate-text').textContent = record.certificate_text;
    }
  }

  // ====== 渲染：收费点 ======
  function renderPointList() {
    const list = document.getElementById('point-list');
    const points = window.Monetization.listPointsByNovel(currentNovelId)
      .filter(p => !currentCategory || window.Monetization.getTypeMeta(p.point_type)?.category === currentCategory);
    if (points.length === 0) {
      list.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:rgba(255,255,255,.45);font-size:13px;">还没有收费点，点击下方"+ 新建收费点"开始</div>`;
      return;
    }
    list.innerHTML = points.map(p => {
      const meta = window.Monetization.getTypeMeta(p.point_type);
      return `
        <div class="point-card ${p.is_active ? '' : 'inactive'}" data-pid="${p.id}">
          <div class="pc-head">
            <span class="pc-icon">${meta?.icon || '💎'}</span>
            <div class="pc-name">${escapeHtml(p.point_name)}</div>
            <div class="pc-price">${p.price} 💎</div>
          </div>
          <div class="pc-desc">${escapeHtml(p.point_description || meta?.desc || '')}</div>
          <div class="pc-meta">
            <span class="tag">${escapeHtml(meta?.name || p.point_type)}</span>
            <span class="tag">${p.is_active ? '上架' : '下架'}</span>
            ${p.id.includes('demo') ? '<span class="tag">演示</span>' : ''}
          </div>
          <div class="pc-actions">
            <button data-act="toggle">${p.is_active ? '下架' : '上架'}</button>
            <button data-act="edit">编辑</button>
            <button data-act="del" class="danger">删除</button>
          </div>
        </div>
      `;
    }).join('');
    list.querySelectorAll('.point-card').forEach(card => {
      const pid = card.dataset.pid;
      card.querySelectorAll('.pc-actions button').forEach(btn => {
        btn.onclick = () => {
          const act = btn.dataset.act;
          if (act === 'toggle') {
            window.Monetization.toggleActive(pid);
            renderPointList();
            toast('已更新状态');
          } else if (act === 'edit') {
            openPointModal(pid);
          } else if (act === 'del') {
            if (confirm('确定删除此收费点？')) {
              window.Monetization.deletePoint(pid);
              renderPointList();
              toast('已删除');
            }
          }
        };
      });
    });
  }

  // ====== 渲染：收益看板 ======
  function renderEarnings() {
    const board = window.Monetization.getEarningsBoard(currentNovel?.novel?.author || 'demo_author');
    const grid = document.getElementById('stats-grid');
    const detail = document.getElementById('earnings-detail');
    if (!board || board.totalCount === 0) {
      grid.innerHTML = `
        <div class="stat-card pending"><div class="label">总流水</div><div class="value">0 💎</div><div class="sub">尚无收入</div></div>
        <div class="stat-card settled"><div class="label">待结算</div><div class="value">0</div><div class="sub">作者分成</div></div>
        <div class="stat-card"><div class="label">已结算</div><div class="value">0</div><div class="sub">可提现</div></div>
        <div class="stat-card"><div class="label">交易笔数</div><div class="value">0</div><div class="sub">累计</div></div>
      `;
      detail.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,.4);">暂无收益记录（玩家购买收费点后会自动累计）</div>';
      return;
    }
    grid.innerHTML = `
      <div class="stat-card pending"><div class="label">总流水</div><div class="value">${board.totalGross} 💎</div><div class="sub">${board.totalCount} 笔交易</div></div>
      <div class="stat-card settled"><div class="label">待结算</div><div class="value">${board.pendingCreator} 💎</div><div class="sub">作者分成</div></div>
      <div class="stat-card"><div class="label">已结算</div><div class="value">${board.settledCreator} 💎</div><div class="sub">可提现</div></div>
      <div class="stat-card"><div class="label">平台抽成</div><div class="value">${board.totalGross - board.pendingCreator - board.settledCreator - board.withdrawnCreator} 💎</div><div class="sub">自动计入</div></div>
    `;
    detail.innerHTML = `
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,.1);">
          <th style="text-align:left;padding:6px;font-size:11px;color:rgba(255,255,255,.55);font-weight:500;">来源</th>
          <th style="text-align:right;padding:6px;font-size:11px;color:rgba(255,255,255,.55);font-weight:500;">总收益</th>
          <th style="text-align:right;padding:6px;font-size:11px;color:rgba(255,255,255,.55);font-weight:500;">作者分成</th>
          <th style="text-align:right;padding:6px;font-size:11px;color:rgba(255,255,255,.55);font-weight:500;">平台</th>
          <th style="text-align:right;padding:6px;font-size:11px;color:rgba(255,255,255,.55);font-weight:500;">状态</th>
        </tr></thead>
        <tbody>
          ${board.items.map(e => `
            <tr style="border-bottom:1px solid rgba(255,255,255,.04);">
              <td style="padding:6px;">${escapeHtml(e.source_type)}</td>
              <td style="text-align:right;padding:6px;color:#ffd980;">${e.gross_amount} 💎</td>
              <td style="text-align:right;padding:6px;color:#7cf6c0;">${e.creator_share} 💎</td>
              <td style="text-align:right;padding:6px;color:rgba(255,255,255,.5);">${e.platform_share} 💎</td>
              <td style="text-align:right;padding:6px;font-size:11px;color:rgba(255,255,255,.6);">${e.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ====== 渲染：质量报告 ======
  function renderQuality(evalResult) {
    renderQualityFromReport(evalResult.report);
  }
  function renderQualityFromReport(report) {
    document.getElementById('quality-grade').textContent = report.grade;
    document.getElementById('quality-grade').style.color = window.QualityReview.gradeColor(report.grade);
    document.getElementById('qi-score').textContent = `总分：${report.total_score} / 5.0`;
    const sl = window.QualityReview.statusLabel(report.status);
    document.getElementById('qi-status').innerHTML = `<span style="color:${sl.color};font-weight:600;">${sl.label}</span>`;
    document.getElementById('qi-meta').textContent = `字数：${report.word_count} · 伏笔兑现：${(report.foreshadow_payoff_rate*100).toFixed(0)}% · AI 味：${report.ai_flavor_score} · 合规：${report.compliance_status}`;

    // 5 维
    const dims = [
      { name: '叙事质量', score: report.narrative_score, weight: 30 },
      { name: '角色质量', score: report.character_score, weight: 25 },
      { name: '文学质量', score: report.literary_score, weight: 20 },
      { name: 'AI 味检测', score: 5 - report.ai_flavor_score * 0.1, weight: 15, inverted: true },
      { name: '合规性', score: report.compliance_status === 'pass' ? 5 : 0, weight: 10 }
    ];
    document.getElementById('dim-list').innerHTML = dims.map(d => `
      <div class="dim">
        <div class="dim-name">${d.name} <span class="weight">${d.weight}%</span></div>
        <div class="bar"><div class="bar-fill" style="width:${(d.score/5)*100}%;"></div></div>
        <div class="dim-score">${d.score.toFixed(1)} / 5.0</div>
      </div>
    `).join('');

    // 硬性门槛
    const gates = [
      { name: '合规性', passed: report.compliance_status === 'pass', detail: report.compliance_status === 'pass' ? '无敏感词' : '命中敏感词' },
      { name: 'AI 味 ≤40', passed: report.ai_flavor_score <= 40, detail: `${report.ai_flavor_score} / 40` },
      { name: '伏笔兑现 ≥60%', passed: report.foreshadow_payoff_rate >= 0.6, detail: `${(report.foreshadow_payoff_rate*100).toFixed(0)}% / 60%` },
      { name: '字数 ≥8000', passed: report.word_count >= 8000, detail: `${report.word_count} 字` }
    ];
    document.getElementById('gates-list').innerHTML = gates.map(g => `
      <div class="gate ${g.passed ? 'pass' : 'fail'}">${g.passed ? '✅' : '❌'} ${g.name} <small style="margin-left:auto;color:rgba(255,255,255,.5);">${g.detail}</small></div>
    `).join('');

    // 驳回原因
    const reasons = document.getElementById('reasons');
    if (report.rejection_reasons && report.rejection_reasons.length > 0) {
      reasons.style.display = '';
      reasons.innerHTML = '<b>⚠ 驳回原因：</b><br/>' + report.rejection_reasons.map(r => '· ' + escapeHtml(r)).join('<br/>');
    } else {
      reasons.style.display = 'none';
    }
    // 改进建议
    const sug = document.getElementById('suggestions');
    if (report.improvement_suggestions && report.improvement_suggestions.length > 0) {
      sug.style.display = '';
      sug.innerHTML = '<b>💡 改进建议：</b>' + report.improvement_suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    } else {
      sug.style.display = 'none';
    }
  }

  // ====== 渲染：改编授权 ======
  function renderLicenses() {
    const list = document.getElementById('license-list');
    const items = window.DB.licenses.queryBy('novel_id', currentNovelId);
    if (items.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,.45);font-size:13px;">尚无改编授权</div>';
      return;
    }
    list.innerHTML = items.map(l => {
      const typeName = { film:'影视', animation:'动漫', game:'游戏', audiobook:'有声', overseas:'海外出版' }[l.license_type] || l.license_type;
      return `
        <div class="license-card">
          <div class="lc-level ${l.license_level}">${l.license_level}</div>
          <div class="lc-info">
            <div class="lc-type">${typeName} 改编 · 等级 ${l.license_level}</div>
            <div class="lc-meta">被授权方：${escapeHtml(l.licensee_name || '—')} · 授权费：${l.license_fee || 0} 灵晶</div>
          </div>
          <div class="lc-share">创作者 ${(l.creator_share_ratio*100).toFixed(0)}%</div>
        </div>
      `;
    }).join('');
  }

  // ====== 模态：新建/编辑收费点 ======
  function openPointModal(pid = null) {
    const existing = pid ? window.DB.monetization.get(pid) : null;
    const types = window.Monetization.POINT_TYPES;
    showModal({
      title: existing ? '编辑收费点' : '新建收费点',
      body: `
        <div class="form-row">
          <label>类型 <button class="ai-help-btn" data-ai="point_name" data-key="point_name">🤖 推荐</button></label>
          <select id="f-type">
            ${types.map(t => `<option value="${t.type}" ${existing?.point_type === t.type ? 'selected' : ''}>${t.icon} ${t.name} (${t.category})</option>`).join('')}
          </select>
          <div class="help">5 大类 22 种，作者可自选</div>
        </div>
        <div class="form-row">
          <label>名称</label>
          <input id="f-name" value="${escapeHtml(existing?.point_name || '')}" placeholder="如：主线锁·第三章" />
        </div>
        <div class="form-row">
          <label>描述</label>
          <textarea id="f-desc" rows="2" placeholder="读者看到的说明文字">${escapeHtml(existing?.point_description || '')}</textarea>
        </div>
        <div class="form-row">
          <label>价格 (10-5000 灵晶，平台建议 50-500)</label>
          <input id="f-price" type="number" min="10" max="5000" value="${existing?.price || 100}" />
          <div class="help" id="price-hint">请输入合法价格</div>
        </div>
      `,
      footer: `<button id="f-ai" style="padding:8px 16px;border-radius:6px;background:rgba(110,198,255,.18);border:1px solid rgba(110,198,255,.4);color:#6ec6ff;font-size:12px;">🤖 AI 帮我写</button>
               <button class="modal-cancel" style="padding:8px 16px;border-radius:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;">取消</button>
               <button class="modal-ok primary" style="padding:8px 18px;border-radius:6px;background:linear-gradient(120deg,#8b7cf6,#6ec6ff);color:#08071a;border:none;font-size:13px;font-weight:600;">保存</button>`,
      onMount: (modal) => {
        // AI 按钮
        modal.querySelector('#f-ai').onclick = () => {
          const type = modal.querySelector('#f-type').value;
          const meta = window.Monetization.getTypeMeta(type);
          window.AIHelper.renderModal('point_name', { type: type }, document.getElementById('ai-root'), {
            onPick: (label) => {
              modal.querySelector('#f-name').value = label;
              if (!modal.querySelector('#f-desc').value) {
                modal.querySelector('#f-desc').value = meta?.desc || '';
              }
            }
          });
        };
        // 价格校验
        const priceInput = modal.querySelector('#f-price');
        const priceHint = modal.querySelector('#price-hint');
        const checkPrice = () => {
          const v = window.Monetization.validatePrice(priceInput.value);
          priceHint.textContent = v.ok ? (v.warn || '✓ 价格合法') : ('✗ ' + v.msg);
          priceHint.style.color = v.ok ? (v.warn ? '#ffd980' : '#7cf6c0') : '#ff7e8a';
        };
        priceInput.oninput = checkPrice;
        checkPrice();
        // 类型变化时更新名称/描述
        modal.querySelector('#f-type').onchange = (e) => {
          const meta = window.Monetization.getTypeMeta(e.target.value);
          if (!modal.querySelector('#f-name').value) modal.querySelector('#f-name').value = meta.name;
          if (!modal.querySelector('#f-desc').value) modal.querySelector('#f-desc').value = meta.desc;
        };
        // 保存
        modal.querySelector('.modal-ok').onclick = () => {
          const data = {
            point_type: modal.querySelector('#f-type').value,
            point_name: modal.querySelector('#f-name').value.trim(),
            point_description: modal.querySelector('#f-desc').value.trim(),
            price: parseInt(modal.querySelector('#f-price').value, 10)
          };
          if (!data.point_name) { alert('请输入名称'); return; }
          try {
            if (existing) {
              window.Monetization.updatePoint(existing.id, data);
              toast('已更新收费点');
            } else {
              window.Monetization.createPoint(currentNovelId, currentNovel.novel.author || 'demo_author', data);
              toast('已创建收费点');
            }
            modal.remove();
            renderPointList();
          } catch (e) {
            alert(e.message);
          }
        };
      }
    });
  }

  // ====== 模态：改编授权 ======
  function openLicenseModal() {
    showModal({
      title: '申请改编授权',
      body: `
        <div class="form-row">
          <label>授权类型</label>
          <select id="l-type">
            <option value="film">🎬 影视</option>
            <option value="animation">🎨 动漫</option>
            <option value="game">🎮 游戏</option>
            <option value="audiobook">🎧 有声</option>
            <option value="overseas">🌏 海外出版</option>
          </select>
        </div>
        <div class="form-row">
          <label>授权等级</label>
          <select id="l-level">
            <option value="A">A·全版权（创作者 60% / 平台 40%）</option>
            <option value="B" selected>B·单品类（创作者 70% / 平台 30%）</option>
            <option value="C">C·自主授权（创作者 90% / 平台 10%）</option>
          </select>
          <div class="help">A 级平台代理谈判；B 级平台代理单一品类；C 级创作者自对接</div>
        </div>
        <div class="form-row">
          <label>被授权方</label>
          <input id="l-name" placeholder="如：XX 影业 / XX 制作公司" />
        </div>
        <div class="form-row">
          <label>授权费（灵晶）</label>
          <input id="l-fee" type="number" min="0" value="5000" />
        </div>
      `,
      footer: `<button class="modal-cancel" style="padding:8px 16px;border-radius:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;">取消</button>
               <button class="modal-ok primary" style="padding:8px 18px;border-radius:6px;background:linear-gradient(120deg,#8b7cf6,#6ec6ff);color:#08071a;border:none;font-size:13px;font-weight:600;">提交申请</button>`,
      onMount: (modal) => {
        modal.querySelector('.modal-ok').onclick = () => {
          const data = {
            novel_id: currentNovelId,
            creator_id: currentNovel.novel.author || 'demo_author',
            license_type: modal.querySelector('#l-type').value,
            license_level: modal.querySelector('#l-level').value,
            licensee_name: modal.querySelector('#l-name').value.trim() || '匿名',
            license_fee: parseInt(modal.querySelector('#l-fee').value, 10) || 0,
            creator_share_ratio: modal.querySelector('#l-level').value === 'A' ? 0.6
                              : modal.querySelector('#l-level').value === 'B' ? 0.7 : 0.9,
            platform_service_fee_ratio: modal.querySelector('#l-level').value === 'A' ? 0.4
                                    : modal.querySelector('#l-level').value === 'B' ? 0.3 : 0.1,
            license_start: new Date().toISOString(),
            status: 'active'
          };
          window.DB.licenses.put(data);
          toast('已提交授权申请');
          modal.remove();
          renderLicenses();
        };
      }
    });
  }

  // ====== 提交上架 ======
  function submitShelf() {
    if (!currentNovel) return;
    const reports = window.DB.quality.queryBy('novel_id', currentNovelId);
    const latest = reports[reports.length - 1];
    if (!latest) {
      toast('请先评估质量');
      return;
    }
    if (latest.status === 'rejected') {
      alert('质量未通过，无法上架：\n\n' + (latest.rejection_reasons || []).join('\n'));
      return;
    }
    if (latest.status === 'needs_revision') {
      if (!confirm('质量为 C 级（需修改），仍要尝试提交上架吗？')) return;
    }
    window.DB.reviews.put({
      novel_id: currentNovelId,
      reviewer_type: 'human',
      review_stage: 'human_review',
      result: latest.status === 'passed' ? 'pass' : 'needs_revision',
      notes: '创作者提交上架申请'
    });
    toast(latest.status === 'passed' ? '✅ 已上架' : '⚠ 已转人工复审');
  }

  // ====== 通用模态 ======
  function showModal({ title, body, footer, onMount }) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-mask">
        <div class="modal-card">
          <div class="modal-head">
            <h3>${escapeHtml(title)}</h3>
            <button class="modal-close">✕</button>
          </div>
          <div class="modal-body">${body}</div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      </div>
    `;
    const close = () => root.innerHTML = '';
    root.querySelector('.modal-close').onclick = close;
    root.querySelectorAll('.modal-cancel').forEach(b => b.onclick = close);
    root.querySelector('.modal-mask').onclick = (e) => { if (e.target.classList.contains('modal-mask')) close(); };
    if (onMount) onMount(root.querySelector('.modal-card'));
    return root.querySelector('.modal-card');
  }

  // 暴露
  window._commerce = { selectNovel, renderAll };

  // 启动
  init();
})();
