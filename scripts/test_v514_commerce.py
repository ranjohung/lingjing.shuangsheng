"""v5.14 商业化设置页真机测试"""
import os, sys, time, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(r"F:\开发软件项目文件\灵境 · 双生\output\preview")
OUT = ROOT / "screenshots" / "v514"
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader'])
    ctx = browser.new_context(viewport={"width": 1320, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda exc: errors.append(f"[pageerror] {exc}"))

    # 1. 打开 commerce.html
    page.goto(f"file://{ROOT}/commerce.html")
    page.wait_for_load_state("networkidle", timeout=10000)
    time.sleep(2.0)
    page.screenshot(path=str(OUT / "01-overview.png"), full_page=True)
    print("✓ 01-overview.png")

    # 2. 选择不同小说，看版权分层和报告
    novels = ['demo_palace', 'demo_study', 'demo_forest']
    for i, nid in enumerate(novels):
        page.evaluate(f"window._commerce.selectNovel('{nid}')")
        time.sleep(1.5)
        page.screenshot(path=str(OUT / f"02-{i+1}-{nid}.png"), full_page=True)
        print(f"✓ 02-{i+1}-{nid}.png")

    # 3. 触发版权评估
    page.evaluate("document.getElementById('btn-eval-copyright').click()")
    time.sleep(1.0)
    page.screenshot(path=str(OUT / "03-copyright-eval.png"), full_page=True)
    print("✓ 03-copyright-eval.png")

    # 4. 触发质量评估
    page.evaluate("document.getElementById('btn-eval-quality').click()")
    time.sleep(1.0)
    page.screenshot(path=str(OUT / "04-quality-eval.png"), full_page=True)
    print("✓ 04-quality-eval.png")

    # 5. 打开新建收费点模态
    page.evaluate("document.getElementById('btn-add-point').click()")
    time.sleep(0.8)
    page.screenshot(path=str(OUT / "05-add-point-modal.png"))
    print("✓ 05-add-point-modal.png")

    # 6. 点击 AI 帮我写按钮
    page.evaluate("document.getElementById('f-ai').click()")
    time.sleep(0.8)
    page.screenshot(path=str(OUT / "06-ai-helper-modal.png"))
    print("✓ 06-ai-helper-modal.png")

    # 选第一个 AI 选项
    opts = page.query_selector_all(".ai-opt")
    if opts:
        opts[0].click()
        time.sleep(0.5)
        page.screenshot(path=str(OUT / "07-after-ai-pick.png"))
        print("✓ 07-after-ai-pick.png")

    # 保存收费点
    save_btn = page.query_selector(".modal-ok")
    if save_btn:
        save_btn.click()
        time.sleep(1.0)
        page.screenshot(path=str(OUT / "08-point-saved.png"), full_page=True)
        print("✓ 08-point-saved.png")

    # 7. 模拟购买（创建更多收费点 + 购买）
    page.evaluate("""() => {
      const m = window.Monetization;
      // 创建 3 个不同收费点
      m.createPoint(window._commerce.selectNovel ? 'demo_palace' : 'demo_palace', 'demo_author',
        { point_type: 'chapter_lock', point_name: '命运转折点·第三章', price: 200 });
      m.createPoint('demo_palace', 'demo_author',
        { point_type: 'cg_card', point_name: 'CG·未央之夜', price: 500 });
      m.createPoint('demo_palace', 'demo_author',
        { point_type: 'title', point_name: '称号·命运之子', price: 50 });
      // 模拟几笔购买
      const points = m.listPointsByNovel('demo_palace');
      points.forEach(p => {
        for (let i = 0; i < 3; i++) {
          m.simulatePurchase('demo_palace', p.id, 'buyer_' + i, 3, 3000);
        }
      });
      window._commerce.selectNovel('demo_palace');
    }""")
    time.sleep(1.0)
    page.screenshot(path=str(OUT / "09-with-points-and-earnings.png"), full_page=True)
    print("✓ 09-with-points-and-earnings.png")

    # 8. 打开改编授权模态
    page.evaluate("document.getElementById('btn-add-license').click()")
    time.sleep(0.8)
    page.screenshot(path=str(OUT / "10-add-license-modal.png"))
    print("✓ 10-add-license-modal.png")
    # 提交
    page.fill("#l-name", "星辰影业")
    page.evaluate("document.querySelector('.modal-ok').click()")
    time.sleep(1.0)
    page.screenshot(path=str(OUT / "11-license-saved.png"), full_page=True)
    print("✓ 11-license-saved.png")

    # 9. 移动端
    mobile_ctx = browser.new_context(viewport={"width": 390, "height": 844})
    m_page = mobile_ctx.new_page()
    m_page.goto(f"file://{ROOT}/commerce.html")
    m_page.wait_for_load_state("networkidle", timeout=10000)
    time.sleep(1.5)
    m_page.screenshot(path=str(OUT / "12-mobile.png"), full_page=True)
    print("✓ 12-mobile.png")

    browser.close()

    if errors:
        print(f"\n⚠ Console errors: {len(errors)}")
        for e in errors[:20]:
            print(f"  {e}")
    else:
        print("\n✅ No console errors")

    pngs = sorted(OUT.glob("*.png"))
    print(f"\n📁 {len(pngs)} 张截图")
    for p in pngs:
        print(f"  - {p.name} ({p.stat().st_size // 1024} KB)")