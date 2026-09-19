
// Tab 切换
function switchTab(name){
  document.querySelectorAll('.editor-tabs .et').forEach(e=>e.classList.remove('active'));
  document.querySelector('.editor-tabs .et[data-tab="'+name+'"]').classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p=>p.style.display='none');
  document.getElementById('panel-'+name).style.display='block';
}

// 作品切换
function switchWork(el, id){
  document.querySelectorAll('.ws-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  const titles = {changye:'《西游记》', saibo:'《三国演义》'};
  document.getElementById('workTitle').textContent = titles[id] || '未命名作品';
  showToast('ok','切换作品', titles[id]);
}

// 章节选择（V27：切章保存/恢复正文）
function selectChapter(el){
  ljSaveCurChapter();
  document.querySelectorAll('.ch-item').forEach(function(c){ c.classList.remove('current'); });
  el.classList.add('current');
  ljLoadCurChapter();
}

// 添加章节
function addChapter(){
  const vol = event.target.closest('.vol-group');
  const list = vol.querySelector('.ch-list');
  const items = list.querySelectorAll('.ch-item');
  const num = items.length + (vol === document.querySelector('.vol-group') ? 1 : 6);
  const ch = document.createElement('div');
  ch.className = 'ch-item';
  ch.textContent = '第' + ['一','二','三','四','五','六','七','八','九','十'][num-1] + '章';
  ch.onclick = function(){ selectChapter(this); };
  list.insertBefore(ch, list.querySelector('.add-ch'));
}

/* ===== V27 AI 辅助（P3：候选 [使用] 写入正文 + 换一批 + 我来说）===== */
var LJ_AI_OFF = 0;
var LJ_AI_POOLS = {
  continue: [
    '她说完就转身回了柜台。我注意到她转身时，左手腕上有一道很深的疤痕——那不是普通的伤。',
    '她笑了一下：「习惯就好了。在这里，最重要的事情就是习惯。」窗外忽然传来一阵钟声，沉闷而悠远。',
    '她没有回答，只是把我的酒杯斟满。酒液是深红色的，像凝固的暮色。',
    '「有些人来这里是为了逃避，有些人是为了寻找。」她擦着杯子，目光若有若无地扫过我的脸。',
    '灯芯忽然爆了个火星。她的影子在墙上晃了晃，比人慢了半拍。',
    '远处传来打更声。她压低声音：「想知道真话？今夜子时，跟我下地下室。」'
  ],
  polish: [
    '改写A（凝练）：她转身回柜台，腕上疤痕一闪而过——深得反常。',
    '改写B（细节）：她转身回柜台，左手腕上一道旧疤从袖口探出头，像一条爬僵的蜈蚣。',
    '改写C（节奏）：她回了柜台。疤痕。很深。不是普通的伤。',
    '改写D（舒缓）：她慢慢转身回了柜台，我这才注意到，她的左手腕上有一道很深的疤痕。'
  ],
  rewrite: [
    '重写A（内心独白）：我没敢再看第二眼。有些伤是会说话的，比人先开口。',
    '重写B（旁观视角）：那个女人转身回了柜台，顾客们不约而同低下头，像排练过一样。',
    '重写C（对话驱动）：「你的手。」我说。她把袖口拉了下来：「你的酒。」',
    '重写D（意识流）：疤痕。烛火。酒馆。三百年没有太阳的城市里，每道伤疤都有自己的年轮。'
  ],
  scene: [
    '酒馆的橡木吧台被岁月磨得发亮，烛光在酒客们的影子间跳跃，空气中混着麦酒与松木的气味。',
    '窗外阴云低垂，整条街只剩酒馆一盏灯还亮着，像黑海里最后一座灯塔。',
    '阁楼的木地板每走一步都吱呀作响，墙角挂着的老地图边角卷起，标注着谁也没去过的区域。',
    '雨点开始敲打窗棂，酒馆里的谈话声不自觉压低了半度，仿佛整座城市都在侧耳倾听。'
  ],
  dialog: [
    '「你话不多。」她说，「但每句都问在点上。这样的人物，在这座城里活不长——或者活得最长。」',
    '「我在看云。」我说。「云没什么好看的。」她擦着杯子，「看云的人，都在看云后面的事。」',
    '「这里的人不问来路。」她把酒推过来，「但都会问一句话——你打算什么时候走？」',
    '「习惯就好？」我笑了。「不。」她也笑，「习惯不好，但习惯能让你活着。」'
  ]
};
var LJ_AI_TYPE_LABEL = { continue: '续写', polish: '润色', rewrite: '重写', scene: '场景描写', dialog: '对话优化' };
function ljEditorEl(){ return document.getElementById('editorContent'); }
function ljGetContext(){
  var ed = ljEditorEl();
  var text = ed ? (ed.innerText || ed.textContent || '') : '';
  text = text.replace(/\s+/g, '');
  return text.slice(-300) || '当前段落';
}
function ljAiPool(type){
  var pool = (LJ_AI_POOLS[type] || []).slice();
  var out = [];
  var base = (LJ_AI_OFF * 2) % Math.max(1, pool.length);
  for (var i = 0; i < 4 && pool.length; i++) out.push(pool[(base + i) % pool.length]);
  return out;
}
function ljAppendPara(text){
  var ed = ljEditorEl();
  if (!ed) return;
  var p = document.createElement('p');
  p.textContent = text;
  ed.appendChild(p);
  ed.scrollTop = ed.scrollHeight;
  ljUpdateStatusBar();
  ljSaveCurChapter();
}
function ljReplacePara(text){
  var ed = ljEditorEl();
  if (!ed) return;
  var paras = ed.querySelectorAll('p');
  var target = window.__ljActivePara || (paras.length ? paras[paras.length - 1] : null);
  if (!target || !ed.contains(target)) { ljAppendPara(text); return; }
  target.textContent = text;
  ljUpdateStatusBar();
  ljSaveCurChapter();
}
function useCandidate(type, text){
  if (!text) return;
  if (type === 'polish' || type === 'rewrite') ljReplacePara(text);
  else ljAppendPara(text);
  showToast('ok', '✓ 已写入正文', LJ_AI_TYPE_LABEL[type] || '内容');
}
function renderAiCands(type, list){
  var host = document.querySelector('.ai-candidates');
  if (!host) return;
  var html = '';
  list.forEach(function(c, i){
    html += '<div class="ai-cand' + (i === 0 ? ' selected' : '') + '" data-ci="' + i + '">' + c +
      '<div class="cand-acts"><span class="cand-use" data-u="' + i + '">✓ 使用</span></div></div>';
  });
  html += '<div class="cand-bar"><span id="candMore">🔄 换一批</span><span id="candMine">✍️ 我来说</span></div>';
  host.innerHTML = html;
  Array.prototype.forEach.call(host.querySelectorAll('.ai-cand'), function(card){
    card.addEventListener('click', function(ev){
      if (ev.target && ev.target.classList && ev.target.classList.contains('cand-use')) return;
      Array.prototype.forEach.call(host.querySelectorAll('.ai-cand'), function(x){ x.classList.remove('selected'); });
      card.classList.add('selected');
    });
  });
  Array.prototype.forEach.call(host.querySelectorAll('.cand-use'), function(btn){
    btn.addEventListener('click', function(){
      useCandidate(type, list[parseInt(btn.getAttribute('data-u'), 10)]);
    });
  });
  var more = host.querySelector('#candMore');
  if (more) more.addEventListener('click', function(){
    LJ_AI_OFF = (LJ_AI_OFF + 1) % 3;
    renderAiCands(type, ljAiPool(type));
    showToast('info', '已换一批', (LJ_AI_TYPE_LABEL[type] || '') + '候选已刷新');
  });
  var mine = host.querySelector('#candMine');
  if (mine) mine.addEventListener('click', function(){
    ljAskText('我来说（自由输入）', '', function(val){ if (val) useCandidate(type, val); });
  });
}
function ljAskText(label, def, cb){
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  box.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:12px">' + label + '</div>' +
    '<textarea id="lj-ask-ta" class="lj-f-input" style="min-height:90px;resize:none"></textarea>' +
    '<div style="display:flex;gap:10px;margin-top:14px">' +
    '<button id="lj-ask-no" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;cursor:pointer">取消</button>' +
    '<button id="lj-ask-ok" style="flex:1;padding:10px;border-radius:8px;background:linear-gradient(90deg,#E94560,#6C5CE7);border:none;color:#fff;font-size:13px;font-weight:600;cursor:pointer">确定</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  var ta = box.querySelector('#lj-ask-ta');
  ta.value = def || '';
  ta.focus();
  box.querySelector('#lj-ask-no').onclick = function(){ ov.remove(); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
  box.querySelector('#lj-ask-ok').onclick = function(){
    var v = (ta.value || '').trim();
    ov.remove();
    if (v) cb(v);
  };
}
function aiAssist(type){
  if (type === 'ask') {
    ljAskText('向 AI 提问（针对当前内容）', '', function(q){
      showToast('info', 'AI 思考中…', '「' + (q.length > 18 ? q.slice(0, 18) + '…' : q) + '」');
      setTimeout(function(){
        showToast('ok', 'AI 回答', '结合本章目标与伏笔台账：建议在本段末尾埋一处「疤痕」细节，第五章回收（质量分 +0.2）。');
      }, 700);
    });
    return;
  }
  var busy = { polish: '正在润色…', continue: '生成 4 个续写候选…', rewrite: '正在重写…', scene: '生成场景描写…', dialog: '优化对话中…' };
  showToast('info', 'AI 处理中', busy[type] || '');
  setTimeout(function(){
    renderAiCands(type, ljAiPool(type));
    showToast('ok', '✓ ' + (LJ_AI_TYPE_LABEL[type] || '') + '候选已生成', '4 个方向 · 点「使用」写入正文');
  }, 600);
}
function ljUpdateStatusBar(){
  var ed = ljEditorEl();
  var n = 0;
  if (ed) n = (ed.innerText || '').replace(/\s/g, '').length;
  var el = document.getElementById('sbWords');
  if (el) el.textContent = '字数：' + n.toLocaleString();
}
function ljCurChapterKey(){
  var c = document.querySelector('.ch-item.current');
  return c ? c.textContent.trim() : '第一章';
}
function ljSaveCurChapter(){
  try {
    var ed = ljEditorEl();
    if (!ed) return;
    var st = wpState();
    st.content = st.content || {};
    st.content[ljCurChapterKey()] = ed.innerHTML;
    wpSave(st);
  } catch (e) {}
}
function ljLoadCurChapter(){
  try {
    var ed = ljEditorEl();
    if (!ed) return;
    var st = wpState();
    if (st.content && st.content[ljCurChapterKey()]) ed.innerHTML = st.content[ljCurChapterKey()];
    ljUpdateStatusBar();
  } catch (e) {}
}
document.addEventListener('click', function(e){
  var p = e.target && e.target.closest ? e.target.closest('#editorContent p') : null;
  if (p) window.__ljActivePara = p;
});

// 保存
function saveDraft(){
  const btn = document.querySelectorAll('.act-btn')[0];
  btn.textContent = '已保存 ✓';
  btn.style.color = 'var(--ok)';
  setTimeout(()=>{btn.textContent='保存'; btn.style.color='';}, 1500);
}

/* ===== V27 预览（P5：章节选择 → 真实 Runtime → 返回后反馈面板）===== */
var LJ_BOOK_MAP = { changye: 'xiyouji', xiyouji: 'xiyouji', saibo: 'sanguoyanyi', sanguoyanyi: 'sanguoyanyi', shenhai: 'hongloumeng', hongloumeng: 'hongloumeng', hlmrev: 'hongloumeng', taohua: 'xiyouji', jiuri: 'hongloumeng' };
function currentWorkId(){
  var q = LJSearch() || '';
  var m = /[?&]w=([a-zA-Z0-9_-]+)/.exec(q);
  if (m) return m[1];
  return (typeof WP_WORKS !== 'undefined' && WP_WORKS[0]) ? WP_WORKS[0].id : 'changye';
}
function previewWork(){
  var workId = currentWorkId();
  var titleEl = document.getElementById('workTitle');
  var workTitle = titleEl ? titleEl.textContent : '当前作品';
  var chEls = document.querySelectorAll('.ch-item');
  var chapters = [];
  for (var i = 0; i < chEls.length; i++) chapters.push(chEls[i].textContent.trim());
  var overlay = document.createElement('div');
  overlay.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  var rows = '';
  chapters.forEach(function(name, i){
    rows += '<div class="src-opt" data-ch="' + i + '" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px">' +
      '<span style="font-size:13px">' + name + '</span>' +
      '<span style="font-size:11px;color:#4ECCA3">预览此章 →</span></div>';
  });
  box.innerHTML = '<div style="font-size:17px;font-weight:700;margin-bottom:4px">👁 选择预览章节</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:14px">「' + workTitle + '」· 以小说世界 Runtime 实际效果预览（背景 / 立绘 / 对话框 / 热点）</div>' +
    rows +
    '<div class="src-opt" data-ch="-1" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px"><span style="font-size:13px">📖 从第一章开始预览</span><span style="font-size:11px;color:#4ECCA3">连续预览 →</span></div>' +
    '<div style="display:flex;gap:10px;margin-top:14px">' +
    '<button id="pvClose" style="flex:1;padding:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:8px;font-size:13px;cursor:pointer">取消</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  Array.prototype.forEach.call(box.querySelectorAll('.src-opt'), function(row){
    row.addEventListener('click', function(){
      var idx = parseInt(row.getAttribute('data-ch'), 10);
      overlay.remove();
      previewChapter(workId, idx >= 0 ? chapters[idx] : '从第一章开始', idx);
    });
  });
  box.querySelector('#pvClose').onclick = function(){ overlay.remove(); };
  overlay.onclick = function(e){ if (e.target === overlay) overlay.remove(); };
}
function previewChapter(workId, chapterName, idx){
  var book = LJ_BOOK_MAP[workId] || 'xiyouji';
  try { sessionStorage.setItem('lingjing_v527_preview_pending', JSON.stringify({ wid: workId, chapter: idx, at: Date.now() })); } catch (e) {}
  var qs = '?book=' + book + '&preview=1';
  if (idx >= 0) qs += '&chapter=' + (idx + 1);
  try {
    if (parent && parent.LJ && parent.LJ.go) parent.LJ.go('novel-canon-reader', qs);
    else parent.postMessage({ lj: 'go', id: 'novel-canon-reader', qs: qs }, '*');
  } catch (e) {}
  showToast('info', '进入预览', '「' + chapterName + '」· 返回后可提交预览反馈');
}
function showPreviewFeedback(){
  var ov = document.createElement('div');
  ov.className = 'lj-ov';
  var box = document.createElement('div');
  box.className = 'lj-box';
  var groups = [
    { key: 'bg', name: '背景图', fixLabel: '去替换背景图', sec: 'bg' },
    { key: 'char', name: '人物立绘', fixLabel: '去替换立绘', sec: 'char' },
    { key: 'monet', name: '收费道具', fixLabel: '修改收费道具', sec: 'pricing' }
  ];
  var ghtml = '';
  groups.forEach(function(g, gi){
    ghtml += '<div class="fb-group" data-g="' + g.key + '">' +
      '<div class="fb-head"><span class="fb-name">' + g.name + '</span>' +
      '<div class="fb-pills">' +
      '<span class="fb-pill" data-v="ok" data-gi="' + gi + '">满意</span>' +
      '<span class="fb-pill on-no" data-v="no" data-gi="' + gi + '">不满意</span></div></div>' +
      '<div class="fb-fix" data-fix="' + g.key + '"><button class="lj-f-input" style="cursor:pointer;background:rgba(233,69,96,.15);border-color:rgba(233,69,96,.4)" data-go="' + g.key + '">' + g.fixLabel + ' →</button></div>' +
      '</div>';
  });
  box.innerHTML = '<div style="font-size:17px;font-weight:700;margin-bottom:4px">📋 预览反馈</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:14px">对本次预览效果满意吗？不满意可直接跳去修改</div>' + ghtml +
    '<div style="display:flex;gap:10px;margin-top:16px">' +
    '<button id="fbEdit" style="flex:1;padding:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;border-radius:8px;font-size:13px;cursor:pointer">返回编辑</button>' +
    '<button id="fbPub" style="flex:1;padding:10px;background:linear-gradient(90deg,#E94560,#6C5CE7);border:none;color:#fff;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">保存并发布</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  Array.prototype.forEach.call(box.querySelectorAll('.fb-pill'), function(pill){
    pill.addEventListener('click', function(){
      var gi = parseInt(pill.getAttribute('data-gi'), 10);
      var group = box.querySelectorAll('.fb-group')[gi];
      Array.prototype.forEach.call(group.querySelectorAll('.fb-pill'), function(x){ x.classList.remove('on-ok', 'on-no'); });
      if (pill.getAttribute('data-v') === 'ok') { pill.classList.add('on-ok'); group.querySelector('.fb-fix').classList.remove('show'); }
      else { pill.classList.add('on-no'); group.querySelector('.fb-fix').classList.add('show'); }
    });
  });
  Array.prototype.forEach.call(box.querySelectorAll('[data-go]'), function(btn){
    btn.addEventListener('click', function(){
      var k = btn.getAttribute('data-go');
      ov.remove();
      if (k === 'monet') { switchTab('pricing'); showToast('info', '收费设置', '可编辑 / 删除 / 添加收费道具'); }
      else {
        switchTab('assets');
        var sec = document.getElementById('sec-' + k);
        if (sec) {
          sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          sec.classList.remove('flash'); void sec.offsetWidth; sec.classList.add('flash');
        }
      }
    });
  });
  box.querySelector('#fbEdit').onclick = function(){ ov.remove(); showToast('info', '已返回编辑', '可继续修改正文或素材'); };
  box.querySelector('#fbPub').onclick = function(){ ov.remove(); saveDraft(); showToast('ok', '已保存并提交发布', '审核预计 48 小时内完成'); };
  ov.onclick = function(e){ if (e.target === ov) ov.remove(); };
}
function checkPreviewPending(){
  try {
    var raw = sessionStorage.getItem('lingjing_v527_preview_pending');
    if (!raw) return false;
    var d = JSON.parse(raw);
    sessionStorage.removeItem('lingjing_v527_preview_pending');
    if (!d || Date.now() - (d.at || 0) > 10 * 60 * 1000) return false;
    showPreviewFeedback();
    return true;
  } catch (e) { return false; }
}

