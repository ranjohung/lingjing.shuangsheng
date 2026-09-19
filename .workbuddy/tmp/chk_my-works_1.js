
function showToast(kind, title, msg){
  var c = document.getElementById('toast');
  var t = document.createElement('div');
  t.className = 'toast-item ' + (kind || 'ok');
  t.innerHTML = '<span class="ti"></span><span><b>' + title + '</b>' + (msg ? '<span style="opacity:.65"> · ' + msg + '</span>' : '') + '</span>';
  c.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3000);
}
/* =====================================================================
 * 编辑我的作品 · 历史作品全集（V26 / v526）
 * 数据 = 上传/连载/生成历史（wid 与 work-editor.html WP_WORKS 对齐，点
 * 「继续续写/编辑」直达编辑器对应作品）+ CreatorStore.works() 真实记录
 * ===================================================================== */
var MW_KEY = 'lingjing_v526_myworks_v1';

/* V27：删除作品（确认弹窗 + 本地隐藏名单持久化；Toast 替代 confirm） */
var MW_DEL_KEY = 'lingjing_v527_hidden_works';
function mwHiddenList(){
  try { return JSON.parse(localStorage.getItem(MW_DEL_KEY) || '[]'); } catch (e) { return []; }
}
function mwAskConfirm(title, msg, onOk){
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center';
  var box = document.createElement('div');
  box.style.cssText = 'background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px;max-width:320px;width:calc(100% - 48px);color:var(--text)';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:8px">' + title + '</div>' +
    '<div style="font-size:12px;color:var(--sub);line-height:1.7;margin-bottom:16px">' + msg + '</div>' +
    '<div style="display:flex;gap:10px">' +
    '<button id="mw-c-no" style="flex:1;padding:10px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid var(--line);color:var(--text);font-size:13px;cursor:pointer">取消</button>' +
    '<button id="mw-c-ok" style="flex:1;padding:10px;border-radius:10px;background:linear-gradient(135deg,#E94560,#C73652);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer">确认删除</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  box.querySelector('#mw-c-no').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
  box.querySelector('#mw-c-ok').onclick = function(){ ov.remove(); onOk(); };
}
function mwDelWork(wid){
  var all = mwMerge();
  var hit = null;
  all.forEach(function(w){ if (w.wid === wid) hit = w; });
  var name = hit ? hit.title : '该作品';
  mwAskConfirm('删除作品', '确认删除「' + name + '」？<br/>删除后将从「编辑我的作品」列表移除，收益记录仍保留在数据中心。', function(){
    var list = mwHiddenList();
    if (list.indexOf(wid) < 0) { list.push(wid); try { localStorage.setItem(MW_DEL_KEY, JSON.stringify(list)); } catch (e) {} }
    if (window.CreatorStore && wid && wid.indexOf('w_') === 0) { try { CreatorStore.removeWork(wid); } catch (e) {} }
    renderList();
    showToast('ok', '已删除', '「' + name + '」已从列表移除');
  });
}

