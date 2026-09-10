/* v5.13 — 通用剧情引擎层（plotTree → 沉浸剧情对话 UI）
   视觉规范（业内沉浸剧情对话游戏经典布局）：
     · 全屏背景图（SD 场景图）
     · 角色立绘居中或左右双人站立（脚部贴底）
     · 顶部名字条（黑底+金边）+ 正文 typewriter
     · 右下角 ▼ 继续提示闪烁
     · 选项按钮（蓝绿色块，hover 高亮）
     · 顶部菜单栏（自动/快进/历史/存档/读档/设置）
     · 数值面板（信任/亲密/声望，top-right 小窗）
   配套文件：plot-runner.html
*/
(function () {
  let STATE = {};
  let PLOT = null;
  let CONTAINER = null;
  let ON_END_CALLBACK = null;
  let OPTIONS = {
    autoMode: false,        // 自动模式：每 3.5s 自动下一句
    skipMode: false,        // 快进模式：直接显示完整句
    textSpeed: 38,          // typewriter 每字 ms（10-100）
    onSpeedChange: null,
    bgm: true,
    sfx: true
  };
  function loadSavedOpts() {
    // v5.16：从独立设置页同步过来的选项
    try {
      const saved = JSON.parse(localStorage.getItem('plotrunner.opts') || '{}');
      if (typeof saved.textSpeed === 'number') OPTIONS.textSpeed = saved.textSpeed;
      if (typeof saved.autoMode === 'boolean') OPTIONS.autoMode = saved.autoMode;
      if (typeof saved.skipMode === 'boolean') OPTIONS.skipMode = saved.skipMode;
      if (typeof saved.bgm === 'boolean') OPTIONS.bgm = saved.bgm;
      if (typeof saved.sfx === 'boolean') OPTIONS.sfx = saved.sfx;
    } catch {}
  }
  let typewriterTimer = null;
  let autoTimer = null;
  let history = [];         // [{nodeId, speaker, text}]
  let saves = [];            // [{name, ts, snapshot}]

  // ====================== init ======================
  function init(plotTree, container, opts = {}) {
    PLOT = plotTree;
    CONTAINER = container || document.body;
    ON_END_CALLBACK = opts.onEnd || null;
    // v5.16：先从 localStorage 恢复用户偏好
    loadSavedOpts();
    OPTIONS.autoMode = false;  // 进游戏时不主动开自动
    OPTIONS.skipMode = false;  // 进游戏时不主动开快进（但文本速度仍用保存值）
    STATE = {
      currentNodeId: startNodeId(),
      visited: [],
      flags: {},
      trust: 0,
      intimacy: 0,
      reputation: 0,
      ended: false,
      textFullyShown: false
    };
    history = [];
    saves = [];
    buildChrome();
    gotoNode(STATE.currentNodeId, /*animate*/ true);
    return STATE;
  }

  function startNodeId() {
    const mains = Object.values(PLOT.nodes).filter(n => n.isMain)
      .sort((a, b) => (a.chapterId || '').localeCompare(b.chapterId || ''));
    return mains[0]?.id || Object.keys(PLOT.nodes)[0];
  }

  // ====================== 顶部菜单栏 + 数值面板 ======================
  function buildChrome() {
    // 顶部菜单栏
    if (!CONTAINER.querySelector('#plot-topbar')) {
      const top = document.createElement('div');
      top.id = 'plot-topbar';
      top.className = 'plot-topbar';
      top.innerHTML = `
        <div class="tb-left">
          <a class="tb-back" href="library.html" id="tb-back" title="退出游戏并返回小说库">◀ 退出游戏</a>
          <div class="tb-title" id="tb-title">— —</div>
        </div>
        <div class="tb-right">
          <button class="tb-btn" id="tb-auto" title="自动模式（每 3.5s 下一句）">⏱ 自动</button>
          <button class="tb-btn" id="tb-skip" title="快进（立即显示全文）">▶▶ 快进</button>
          <button class="tb-btn" id="tb-history" title="历史记录（最近 20 句）">📜 历史</button>
          <button class="tb-btn" id="tb-save" title="存档（最多 5 个槽位）">💾 存档</button>
          <button class="tb-btn" id="tb-load" title="读档">📂 读档</button>
          <button class="tb-btn" id="tb-settings" title="设置（文字速度）">⚙ 设置</button>
          <a class="tb-btn" id="tb-edit" href="#" title="编辑当前小说">✎ 编辑</a>
        </div>
      `;
      CONTAINER.appendChild(top);
      bindTopbar();
    }
    // 数值面板（右上）
    if (!CONTAINER.querySelector('#plot-stats')) {
      const stats = document.createElement('div');
      stats.id = 'plot-stats';
      stats.className = 'plot-stats';
      stats.innerHTML = `
        <div class="stats-title">剧情进度</div>
        <div class="stats-row"><span>信任</span><b id="stats-trust" style="color:#6ec6ff">0</b></div>
        <div class="stats-row"><span>亲密</span><b id="stats-intimacy" style="color:#f6a6d8">0</b></div>
        <div class="stats-row"><span>声望</span><b id="stats-rep" style="color:#7cf6c0">0</b></div>
        <div class="stats-cov" id="stats-cov">—</div>
        <div class="stats-jump">
          <button id="stats-back" title="回到上一节点">↩ 上一步</button>
          <button id="stats-reset" title="重新开始">↻ 重置</button>
        </div>
      `;
      CONTAINER.appendChild(stats);
      document.getElementById('stats-back').onclick = back;
      document.getElementById('stats-reset').onclick = reset;
    }
    renderStatsValues();
    renderStatsCoverage();
  }

  function bindTopbar() {
    const $ = (id) => document.getElementById(id);
    const novelId = PLOT.novel.id;
    $('tb-title').textContent = PLOT.novel.title || '—';
    $('tb-auto').onclick = () => {
      OPTIONS.autoMode = !OPTIONS.autoMode;
      $('tb-auto').classList.toggle('on', OPTIONS.autoMode);
      $('tb-auto').textContent = OPTIONS.autoMode ? '⏱ 自动中' : '⏱ 自动';
      if (OPTIONS.autoMode) tryAdvance();
    };
    $('tb-skip').onclick = () => {
      OPTIONS.skipMode = !OPTIONS.skipMode;
      $('tb-skip').classList.toggle('on', OPTIONS.skipMode);
      $('tb-skip').textContent = OPTIONS.skipMode ? '▶▶ 快进中' : '▶▶ 快进';
      if (OPTIONS.skipMode && !STATE.textFullyShown) finishTypewriter();
    };
    // v5.16：模态 → 独立页面跳转（每个功能区只看自己内容）
    $('tb-history').onclick = () => { location.href = `plot-history.html?novelId=${novelId}`; };
    $('tb-save').onclick = () => { location.href = `plot-save.html?novelId=${novelId}&mode=save`; };
    $('tb-load').onclick = () => { location.href = `plot-save.html?novelId=${novelId}&mode=load`; };
    $('tb-settings').onclick = () => { location.href = `plot-settings.html?novelId=${novelId}`; };
    const editBtn = $('tb-edit');
    if (editBtn) editBtn.href = `novel-edit.html?novelId=${novelId}`;

    // v5.16：左上角固定返回箭头（游戏内 = 退出游戏）
    if (!document.getElementById('plot-back-arrow')) {
      const back = document.createElement('a');
      back.id = 'plot-back-arrow';
      back.className = 'back-arrow';
      back.href = 'library.html';
      back.title = '退出游戏并返回小说库';
      back.innerHTML = '<span class="icon">◀</span><span>退出游戏</span>';
      document.body.appendChild(back);
    }
  }

  function renderStatsValues() {
    const t = document.getElementById('stats-trust');
    const i = document.getElementById('stats-intimacy');
    const r = document.getElementById('stats-rep');
    if (t) t.textContent = STATE.trust;
    if (i) i.textContent = STATE.intimacy;
    if (r) r.textContent = STATE.reputation;
  }

  function renderStatsCoverage() {
    const el = document.getElementById('stats-cov');
    if (!el || !PLOT.audit) { if (el) el.textContent = ''; return; }
    const a = PLOT.audit;
    el.innerHTML = `
      <div class="cov-line">📖 ${a.covered.chapters}/${a.total.chapters} 章</div>
      <div class="cov-line">👤 ${a.covered.chars}/${a.total.chars} 角色</div>
      <div class="cov-line">✦ ${a.covered.highlights}/${a.total.highlights} 高光</div>
      ${(a.gaps.chars.length + a.gaps.highlights.length + a.gaps.chapters.length) > 0
        ? `<div class="cov-warn">⚠ 未覆盖：${a.gaps.chars.length + a.gaps.highlights.length + a.gaps.chapters.length} 项</div>`
        : `<div class="cov-ok">✅ 全部覆盖</div>`}
    `;
  }

  // ====================== 场景层（背景图 + 立绘） ======================
  function renderScene(animate) {
    const node = PLOT.nodes[STATE.currentNodeId];
    if (!node) return;

    // 背景层
    let scEl = CONTAINER.querySelector('#plot-scene');
    if (!scEl) {
      scEl = document.createElement('div');
      scEl.id = 'plot-scene';
      scEl.className = 'plot-scene';
      CONTAINER.appendChild(scEl);
    }
    const bgUrl = node.bg || sceneBgUrl(node.sceneKey);
    const newBg = bgUrl ? `url('${bgUrl}')` : moodGradient(node.sceneKey);
    if (scEl.dataset.bg !== newBg) {
      scEl.style.backgroundImage = newBg;
      scEl.style.backgroundColor = '';  // 让图覆盖渐变
      scEl.dataset.bg = newBg;
      if (animate) {
        scEl.classList.remove('fade-in');
        void scEl.offsetWidth;  // restart anim
        scEl.classList.add('fade-in');
      }
    }

    // 立绘层（支持左中右）
    let charEl = CONTAINER.querySelector('#plot-chars');
    if (!charEl) {
      charEl = document.createElement('div');
      charEl.id = 'plot-chars';
      charEl.className = 'plot-chars';
      CONTAINER.appendChild(charEl);
    }
    const ids = (node.charIds && node.charIds.length) ? node.charIds.slice(0, 2) : [];
    // fallback：通过 speaker 匹配第一个相同 name 的角色
    let chars = ids.map(id => PLOT.chars.find(c => c.id === id)).filter(Boolean);
    if (chars.length === 0 && node.speaker) {
      const byName = PLOT.chars.find(c => c.name === node.speaker);
      if (byName) chars = [byName];
    }

    if (chars.length === 0) {
      charEl.innerHTML = '';
      charEl.style.display = 'none';
    } else {
      charEl.style.display = '';
      // 布局：1 人居中 / 2 人左右
      const layout = chars.length === 1 ? 'single' : 'double';
      charEl.dataset.layout = layout;
      charEl.innerHTML = chars.map((ch, idx) => renderPortrait(ch, idx, layout)).join('');
    }

    // 章节标题水印（首次进入章节时显示）
    showChapterTitle(node);
  }

  function renderPortrait(ch, idx, layout) {
    const posClass = layout === 'single' ? 'pos-center' : (idx === 0 ? 'pos-left' : 'pos-right');
    const roleText = ch.role === 'main' ? '主角' : ch.role === 'antag' ? '反派' : '配角';
    const roleColor = ch.role === 'main' ? '#f6a6d8' : ch.role === 'antag' ? '#ff7e8a' : '#a8d8ff';
    const inner = ch.portrait
      ? `<img src="${ch.portrait}" alt="${escapeAttr(ch.name)}" class="portrait-img" />`
      : `<div class="portrait-placeholder" style="border:2px solid ${roleColor};">
           <div class="pp-name">${escapeHtml(ch.name)}</div>
           <div class="pp-role" style="color:${roleColor}">${roleText}</div>
         </div>`;
    return `<div class="portrait ${posClass} fade-in" data-char="${ch.id}">${inner}</div>`;
  }

  function showChapterTitle(node) {
    const chap = PLOT.novel.chapters.find(c => c.id === node.chapterId);
    if (!chap) return;
    if (STATE.visited.length === 0 || lastVisitedChapterId() !== node.chapterId) {
      const layer = document.createElement('div');
      layer.className = 'chapter-title-card';
      layer.innerHTML = `
        <div class="ctc-frame">
          <div class="ctc-bar"></div>
          <div class="ctc-text">${escapeHtml(chap.title || chap.id)}</div>
          <div class="ctc-bar"></div>
        </div>`;
      CONTAINER.appendChild(layer);
      setTimeout(() => layer.classList.add('show'), 20);
      setTimeout(() => {
        layer.classList.remove('show');
        setTimeout(() => layer.remove(), 600);
      }, 2200);
    }
  }
  function lastVisitedChapterId() {
    for (let i = STATE.visited.length - 1; i >= 0; i--) {
      const n = PLOT.nodes[STATE.visited[i]];
      if (n) return n.chapterId;
    }
    return null;
  }

  function moodGradient(sceneKey) {
    const map = {
      pavilion_night:   'linear-gradient(180deg, #0d1326, #1c1939 60%, #2a1f4e)',
      classroom_sunny:  'linear-gradient(180deg, #f6dca6, #fff5d6 60%, #b3c8ff)',
      neon_street:      'linear-gradient(180deg, #2a1a4a, #1c1939 60%, #5b3a9e)',
      livingroom_warm:  'linear-gradient(180deg, #3a1f1f, #2a1f4e 60%, #5b3a4a)',
      xianxia_peak:     'linear-gradient(180deg, #4a1a4e, #1c1939 60%, #6b4a8e)',
      palace_tang:      'radial-gradient(60% 60% at 50% 30%, #5b2026, #2a1019 70%)',
      study_republic:   'radial-gradient(60% 60% at 30% 30%, #3a2a1a, #2a1f0a 70%)',
      elf_forest:       'radial-gradient(80% 80% at 50% 60%, #1a4e2a, #0a1f14 70%)',
      starship_bridge:  'radial-gradient(60% 60% at 50% 30%, #0a1a4e, #050a1a 70%)',
      cafe_dusk:        'radial-gradient(70% 70% at 50% 50%, #4e3a1a, #1f140a 70%)',
      graveyard_night:  'radial-gradient(60% 60% at 50% 30%, #1a1a2a, #05050a 70%)',
      battle_field:     'radial-gradient(70% 70% at 50% 30%, #4e1a1a, #1f0a0a 70%)',
      magic_academy:    'radial-gradient(70% 70% at 50% 30%, #2a1a4e, #0f0a1f 70%)'
    };
    return map[sceneKey] || 'linear-gradient(180deg, #1c1939, #08071a 70%)';
  }
  function sceneBgUrl(sceneKey) {
    if (!sceneKey) return null;
    const map = {
      pavilion_night:   'scenes/pavilion_night.png',
      classroom_sunny:  'scenes/classroom_sunny.png',
      neon_street:      'scenes/neon_street.png',
      livingroom_warm:  'scenes/livingroom_warm.png',
      xianxia_peak:     'scenes/xianxia_peak.png',
      palace_tang:      'scenes/palace_tang.png',
      study_republic:   'scenes/study_republic.png',
      elf_forest:       'scenes/elf_forest.png',
      starship_bridge:  'scenes/starship_bridge.png'
    };
    return map[sceneKey] || null;
  }

  // ====================== 对话框（沉浸剧情经典） ======================
  function renderDialogue(animate) {
    const node = PLOT.nodes[STATE.currentNodeId];
    if (!node) return;

    let dlgEl = CONTAINER.querySelector('#plot-dlg');
    if (!dlgEl) {
      dlgEl = document.createElement('div');
      dlgEl.id = 'plot-dlg';
      dlgEl.className = 'plot-dlg';
      dlgEl.innerHTML = `
        <div class="dlg-namebar">
          <span class="dlg-name" id="dlg-name">旁白</span>
          <span class="dlg-tag" id="dlg-tag"></span>
          <span class="dlg-chap" id="dlg-chap"></span>
        </div>
        <div class="dlg-text" id="dlg-text"></div>
        <div class="dlg-continue" id="dlg-continue">▼</div>
        <div class="dlg-options" id="dlg-options"></div>
      `;
      CONTAINER.appendChild(dlgEl);
      // 点击对话框或键盘空格 → 推进
      dlgEl.addEventListener('click', (e) => {
        // 选项按钮单独处理
        if (e.target.classList.contains('opt-btn')) return;
        tryAdvance();
      });
      document.addEventListener('keydown', (e) => {
        if (STATE.ended) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tryAdvance(); }
      });
    }
    // 角色名（带角色色）
    const speaker = node.speaker || '旁白';
    const speakerChar = (node.charIds && node.charIds[0])
      ? PLOT.chars.find(c => c.id === node.charIds[0]) : null;
    const nameColor = speakerChar
      ? (speakerChar.role === 'main' ? '#f6a6d8'
        : speakerChar.role === 'antag' ? '#ff7e8a' : '#a8d8ff')
      : '#e8d6a0';
    document.getElementById('dlg-name').textContent = speaker;
    document.getElementById('dlg-name').style.color = nameColor;
    document.getElementById('dlg-name').style.borderColor = nameColor;
    document.getElementById('dlg-tag').innerHTML = node.isHighlight
      ? '<span class="hl-badge">✦ 高光</span>' : '';
    document.getElementById('dlg-chap').textContent = node.chapterId || '';

    // 正文（typewriter）
    const text = node.text || '';
    const txtEl = document.getElementById('dlg-text');
    const contEl = document.getElementById('dlg-continue');
    const optEl = document.getElementById('dlg-options');

    // 清空旧状态
    clearTimeout(typewriterTimer);
    txtEl.classList.remove('show');
    contEl.style.display = 'none';
    optEl.innerHTML = '';

    // 选项按钮（先放，但隐藏，等文字显示完才显示）
    // v5.16：选项按钮不再渲染 fx 数值（沉浸剧情式：选择后才弹窗揭示增减）
    const choices = node.choices || [];
    if (choices.length > 0) {
      optEl.innerHTML = choices.map((c, i) => `
        <button class="opt-btn" data-idx="${i}" style="--i:${i}">
          <span class="opt-num">${i + 1}</span>
          <span class="opt-label">${escapeHtml(c.label)}</span>
        </button>`).join('');
      optEl.style.display = 'none';
      optEl.querySelectorAll('.opt-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); pickChoice(parseInt(btn.dataset.idx, 10)); };
      });
    } else {
      optEl.style.display = 'none';
    }

    // 开始 typewriter
    STATE.textFullyShown = false;
    if (OPTIONS.skipMode) {
      txtEl.textContent = text;
      onTextComplete();
    } else {
      typewrite(txtEl, text, 0, OPTIONS.textSpeed);
    }
    if (animate) {
      dlgEl.classList.remove('fade-in');
      void dlgEl.offsetWidth;
      dlgEl.classList.add('fade-in');
    }
  }

  // v5.16：移除选项按钮上的 fx 数值预览，改为选择后弹窗（showChoiceFxToast）

  function typewrite(el, text, idx, speed) {
    if (idx <= text.length) {
      el.textContent = text.slice(0, idx);
      typewriterTimer = setTimeout(() => typewrite(el, text, idx + 1, speed), speed);
    } else {
      onTextComplete();
    }
  }
  function onTextComplete() {
    STATE.textFullyShown = true;
    const contEl = document.getElementById('dlg-continue');
    if (contEl) {
      const node = PLOT.nodes[STATE.currentNodeId];
      const choices = node?.choices || [];
      contEl.style.display = choices.length > 0 ? 'none' : 'flex';
    }
    const optEl = document.getElementById('dlg-options');
    if (optEl && optEl.children.length > 0) {
      optEl.style.display = '';
      optEl.querySelectorAll('.opt-btn').forEach((btn, i) => {
        setTimeout(() => btn.classList.add('show'), i * 80);
      });
    }
    if (OPTIONS.autoMode) {
      clearTimeout(autoTimer);
      autoTimer = setTimeout(() => {
        if (OPTIONS.autoMode && !STATE.ended) tryAdvance();
      }, 3500);
    }
  }
  function finishTypewriter() {
    const node = PLOT.nodes[STATE.currentNodeId];
    const text = node.text || '';
    clearTimeout(typewriterTimer);
    document.getElementById('dlg-text').textContent = text;
    onTextComplete();
  }

  function tryAdvance() {
    const node = PLOT.nodes[STATE.currentNodeId];
    if (!node || STATE.ended) return;
    if (!STATE.textFullyShown) {
      finishTypewriter();
      return;
    }
    const choices = node.choices || [];
    if (choices.length > 0) {
      // 已有选项：点击/空格不直接推进，让玩家选
      return;
    }
    // 没选项，自动跳到下一个主线节点 / 结局
    const mains = Object.values(PLOT.nodes).filter(n => n.isMain);
    const curMainIdx = mains.findIndex(n => n.id === STATE.currentNodeId);
    if (curMainIdx >= 0 && curMainIdx + 1 < mains.length) {
      gotoNode(mains[curMainIdx + 1].id, true);
    } else {
      // 末尾主线走完 → 普通结局
      const fallbackEnding = Object.keys(PLOT.endings)[0];
      triggerEnding(fallbackEnding || 'ending-normal');
    }
  }

  // ====================== 跳转与选项 ======================
  function pickChoice(idx) {
    const node = PLOT.nodes[STATE.currentNodeId];
    if (!node || !node.choices || !node.choices[idx]) return;
    const choice = node.choices[idx];
    STATE.visited.push(STATE.currentNodeId);

    // v5.16：先弹出 fx 变化通知（客户选择后才显示增加/减少，不再预览）
    const delta = (choice.effects && typeof choice.effects === 'object') ? { ...choice.effects } : null;
    const isNoFx = !delta || (delta.trust === 0 && delta.intimacy === 0 && delta.reputation === 0 && !(delta.flags && delta.flags.length));

    // 旧数值（用于弹窗中显示"+"或"-"）
    const before = { trust: STATE.trust, intimacy: STATE.intimacy, reputation: STATE.reputation };

    if (choice.effects) {
      if (typeof choice.effects.trust === 'number') STATE.trust += choice.effects.trust;
      if (typeof choice.effects.intimacy === 'number') STATE.intimacy += choice.effects.intimacy;
      if (typeof choice.effects.reputation === 'number') STATE.reputation += choice.effects.reputation;
      if (Array.isArray(choice.effects.flags)) for (const f of choice.effects.flags) STATE.flags[f] = true;
    }

    // 弹窗展示属性变化（沉浸剧情式：选择后才揭示）
    if (!isNoFx) {
      showChoiceFxToast(choice, before, delta);
    }

    // 记录历史
    history.push({
      ts: Date.now(),
      nodeId: node.id,
      speaker: node.speaker,
      text: (node.text || '').slice(0, 100),
      choiceLabel: choice.label
    });
    if (history.length > 50) history.shift();

    if (window.AudioFX?.sfx?.click) try { window.AudioFX.sfx.click(); } catch (e) {}

    if (choice.next) {
      if (PLOT.endings[choice.next]) return triggerEnding(choice.next);
      if (PLOT.nodes[choice.next]) return gotoNode(choice.next, true);
    }
    // 兜底：下一主线
    const mains = Object.values(PLOT.nodes).filter(n => n.isMain);
    const curMainIdx = mains.findIndex(n => n.id === STATE.currentNodeId);
    if (curMainIdx >= 0 && curMainIdx + 1 < mains.length) return gotoNode(mains[curMainIdx + 1].id, true);
    triggerEnding(Object.keys(PLOT.endings)[0] || 'ending-normal');
  }

  // v5.16：弹窗式 fx 通知（沉浸剧情：选择后才提示增减）
  function showChoiceFxToast(choice, before, delta) {
    const items = [];
    const fmtDelta = (label, beforeVal, key) => {
      const d = delta[key];
      if (typeof d !== 'number' || d === 0) return null;
      const after = beforeVal + d;
      const isPos = d > 0;
      return {
        label,
        before: beforeVal,
        delta: d,
        after,
        icon: isPos ? '✦' : '✧',
        cls: isPos ? 'fx-pos' : 'fx-neg'
      };
    };
    items.push(fmtDelta('信任', before.trust, 'trust'));
    items.push(fmtDelta('亲密', before.intimacy, 'intimacy'));
    items.push(fmtDelta('声望', before.reputation, 'reputation'));
    const visible = items.filter(Boolean);
    if (visible.length === 0) return;

    const wrap = document.createElement('div');
    wrap.className = 'plot-fx-toast';
    wrap.innerHTML = `
      <div class="fx-toast-inner">
        <div class="fx-toast-head">
          <span class="fx-quote">"${escapeHtml(choice.label || '')}"</span>
        </div>
        <div class="fx-toast-list">
          ${visible.map(v => `
            <div class="fx-row ${v.cls}">
              <span class="fx-icon">${v.icon}</span>
              <span class="fx-name">${v.label}</span>
              <span class="fx-arrow">${v.delta > 0 ? '↑' : '↓'}</span>
              <span class="fx-delta">${v.delta > 0 ? '+' : ''}${v.delta}</span>
              <span class="fx-detail">${v.before} → <b>${v.after}</b></span>
            </div>
          `).join('')}
        </div>
        <button class="fx-toast-close" type="button">继续</button>
      </div>
    `;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    const dismiss = () => {
      wrap.classList.remove('show');
      setTimeout(() => wrap.remove(), 350);
    };
    wrap.querySelector('.fx-toast-close').onclick = dismiss;
    // 2.4s 自动关闭
    setTimeout(dismiss, 2400);
  }

  function gotoNode(nodeId, animate) {
    if (!PLOT.nodes[nodeId]) return;
    if (STATE.currentNodeId !== nodeId) STATE.visited.push(STATE.currentNodeId);
    STATE.currentNodeId = nodeId;
    const node = PLOT.nodes[nodeId];
    renderStatsValues();
    renderScene(animate);
    renderDialogue(animate);
    // BGM 切换（如果有）
    if (window.AudioFX?.bgm?.play && node.bgmKey) {
      try { window.AudioFX.bgm.play(node.bgmKey); } catch (e) {}
    }
  }

  function back() {
    if (STATE.visited.length < 1) return;
    const prev = STATE.visited.pop();
    STATE.currentNodeId = prev;
    renderScene(true);
    renderDialogue(true);
  }

  function reset() {
    init(PLOT, CONTAINER, { onEnd: ON_END_CALLBACK });
  }

  // ====================== 结局模态（沉浸剧情式大卡） ======================
  function triggerEnding(endingId) {
    const e = PLOT.endings[endingId];
    if (!e) return;
    STATE.ended = true;
    clearTimeout(typewriterTimer);
    clearTimeout(autoTimer);
    OPTIONS.autoMode = false;
    const autoBtn = document.getElementById('tb-auto');
    if (autoBtn) { autoBtn.classList.remove('on'); autoBtn.textContent = '⏱ 自动'; }

    let m = CONTAINER.querySelector('#plot-end-modal');
    if (m) m.remove();
    m = document.createElement('div');
    m.id = 'plot-end-modal';
    m.className = 'plot-end-modal';
    const rarityClass = e.rarity || 'common';
    const rarityLabel = { legendary: '限定 · LEGENDARY', epic: '珍稀 · EPIC', rare: '稀有 · RARE', common: '普通 · COMMON' }[rarityClass] || rarityClass;
    const rarityColor = { legendary: '#f6a6d8', epic: '#8b7cf6', rare: '#6ec6ff', common: '#7cf6c0' }[rarityClass] || '#fff';
    m.innerHTML = `
      <div class="end-card">
        <div class="end-deco" style="background:${rarityColor}"></div>
        <div class="end-rarity" style="color:${rarityColor}">${rarityLabel}</div>
        <h1 class="end-title">${escapeHtml(e.title)}</h1>
        <div class="end-scene">${escapeHtml(e.scene)}</div>
        <div class="end-quote">"${escapeHtml(e.quote)}"</div>
        <div class="end-stats">
          <span>信任 <b style="color:#6ec6ff">${e.deltas?.trust >= 0 ? '+' : ''}${e.deltas?.trust || 0}</b></span>
          <span>亲密 <b style="color:#f6a6d8">${e.deltas?.intimacy >= 0 ? '+' : ''}${e.deltas?.intimacy || 0}</b></span>
          <span>声望 <b style="color:#7cf6c0">${e.deltas?.reputation >= 0 ? '+' : ''}${e.deltas?.reputation || 0}</b></span>
        </div>
        <div class="end-actions">
          <button id="end-restart" class="end-btn primary" style="border-color:${rarityColor};color:${rarityColor}">↻ 重新开始</button>
          ${ON_END_CALLBACK ? '<button id="end-quit" class="end-btn">退出</button>' : ''}
          <a class="end-btn" href="library.html">回到小说世界</a>
        </div>
      </div>`;
    CONTAINER.appendChild(m);
    requestAnimationFrame(() => m.classList.add('show'));
    m.querySelector('#end-restart').onclick = () => { m.remove(); reset(); };
    if (ON_END_CALLBACK) m.querySelector('#end-quit').onclick = () => { m.remove(); ON_END_CALLBACK(); };
    if (window.AudioFX?.sfx?.end) try { window.AudioFX.sfx.end(); } catch (e) {}
  }

  // ====================== 历史/存档/读档/设置 模态 ======================
  function openHistory() {
    if (history.length === 0) {
      toast('还没有历史记录（当前节点未推进）');
      return;
    }
    showModal({
      title: '📜 历史记录（最近 20 条）',
      body: `<div class="hist-list">
        ${history.slice(-20).reverse().map((h, i) => `
          <div class="hist-item">
            <div class="hist-time">${new Date(h.ts).toLocaleTimeString('zh-CN')}</div>
            <div class="hist-speaker">${escapeHtml(h.speaker || '旁白')}</div>
            <div class="hist-text">${escapeHtml(h.text)}${h.choiceLabel ? ` <span style="color:#f6a6d8">→ ${escapeHtml(h.choiceLabel)}</span>` : ''}</div>
          </div>`).join('')}
      </div>`
    });
  }

  function openSaveLoad() {
    const slots = [0, 1, 2, 3, 4].map(i => {
      const s = saves[i];
      return `<div class="slot">
        <div class="slot-head">
          <b>槽位 ${i + 1}</b>
          ${s ? `<span class="slot-time">${new Date(s.ts).toLocaleString('zh-CN')}</span>` : '<span class="slot-empty">空</span>'}
        </div>
        ${s ? `
          <div class="slot-info">${escapeHtml(s.name || '自动存档')}</div>
          <div class="slot-actions">
            <button class="slot-btn" data-act="load" data-i="${i}">读档</button>
            <button class="slot-btn" data-act="overwrite" data-i="${i}">覆盖</button>
            <button class="slot-btn danger" data-act="del" data-i="${i}">删除</button>
          </div>
        ` : `
          <div class="slot-actions">
            <button class="slot-btn primary" data-act="save" data-i="${i}">立即存档</button>
          </div>
        `}
      </div>`;
    }).join('');
    showModal({
      title: '💾 存档 / 读档（最多 5 槽位）',
      body: `<div class="slot-grid">${slots}</div>`,
      onMount: (modal) => {
        modal.querySelectorAll('.slot-btn').forEach(btn => {
          btn.onclick = () => {
            const act = btn.dataset.act;
            const i = parseInt(btn.dataset.i, 10);
            if (act === 'save' || act === 'overwrite') {
              saves[i] = { ts: Date.now(), name: `${PLOT.novel.title} · ${PLOT.nodes[STATE.currentNodeId].chapterId}`, snapshot: snapshot() };
              localStorage.setItem(`plotrunner.save.${PLOT.novel.id}.${i}`, JSON.stringify(saves[i]));
              toast('已存档到槽位 ' + (i + 1));
              modal.remove();
              openSaveLoad();
            } else if (act === 'load') {
              if (!saves[i]) return;
              restore(saves[i].snapshot);
              modal.remove();
              toast('已读档');
            } else if (act === 'del') {
              saves[i] = null;
              localStorage.removeItem(`plotrunner.save.${PLOT.novel.id}.${i}`);
              modal.remove();
              openSaveLoad();
            }
          };
        });
      }
    });
  }

  function openSettings() {
    showModal({
      title: '⚙ 设置',
      body: `
        <div class="set-row">
          <div class="set-label">文字速度</div>
          <input type="range" id="set-speed" min="10" max="120" step="4" value="${OPTIONS.textSpeed}" style="flex:1;margin:0 14px;" />
          <span id="set-speed-val" style="width:60px;text-align:right;">${OPTIONS.textSpeed}ms/字</span>
        </div>
        <div class="set-row">
          <div class="set-label">自动模式</div>
          <button id="set-auto" class="set-toggle ${OPTIONS.autoMode ? 'on' : ''}">${OPTIONS.autoMode ? '已开启' : '已关闭'}</button>
        </div>
        <div class="set-row">
          <div class="set-label">快进模式</div>
          <button id="set-skip" class="set-toggle ${OPTIONS.skipMode ? 'on' : ''}">${OPTIONS.skipMode ? '已开启' : '已关闭'}</button>
        </div>
      `,
      onMount: (modal) => {
        const speed = modal.querySelector('#set-speed');
        const sv = modal.querySelector('#set-speed-val');
        speed.oninput = () => {
          OPTIONS.textSpeed = parseInt(speed.value, 10);
          sv.textContent = OPTIONS.textSpeed + 'ms/字';
        };
        modal.querySelector('#set-auto').onclick = (e) => {
          OPTIONS.autoMode = !OPTIONS.autoMode;
          e.target.classList.toggle('on', OPTIONS.autoMode);
          e.target.textContent = OPTIONS.autoMode ? '已开启' : '已关闭';
          if (OPTIONS.autoMode) tryAdvance();
        };
        modal.querySelector('#set-skip').onclick = (e) => {
          OPTIONS.skipMode = !OPTIONS.skipMode;
          e.target.classList.toggle('on', OPTIONS.skipMode);
          e.target.textContent = OPTIONS.skipMode ? '已开启' : '已关闭';
          if (OPTIONS.skipMode && !STATE.textFullyShown) finishTypewriter();
        };
      }
    });
  }

  function showModal({ title, body, onMount }) {
    let m = CONTAINER.querySelector('#plot-modal');
    if (m) m.remove();
    m = document.createElement('div');
    m.id = 'plot-modal';
    m.className = 'plot-modal';
    m.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <div class="modal-title">${escapeHtml(title)}</div>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">${body}</div>
      </div>`;
    CONTAINER.appendChild(m);
    requestAnimationFrame(() => m.classList.add('show'));
    const close = () => m.remove();
    m.querySelector('.modal-close').onclick = close;
    m.onclick = (e) => { if (e.target === m) close(); };
    if (onMount) onMount(m);
  }

  function snapshot() {
    return {
      currentNodeId: STATE.currentNodeId,
      visited: [...STATE.visited],
      flags: { ...STATE.flags },
      trust: STATE.trust,
      intimacy: STATE.intimacy,
      reputation: STATE.reputation
    };
  }
  function restore(snap) {
    STATE.currentNodeId = snap.currentNodeId;
    STATE.visited = snap.visited || [];
    STATE.flags = snap.flags || {};
    STATE.trust = snap.trust || 0;
    STATE.intimacy = snap.intimacy || 0;
    STATE.reputation = snap.reputation || 0;
    STATE.ended = false;
    renderStatsValues();
    renderScene(true);
    renderDialogue(true);
  }

  function toast(msg) {
    let t = document.getElementById('plot-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'plot-toast';
      t.className = 'plot-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ====================== 工具 ======================
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function getState() { return STATE; }

  // 暴露 API
  window.PlotEngine = { init, pickChoice, back, reset, getState, triggerEnding, finishTypewriter };
  console.log('[v5.13] plot-engine 加载完成 · 沉浸剧情对话样式');
})();