/* ============ 编辑作品 · 历史作品选择（V23） ============ */
var WP_KEY = 'lingjing_v23_work_editor';
var WP_WORKS = [
  { id:'changye', name:'《西游记》',        emoji:'🏯', cov:'linear-gradient(160deg,#2E3A6E,#4A3A8C)', status:'已发布', words:'12.8 万字', chap:'第 12 章', updated:'2 小时前', score:'4.8' },
  { id:'saibo',   name:'《三国演义》',      emoji:'🌸', cov:'linear-gradient(160deg,#5E2E3A,#E94560)', status:'草稿',   words:'3.2 万字',  chap:'第 4 章',  updated:'1 小时前', score:'—' },
  { id:'shenhai', name:'《红楼梦》',      emoji:'🌊', cov:'linear-gradient(160deg,#2E5E56,#00B894)', status:'连载中', words:'18.2 万字', chap:'第 46 章', updated:'3 小时前', score:'4.6' },
  { id:'taohua',  name:'《桃花源记·同人》', emoji:'📜', cov:'linear-gradient(160deg,#6B2737,#B8863B)', status:'草稿',   words:'0.8 万字',  chap:'第 2 章',  updated:'昨天',     score:'—' }
];

function wpState(){
  try { return JSON.parse(localStorage.getItem(WP_KEY) || '{}'); } catch (e) { return {}; }
}
function wpSave(s){ try { localStorage.setItem(WP_KEY, JSON.stringify(s)); } catch (e) {} }