var MW_HISTORY = [
  { wid:'changye', title:'《西游记》',        emoji:'🐵', cov:'linear-gradient(160deg,#2E3A6E,#4A3A8C)', st:'pub',     kind:'novel', src:'生成 + 上传', words:'86.2 万字', chap:'更新至第 12 章', info:'连载中 · 1.2 万游玩', score:'4.8',  income:'8,400 灵晶', cont:true },
  { wid:'shanhe',  title:'《山河故人》',      emoji:'🗡️', cov:'linear-gradient(160deg,#6E5A2E,#8C7A3A)', st:'pub',     kind:'novel', src:'上传',        words:'22.7 万字', chap:'已完结',         info:'古风 · 4 个收费点',   score:'4.6',  income:'2,940 灵晶', cont:true },
  { wid:'shenhai', title:'《红楼梦》',        emoji:'🌸', cov:'linear-gradient(160deg,#5E2E3A,#E94560)', st:'draft',   kind:'novel', src:'上传',        words:'73.1 万字', chap:'第 8 章',        info:'未完工 · 等待续写',   score:'—',    income:'',           cont:true },
  { wid:'saibo',   title:'《三国演义》',      emoji:'⚔️', cov:'linear-gradient(160deg,#2E5E56,#00B894)', st:'draft',   kind:'novel', src:'上传',        words:'3.2 万字',  chap:'第 4 章',        info:'未完工 · 等待续写',   score:'—',    income:'',           cont:true },
  { wid:'taohua',  title:'《桃花源记·同人》',  emoji:'📜', cov:'linear-gradient(160deg,#6B2737,#B8863B)', st:'draft',   kind:'novel', src:'上传',        words:'0.8 万字',  chap:'第 2 章',        info:'未完工 · 等待续写',   score:'—',    income:'',           cont:true },
  { wid:'hlmrev',  title:'《红楼梦 · 改版》',  emoji:'🏮', cov:'linear-gradient(160deg,#1F5C4D,#2E8B6E)', st:'review',  kind:'novel', src:'上传',        words:'31.0 万字', chap:'—',              info:'提交于 09-11 · 48 小时内出结果', score:'—', income:'', cont:false },
  { wid:'jiuri',   title:'《旧日灯火》',      emoji:'🕯️', cov:'linear-gradient(160deg,#5A2E3A,#7A3A4A)', st:'offline', kind:'novel', src:'上传',        words:'8.9 万字',  chap:'—',              info:'含未授权素材 08-30 下架 · 可申诉', score:'—', income:'412 灵晶', cont:false }
];

var ST_LABEL = { pub:'已发布', draft:'草稿 · 待续写', review:'审核中', offline:'已下架' };
var MW_TABS = [
  { id:'all',    label:'全部' },
  { id:'pub',    label:'已发布' },
  { id:'draft',  label:'草稿 · 待续写' },
  { id:'review', label:'审核中' },
  { id:'offline',label:'已下架' },
  { id:'asset',  label:'角色 · 道具' }
];
var curTab = 'all';

/* 合并 CreatorStore 真实作品（同名小说并入历史记录） */
function mwMerge(){
  var out = [];
  var idx = {};
  var hidden = mwHiddenList();
  MW_HISTORY.forEach(function (h) {
    if (hidden.indexOf(h.wid) >= 0) return; // V27：已删除的作品不再出现
    var r = {}; for (var k in h) r[k] = h[k];
    out.push(r); idx[h.title] = r;
  });
  var store = (window.CreatorStore ? CreatorStore.works() : []);
  store.forEach(function (w) {
    if (hidden.indexOf(w.id) >= 0) return; // V27：已删除
    var title = w.title || '未命名作品';
    if (w.type === 'novel' && idx[title]) {
      var hit = idx[title];
      if (w.income) hit.income = w.income.toLocaleString() + ' 灵晶';
      if (w.words) hit.words = w.words;
      if (w.score) hit.score = w.score;
      return;
    }
    var isChar = w.type === 'character';
    var isProp = w.type === 'prop';
    var fresh = w.id && w.id.indexOf('w_') === 0 && w.id.length > 8;
    out.push({
      wid: w.id, title: title, st: (w.status === '已发布' ? 'pub' : 'draft'),
      kind: w.type || 'novel',
      emoji: isChar ? '🧑' : (isProp ? '⚔️' : '📖'),
      cov: isChar ? 'linear-gradient(160deg,#3A2E1A,#FFB347)'
         : (isProp ? 'linear-gradient(160deg,#1A2E3A,#6C5CE7)' : 'linear-gradient(160deg,#2E3A6E,#4A3A8C)'),
      src: fresh ? '创建' : '生成',
      words: w.words || '', chap: '', info: w.desc || '',
      score: w.score || '—', income: w.income ? w.income.toLocaleString() + ' 灵晶' : '',
      cont: false, asset: isChar || isProp
    });
  });
  try { localStorage.setItem(MW_KEY, JSON.stringify({ syncedAt: new Date().toISOString(), total: out.length })); } catch (e) {}
  return out;
}

