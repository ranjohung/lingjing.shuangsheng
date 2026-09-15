/* =====================================================================
 * 灵境 · 双生 — V23 创作页集中接线 (creator-pages.js)
 * 依赖：creator-store.js / creator-ai.js（须先引入）
 * 机制：按 location.pathname 识别页面，覆盖页内假交互函数 → 走 Store 真流程
 * 铁律：Toast 替代 alert；额度真扣减；AI 候选恒 3-5 + 换一批
 * ===================================================================== */
(function () {
  var page = (location.pathname.split('/').pop() || '').replace('.html', '');
  var S = window.CreatorStore, A = window.CreatorAI;
  if (!S) return;

  /* ---------- 固定底条避让 tabbar（tabbar 高 76px + 安全区）---------- */
  var avoidCss = document.createElement('style');
  avoidCss.textContent = '.generate-bar,.bottom-actions,.publish-bar,.bottom-bar{bottom:calc(76px + env(safe-area-inset-bottom))!important}' +
    '.modal-overlay{z-index:500!important}' +
    '.modal-sheet{max-height:70vh;overflow:auto}';
  document.head.appendChild(avoidCss);

  /* ---------- 额度条文案 ---------- */
  function quotaText(kind, unit) {
    var q = S.quotaInfo(kind);
    if (!q) return '';
    if (q.unlimited || q.remaining === '∞') return '免费发布 · 无限制';
    if (q.freeLeft > 0) return '免费额度内 · 今日剩余 ' + q.freeLeft + ' ' + unit;
    return '免费额度已用完 · ' + q.cost + ' 灵晶/' + unit + ' · 余额 ' + S.getCoins().crystal;
  }
  function setQuotaLine(kind, unit) {
    var el = document.querySelector('.cost-info');
    if (el) el.textContent = quotaText(kind, unit);
  }

  /* ---------- AI 候选渲染（统一 3-5 条 + 换一批 + 我来说）---------- */
  function renderCands(elId, kind, ctx, onPick) {
    var box = document.getElementById(elId);
    if (!box) return;
    box.innerHTML = '<div class="ai-loading">AI 正在构思<div class="dots"><span></span><span></span><span></span></div></div>';
    setTimeout(function () {
      var list = A.candidates(kind, ctx, 4);
      box.innerHTML = list.map(function (x, i) {
        return '<div class="candidate-item" data-i="' + i + '"><div class="ci">' + x.icon + '</div>' +
          '<div class="cf"><div class="cn">' + x.name + '</div><div class="cd">' + x.detail + '</div></div></div>';
      }).join('') +
        '<div style="text-align:center;margin-top:8px;display:flex;gap:16px;justify-content:center">' +
        '<span style="font-size:12px;color:var(--xinyu);cursor:pointer" id="lj-ai-more">🔄 换一批</span>' +
        '<span style="font-size:12px;color:var(--xinyu);cursor:pointer" id="lj-ai-mine">✍️ 我来说</span></div>';
      Array.prototype.forEach.call(box.querySelectorAll('.candidate-item'), function (n, i) {
        n.onclick = function () {
          Array.prototype.forEach.call(box.querySelectorAll('.candidate-item'), function (c) { c.classList.remove('selected'); });
          n.classList.add('selected');
          onPick(list[i]);
        };
      });
      box.querySelector('#lj-ai-more').onclick = function () { A.rotate(); renderCands(elId, kind, ctx, onPick); };
      box.querySelector('#lj-ai-mine').onclick = function () {
        var mine = prompt('我来说（自由输入）：');
        if (mine) onPick({ name: '我的方案', detail: mine });
      };
    }, 900);
  }

  /* ---------- 通用生成流程（额度→扣费→弹窗→确认入库存档）---------- */
  function mediaFlow(kind, unit, typeName, modalId, gridId, extra) {
    var res = S.consume(kind);
    if (!res.ok) {
      S.toast('warn', '灵晶不足', '需要 ' + res.need + ' 灵晶，当前余额 ' + res.balance + '，请先充值');
      return;
    }
    var m = document.getElementById(modalId);
    if (m) m.classList.add('show');
    S.toast(res.free ? 'info' : 'ok',
      res.free ? '已生成 4 个候选' : '已生成 4 个候选（超额）',
      res.free ? '免费额度内，今日剩余 ' + res.left + ' ' + unit : '本次消耗 ' + res.charged + ' 灵晶，余额 ' + res.balance);
    setQuotaLine(kind, unit);
    window.__ljLastConsume = res;
    if (typeof extra === 'function') extra();
  }
  function mediaConfirm(kind, typeName) {
    var m = document.querySelector('.modal-overlay.show');
    if (m) m.classList.remove('show');
    S.addMedia({ type: kind, name: typeName });
    S.toast('ok', typeName + '已保存', '可在灵境工坊·我的作品/素材库中查看');
  }

  /* ================= 按页面接线 ================= */

  if (page === 'create-image' || page === 'create-video') {
    var kind = page === 'create-image' ? 'image' : 'video';
    var unit = kind === 'image' ? '张' : '条';
    document.addEventListener('DOMContentLoaded', function () { setQuotaLine(kind, unit); });
    if (typeof window.gen === 'function') {
      window.gen = function () {
        mediaFlow(kind, unit, kind === 'image' ? '图片' : '视频', 'resultModal', 'resultGrid');
      };
    }
    if (typeof window.confirm === 'function' || true) {
      window.confirm = function () { mediaConfirm(kind, kind === 'image' ? '图片' : '视频'); };
    }
  }

  if (page === 'create-sound') {
    document.addEventListener('DOMContentLoaded', function () { setQuotaLine('sound', '条'); });
    window.gen = function () {
      var r = S.consume('sound');
      if (!r.ok) { S.toast('warn', '灵晶不足', '需要 ' + r.need + ' 灵晶，余额 ' + r.balance); return; }
      S.addMedia({ type: 'sound' });
      S.toast(r.free ? 'ok' : 'ok', '已生成 4 条候选语音',
        r.free ? '免费额度内，今日剩余 ' + r.left + ' 条' : '本次消耗 ' + r.charged + ' 灵晶，余额 ' + r.balance);
      setQuotaLine('sound', '条');
    };
  }

  if (page === 'create-post') {
    window.addMedia = function () { S.toast('info', '选择素材', '图片/视频选择器即将开放，当前可发布纯图文'); };
    window.saveDraft = function () { S.toast('ok', '已保存到草稿箱', '草稿保存在本地'); };
    window.publish = function () {
      var t = document.getElementById('postText');
      if (!t || !t.value.trim()) { S.toast('warn', '内容为空', '写点什么再发布吧'); return; }
      S.addPost({ text: t.value });
      S.toast('ok', '动态发布成功', '已同步到你的创作者主页');
      if (t) t.value = '';
      var n = document.getElementById('charNum'); if (n) n.textContent = '0';
    };
  }

  if (page === 'create-card') {
    window.genCard = function () {
      var r = S.consume('card');
      if (!r.ok) { S.toast('warn', '灵晶不足', '需要 ' + r.need + ' 灵晶，余额 ' + r.balance); return; }
      var sel = document.querySelector('.rarity-card.selected .rl') || document.querySelector('.rarity-card .rl');
      S.addCard({ rarity: sel ? sel.textContent : '普通' });
      S.toast('ok', '灵念已生成', (sel ? sel.textContent : '') + ' · 已存入灵念收藏（' +
        (r.free ? '免费额度内' : '消耗 ' + r.charged + ' 灵晶') + '）');
    };
  }

  if (page === 'agent-create') {
    window.aiDesc = function () {
      renderCands('lj-ai-box', 'agentBehavior', null, function (c) {
        var d = document.getElementById('agentDesc');
        if (d) d.value = c.detail;
      });
      var box = document.getElementById('lj-ai-box');
      if (!box) S.toast('info', 'AI 候选', A.candidates('agentBehavior', null, 3).map(function (x) { return x.name; }).join(' / '));
    };
    window.aiAction = function () { S.toast('info', 'AI 正在生成动作内容', '候选将填充到执行动作列表'); };
    window.aiTemplate = function () { S.toast('info', 'AI 正在生成回复模板', '3-5 条模板候选即将填充'); };
    window.saveAgent = function () {
      var r = S.consume('agentBehavior');
      if (!r.ok) { S.toast('warn', '灵晶不足', '需要 ' + r.need + ' 灵晶，余额 ' + r.balance); return; }
      var name = document.getElementById('agentName');
      S.addBehavior({ name: name ? name.value || '未命名 Agent' : '未命名 Agent' });
      S.toast('ok', 'Agent 创建成功', r.free ? '免费额度内（本月剩余 ' + r.left + ' 次）' : '消耗 ' + r.charged + ' 灵晶');
    };
  }

  if (page === 'voice-clone') {
    window.startClone = function () {
      var cb = document.getElementById('legalCheck') || document.querySelector('input[type=checkbox]');
      if (cb && !cb.checked) {
        S.toast('warn', '需要授权确认', '请先勾选「我拥有该声音的合法授权」');
        return;
      }
      var first = !S.voiceCloneDone();
      var r = S.consume('voiceClone');
      if (!r.ok) { S.toast('warn', '灵晶不足', '需要 ' + r.need + ' 灵晶，余额 ' + r.balance); return; }
      S.markVoiceCloneDone();
      S.toast('ok', '音色复刻已启动', first ? '首次免费 · AI 提取音色特征中（约 3 分钟）' : '本次消耗 ' + r.charged + ' 灵晶');
    };
  }

  /* ================= 灵境工坊首页（V3.0 §4.1）================= */
  if (page === 'workshop') {
    var TYPE_META = {
      novel: { ico: '📖', label: '小说' }, character: { ico: '🪄', label: '角色' },
      prop: { ico: '🎨', label: '道具' }, scene: { ico: '🏔️', label: '场景' }
    };
    function ljRenderWorks(filter) {
      var list = document.getElementById('ljWorkList');
      if (!list) return;
      var works = S.works(filter === 'all' ? null : filter);
      list.innerHTML = works.map(function (w) {
        var m = TYPE_META[w.type] || { ico: '📦', label: '作品' };
        var meta = w.type === 'novel'
          ? (w.status + ' · ' + (w.words || '') + ' · ' + (w.readers || '') + ' · ⭐' + (w.score || '-') + ' · 收益 ' + (w.income || 0) + ' 灵晶')
          : (w.status + ' · ' + (w.desc || m.label) + ' · 收益 ' + (w.income || 0) + ' 灵晶');
        var act = w.type === 'character'
          ? '<button class="asset-action" style="background:rgba(0,184,148,.15);color:var(--world)" onclick="location.href=\'interaction-manage.html\'">互动管理</button>'
          : '';
        return '<div class="asset-item"><div class="asset-thumb">' + m.ico + '</div>' +
          '<div class="asset-info"><div class="asset-name">' + w.title + '</div>' +
          '<div class="asset-meta">' + meta + '</div></div>' + act +
          '<button class="asset-action" onclick="location.href=\'work-editor.html\'">编辑</button></div>';
      }).join('');
    }
    function ljRenderLevel() {
      var s = S.incomeSummary();
      var el = function (id) { return document.getElementById(id); };
      if (el('ljLevelName')) el('ljLevelName').textContent = s.level.lv + ' · ' + s.level.name;
      if (el('ljLevelDesc')) el('ljLevelDesc').textContent = '分成比例 ' + s.level.share + ' · 独家发布 · 有实际收益才分成';
      if (el('ljIncomeTotal')) el('ljIncomeTotal').textContent = s.total.toLocaleString();
      if (el('ljIncomePending')) el('ljIncomePending').textContent = s.pending.toLocaleString();
      if (el('ljWorkCount')) el('ljWorkCount').textContent = S.works().length;
    }
    window.ljWithdraw = function () {
      S.toast('info', 'MVP 阶段提现规则', '收益仅可兑换平台灵晶；月流水超 10 万后接入正式提现（每月 1-5 日 · 最低 100 元）');
    };
    window.ljTpl = function (t) { S.toast('info', t, '预设模板即将开放：选择后自动填充创建向导'); };
    document.addEventListener('DOMContentLoaded', function () {
      ljRenderLevel();
      ljRenderWorks('all');
      var tabs = document.getElementById('ljWorkTabs');
      if (tabs) tabs.addEventListener('click', function (e) {
        var t = e.target.closest('.asset-tab');
        if (!t) return;
        Array.prototype.forEach.call(tabs.querySelectorAll('.asset-tab'), function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        ljRenderWorks(t.getAttribute('data-w') || 'all');
      });
    });
  }

  /* ================= 数据看板（V3.0 §8：AI 优化建议真数据）================= */
  if (page === 'dashboard') {
    window.togglePeriod = function () {
      S.toast('info', '时间范围', '今日 / 本周数据可切换；更多周期即将开放');
    };
    document.addEventListener('DOMContentLoaded', function () {
      var box = document.querySelector('.content') || document.body;
      var old = box.querySelectorAll('[data-lj-sug]');
      Array.prototype.forEach.call(old, function (n) { n.remove(); });
      var list = A.candidates('suggest', null, 5);
      var sec = document.createElement('div');
      sec.setAttribute('data-lj-sug', '1');
      sec.style.cssText = 'padding:0 16px 100px';
      sec.innerHTML = '<div style="font-size:15px;font-weight:600;margin:20px 0 12px">🤖 AI 优化建议</div>' +
        list.map(function (x) {
          return '<div style="background:var(--card,#16213E);border:1px solid rgba(108,92,231,.3);border-radius:12px;padding:12px 14px;margin-bottom:10px">' +
            '<div style="font-size:13px;font-weight:600;color:var(--xinyu,#6C5CE7)">' + x.icon + ' ' + x.name + '</div>' +
            '<div style="font-size:11px;color:var(--sub,#8A8A9A);margin-top:4px;line-height:1.5">' + x.detail + '</div></div>';
        }).join('');
      box.appendChild(sec);
    });
  }

  /* ================= 作品编辑器（保存入库）================= */
  if (page === 'work-editor') {
    window.saveDraft = (function (orig) {
      return function () {
        var nameEl = document.querySelector('input');
        var name = nameEl ? nameEl.value.trim() : '';
        if (orig && !/saveDraft|savePrice/.test(String(orig))) { /* noop */ }
        try { if (typeof orig === 'function') orig(); } catch (e) {}
        if (name) {
          S.addWork({ type: 'novel', title: name, status: '草稿', words: '0 字', income: 0 });
          S.toast('ok', '草稿已保存', '「' + name + '」已存入灵境工坊·我的作品');
        } else {
          S.toast('warn', '未命名', '请先填写作品标题');
        }
      };
    })(window.saveDraft);
  }

  /* ================= 互动管理（四模块真数据）================= */
  if (page === 'interaction-manage') {
    var CHAR = 'char_lin';
    var IMAP = {
      scene: { pid: 'pageScene', key: 'scenes',    pool: 'scene',    label: '互动场景' },
      daily: { pid: 'pageDaily', key: 'events',    pool: 'event',    label: '日常事件' },
      frag:  { pid: 'pageFrag',  key: 'fragments', pool: 'fragment', label: '剧情碎片' },
      coop:  { pid: 'pageCoop',  key: 'missions',  pool: 'mission',  label: '共同任务' }
    };
    var BASE_COUNT = { scenes: 3, events: 5, fragments: 4, missions: 2 }; // 页内演示底数
    function ljRenderCounts() {
      var c = S.interactionCounts(CHAR);
      var keys = ['scenes', 'events', 'fragments', 'missions'];
      var els = document.querySelectorAll('.mod-count');
      Array.prototype.forEach.call(els, function (el, i) {
        if (keys[i]) el.textContent = '已创建 ' + (BASE_COUNT[keys[i]] + (c[keys[i]] || 0)) + '个';
      });
    }
    function ljRenderList(cfg) {
      var pg = document.getElementById(cfg.pid);
      if (!pg) return;
      var ws = pg.querySelector('.ws');
      if (!ws) return;
      Array.prototype.forEach.call(ws.querySelectorAll('[data-lj="1"]'), function (n) { n.remove(); });
      var items = S.interactions(CHAR, cfg.key);
      items.forEach(function (x) {
        var div = document.createElement('div');
        div.className = 'list-item';
        div.setAttribute('data-lj', '1');
        div.innerHTML = '<div class="li-top"><span class="li-name">✨ ' + x.name + '</span>' +
          '<span class="li-status ' + (x.status === 'draft' ? 'draft' : 'active') + '">' +
          (x.status === 'draft' ? '草稿' : '已上线') + '</span></div>' +
          '<div class="li-meta">' + (x.meta || '新建条目') + '</div>' +
          '<div class="li-actions"><button class="btn" onclick="openCreate(\'' + cfgKeyOf(cfg) + '\')">编辑</button>' +
          '<button class="btn danger" onclick="ljDelItem(\'' + cfg.key + '\',\'' + x.id + '\')">删除</button></div>';
        ws.appendChild(div);
      });
    }
    function cfgKeyOf(cfg) {
      return Object.keys(IMAP).filter(function (k) { return IMAP[k] === cfg; })[0] || 'scene';
    }
    window.ljDelItem = function (kind, id) {
      S.removeInteraction(CHAR, kind, id);
      ljRenderCounts();
      ljRenderList(IMAP[Object.keys(IMAP).filter(function (k) { return IMAP[k].key === kind; })[0]]);
      S.toast('ok', '已删除', '条目已从列表移除');
    };
    document.addEventListener('DOMContentLoaded', function () {
      ljRenderCounts();
      Object.keys(IMAP).forEach(function (k) { ljRenderList(IMAP[k]); });
    });
    // 保存：抓表单第一输入项作为名称，入库
    window.saveAndBack = function () {
      var form = document.getElementById('createForm');
      var nameEl = form ? form.querySelector('input') : null;
      var name = nameEl ? nameEl.value.trim() : '';
      if (!name) { S.toast('warn', '名称必填', '请至少填写第一项名称'); return; }
      var cfg = IMAP[createType];
      if (!cfg) { goBack(); return; }
      var sel = form.querySelector('.candidate-item.selected .cd');
      var item = S.addInteraction(CHAR, cfg.key, {
        name: name, detail: sel ? sel.textContent : '',
        status: 'draft', meta: '新建草稿 · 待完善选择点与分支'
      });
      S.toast('ok', '已保存', '「' + item.name + '」已存入' + cfg.label + '（草稿）');
      ljRenderCounts(); ljRenderList(cfg);
      goBack();
    };
    // 新建/编辑表单注入 AI 候选（3-5 条 + 换一批 + 我来说）
    var _ljOpenCreate = window.openCreate;
    window.openCreate = function (type) {
      _ljOpenCreate(type);
      var cfg = IMAP[type];
      if (!cfg) return;
      var form = document.getElementById('createForm');
      if (!form || document.getElementById('lj-ai-box')) return;
      var box = document.createElement('div');
      box.id = 'lj-ai-box';
      box.style.cssText = 'margin-bottom:16px';
      form.insertBefore(box, form.firstChild);
      renderCands('lj-ai-box', cfg.pool, null, function (c) {
        var first = form.querySelector('input');
        if (first && !first.value) first.value = c.name;
      });
    };
  }
})();
