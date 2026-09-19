# -*- coding: utf-8 -*-
"""V27: novel-canon-reader 页新增作者预览模式（preview=1）。
- 顶部悬浮条「👁 预览模式 · ← 返回编辑」，点击 postMessage {lj:'back'} 回 work-editor
- 章末覆盖层在预览模式下追加「← 返回编辑器」主按钮
- 幂等：所有替换前 assert 锚点存在；写回后重新加载断言 probe
"""
import json, io, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC = 'index.html'

def load():
    s = open(SRC, encoding='utf-8').read()
    lines = s.split('\n')
    idx = next(i for i, l in enumerate(lines) if l.startswith('<script>var LJ_PAGES = '))
    l = lines[idx]
    start = l.find('= ') + 2
    end = l.rfind('</script>')
    raw = l[start:end].rstrip().rstrip(';')
    return s, lines, idx, json.loads(raw)

def save(s, lines, idx, pages):
    out = json.dumps(pages, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    lines[idx] = '<script>var LJ_PAGES = ' + out + ';</script>'
    open(SRC, 'w', encoding='utf-8', newline='').write('\n'.join(lines))
    print('written, LJ_PAGES line len =', len(lines[idx]))

def rep(p, old, new, tag):
    assert old in p, 'ANCHOR MISS: ' + tag
    assert p.count(old) == 1, 'ANCHOR DUP: ' + tag
    print('R ok:', tag, len(p), '->', end=' ')
    p = p.replace(old, new)
    print(len(p))
    return p

s, lines, idx, pages = load()
p = pages['novel-canon-reader']
LEN0 = len(p)

# ---------- R1 CSS：预览悬浮条 ----------
old = '/* Toast */'
new = '''/* V27 作者预览模式悬浮条 */
#lj-preview-bar{position:fixed;top:0;left:0;right:0;z-index:200;display:none;align-items:center;justify-content:center;gap:10px;background:linear-gradient(90deg,rgba(108,92,231,.95),rgba(233,69,96,.95));color:#fff;font-size:12px;letter-spacing:1px;padding:7px 12px;box-shadow:0 2px 14px rgba(0,0,0,.5)}
#lj-preview-bar.show{display:flex}
#lj-preview-bar .pv-back{background:#fff;color:#6C5CE7;border:none;border-radius:14px;padding:5px 16px;font-size:12px;cursor:pointer;font-weight:700}
#lj-preview-bar .pv-back:active{opacity:.85}

/* Toast */'''
p = rep(p, old, new, 'R1 css')

# ---------- R2 HTML：悬浮条节点 ----------
old = '<!-- 书库选择界面 -->'
new = '''<!-- V27 作者预览模式悬浮条 -->
<div id="lj-preview-bar">👁 预览模式 · 确认背景 / 立绘 / 道具沉浸效果<button class="pv-back" data-act="pv-back">← 返回编辑</button></div>

<!-- 书库选择界面 -->'''
p = rep(p, old, new, 'R2 html')

# ---------- R3 JS：init 内识别 preview=1 ----------
old = '''    // 渲染书库
    renderBookSelect();'''
new = '''    // 渲染书库
    renderBookSelect();

    // V27: preview=1 作者预览模式（work-editor 发起，返回键回编辑器）
    try {
      var __pqs = __LJ_QS__ || '';
      if (/(?:^|&)preview=1/.test(__pqs)) {
        window.__ljPreviewMode = true;
        var __pvbar = document.getElementById('lj-preview-bar');
        if (__pvbar) {
          __pvbar.classList.add('show');
          __pvbar.querySelector('.pv-back').addEventListener('click', function () {
            __ljPreviewBack();
          });
        }
      }
    } catch (e) {}'''
p = rep(p, old, new, 'R3 init flag')

# ---------- R4 JS：__ljPreviewBack 定义 ----------
old = '''  // ============ 返回书库 ============'''
new = '''  // ============ V27: 返回编辑器（弹 shell LJ_BACK_STACK） ============
  function __ljPreviewBack() {
    try { parent.postMessage({ lj: 'back' }, '*'); } catch (e) { try { history.back(); } catch (e2) {} }
  }
  window.__ljPreviewBack = __ljPreviewBack;

  // ============ 返回书库 ============'''
p = rep(p, old, new, 'R4 back fn')

# ---------- R5 JS：章末覆盖层加「返回编辑器」 ----------
old = '''    var btns = '';
    if (hasNext) {
      btns = '<button class="primary" data-act="next">继续阅读下一回 →</button>';
    }
    btns += '<button data-act="restart">重新阅读本章</button>';
    btns += '<button data-act="chapters">返回章节目录</button>';'''
new = '''    var btns = '';
    if (window.__ljPreviewMode) {
      btns += '<button class="primary" data-act="back-edit">← 返回编辑器</button>';
    }
    if (hasNext) {
      if (btns) {
        btns += '<button data-act="next">继续阅读下一回 →</button>';
      } else {
        btns = '<button class="primary" data-act="next">继续阅读下一回 →</button>';
      }
    }
    btns += '<button data-act="restart">重新阅读本章</button>';
    btns += '<button data-act="chapters">返回章节目录</button>';'''
p = rep(p, old, new, 'R5 end btns')

old = '''    overlay.querySelectorAll('button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        overlay.remove();'''
new = '''    overlay.querySelectorAll('button').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.dataset.act === 'back-edit') {
          overlay.remove();
          if (!sysLayer.querySelector('.canon-end-overlay') && !sysLayer.querySelector('.lj-menu-overlay')) {
            sysLayer.style.display = 'none';
          }
          __ljPreviewBack();
          return;
        }
        overlay.remove();'''
p = rep(p, old, new, 'R5 end handler')

assert len(p) > LEN0
pages['novel-canon-reader'] = p

# ---------- 写回 ----------
save(s, lines, idx, pages)

# ---------- 复核 ----------
_, lines2, idx2, pages2 = load()
q = pages2['novel-canon-reader']
probes = ['lj-preview-bar', 'pv-back', '__ljPreviewMode', '__ljPreviewBack', 'data-act="back-edit"', 'preview=1']
ok = True
for b in probes:
    c = q.count(b)
    print('probe', b, '->', c)
    ok = ok and c >= 1
print('canon-reader OK' if ok else 'PROBE FAIL', len(q))
