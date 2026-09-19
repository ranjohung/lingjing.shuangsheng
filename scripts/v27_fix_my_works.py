# -*- coding: utf-8 -*-
"""V27: 修复 my-works 页（P1 返回 / 五按钮卡片 / 删除 / 预览直入）"""
import json, io, sys

PATH = 'index.html'

def load_pages():
    src = open(PATH, encoding='utf-8').read()
    lines = src.split('\n')
    # 定位 LJ_PAGES 行
    idx = None
    for i, l in enumerate(lines):
        if '<script>var LJ_PAGES = ' in l:
            idx = i
            break
    assert idx is not None, 'LJ_PAGES line not found'
    l = lines[idx]
    start = l.find('= ') + 2
    end = l.rfind('</script>')
    raw = l[start:end].rstrip()
    if raw.endswith(';'):
        raw = raw[:-1]
    pages = json.loads(raw)
    return src, lines, idx, pages

def save_pages(src, lines, idx, pages):
    out = json.dumps(pages, ensure_ascii=False, separators=(',', ':'))
    out = out.replace('</', '<\\/')  # 防止 JSON 内 </script> 截断外壳
    lines[idx] = '<script>var LJ_PAGES = ' + out + ';</script>'
    open(PATH, 'w', encoding='utf-8', newline='').write('\n'.join(lines))

def main():
    src, lines, idx, pages = load_pages()
    p = pages['my-works']
    n0 = len(p)

    # ---------- P1: 返回按钮走 LJBack（iframe 路由下 history.back 无效） ----------
    old_back = '<button class="icon-btn" onclick="if(history.length&gt;1){history.back()}else{location.href=\'creator-center.html\'}" title="返回上一级">‹</button>'
    assert old_back in p, 'back btn anchor missing'
    new_back = '<button class="icon-btn" onclick="LJBack()" style="min-width:44px;min-height:44px;cursor:pointer" title="返回上一级" aria-label="返回上一级">‹</button>'
    p = p.replace(old_back, new_back, 1)

    # ---------- 卡片操作按钮：预览改 pv=1 直入章节选择；新增 图片管理/删除 ----------
    old_acts = """      acts += '<a class="a primary" href="work-editor.html?w=' + w.wid + '&tab=edit">' + (w.cont ? '✍️ 继续续写' : '✏️ 编辑') + '</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&tab=pricing">💰 收费</a>';
      acts += '<a class="a" href="dashboard.html">📊 数据</a>';
      acts += '<a class="a" href="novel-upload.html?w=' + w.wid + '">👁 预览</a>';"""
    assert old_acts in p, 'acts anchor missing'
    new_acts = """      acts += '<a class="a primary" href="work-editor.html?w=' + w.wid + '&tab=edit">' + (w.cont ? '✍️ 继续续写' : '✏️ 编辑') + '</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&tab=pricing">💰 收费</a>';
      acts += '<a class="a" href="dashboard.html">📊 数据</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&pv=1">👁 预览</a>';
      acts += '<a class="a" href="work-editor.html?w=' + w.wid + '&tab=assets">🖼️ 图片管理</a>';
      acts += '<span class="a" style="color:var(--accent)" onclick="mwDelWork(\\'' + w.wid + '\\')">🗑 删除</span>';"""
    p = p.replace(old_acts, new_acts, 1)

    # ---------- 隐藏名单 + 删除确认弹窗（V27） ----------
    anchor = "var MW_KEY = 'lingjing_v526_myworks_v1';"
    assert anchor in p, 'MW_KEY anchor missing'
    add_js = anchor + """

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
}"""
    p = p.replace(anchor, add_js, 1)

    # ---------- mwMerge 过滤已删除作品 ----------
    old_merge = """function mwMerge(){
  var out = [];
  var idx = {};
  MW_HISTORY.forEach(function (h) {
    var r = {}; for (var k in h) r[k] = h[k];
    out.push(r); idx[h.title] = r;
  });"""
    assert old_merge in p, 'mwMerge anchor missing'
    new_merge = """function mwMerge(){
  var out = [];
  var idx = {};
  var hidden = mwHiddenList();
  MW_HISTORY.forEach(function (h) {
    if (hidden.indexOf(h.wid) >= 0) return; // V27：已删除的作品不再出现
    var r = {}; for (var k in h) r[k] = h[k];
    out.push(r); idx[h.title] = r;
  });"""
    p = p.replace(old_merge, new_merge, 1)

    # ---------- CreatorStore 分支同样过滤 ----------
    old_store = """  var store = (window.CreatorStore ? CreatorStore.works() : []);
  store.forEach(function (w) {
    var title = w.title || '未命名作品';"""
    assert old_store in p, 'store anchor missing'
    new_store = """  var store = (window.CreatorStore ? CreatorStore.works() : []);
  store.forEach(function (w) {
    if (hidden.indexOf(w.id) >= 0) return; // V27：已删除
    var title = w.title || '未命名作品';"""
    p = p.replace(old_store, new_store, 1)

    pages['my-works'] = p
    save_pages(src, lines, idx, pages)

    # 验证
    src2, lines2, idx2, pages2 = load_pages()
    assert 'mwDelWork' in pages2['my-works']
    assert 'LJBack()' in pages2['my-works']
    print('my-works OK:', n0, '->', len(pages2['my-works']))

if __name__ == '__main__':
    main()
