
document.addEventListener('click', function (e) {
  var el = e.target;
  while (el && el.nodeType === 1 && el.tagName !== 'A') el = el.parentElement;
  if (!el || el.tagName !== 'A') return;
  var h = el.getAttribute('href') || '';
  if (h.charAt(0) === '#') {
    if (h.length > 1) {
      e.preventDefault();
      var t = document.getElementById(h.slice(1));
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { window.dispatchEvent(new Event('hashchange')); } catch (err) {}
    }
    return;
  }
  if (!h || /^[a-zA-Z][\w+.\-]*:/.test(h)) return;
  if (/([\w.\-]+)\.html(\?|#|$)/.test(h)) {
    e.preventDefault();
    window.LJNav(h);
  }
}, true);

/* ====== V27 收费道具（P2：类型/名称/描述/价格/图片/触发条件 + 编辑/删除）====== */
var MONET_KEY = 'lingjing_v527_monet_items';
var BASE_MONET = [
  { id: 'm_tideng', ico: '🔦', type: 'functional', name: '提灯·照亮场景', desc: '解锁隐藏场景描写 · 影响剧情分支', price: 10, trigger: '第三章起' },
  { id: 'm_yaoshi', ico: '🔑', type: 'functional', name: '夜门钥匙', desc: '解锁地下世界支线剧情', price: 20, trigger: '第四章起' },
  { id: 'm_diaozhui', ico: '📿', type: 'collectible', name: '守夜人吊坠', desc: '解锁酒馆女人 backstory', price: 15, trigger: '第五章起' }
];
var MONET_TYPES = [
  { id: 'plot', label: '剧情锁' }, { id: 'attr', label: '属性道具' }, { id: 'collectible', label: '收藏品' },
  { id: 'skin', label: '外观装饰' }, { id: 'functional', label: '功能性解锁' }
];
function monetAll(){
  var wid = currentWorkId();
  var store = {};
  try { store = JSON.parse(localStorage.getItem(MONET_KEY) || '{}'); } catch (e) {}
  var mine = store[wid] || [];
  var hidden = [];
  try { hidden = JSON.parse(localStorage.getItem(MONET_KEY + '_hidden') || '[]'); } catch (e2) {}
  var out = [];
  BASE_MONET.forEach(function(b){
    if (hidden.indexOf(b.id) >= 0) return;
    for (var i = 0; i < mine.length; i++) if (mine[i].id === b.id) return;
    out.push(b);
  });
  mine.forEach(function(u){ out.push(u); });
  return out;
}
function monetSaveList(wid, list){
  var store = {};
  try { store = JSON.parse(localStorage.getItem(MONET_KEY) || '{}'); } catch (e) {}
  store[wid] = list;
  try { localStorage.setItem(MONET_KEY, JSON.stringify(store)); } catch (e2) {}
}
function renderMonetItems(){
  var host = document.getElementById('monetItemList');
  if (!host) return;
  var list = monetAll();
  var html = '';
  list.forEach(function(m){
    html += '<div class="pricing-row" data-mid="' + m.id + '">' +
      '<div style="width:40px;height:40px;border-radius:8px;background:rgba(233,69,96,.15);display:grid;place-items:center;font-size:20px;flex-shrink:0;overflow:hidden">' + (m.url ? '<img src="' + m.url + '" style="width:100%;height:100%;object-fit:cover">' : (m.ico || '💎')) + '</div>' +
      '<div class="pr-info" style="padding:0 10px"><div class="pr-name">' + m.name + '</div>' +
      '<div class="pr-desc">' + (m.desc || '') + (m.trigger ? ' · ' + m.trigger : '') + '</div></div>' +
      '<div class="pr-price" style="margin-right:6px">' + m.price + ' 灵晶</div>' +
      '<div class="mn-acts">' +
      '<span class="mn-btn" data-act="edit" data-id="' + m.id + '">编辑</span>' +
      '<span class="mn-btn" data-act="del" data-id="' + m.id + '">删除</span></div>' +
      '</div>';
  });
  host.innerHTML = html || '<div style="font-size:11px;color:var(--sub);padding:6px 2px 10px">暂无收费道具，点下方添加</div>';
  Array.prototype.forEach.call(host.querySelectorAll('.mn-btn'), function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-id');
      if (btn.getAttribute('data-act') === 'edit') openAddPricingItem(id);
      else monetAskDel(id);
    });
  });
}
function monetAskDel(id){
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:8px">删除收费点</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,.6);margin-bottom:16px">确认删除该收费点？删除后读者将免费访问对应内容。</div>' +
    '<div style="display:flex;gap:10px">' +
    '<button id="md-no" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;cursor:pointer">取消</button>' +
    '<button id="md-ok" style="flex:1;padding:10px;border-radius:8px;background:linear-gradient(135deg,#E94560,#C73652);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer">确认删除</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  box.querySelector('#md-no').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
  box.querySelector('#md-ok').onclick = function(){
    ov.remove();
    var wid = currentWorkId();
    var store = {};
    try { store = JSON.parse(localStorage.getItem(MONET_KEY) || '{}'); } catch (e) {}
    var mine = store[wid] || [];
    var isUser = false;
    store[wid] = mine.filter(function(x){ if (x.id === id) { isUser = true; return false; } return true; });
    monetSaveList(wid, store[wid]);
    if (!isUser) {
      var hidden = [];
      try { hidden = JSON.parse(localStorage.getItem(MONET_KEY + '_hidden') || '[]'); } catch (e2) {}
      if (hidden.indexOf(id) < 0) { hidden.push(id); try { localStorage.setItem(MONET_KEY + '_hidden', JSON.stringify(hidden)); } catch (e3) {} }
    }
    renderMonetItems();
    showToast('ok', '已删除', '收费点已移除');
  };
}
var __pi = { ico: '💎', url: '', type: 'functional' };
function openAddPricingItem(editId){
  __pi = { ico: '💎', url: '', type: 'functional' };
  var editing = null;
  if (editId) { monetAll().forEach(function(m){ if (m.id === editId) editing = m; }); }
  if (editing) { __pi.type = editing.type || 'functional'; __pi.ico = editing.ico || '💎'; __pi.url = editing.url || ''; }
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  var pills = '';
  MONET_TYPES.forEach(function(t){
    pills += '<span class="type-pill' + (t.id === __pi.type ? ' on' : '') + '" data-t="' + t.id + '">' + t.label + '</span>';
  });
  box.innerHTML = '<div style="font-size:16px;font-weight:700;margin-bottom:14px">' + (editing ? '编辑收费道具' : '添加收费道具') + '</div>' +
    '<div style="margin-bottom:12px"><div class="lj-f-label">道具类型</div>' + pills + '</div>' +
    '<div style="margin-bottom:12px"><div class="lj-f-label">道具名称</div>' +
    '<input id="piName" class="lj-f-input" placeholder="如：玄铁剑" value="' + (editing ? editing.name : '') + '"></div>' +
    '<div style="margin-bottom:12px"><div class="lj-f-label">道具描述</div>' +
    '<textarea id="piDesc" class="lj-f-input" style="min-height:52px;resize:none" placeholder="一把传说中的玄铁剑，攻击力+10">' + (editing ? (editing.desc || '') : '') + '</textarea></div>' +
    '<div style="margin-bottom:12px"><div class="lj-f-label">价格（灵晶）</div>' +
    '<input id="piPrice" type="number" min="1" class="lj-f-input" value="' + (editing ? editing.price : 10) + '"></div>' +
    '<div style="margin-bottom:12px"><div class="lj-f-label">道具图片</div>' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
    '<span class="mn-btn" id="piUp" style="padding:7px 12px">📤 上传本地图片</span>' +
    '<span class="mn-btn" id="piAi" style="padding:7px 12px">✨ AI 生成</span>' +
    '<span class="mn-btn" id="piPre" style="padding:7px 12px">🗄 预设库</span>' +
    '<span id="piPrev" style="width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.06);display:grid;place-items:center;font-size:18px;overflow:hidden;flex-shrink:0">' + (editing && editing.url ? '<img src="' + editing.url + '" style="width:100%;height:100%;object-fit:cover">' : (editing ? editing.ico : '💎')) + '</span>' +
    '<input type="file" id="piFile" accept="image/jpeg,image/png" style="display:none"></div></div>' +
    '<div style="margin-bottom:16px"><div class="lj-f-label">触发条件</div>' +
    '<input id="piTrig" class="lj-f-input" placeholder="第几章 / 哪个节点，如：第12章结束" value="' + (editing ? (editing.trigger || '') : '') + '"></div>' +
    '<div style="display:flex;gap:10px">' +
    '<button id="piNo" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;cursor:pointer">取消</button>' +
    '<button id="piOk" style="flex:1;padding:10px;border-radius:8px;background:linear-gradient(90deg,#E94560,#6C5CE7);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer">✓ 保存</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  Array.prototype.forEach.call(box.querySelectorAll('.type-pill'), function(pl){
    pl.addEventListener('click', function(){
      Array.prototype.forEach.call(box.querySelectorAll('.type-pill'), function(x){ x.classList.remove('on'); });
      pl.classList.add('on');
      __pi.type = pl.getAttribute('data-t');
    });
  });
  var prevEl = box.querySelector('#piPrev');
  function paintPrev(){ prevEl.innerHTML = __pi.url ? '<img src="' + __pi.url + '" style="width:100%;height:100%;object-fit:cover">' : __pi.ico; }
  box.querySelector('#piUp').addEventListener('click', function(){ box.querySelector('#piFile').click(); });
  box.querySelector('#piFile').addEventListener('change', function(){
    var f = this.files && this.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showToast('warn', '图片过大', '请选择 5MB 以内的 JPG/PNG'); return; }
    var r = new FileReader();
    r.onload = function(ev){ __pi.url = ev.target.result; paintPrev(); showToast('ok', '图片已选择', '点「保存」完成添加'); };
    r.readAsDataURL(f);
  });
  box.querySelector('#piAi').addEventListener('click', function(){ openAiImgPick(function(url){ __pi.url = url; paintPrev(); }); });
  box.querySelector('#piPre').addEventListener('click', function(){
    openPresetPick('prop', function(val, kind){
      if (kind === 'img') { __pi.url = val; }
      else { __pi.url = ''; __pi.ico = val; }
      paintPrev();
    });
  });
  box.querySelector('#piNo').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
  box.querySelector('#piOk').onclick = function(){
    var name = (box.querySelector('#piName').value || '').trim();
    if (!name) { showToast('warn', '请输入道具名称', ''); return; }
    var price = parseInt(box.querySelector('#piPrice').value, 10) || 10;
    var desc = (box.querySelector('#piDesc').value || '').trim() || '新添加的收费道具';
    var trig = (box.querySelector('#piTrig').value || '').trim();
    var wid = currentWorkId();
    var store = {};
    try { store = JSON.parse(localStorage.getItem(MONET_KEY) || '{}'); } catch (e) {}
    var mine = store[wid] || [];
    var item = { id: (editing && editing.id) ? editing.id : ('u_' + Date.now()), type: __pi.type, name: name, desc: desc, price: price, ico: __pi.url ? '' : __pi.ico, url: __pi.url, trigger: trig };
    var replaced = false;
    for (var i = 0; i < mine.length; i++) if (mine[i].id === item.id) { mine[i] = item; replaced = true; break; }
    if (!replaced) mine.push(item);
    monetSaveList(wid, mine);
    ov.remove();
    renderMonetItems();
    showToast('ok', editing ? '✓ 收费道具已更新' : '✓ 收费道具添加成功', name + ' · ' + price + ' 灵晶');
  };
}