function renderPicker(){
  var host = document.getElementById('wpList');
  if (!host) return;
  var st = wpState();
  var html = '';
  WP_WORKS.forEach(function (w) {
    var d = st[w.id] || {};
    var tagCls = w.status === '草稿' ? 'draft' : 'pub';
    html += '<div class="wp-card">' +
      '<div class="wp-cover" style="background:' + (d.cov || w.cov) + '">' + w.emoji + '</div>' +
      '<div class="wp-body">' +
        '<div class="wp-name">' + w.name + '</div>' +
        '<div class="wp-tags"><span class="wp-tag ' + tagCls + '">' + w.status + '</span>' +
          '<span class="wp-tag">' + w.words + '</span><span class="wp-tag">' + w.chap + '</span></div>' +
        '<div class="wp-meta">最近编辑 ' + w.updated + (w.score === '—' ? '' : ' · 评分 ' + w.score) + '</div>' +
        '<div class="wp-acts">' +
          '<button class="wp-btn primary" onclick="openWork(\'' + w.id + '\',\'edit\')">继续续写</button>' +
          '<button class="wp-btn" onclick="openWork(\'' + w.id + '\',\'edit\',1)">改写</button>' +
          '<button class="wp-btn" onclick="openWork(\'' + w.id + '\',\'assets\')">图片管理</button>' +
          '<button class="wp-btn" onclick="openWork(\'' + w.id + '\',\'pricing\')">收费设置</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  host.innerHTML = html;
}

function showPicker(){
  document.body.classList.add('picking');
  document.body.classList.remove('editing');
  renderPicker();
}
function showEditor(){
  document.body.classList.remove('picking');
  document.body.classList.add('editing');
}
function openWork(id, tab, rewrite){
  var w = null;
  WP_WORKS.forEach(function (x) { if (x.id === id) { w = x; } });
  showEditor();
  document.getElementById('workTitle').textContent = w ? w.name : '未命名作品';
  document.querySelectorAll('.ws-chip').forEach(function (c) { c.classList.remove('active'); });
  if (tab) { switchTab(tab); }
  if (rewrite) {
    showToast('info', '改写模式', '可在 AI 续写候选中挑选，或直接修改正文');
  } else {
    var tip = tab === 'assets' ? ' · 图片管理' : (tab === 'pricing' ? ' · 收费设置' : '');
    showToast('ok', '已打开作品', (w ? w.name : '') + tip);
  }
  try { history.replaceState(null, '', 'work-editor.html?w=' + id + (tab ? '&tab=' + tab : '')); } catch (e) {}
}

/* ============ 图片上传：更换人物 / 道具 / 场景图片 ============ */
var _imgTarget = null;
function changeImg(btn, key){
  var card = btn.closest('.asset-card');
  var img = card ? card.querySelector('.ac-img') : null;
  if (!img) return;
  _imgTarget = { el: img, key: key };
  var input = document.getElementById('imgPick');
  input.value = '';
  input.click();
}
function wireImgPick(){
  var input = document.getElementById('imgPick');
  if (!input) return;
  input.addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f || !_imgTarget) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var url = ev.target.result;
      _imgTarget.el.style.backgroundImage = 'url(' + url + ')';
      _imgTarget.el.textContent = '';
      var st = wpState();
      st.images = st.images || {};
      st.images[_imgTarget.key] = url;
      wpSave(st);
      showToast('ok', '图片已更换', '已保存到本机');
    };
    reader.readAsDataURL(f);
  });
}
function wireAssetUploads(){
  var cards = document.querySelectorAll('.asset-card');
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var img = card.querySelector('.ac-img');
    if (!img) continue;
    var nameEl = card.querySelector('.ac-name');
    var key = 'a' + i + '_' + (nameEl ? nameEl.textContent.trim() : 'asset');
    img.setAttribute('data-img-key', key);
    img.style.cursor = 'pointer';
    img.title = '点击更换图片';
    bindImgEl(img, key);
    var btns = card.querySelectorAll('.ac-btn');
    for (var j = 0; j < btns.length; j++) {
      if (btns[j].textContent.indexOf('换图') >= 0) {
        btns[j].removeAttribute('onclick');
        bindImgBtn(btns[j], key);
      }
    }
  }
}
function bindImgEl(img, key){
  img.addEventListener('click', function () {
    _imgTarget = { el: img, key: key };
    var input = document.getElementById('imgPick');
    input.value = '';
    input.click();
  });
}
function bindImgBtn(btn, key){
  btn.addEventListener('click', function () { changeImg(btn, key); });
}