function mwMatch(w){
  if (curTab === 'all') return true;
  if (curTab === 'asset') return !!w.asset;
  return w.st === curTab;
}

function renderTabs(){
  var host = document.getElementById('mw-tabs');
  var html = '';
  MW_TABS.forEach(function (t) {
    html += '<div class="mw-tab' + (curTab === t.id ? ' on' : '') + '" data-tab="' + t.id + '">' + t.label + '</div>';
  });
  host.innerHTML = html;
}

function renderList(){
  var all = mwMerge();
  var list = all.filter(mwMatch);
  var pub = all.filter(function (w) { return w.st === 'pub'; }).length;
  var draft = all.filter(function (w) { return w.st === 'draft'; }).length;
  document.getElementById('mw-sum').innerHTML =
    '共 <b>' + all.length + '</b> 部<span class="sep">·</span>已发布 <b>' + pub + '</b><span class="sep">·</span>' +
    '草稿/待续写 <b>' + draft + '</b><br/>点「继续续写 / 编辑」进入编辑器：改正文、换图、调收费点';
  var box = document.getElementById('mw-list');
  document.getElementById('mw-empty').style.display = list.length ? 'none' : '';
  var html = '';
  list.forEach(function (w) {
    var meta = [];
    if (w.words) meta.push(w.words);
    if (w.info) meta.push(w.info);
    if (w.score && w.score !== '—') meta.push('★ ' + w.score);
    var acts = '';
    if (w.asset) {
      acts += '<span class="a primary" onclick="showToast(\'info\',\'编辑' + (w.kind === 'character' ? '角色' : '道具') + '\',\'在灵境工坊素材库中修改\')">✏️ 编辑</span>';
      acts += '<a class="a" href="workshop.html">🛠 工坊</a>';
    } else if (w.st === 'offline') {
      acts += '<a class="a primary" href="creator-legal.html">⚖️ 申诉</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&tab=edit">✏️ 修改后重新提交</a>';
    } else if (w.st === 'review') {
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&tab=quality">🔍 查看质检</a>';
      acts += '<a class="a ghost" href="dashboard.html">📊 数据</a>';
    } else {
      acts += '<a class="a primary" href="work-editor.html?w=' + w.wid + '&tab=edit">' + (w.cont ? '✍️ 继续续写' : '✏️ 编辑') + '</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&tab=pricing">💰 收费</a>';
      acts += '<a class="a" href="dashboard.html">📊 数据</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&pv=1">👁 预览</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&tab=assets">🖼️ 图片管理</a>';
      acts += '<span class="a" style="color:var(--accent)" onclick="mwDelWork(\'' + w.wid + '\')">🗑 删除</span>';
    }
    html += '<div class="mw-item">' +
      '<div class="cov" style="background:' + w.cov + '">' + w.emoji + '</div>' +
      '<div class="body">' +
        '<div class="t">' + w.title + '</div>' +
        '<div class="tags">' +
          '<span class="tag ' + w.st + '">' + (ST_LABEL[w.st] || w.st) + '</span>' +
          '<span class="tag src">' + w.src + '</span>' +
          (w.chap && w.chap !== '—' ? '<span class="tag">' + w.chap + '</span>' : '') +
        '</div>' +
        (meta.length ? '<div class="s">' + meta.join(' · ') + '</div>' : '') +
        '<div class="acts">' + acts + '</div>' +
      '</div>' +
      (w.income ? '<span class="earn">' + w.income + '</span>' : '') +
    '</div>';
  });
  box.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function () {
  renderTabs();
  renderList();
  document.getElementById('mw-tabs').addEventListener('click', function (ev) {
    var t = ev.target.closest('.mw-tab');
    if (!t) return;
    curTab = t.getAttribute('data-tab');
    renderTabs();
    renderList();
  });
});