/* ====== V27 图片管理（P4：背景/人物/道具 三区 + 版本管理）====== */
var BASE_ASSETS = [
  { key: 'bg_1', type: 'bg', name: '长夜酒馆', desc: '主城 · 第三章核心场景', grad: 'linear-gradient(135deg,#0D1B2A,#1B2838)', emoji: '🏛️' },
  { key: 'bg_2', type: 'bg', name: '西游记街道', desc: '主城 · 霓虹与黑暗交织', grad: 'linear-gradient(135deg,#1A0A2E,#2D1B69)', emoji: '🌃' },
  { key: 'bg_3', type: 'bg', name: '地下通道', desc: '隐藏区域 · 通往夜门', grad: 'linear-gradient(135deg,#0A1628,#1A3050)', emoji: '🚇' },
  { key: 'char_1', type: 'char', name: '李玄', desc: '主角 · 28岁 · 前城市守卫', grad: 'linear-gradient(135deg,#2E3A6E,#4A3A8C)', emoji: '🧑' },
  { key: 'char_2', type: 'char', name: '酒馆女人', desc: '关键NPC · 身份待揭示', grad: 'linear-gradient(135deg,#5E2E3A,#E94560)', emoji: '👩' },
  { key: 'char_3', type: 'char', name: '角落密语者', desc: '配角 · 身份不明 · 监视者', grad: 'linear-gradient(135deg,#1A3A2E,#00B894)', emoji: '🕵️' },
  { key: 'prop_1', type: 'prop', name: '玄铁短刀', desc: '主角随身武器 · 第一章获得', grad: 'linear-gradient(135deg,#3A2E1A,#FFB347)', emoji: '🗡️' },
  { key: 'prop_2', type: 'prop', name: '夜门钥匙', desc: '关键道具 · 通往地下世界', grad: 'linear-gradient(135deg,#1A2E3A,#6C5CE7)', emoji: '🔑' },
  { key: 'prop_3', type: 'prop', name: '守夜人吊坠', desc: '酒馆女人信物 · 伏笔道具', grad: 'linear-gradient(135deg,#2E1A3A,#E94560)', emoji: '📿' },
  { key: 'prop_4', type: 'prop', name: '提灯', desc: '照亮隐藏场景 · 收费道具', grad: 'linear-gradient(135deg,#3A341A,#FFB347)', emoji: '🔦' }
];
var ASSET_FILTER = 'all';
function assetState(){
  var st = wpState();
  st.assets = st.assets || {};
  st.versions = st.versions || {};
  st.hiddenAssets = st.hiddenAssets || {};
  return st;
}
function assetVal(key, base){
  var st = assetState();
  return st.assets[key] || { kind: 'grad', val: '', emoji: base ? base.emoji : '📦', grad: base ? base.grad : 'linear-gradient(135deg,#2A2A4A,#3A3A5A)', name: '' };
}
function assetPaint(imgEl, val, base){
  if (val.kind === 'img') { imgEl.style.background = '#000'; imgEl.style.backgroundImage = 'url("' + val.val + '")'; imgEl.style.backgroundSize = 'cover'; imgEl.style.backgroundPosition = 'center'; imgEl.textContent = ''; }
  else if (val.kind === 'emoji') { imgEl.style.backgroundImage = 'none'; imgEl.style.background = (base ? base.grad : 'linear-gradient(135deg,#2A2A4A,#3A3A5A)'); imgEl.textContent = val.val || (base ? base.emoji : ''); }
  else { imgEl.style.backgroundImage = 'none'; imgEl.style.background = val.val || (base ? base.grad : ''); imgEl.textContent = ''; }
}
function assetCardEl(key, base, isUser){
  var card = document.createElement('div');
  card.className = 'asset-card';
  var img = document.createElement('div');
  img.className = 'ac-img';
  img.style.cssText = 'height:80px;display:grid;place-items:center;font-size:32px';
  var val = assetVal(key, base);
  assetPaint(img, val, base);
  var info = document.createElement('div');
  info.className = 'ac-info';
  var verCount = (assetState().versions[key] || []).length;
  info.innerHTML = '<div class="ac-name">' + (val.name || base.name) + '</div>' +
    '<div class="ac-desc">' + (base.desc || '') + '</div>' +
    '<div class="ac-actions">' +
    '<span class="ac-btn" data-a="rep">🔁 替换</span>' +
    '<span class="ac-btn" data-a="ver">🕘 版本' + (verCount ? '(' + verCount + ')' : '') + '</span>' +
    '<span class="ac-btn" data-a="del" style="color:var(--accent)">🗑 删除</span>' +
    '</div>';
  card.appendChild(img);
  card.appendChild(info);
  img.addEventListener('click', function(){ openAssetSource(key, base.name); });
  info.querySelector('[data-a="rep"]').addEventListener('click', function(){ openAssetSource(key, base.name); });
  info.querySelector('[data-a="ver"]').addEventListener('click', function(){ openAssetVersions(key, base); });
  info.querySelector('[data-a="del"]').addEventListener('click', function(){ assetAskDel(key, base, isUser); });
  return card;
}
function renderAssetPanel(){
  ['bg', 'char', 'prop'].forEach(function(tp){
    var grid = document.getElementById('grid-' + tp);
    if (!grid) return;
    grid.innerHTML = '';
    var st = assetState();
    var sec = document.getElementById('sec-' + tp);
    if (sec) sec.style.display = (ASSET_FILTER === 'all' || ASSET_FILTER === tp) ? '' : 'none';
    BASE_ASSETS.filter(function(b){ return b.type === tp && !st.hiddenAssets[b.key]; }).forEach(function(b){
      grid.appendChild(assetCardEl(b.key, b, false));
    });
    Object.keys(st.assets).forEach(function(k){
      if (k.indexOf('u_') !== 0) return;
      var a = st.assets[k];
      if (a.type !== tp) return;
      grid.appendChild(assetCardEl(k, { key: k, type: tp, name: a.name || '自定义', desc: a.desc || '作者上传', grad: 'linear-gradient(135deg,#2A2A4A,#3A3A5A)', emoji: '📦' }, true));
    });
    var add = document.createElement('div');
    add.className = 'asset-card';
    add.style.cssText = 'display:grid;place-items:center;min-height:140px;border-style:dashed';
    add.innerHTML = '<div style="text-align:center;color:var(--sub)"><div style="font-size:24px;margin-bottom:4px">＋</div><div style="font-size:11px">添加' + (tp === 'bg' ? '背景图' : tp === 'char' ? '人物立绘' : '道具图标') + '</div></div>';
    add.addEventListener('click', function(){ addAssetFlow(tp); });
    grid.appendChild(add);
  });
}
function wireImgFilter(){
  var f = document.getElementById('imgFilter');
  if (!f) return;
  f.addEventListener('click', function(e){
    var t = e.target.closest('.if-tab');
    if (!t) return;
    ASSET_FILTER = t.getAttribute('data-f');
    Array.prototype.forEach.call(f.querySelectorAll('.if-tab'), function(x){ x.classList.remove('on'); });
    t.classList.add('on');
    renderAssetPanel();
  });
}
function openAssetSource(key, name){
  var isCover = key === '__cover__';
  var type = 'prop';
  BASE_ASSETS.forEach(function(b){ if (b.key === key) type = b.type; });
  if (isCover) type = 'prop';
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:4px">🖼 ' + name + ' · 更换图片</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:14px">替换将保留旧版本，可随时回滚</div>' +
    '<div class="src-opt" data-s="up">📤 上传本地图片 <span style="float:right;font-size:11px;color:rgba(255,255,255,.4)">JPG/PNG ≤5MB</span></div>' +
    '<div class="src-opt" data-s="ai">✨ AI 生成 <span style="float:right;font-size:11px;color:rgba(255,255,255,.4)">4 张候选</span></div>' +
    '<div class="src-opt" data-s="pre">🗄 从系统预设库选择</div>' +
    '<div style="margin-top:12px;text-align:center"><button id="asNo" style="padding:9px 24px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;cursor:pointer">取消</button></div>' +
    '<input type="file" id="asFile2" accept="image/jpeg,image/png" style="display:none">';
  ov.appendChild(box);
  document.body.appendChild(ov);
  function apply(val){
    ov.remove();
    if (isCover) { showToast('ok', '封面已更新', '新封面已保存到作品资产库'); return; }
    applyAsset(key, val, name);
  }
  box.querySelector('[data-s="up"]').addEventListener('click', function(){
    var fi = box.querySelector('#asFile2');
    fi.onchange = function(){
      var f = this.files && this.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) { showToast('warn', '图片过大', '请选择 5MB 以内的 JPG/PNG'); return; }
      var r = new FileReader();
      r.onload = function(ev){ apply({ kind: 'img', val: ev.target.result }); };
      r.readAsDataURL(f);
    };
    fi.click();
  });
  box.querySelector('[data-s="ai"]').addEventListener('click', function(){ openAiImgPick(function(url){ apply({ kind: 'img', val: url }); }); });
  box.querySelector('[data-s="pre"]').addEventListener('click', function(){
    openPresetPick(type === 'bg' ? 'bg' : (type === 'char' ? 'char' : 'prop'), function(val, kind){
      if (kind === 'img') apply({ kind: 'img', val: val });
      else if (kind === 'grad') apply({ kind: 'grad', val: val });
      else apply({ kind: 'emoji', val: val });
    });
  });
  box.querySelector('#asNo').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
}
function applyAsset(key, val, name){
  var st = assetState();
  var old = st.assets[key];
  if (old) {
    var vs = st.versions[key] = st.versions[key] || [];
    vs.push({ v: vs.length + 1, kind: old.kind, val: old.val, at: new Date().toLocaleString() });
    if (vs.length > 10) vs.shift();
  }
  val.name = name || (old && old.name) || '';
  st.assets[key] = val;
  wpSave(st);
  renderAssetPanel();
  showToast('ok', '✓ 图片已更新', '替换前版本已保留在「版本」中');
}
function verThumbCss(v, base){
  if (!v) return 'background:linear-gradient(135deg,#2A2A4A,#3A3A5A)';
  if (v.kind === 'img') return 'background-image:url(&quot;' + v.val + '&quot;);background-size:cover;background-position:center';
  if (v.kind === 'grad') return 'background:' + v.val;
  return 'background:' + (base ? base.grad : 'linear-gradient(135deg,#2A2A4A,#3A3A5A)');
}
function openAssetVersions(key, base){
  var st = assetState();
  var vs = st.versions[key] || [];
  var cur = st.assets[key];
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  var rows = '<div class="ver-item"><div class="ver-thumb" style="' + verThumbCss(cur, base) + '">' + (cur && cur.kind === 'emoji' ? cur.val : '') + '</div>' +
    '<div style="font-size:12px"><b>当前使用</b><div style="color:rgba(255,255,255,.45);font-size:10px">' + (cur ? (cur.kind === 'img' ? '图片' : cur.kind === 'emoji' ? '图标' : '预设图') : '默认样式') + '</div></div>' +
    '<span style="margin-left:auto;font-size:10px;color:#4ECCA3">●</span></div>';
  vs.slice().reverse().forEach(function(v){
    rows += '<div class="ver-item"><div class="ver-thumb" style="' + verThumbCss(v, base) + '">' + (v.kind === 'emoji' ? v.val : '') + '</div>' +
      '<div style="font-size:12px">V' + v.v + ' · 替换版<div style="color:rgba(255,255,255,.45);font-size:10px">' + v.at + '</div></div>' +
      '<span class="ver-roll" data-v="' + v.v + '">回滚到此版</span></div>';
  });
  if (!vs.length) rows += '<div style="font-size:12px;color:rgba(255,255,255,.45);text-align:center;padding:14px 0">暂无历史版本 · 替换图片后自动保留</div>';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:12px">🕘 版本管理 · ' + (base ? base.name : key) + '</div>' + rows +
    '<div style="margin-top:12px;text-align:center"><button id="verNo" style="padding:9px 24px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;cursor:pointer">关闭</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  Array.prototype.forEach.call(box.querySelectorAll('.ver-roll'), function(btn){
    btn.addEventListener('click', function(){
      var vn = parseInt(btn.getAttribute('data-v'), 10);
      var hit = null;
      (st.versions[key] || []).forEach(function(v){ if (v.v === vn) hit = v; });
      if (!hit) return;
      var curNow = st.assets[key];
      var vs2 = (st.versions[key] || []).filter(function(v){ return v.v !== vn; });
      st.versions[key] = vs2;
      st.assets[key] = { kind: hit.kind, val: hit.val, name: (base ? base.name : '') };
      if (curNow) vs2.push({ v: vs2.length + 1, kind: curNow.kind, val: curNow.val, at: new Date().toLocaleString() });
      wpSave(st);
      ov.remove();
      renderAssetPanel();
      showToast('ok', '已回滚', 'V' + vn + ' 已恢复为当前使用');
    });
  });
  box.querySelector('#verNo').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
}
function assetAskDel(key, base, isUser){
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:8px">删除图片</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,.6);margin-bottom:16px">确认删除「' + (base ? base.name : key) + '」的图片？删除后恢复默认样式（历史版本一并清除）。</div>' +
    '<div style="display:flex;gap:10px">' +
    '<button id="da-no" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;cursor:pointer">取消</button>' +
    '<button id="da-ok" style="flex:1;padding:10px;border-radius:8px;background:linear-gradient(135deg,#E94560,#C73652);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer">确认删除</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  box.querySelector('#da-no').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
  box.querySelector('#da-ok').onclick = function(){
    ov.remove();
    var st = assetState();
    delete st.assets[key];
    delete st.versions[key];
    if (!isUser) st.hiddenAssets[key] = 1;
    wpSave(st);
    renderAssetPanel();
    showToast('ok', '已删除', '已恢复默认样式');
  };
}
function addAssetFlow(type){
  ljAskText('名称（' + (type === 'bg' ? '背景图' : type === 'char' ? '人物立绘' : '道具图标') + '）', '', function(name){
    var key = 'u_' + Date.now();
    var st = assetState();
    st.assets[key] = { kind: 'grad', val: '', name: name, type: type, desc: '作者添加 · 点缩略图上传图片' };
    wpSave(st);
    renderAssetPanel();
    showToast('ok', '已添加', '「' + name + '」· 正在打开图片来源');
    openAssetSource(key, name);
  });
}

