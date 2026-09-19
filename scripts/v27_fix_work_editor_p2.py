# -*- coding: utf-8 -*-
"""V27 part2: work-editor JS 逻辑
R4 AI 续写区（候选[使用]写入正文/换一批/我来说/字数/章节内容保存）
R5 selectChapter 保存恢复
R6 预览（章节选择→canon-reader+preview=1→反馈面板）
R7 initWorkEditor（pv=1 直入/pending 检测/新面板渲染）
R8 收费道具弹窗重写 + 图片管理 JS + AI生成 + 预设库 + 版本管理
"""
import json

PATH = 'index.html'

def load_pages():
    src = open(PATH, encoding='utf-8').read()
    lines = src.split('\n')
    idx = None
    for i, l in enumerate(lines):
        if '<script>var LJ_PAGES = ' in l:
            idx = i
            break
    assert idx is not None
    l = lines[idx]
    start = l.find('= ') + 2
    end = l.rfind('</script>')
    raw = l[start:end].rstrip()
    if raw.endswith(';'):
        raw = raw[:-1]
    return src, lines, idx, json.loads(raw)

def save_pages(src, lines, idx, pages):
    out = json.dumps(pages, ensure_ascii=False, separators=(',', ':'))
    out = out.replace('</', '<\\/')
    lines[idx] = '<script>var LJ_PAGES = ' + out + ';</script>'
    open(PATH, 'w', encoding='utf-8', newline='').write('\n'.join(lines))

AI_JS = r'''/* ===== V27 AI 辅助（P3：候选 [使用] 写入正文 + 换一批 + 我来说）===== */
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
'''

PREVIEW_JS = r'''/* ===== V27 预览（P5：章节选择 → 真实 Runtime → 返回后反馈面板）===== */
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
'''

INIT_JS = r'''/* ============ 初始化（V27） ============ */
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
'''

MONET_JS = r'''/* ====== V27 收费道具（P2：类型/名称/描述/价格/图片/触发条件 + 编辑/删除）====== */
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
'''

def main():
    src, lines, idx, pages = load_pages()
    p = pages['work-editor']

    # ---------- R4 AI 区域整体替换 ----------
    if 'LJ_AI_POOLS' not in p:
        s = p.find('// AI 辅助\nfunction aiAssist(type){')
        e = p.find('// 保存\nfunction saveDraft(){')
        assert s > 0 and e > s, 'R4 anchors'
        assert p[s:e].count('function selectCand') == 2, 'R4 expects 2 selectCand'
        p = p[:s] + AI_JS + '\n' + p[e:]

    # ---------- R5 selectChapter ----------
    old_sel = '''// 章节选择
function selectChapter(el){
  document.querySelectorAll('.ch-item').forEach(c=>c.classList.remove('current'));
  el.classList.add('current');
}'''
    if 'ljLoadCurChapter();' not in p.split('function selectChapter')[1][:400] if 'function selectChapter' in p else True:
        pass
    if old_sel in p:
        new_sel = '''// 章节选择（V27：切章保存/恢复正文）
function selectChapter(el){
  ljSaveCurChapter();
  document.querySelectorAll('.ch-item').forEach(function(c){ c.classList.remove('current'); });
  el.classList.add('current');
  ljLoadCurChapter();
}'''
        p = p.replace(old_sel, new_sel, 1)

    # ---------- R6 预览区替换 ----------
    if 'LJ_BOOK_MAP' not in p:
        s = p.find('// 预览\nfunction previewWork(){')
        e = p.find('/* ============ 编辑作品 · 历史作品选择（V23） ============ */')
        assert s > 0 and e > s, 'R6 anchors'
        p = p[:s] + PREVIEW_JS + '\n' + p[e:]

    # ---------- R7 初始化替换 ----------
    if 'checkPreviewPending();' not in p:
        s = p.find('/* ============ 初始化 ============ */')
        e = p.find('// Toast\nfunction showToast')
        assert s > 0 and e > s, 'R7 anchors'
        p = p[:s] + INIT_JS + '\n' + p[e:]

    # ---------- R8 尾部 script 块：收费弹窗+图片管理 ----------
    if 'BASE_MONET' not in p:
        s = p.find('/* ====== 添加收费道具弹窗 ====== */')
        assert s > 0, 'R8 start anchor'
        e = p.find('</script>', s)
        assert e > s, 'R8 end anchor'
        p = p[:s] + MONET_JS + '\n' + p[e:]

    # ---------- chars tab 添加人物卡改走 addAssetFlow ----------
    p = p.replace("onclick=\"openAddAsset('char')\"", "onclick=\"addAssetFlow('char')\"")

    pages['work-editor'] = p
    save_pages(src, lines, idx, pages)

    src2, lines2, idx2, pages2 = load_pages()
    q = pages2['work-editor']
    for probe in ['LJ_AI_POOLS', 'LJ_BOOK_MAP', 'BASE_MONET', 'BASE_ASSETS', 'checkPreviewPending();', "addAssetFlow('char')"]:
        assert probe in q, probe
    assert 'openAddAsset' not in q, 'old openAddAsset should be gone'
    assert q.count('function selectCand') == 0, 'old selectCand should be gone'
    # 裸 </script> 检查（JSON 解析后仍不允许裸的出现在 JS 字符串中——上面 verThumbCss 用了 &quot; 无裸标签）
    print('work-editor part2 OK:', len(q))

if __name__ == '__main__':
    main()
