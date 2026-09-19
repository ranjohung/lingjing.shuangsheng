# -*- coding: utf-8 -*-
"""V27 part1: work-editor HTML/CSS 结构改造
R1 状态栏字数加 id
R2 收费道具静态行 -> JS 渲染容器
R3 素材 tab 重构为图片管理（三区 + 筛选 + 版本）
R9 CSS 补充
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

def main():
    src, lines, idx, pages = load_pages()
    p = pages['work-editor']

    # ---------- R1 状态栏字数 ----------
    if 'id="sbWords"' not in p:
        old = '<span>字数：1,247</span>'
        assert old in p, 'R1 anchor'
        p = p.replace(old, '<span id="sbWords">字数：1,247</span>', 1)

    # ---------- R2 收费道具静态行 -> 容器 ----------
    old_rows = '''      <div class="pricing-row">
        <div class="pr-info">
          <div class="pr-name">🔦 提灯·照亮场景</div>
          <div class="pr-desc">解锁隐藏场景描写 · 影响剧情分支</div>
        </div>
        <div class="pr-price">10 灵晶</div>
        <div class="toggle on" onclick="this.classList.toggle('on')"></div>
      </div>
      <div class="pricing-row">
        <div class="pr-info">
          <div class="pr-name">🔑 夜门钥匙</div>
          <div class="pr-desc">解锁地下世界支线剧情</div>
        </div>
        <div class="pr-price">20 灵晶</div>
        <div class="toggle on" onclick="this.classList.toggle('on')"></div>
      </div>
      <div class="pricing-row">
        <div class="pr-info">
          <div class="pr-name"> 守夜人吊坠</div>
          <div class="pr-desc">解锁酒馆女人 backstory</div>
        </div>
        <div class="pr-price">15 灵晶</div>
        <div class="toggle" onclick="this.classList.toggle('on')"></div>
      </div>
      <div class="pricing-row" onclick="openAddPricingItem()" style="cursor:pointer;border-style:dashed">'''
    if 'id="monetItemList"' not in p:
        assert old_rows in p, 'R2 anchor'
        new_rows = '''      <div id="monetItemList"></div>
      <div class="pricing-row" onclick="openAddPricingItem()" style="cursor:pointer;border-style:dashed">'''
        p = p.replace(old_rows, new_rows, 1)

    # ---------- R3 素材 tab 重构 ----------
    a1 = p.find('<!-- ========== 素材面板 ========== -->')
    a2 = p.find('<!-- ========== 伏笔面板 ========== -->')
    assert a1 > 0 and a2 > a1, 'R3 anchors'
    if 'id="grid-bg"' not in p:
        new_assets = '''<!-- ========== 图片管理面板（V27 · P4：背景/人物/道具 + 版本管理） ========== -->
<div class="tab-panel" id="panel-assets" style="display:none">
  <div class="panel">
    <div class="panel-title">🖼️ 图片管理 <span class="badge">上传 / AI 生成 / 预设库</span></div>
    <div class="img-filter" id="imgFilter">
      <div class="if-tab on" data-f="all">全部</div>
      <div class="if-tab" data-f="bg">背景</div>
      <div class="if-tab" data-f="char">人物</div>
      <div class="if-tab" data-f="prop">道具</div>
    </div>
    <div class="img-sec" id="sec-bg" data-sec="bg">
      <div class="img-sec-title">🏔️ 背景图</div>
      <div class="asset-grid" id="grid-bg"></div>
    </div>
    <div class="img-sec" id="sec-char" data-sec="char">
      <div class="img-sec-title">🧑 人物立绘</div>
      <div class="asset-grid" id="grid-char"></div>
    </div>
    <div class="img-sec" id="sec-prop" data-sec="prop">
      <div class="img-sec-title">⚔️ 道具图标</div>
      <div class="asset-grid" id="grid-prop"></div>
    </div>
    <div style="font-size:10px;color:var(--sub);margin-top:12px;line-height:1.7">· 点击缩略图或「替换」可选：上传本地图片（JPG/PNG ≤5MB）/ AI 生成（4 候选）/ 系统预设库<br/>· 替换自动保留历史版本，「版本」里可随时回滚</div>
  </div>
  <div class="panel">
    <div class="panel-title">🖼️ 作品封面</div>
    <div style="display:flex;gap:12px;align-items:center">
      <div style="width:80px;height:100px;border-radius:10px;background:linear-gradient(135deg,#2E3A6E,#4A3A8C);display:grid;place-items:center;font-size:36px;flex-shrink:0">🏯</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">《西游记》封面</div>
        <div style="font-size:11px;color:var(--sub);margin-bottom:8px">当前使用 AI 生成封面 · 1024×1280</div>
        <div style="display:flex;gap:6px">
          <div class="ac-btn" style="font-size:11px;padding:6px 10px" onclick="ljToast('info','AI 生成封面','在弹窗中选择风格生成 4 张候选')">✨ AI生成</div>
          <div class="ac-btn" style="font-size:11px;padding:6px 10px" onclick="openAssetSource('__cover__','作品封面')">📤 上传</div>
        </div>
      </div>
    </div>
  </div>
</div>

'''
        p = p[:a1] + new_assets + p[a2:]

    # ---------- R9 CSS 补充 ----------
    if '.if-tab' not in p:
        css_anchor = '<link rel="stylesheet" href="css/tabbar-embed.css">'
        assert css_anchor in p, 'R9 anchor'
        add_css = '''<style>
/* ===== V27 图片管理 ===== */
.img-filter{display:flex;gap:6px;margin-bottom:14px}
.if-tab{padding:6px 16px;border-radius:16px;background:var(--bg);border:1px solid var(--border);font-size:12px;color:var(--sub);cursor:pointer}
.if-tab.on{background:rgba(233,69,96,.15);border-color:var(--accent);color:var(--accent);font-weight:600}
.img-sec{margin-bottom:18px}
.img-sec-title{font-size:13px;font-weight:600;margin-bottom:10px;color:var(--sub)}
.img-sec.flash{animation:secFlash 1.2s ease}
@keyframes secFlash{0%,100%{outline:2px solid transparent}30%{outline:2px solid var(--accent);border-radius:10px}}
.ac-btn{font-size:9px;padding:3px 6px;border-radius:4px;background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--sub);cursor:pointer}
.ac-btn:hover{border-color:var(--accent);color:var(--text)}
.asset-card .ac-img{cursor:pointer}
/* AI候选 使用/换一批 */
.cand-acts{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}
.cand-use{font-size:11px;padding:4px 12px;border-radius:6px;background:rgba(233,69,96,.15);border:1px solid rgba(233,69,96,.4);color:var(--accent);cursor:pointer;font-weight:600}
.cand-use:hover{background:rgba(233,69,96,.3)}
.cand-bar{display:flex;gap:18px;justify-content:center;margin-top:10px}
.cand-bar span{font-size:12px;color:var(--xinyu);cursor:pointer}
/* 收费道具行动作 */
.mn-acts{display:flex;gap:4px;flex-shrink:0}
.mn-btn{font-size:10px;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--sub);cursor:pointer}
.mn-btn:hover{color:var(--text);border-color:var(--accent)}
/* 通用弹窗 */
.lj-ov{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:99999;display:flex;align-items:center;justify-content:center}
.lj-box{background:#1a1a2e;border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:22px;max-width:360px;width:calc(100% - 32px);max-height:82vh;overflow-y:auto;color:#fff}
.lj-f-label{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:4px}
.lj-f-input{width:100%;padding:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#fff;font-size:13px;box-sizing:border-box}
.type-pill{display:inline-block;padding:6px 12px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);font-size:12px;margin:0 6px 6px 0;cursor:pointer}
.type-pill.on{background:rgba(233,69,96,.2);border-color:var(--accent);color:#fff}
.src-opt{padding:12px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);margin-bottom:8px;cursor:pointer;font-size:13px}
.src-opt:hover{border-color:var(--accent);background:rgba(233,69,96,.08)}
.preset-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.preset-item{aspect-ratio:3/4;border-radius:8px;border:1px solid rgba(255,255,255,.12);display:grid;place-items:center;font-size:24px;cursor:pointer;overflow:hidden;background-size:cover;background-position:center}
.preset-item:hover{border-color:var(--accent)}
.preset-item img{width:100%;height:100%;object-fit:cover}
.ver-item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;background:rgba(255,255,255,.04);margin-bottom:6px}
.ver-thumb{width:40px;height:52px;border-radius:6px;background-size:cover;background-position:center;display:grid;place-items:center;font-size:16px;flex-shrink:0;border:1px solid rgba(255,255,255,.1)}
.ver-roll{margin-left:auto;font-size:11px;padding:4px 10px;border-radius:6px;background:rgba(78,204,163,.15);border:1px solid rgba(78,204,163,.4);color:#4ECCA3;cursor:pointer}
/* 预览反馈 */
.fb-group{margin-bottom:14px;padding:12px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.fb-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.fb-name{font-size:13px;font-weight:600}
.fb-pills{display:flex;gap:8px}
.fb-pill{padding:5px 14px;border-radius:14px;font-size:12px;cursor:pointer;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05)}
.fb-pill.on-ok{background:rgba(78,204,163,.2);border-color:#4ECCA3;color:#4ECCA3}
.fb-pill.on-no{background:rgba(233,69,96,.2);border-color:var(--accent);color:var(--accent)}
.fb-fix{display:none;margin-top:8px}
.fb-fix.show{display:block}
</style>
''' + css_anchor
        p = p.replace(css_anchor, add_css, 1)

    pages['work-editor'] = p
    save_pages(src, lines, idx, pages)
    src2, lines2, idx2, pages2 = load_pages()
    q = pages2['work-editor']
    for probe in ['id="sbWords"', 'id="monetItemList"', 'id="grid-bg"', '.if-tab']:
        assert probe in q, probe
    print('work-editor part1 OK:', len(p), '->', len(q))

if __name__ == '__main__':
    main()