/* ====== V27 AI 生成图片（mock：4 候选 + 换一批）====== */
function aiMockImg(seed){
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="hsl(' + ((seed * 67) % 360) + ',55%,30%)"/>' +
    '<stop offset="1" stop-color="hsl(' + ((seed * 67 + 80) % 360) + ',45%,' + (16 + (seed * 7) % 22) + '%)"/></linearGradient></defs>' +
    '<rect width="240" height="320" fill="url(#g)"/>' +
    '<circle cx="' + (50 + (seed * 37) % 140) + '" cy="' + (70 + (seed * 53) % 180) + '" r="44" fill="rgba(255,255,255,.14)"/>' +
    '<circle cx="' + (170 - (seed * 23) % 100) + '" cy="' + (230 - (seed * 41) % 130) + '" r="24" fill="rgba(255,255,255,.10)"/>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function openAiImgPick(cb){
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:4px">✨ AI 生成</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:12px">免费额度内生成 4 张候选，点击选用</div>' +
    '<div class="preset-grid" id="aiGrid"></div>' +
    '<div style="display:flex;gap:10px;margin-top:14px">' +
    '<button id="aiMore" style="flex:1;padding:9px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;cursor:pointer">🔄 换一批</button>' +
    '<button id="aiNo" style="flex:1;padding:9px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;cursor:pointer">取消</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  var off = 0;
  function paint(){
    var g = box.querySelector('#aiGrid');
    g.innerHTML = '';
    for (var i = 0; i < 4; i++) {
      (function(idx){
        var url = aiMockImg(off * 4 + idx + 1);
        var d = document.createElement('div');
        d.className = 'preset-item';
        d.style.backgroundImage = 'url("' + url + '")';
        d.addEventListener('click', function(){ ov.remove(); cb(url); showToast('ok', '已选用 AI 候选', (idx + 1) + ' 号'); });
        g.appendChild(d);
      })(i);
    }
  }
  paint();
  box.querySelector('#aiMore').onclick = function(){ off++; paint(); };
  box.querySelector('#aiNo').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
}