/* ============ 收费项就地编辑（收费章节 / 收费道具） ============ */
function editPrice(el){
  el.setAttribute('contenteditable', 'true');
  el.focus();
  try {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (e) {}
}
function savePrice(el){
  el.removeAttribute('contenteditable');
  var id = el.getAttribute('data-price-id');
  if (!id) return;
  var st = wpState();
  st.prices = st.prices || {};
  st.prices[id] = el.textContent.trim();
  wpSave(st);
  showToast('ok', '价格已更新', el.textContent.trim());
}
function wirePricing(){
  var list = document.querySelectorAll('.ch-price, .pr-price');
  for (var i = 0; i < list.length; i++) {
    var el = list[i];
    var id = 'price' + i;
    el.setAttribute('data-price-id', id);
    el.classList.add('price-edit');
    el.setAttribute('title', '点击可修改价格');
    bindPrice(el);
  }
}
function bindPrice(el){
  el.addEventListener('click', function () { editPrice(el); });
  el.addEventListener('blur', function () { savePrice(el); });
}

/* ============ 初始化（V27） ============ */
function restoreState(){
  var st = wpState();
  if (st.prices) {
    Object.keys(st.prices).forEach(function (k) {
      var el = document.querySelector('[data-price-id="' + k + '"]');
      if (el) el.textContent = st.prices[k];
    });
  }
}
function initWorkEditor(){
  wireImgPick();
  wirePricing();
  var q = LJSearch() || '';
  var m = q.match(/[?&]w=([a-zA-Z0-9_-]+)/);
  var t = q.match(/[?&]tab=([a-zA-Z]+)/);
  var pv = /[?&]pv=1/.test(q);
  if (m) { openWork(m[1], (t && !pv) ? t[1] : null); } else { showPicker(); }
  restoreState();
  renderMonetItems();
  renderAssetPanel();
  wireImgFilter();
  renderAiCands('continue', ljAiPool('continue'));
  ljLoadCurChapter();
  if (pv && m) { setTimeout(previewWork, 350); }
  checkPreviewPending();
}

// Toast
function showToast(kind, title, msg){
  var c = document.getElementById('toast');
  var t = document.createElement('div');
  t.className = 'toast-item';
  t.style.cssText='padding:10px 16px;border-radius:10px;background:var(--card);border:1px solid var(--border);font-size:13px;margin-bottom:8px;box-shadow:0 4px 20px rgba(0,0,0,.4)';
  const colors = {ok:'var(--ok)',warn:'var(--warn)',info:'var(--xinyu)'};
  t.innerHTML = '<b style="color:'+(colors[kind]||'var(--accent)')+'">'+title+'</b>' + (msg?' <span style="color:var(--sub)">· '+msg+'</span>':'');
  c.appendChild(t);
  setTimeout(()=>t.remove(), 3000);
}

// 启动：无 ?w= 参数时进入「作品选择」视图
initWorkEditor();
