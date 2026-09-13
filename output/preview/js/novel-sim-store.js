/* =====================================================================
 * V21-A · 小说辅助模拟器数据中枢（novel-sim-store.js）
 * 镜像 PRD-v21 §3 F-8 五表（localStorage 前缀 lingjing_v521_）：
 *   brief（创作简报） / outline（novel_outlines） / chapter_plans（novel_chapter_plans）
 *   chapters（正文+版本） / characters（character_profiles） / foreshadows（foreshadowing_tracker）
 *   ai_logs（ai_generation_logs）
 * 规则：
 *   - outline 锁定态机 draft → confirmed → locked；locked 时拒绝草稿写入
 *   - chapter_plans 锁定后不可改（plans_status）
 *   - 所有写入即时持久化
 * ===================================================================== */

window.NovelSimStore = {
  KEY: 'lingjing_v521_novsim_v1',

  _default: function () {
    return {
      meta: { title: '未命名作品', updatedAt: null },
      brief: null,
      outline: { status: 'draft', theme: '', background: '', main_plot: '',
                 turning_points: [], ending_direction: '', confirmed_at: null },
      plans_status: 'draft',
      chapter_plans: [],
      chapters: {},
      characters: [],
      foreshadows: [],
      ai_logs: []
    };
  },

  load: function () {
    try {
      var raw = localStorage.getItem(this.KEY);
      if (!raw) return this._default();
      var obj = JSON.parse(raw);
      var base = this._default();
      for (var k in base) { if (obj[k] === undefined) obj[k] = base[k]; }
      return obj;
    } catch (e) { return this._default(); }
  },

  save: function (proj) {
    proj.meta.updatedAt = new Date().toISOString();
    try { localStorage.setItem(this.KEY, JSON.stringify(proj)); } catch (e) {}
    return proj;
  },

  reset: function () {
    try { localStorage.removeItem(this.KEY); } catch (e) {}
    return this._default();
  },

  /* ---------- 创作简报 ---------- */
  getBrief: function () { return this.load().brief; },
  setBrief: function (brief) {
    var p = this.load();
    p.brief = brief;
    if (brief && brief.title) p.meta.title = brief.title;
    return this.save(p);
  },

  /* ---------- 大纲（锁定状态机） ---------- */
  getOutline: function () { return this.load().outline; },
  saveOutlineDraft: function (patch) {
    var p = this.load();
    if (p.outline.status === 'locked') return { ok: false, reason: 'locked' };
    for (var k in patch) { p.outline[k] = patch[k]; }
    p.outline.status = 'confirmed';
    return this.save(p), { ok: true };
  },
  confirmOutline: function () {
    var p = this.load();
    p.outline.status = 'locked';
    p.outline.confirmed_at = new Date().toISOString();
    return this.save(p);
  },
  unlockOutline: function () {
    var p = this.load();
    p.outline.status = 'draft';
    p.plans_status = 'draft';
    return this.save(p);
  },

  /* ---------- 章节规划 ---------- */
  getPlans: function () { return this.load().chapter_plans; },
  plansLocked: function () { return this.load().plans_status === 'locked'; },
  setPlans: function (list) {
    var p = this.load();
    if (p.plans_status === 'locked') return { ok: false, reason: 'locked' };
    p.chapter_plans = list;
    return this.save(p), { ok: true };
  },
  lockPlans: function () {
    var p = this.load();
    p.plans_status = 'locked';
    return this.save(p);
  },
  unlockPlans: function () {
    var p = this.load();
    p.plans_status = 'draft';
    return this.save(p);
  },

  /* ---------- 正文（含版本） ---------- */
  getChapter: function (no) { return this.load().chapters[String(no)] || null; },
  saveChapter: function (no, patch) {
    var p = this.load();
    var key = String(no);
    var cur = p.chapters[key] || { title: '', content: '', wordcount: 0, versions: [], saved_at: null };
    var changed = false;
    for (var k in patch) {
      if (cur[k] !== patch[k]) { changed = true; cur[k] = patch[k]; }
    }
    if (typeof cur.content === 'string') cur.wordcount = cur.content.replace(/\s/g, '').length;
    if (changed && cur.content) {
      cur.versions.push({ at: new Date().toISOString(), wordcount: cur.wordcount });
      if (cur.versions.length > 20) cur.versions.shift();
    }
    cur.saved_at = new Date().toISOString();
    p.chapters[key] = cur;
    this.save(p);
    return cur;
  },
  setChapterStatus: function (no, status) {
    var p = this.load();
    var plan = p.chapter_plans[Number(no) - 1];
    if (plan) { plan.status = status; }
    this.save(p);
  },
  totalWords: function () {
    var p = this.load(), n = 0;
    Object.keys(p.chapters).forEach(function (k) { n += p.chapters[k].wordcount || 0; });
    return n;
  },

  /* ---------- 人物小传 ---------- */
  getCharacters: function () { return this.load().characters; },
  addCharacter: function (c) {
    var p = this.load();
    c.id = 'chr_' + Date.now();
    p.characters.push(c);
    this.save(p);
    return c;
  },
  removeCharacter: function (id) {
    var p = this.load();
    p.characters = p.characters.filter(function (x) { return x.id !== id; });
    this.save(p);
  },

  /* ---------- 伏笔追踪 ---------- */
  getForeshadows: function () { return this.load().foreshadows; },
  addForeshadow: function (f) {
    var p = this.load();
    f.id = 'fs_' + Date.now();
    f.status = f.status || 'introduced';
    p.foreshadows.push(f);
    this.save(p);
    return f;
  },
  setForeshadowStatus: function (id, status) {
    var p = this.load();
    p.foreshadows.forEach(function (x) { if (x.id === id) x.status = status; });
    this.save(p);
  },

  /* ---------- AI 生成日志（≙ ai_generation_logs） ---------- */
  addAiLog: function (type, contextUsed, candidatesN, selected) {
    var p = this.load();
    p.ai_logs.push({ type: type, context_used: contextUsed || '', candidates_n: candidatesN || 0,
                     selected: selected === undefined ? null : selected,
                     created_at: new Date().toISOString() });
    if (p.ai_logs.length > 100) p.ai_logs.shift();
    this.save(p);
  },
  getAiLogs: function () { return this.load().ai_logs; }
};