/* ====== V27 系统预设库 ====== */
var PRESET_BG = [
  'linear-gradient(160deg,#0D1B2A,#1B2838)', 'linear-gradient(160deg,#1A0A2E,#2D1B69)',
  'linear-gradient(160deg,#0A1628,#1A3050)', 'linear-gradient(160deg,#2E1A3A,#4A2A6E)',
  'linear-gradient(160deg,#1A2E20,#2E5E3A)', 'linear-gradient(160deg,#3A2A1A,#6E4A2A)',
  'linear-gradient(160deg,#202A4A,#3A4A8C)', 'linear-gradient(160deg,#3A1A28,#8C3A5A)'
];
var PRESET_CHAR = (function(){ var a = [], i; for (i = 1; i <= 8; i++) a.push('img/novel-forge/xiyouji/por00' + i + '.png'); return a; })();
var PRESET_PROP = ['🗡️', '🔑', '📿', '💎', '🏮', '📜', '⚗️', '🕯️', '🍶', '🪙', '👑', '🔮'];
function openPresetPick(type, cb){
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:12px">🗄 系统预设库</div><div class="preset-grid" id="preGrid"></div>' +
    '<div style="margin-top:14px;text-align:center"><button id="preNo" style="padding:9px 24px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;cursor:pointer">取消</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  var g = box.querySelector('#preGrid');
  if (type === 'bg') {
    PRESET_BG.forEach(function(grad){
      var d = document.createElement('div');
      d.className = 'preset-item';
      d.style.background = grad;
      d.addEventListener('click', function(){ ov.remove(); cb(grad, 'grad'); });
      g.appendChild(d);
    });
  } else if (type === 'char') {
    PRESET_CHAR.forEach(function(src){
      var d = document.createElement('div');
      d.className = 'preset-item';
      d.innerHTML = '<img src="' + src + '" alt="">';
      d.addEventListener('click', function(){ ov.remove(); cb(src, 'img'); });
      g.appendChild(d);
    });
  } else {
    PRESET_PROP.forEach(function(emo){
      var d = document.createElement('div');
      d.className = 'preset-item';
      d.textContent = emo;
      d.addEventListener('click', function(){ ov.remove(); cb(emo, 'emoji'); });
      g.appendChild(d);
    });
  }
  box.querySelector('#preNo').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
}

