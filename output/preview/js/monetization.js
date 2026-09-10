/* v5.14 — 收费点 + 收益分成引擎
   22 种收费点（5 大类）：
     1. 剧情锁（5）：主线锁/番外锁/角色线锁/隐藏剧情锁/真结局锁
     2. 属性道具（5）：好感度/属性加成/金钱/声望/全档通用
     3. 卡牌/收集品（4）：角色卡牌/CG卡牌/命运卡牌/限定收藏品
     4. 外观/装饰（5）：角色服装/场景皮肤/聊天气泡/头像框/称号
     5. 功能性解锁（3）：上帝视角/好感度可视化/路线图
   作者定价：10-5000 灵晶
   收益分成：基础 5 档（50/60/70/75/80%）+ 阶梯加成
*/
(function () {
  if (window.Monetization) return;

  // ====== 22 种收费点 schema 定义 ======
  const POINT_TYPES = [
    // 剧情锁
    { type: 'chapter_lock',     category: 'story',    name: '主线锁',     icon: '🔒', desc: '锁住主线关键剧情，购买后解锁',
      fields: ['chapter_id', 'price'] },
    { type: 'extra_lock',       category: 'story',    name: '番外锁',     icon: '📕', desc: '锁住番外篇，购买后解锁',
      fields: ['extra_id', 'price'] },
    { type: 'route_lock',       category: 'story',    name: '角色线锁',   icon: '💞', desc: '锁住某角色的个人线',
      fields: ['char_id', 'price'] },
    { type: 'hidden_lock',      category: 'story',    name: '隐藏剧情锁', icon: '🕵', desc: '需特定条件触发的隐藏剧情',
      fields: ['condition', 'price'] },
    { type: 'true_end_lock',    category: 'story',    name: '真结局锁',   icon: '👑', desc: '锁住 True Ending',
      fields: ['condition', 'price'] },
    // 属性道具
    { type: 'affection_item',   category: 'item',     name: '好感度道具', icon: '💗', desc: '使用后增加指定角色好感度',
      fields: ['char_id', 'value', 'price'] },
    { type: 'attr_item',        category: 'item',     name: '属性加成',   icon: '📈', desc: '增加智慧/勇气/魅力等属性',
      fields: ['attr_key', 'value', 'price'] },
    { type: 'money_item',       category: 'item',     name: '金钱道具',   icon: '💰', desc: '使用后获得游戏内金钱',
      fields: ['amount', 'price'] },
    { type: 'reputation_item',  category: 'item',     name: '声望道具',   icon: '🏆', desc: '使用后增加声望',
      fields: ['value', 'price'] },
    { type: 'perm_item',        category: 'item',     name: '全档通用',   icon: '♾️', desc: '重开存档后仍生效的永久道具',
      fields: ['effect', 'price'] },
    // 卡牌/收集品
    { type: 'char_card',        category: 'card',     name: '角色卡牌',   icon: '🎴', desc: '解锁角色的专属卡牌',
      fields: ['char_id', 'rarity', 'price'] },
    { type: 'cg_card',          category: 'card',     name: 'CG 卡牌',    icon: '🖼️', desc: '解锁剧情 CG',
      fields: ['cg_id', 'price'] },
    { type: 'fate_card',        category: 'card',     name: '命运卡牌',   icon: '✨', desc: '游玩中生成的命运卡，可分享',
      fields: ['skin_id', 'price'] },
    { type: 'limited_card',     category: 'card',     name: '限定收藏品', icon: '💎', desc: '限时限量的特殊收藏品',
      fields: ['quantity', 'price'] },
    // 外观/装饰
    { type: 'costume',          category: 'cosmetic', name: '角色服装',   icon: '👘', desc: '解锁角色专属服装',
      fields: ['char_id', 'costume_id', 'price'] },
    { type: 'scene_skin',       category: 'cosmetic', name: '场景皮肤',   icon: '🌃', desc: '解锁特殊场景背景',
      fields: ['scene_id', 'price'] },
    { type: 'bubble',           category: 'cosmetic', name: '聊天气泡',   icon: '💬', desc: '解锁专属对话气泡样式',
      fields: ['bubble_id', 'price'] },
    { type: 'avatar_frame',     category: 'cosmetic', name: '头像框',     icon: '🖼', desc: '解锁专属头像框',
      fields: ['frame_id', 'price'] },
    { type: 'title',            category: 'cosmetic', name: '称号',       icon: '🎖️', desc: '解锁专属称号',
      fields: ['title_text', 'price'] },
    // 功能性解锁
    { type: 'god_view',         category: 'functional', name: '上帝视角',  icon: '👁️', desc: '查看所有角色隐藏信息和内心独白',
      fields: ['price'] },
    { type: 'affection_visible', category: 'functional', name: '好感度可视化', icon: '📊', desc: '显示精确好感度数值',
      fields: ['price'] },
    { type: 'route_map',        category: 'functional', name: '路线图',     icon: '🗺', desc: '查看所有路线和解锁状态',
      fields: ['price'] }
  ];

  const POINT_TYPE_MAP = Object.fromEntries(POINT_TYPES.map(p => [p.type, p]));

  // ====== 5 档作者等级 + 分成比例 ======
  const AUTHOR_TIERS = [
    { level: 1, name: '青铜',  ratio: 0.50, color: '#cd7f32', minPlays: 0 },
    { level: 2, name: '白银',  ratio: 0.60, color: '#c0c0c0', minPlays: 100 },
    { level: 3, name: '黄金',  ratio: 0.70, color: '#ffd700', minPlays: 1000 },
    { level: 4, name: '钻石',  ratio: 0.75, color: '#b9f2ff', minPlays: 10000 },
    { level: 5, name: '传奇',  ratio: 0.80, color: '#ff6b9d', minPlays: 100000 }
  ];

  // ====== 月收入阶梯加成 ======
  const INCOME_BRACKETS = [
    { min: 0,      max: 1000,  ratio: 0.50 },
    { min: 1000,   max: 5000,  ratio: 0.60 },
    { min: 5000,   max: 20000, ratio: 0.70 },
    { min: 20000,  max: Infinity, ratio: 0.80 }
  ];

  // ====== 工具 ======
  function getTypeMeta(type) { return POINT_TYPE_MAP[type] || null; }
  function listTypes(category) {
    return category ? POINT_TYPES.filter(p => p.category === category) : POINT_TYPES;
  }
  function listCategories() {
    return [
      { id: 'story', name: '剧情锁', icon: '🔒', desc: '锁住关键剧情，购买后解锁' },
      { id: 'item', name: '属性道具', icon: '📦', desc: '使用后获得数值加成' },
      { id: 'card', name: '卡牌收集', icon: '🎴', desc: '解锁角色卡牌/CG/限定品' },
      { id: 'cosmetic', name: '外观装饰', icon: '👗', desc: '解锁服装/场景/气泡/称号' },
      { id: 'functional', name: '功能解锁', icon: '⚙️', desc: '解锁上帝视角/路线图等' }
    ];
  }

  // ====== 收费点 CRUD ======
  function createPoint(novelId, creatorId, pointData) {
    const meta = getTypeMeta(pointData.point_type);
    if (!meta) throw new Error('[Monetization] 未知收费点类型: ' + pointData.point_type);
    const price = parseInt(pointData.price, 10);
    if (!(price >= 10 && price <= 5000)) {
      throw new Error('[Monetization] 价格必须在 10-5000 灵晶之间');
    }
    const record = {
      novel_id: novelId,
      creator_id: creatorId,
      point_type: pointData.point_type,
      point_name: pointData.point_name || meta.name,
      point_description: pointData.point_description || meta.desc,
      price,
      trigger_condition: pointData.trigger_condition || {},
      effect: pointData.effect || {},
      is_active: pointData.is_active !== false
    };
    if (!window.DB?.monetization?.put) throw new Error('[Monetization] DB 未加载');
    return window.DB.monetization.put(record);
  }
  function updatePoint(id, patch) {
    if (!window.DB?.monetization?.put) return null;
    const existing = window.DB.monetization.get(id);
    if (!existing) return null;
    return window.DB.monetization.put({ ...existing, ...patch, id });
  }
  function deletePoint(id) {
    return window.DB?.monetization?.remove(id) || false;
  }
  function listPointsByNovel(novelId) {
    if (!window.DB?.monetization?.queryBy) return [];
    return window.DB.monetization.queryBy('novel_id', novelId);
  }
  function toggleActive(id) {
    const p = window.DB?.monetization?.get(id);
    if (!p) return null;
    return updatePoint(id, { is_active: !p.is_active });
  }

  // ====== 收益分成计算 ======
  function calcShare(grossAmount, authorLevel = 1, monthlyIncome = 0) {
    const tier = AUTHOR_TIERS.find(t => t.level === authorLevel) || AUTHOR_TIERS[0];
    const base = tier.ratio;
    // 阶梯加成（取基础和阶梯中较高者）
    const bracket = INCOME_BRACKETS.find(b => monthlyIncome >= b.min && monthlyIncome < b.max) || INCOME_BRACKETS[0];
    const bracketRatio = bracket.ratio;
    const finalRatio = Math.max(base, bracketRatio);
    const creatorShare = Math.floor(grossAmount * finalRatio);
    const platformShare = grossAmount - creatorShare;
    return {
      grossAmount,
      finalRatio,
      creatorShare,
      platformShare,
      authorLevel: tier,
      bracket
    };
  }

  // ====== 模拟一笔购买 ======
  function simulatePurchase(novelId, pointId, buyerId = 'guest', authorLevel = 1, monthlyIncome = 0) {
    const point = window.DB?.monetization?.get(pointId);
    if (!point) throw new Error('[Monetization] 收费点不存在: ' + pointId);
    if (!point.is_active) throw new Error('[Monetization] 收费点已下架');
    if (point.novel_id !== novelId) throw new Error('[Monetization] 收费点与小说不匹配');
    const share = calcShare(point.price, authorLevel, monthlyIncome);
    const earning = window.DB.earnings.put({
      creator_id: point.creator_id,
      novel_id: novelId,
      source_type: point.category === 'story' ? 'chapter_purchase' : 'item_purchase',
      source_id: pointId,
      gross_amount: point.price,
      platform_share: share.platformShare,
      creator_share: share.creatorShare,
      status: 'pending'
    });
    return { point, share, earning };
  }

  // ====== 收益看板 ======
  function getEarningsBoard(creatorId) {
    if (!window.DB?.earnings?.queryBy) return null;
    const list = window.DB.earnings.queryBy('creator_id', creatorId);
    const total = list.reduce((s, e) => s + e.gross_amount, 0);
    const pending = list.filter(e => e.status === 'pending').reduce((s, e) => s + e.creator_share, 0);
    const settled = list.filter(e => e.status === 'settled').reduce((s, e) => s + e.creator_share, 0);
    const withdrawn = list.filter(e => e.status === 'withdrawn').reduce((s, e) => s + e.creator_share, 0);
    return {
      creatorId,
      totalGross: total,
      pendingCreator: pending,
      settledCreator: settled,
      withdrawnCreator: withdrawn,
      totalCount: list.length,
      items: list.slice(-20).reverse()
    };
  }

  // ====== 校验价格 ======
  function validatePrice(price) {
    const p = parseInt(price, 10);
    if (isNaN(p)) return { ok: false, msg: '价格必须是数字' };
    if (p < 10) return { ok: false, msg: '最低 10 灵晶' };
    if (p > 5000) return { ok: false, msg: '最高 5000 灵晶' };
    if (p < 50 || p > 500) return { ok: true, warn: '建议价格 50-500 灵晶' };
    return { ok: true };
  }

  // ====== 暴露 API ======
  window.Monetization = {
    POINT_TYPES, POINT_TYPE_MAP, AUTHOR_TIERS, INCOME_BRACKETS,
    getTypeMeta, listTypes, listCategories,
    createPoint, updatePoint, deletePoint, listPointsByNovel, toggleActive,
    calcShare, simulatePurchase, getEarningsBoard, validatePrice
  };
  console.log('[v5.14] Monetization 加载完成 · 22 种收费点 · 5 档作者等级');
})();