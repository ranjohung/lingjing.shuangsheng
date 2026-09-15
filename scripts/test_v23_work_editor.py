"""编辑作品（我的作品 → 编辑作品）验收测试
按用户描述验收：
  点击编辑作品 → 选择历史作品 → 编辑/继续续写/改写
  → 上传更换人物/道具/场景图片 → 重新设置收费章节/收费道具
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(name)
    print(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")


BASE = 'http://127.0.0.1:8793/output/preview/work-editor.html'
IMG = str(Path('screenshots/home-restore-1.png').resolve())

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(viewport={'width': 480, 'height': 900})
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' else None)

    # ---------- A. 无参数 → 作品选择视图 ----------
    page.goto(BASE, wait_until='domcontentloaded')
    page.wait_for_timeout(500)
    check('A1 进入作品选择视图（picking）',
          page.evaluate('document.body.classList.contains("picking")'))
    cards = page.evaluate('document.querySelectorAll("#wpView .wp-card").length')
    check('A2 历史作品卡片数 ≥2', cards >= 2, f'count={cards}')
    check('A3 编辑器在未选作品时隐藏',
          page.evaluate('getComputedStyle(document.querySelector(".editor-tabs")).display') == 'none')
    lead = page.evaluate('(document.querySelector(".wp-lead")||{}).textContent||""')
    check('A4 有引导文案（继续续写/改写/图片/收费）',
          all(k in lead for k in ['继续续写', '改写', '图片', '收费']), lead[:40])

    # 每张卡 4 个操作
    acts = page.evaluate('''(() => Array.from(document.querySelectorAll("#wpView .wp-card .wp-btn"))
        .map(function (b) { return b.textContent.trim(); }))()''')
    check('A5 作品卡含 继续续写/改写/图片管理/收费设置',
          all(any(x in a for a in acts) for x in ['继续续写', '改写', '图片管理', '收费设置']),
          '|'.join(sorted(set(acts))))

    # ---------- B. 点「继续续写」→ 进编辑器 ----------
    page.evaluate('''Array.from(document.querySelectorAll("#wpView .wp-card .wp-btn"))
        .find(function (b) { return b.textContent.indexOf("继续续写") >= 0; }).click()''')
    page.wait_for_timeout(400)
    check('B1 进入编辑态（editing）', page.evaluate('document.body.classList.contains("editing")'))
    check('B2 编辑器标签栏显示',
          page.evaluate('getComputedStyle(document.querySelector(".editor-tabs")).display') != 'none')
    title = page.evaluate('document.getElementById("workTitle").textContent')
    check('B3 标题切换为所选作品', '长夜城' in title, title)
    check('B4 编辑面板可见',
          page.evaluate('getComputedStyle(document.getElementById("panel-edit")).display') != 'none')
    check('B5 URL 带上作品参数', 'w=changye' in page.url, page.url)
    check('B6 有 AI续写/改写 工具',
          page.evaluate('''(() => { var t = document.querySelector(".editor-toolbar").textContent;
              return t.indexOf("续写") >= 0 && t.indexOf("重写") >= 0; })()'''))

    # ---------- C. 图片管理（上传更换人物图片） ----------
    page.evaluate('''Array.from(document.querySelectorAll(".wp-btn, .et"))
        .find(function (b) { return b.textContent.indexOf("素材") >= 0; })''')
    page.evaluate('switchTab("chars")')
    page.wait_for_timeout(200)
    check('C1 人物面板可见',
          page.evaluate('getComputedStyle(document.getElementById("panel-chars")).display') != 'none')
    before_bg = page.evaluate('document.querySelector("#panel-chars .ac-img").style.backgroundImage')
    # 先点「换图」再选文件（与真实用户路径一致）
    page.evaluate('''Array.from(document.querySelectorAll("#panel-chars .ac-btn"))
        .find(function (b) { return b.textContent.indexOf("换图") >= 0; }).click()''')
    page.wait_for_timeout(150)
    page.set_input_files('#imgPick', IMG)
    page.wait_for_timeout(700)
    after_bg = page.evaluate('document.querySelector("#panel-chars .ac-img").style.backgroundImage')
    check('C2 上传图片后立绘背景被替换',
          ('data:image' in after_bg) and after_bg != before_bg, (after_bg or '')[:34])
    persisted = page.evaluate('(JSON.parse(localStorage.getItem("lingjing_v23_work_editor")||"{}").images||{})')
    check('C3 图片写入 localStorage 持久化', len(persisted) >= 1, f'count={len(persisted)}')

    page.evaluate('switchTab("assets")')
    page.wait_for_timeout(150)
    n_assets = page.evaluate('document.querySelectorAll("#panel-assets .ac-img").length')
    check('C4 素材面板含 道具+场景 图片位', n_assets >= 4, f'count={n_assets}')

    # ---------- D. 收费设置（收费章节 / 收费道具 可改） ----------
    page.evaluate('switchTab("pricing")')
    page.wait_for_timeout(200)
    check('D1 收费面板可见',
          page.evaluate('getComputedStyle(document.getElementById("panel-pricing")).display') != 'none')
    has_ch = page.evaluate('document.querySelectorAll("#panel-pricing .ch-price").length')
    has_pr = page.evaluate('document.querySelectorAll("#panel-pricing .pr-price").length')
    check('D2 有收费章节', has_ch >= 1, f'count={has_ch}')
    check('D3 有收费道具', has_pr >= 1, f'count={has_pr}')
    check('D4 价格可点击编辑（price-edit 类）',
          page.evaluate('document.querySelectorAll("#panel-pricing .price-edit").length') >= 2)

    page.evaluate('''(() => { var el = document.querySelector("#panel-pricing .ch-price");
        el.setAttribute("contenteditable","true"); el.textContent = "9 灵晶"; savePrice(el); })()''')
    page.wait_for_timeout(200)
    saved = page.evaluate('(JSON.parse(localStorage.getItem("lingjing_v23_work_editor")||"{}").prices||{})')
    check('D5 改价写入 localStorage', any('9 灵晶' in v for v in saved.values()), str(saved)[:50])

    # ---------- E. 刷新后持久化 ----------
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(600)
    restored_bg = page.evaluate('document.querySelector("#panel-chars .ac-img").style.backgroundImage')
    check('E1 刷新后人物图片仍为上传的图', 'data:image' in restored_bg)
    restored_price = page.evaluate('''(() => { switchTab("pricing");
        var el = document.querySelector("#panel-pricing .ch-price"); return el ? el.textContent.trim() : ""; })()''')
    check('E2 刷新后价格仍为 9 灵晶', '9' in restored_price, restored_price)

    # ---------- F. ?w= 直达 + tab ----------
    page.goto(BASE + '?w=saibo&tab=pricing', wait_until='domcontentloaded')
    page.wait_for_timeout(500)
    t2 = page.evaluate('document.getElementById("workTitle").textContent')
    check('F1 ?w=saibo 直达且标题正确', '赛博长夜' in t2, t2)
    check('F2 ?tab=pricing 直接落到收费面板',
          page.evaluate('getComputedStyle(document.getElementById("panel-pricing")).display') != 'none')

    # ---------- G. 返回作品列表 ----------
    page.evaluate('showPicker()')
    page.wait_for_timeout(300)
    check('G1 可返回作品选择视图', page.evaluate('document.body.classList.contains("picking")'))

    # ---------- H. 无关键错误 + 移动端不溢出 ----------
    critical = [e for e in errors if 'TypeError' in e or 'Cannot read' in e or 'ReferenceError' in e]
    check('H1 无关键 JS 错误', len(critical) == 0, str(critical[:2])[:60])
    overflow = page.evaluate('document.documentElement.scrollWidth <= 480')
    check('H2 480px 无横向溢出', overflow == True)

    Path('screenshots').mkdir(exist_ok=True)
    page.screenshot(path='screenshots/v23-work-picker.png')
    page.goto(BASE + '?w=changye', wait_until='domcontentloaded')
    page.wait_for_timeout(400)
    page.screenshot(path='screenshots/v23-work-editor.png')
    browser.close()

print('\n' + '=' * 60)
print(f'PASS: {len(PASS)} · FAIL: {len(FAIL)}')
print('=' * 60)
if FAIL:
    print('FAILED: ' + ', '.join(FAIL))
    raise SystemExit(1)
print('✅ 编辑作品功能全部验收通过')
