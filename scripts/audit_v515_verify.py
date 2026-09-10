"""验证 library.html 的 novel-grid 题材筛选 + URL 参数 + 跳转"""
from playwright.sync_api import sync_playwright
import os, json
from pathlib import Path

ROOT = Path("F:/开发软件项目文件/灵境 · 双生")
OUT = ROOT / "output/preview/screenshots/audit"
OUT.mkdir(parents=True, exist_ok=True)

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # 测试 1：默认 library 页面
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.on("console", lambda msg: msg.type == "error" and errors.append(f"[err] {msg.text}"))
    page.on("pageerror", lambda err: errors.append(f"[pe] {err}"))

    page.goto(f"file://{ROOT}/output/preview/library.html", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2500)
    page.screenshot(path=str(OUT / "library-default.png"), full_page=False)
    print("✓ library.html default")

    # 测试 2：library.html?genre=guding → 应自动筛选 + 跳转 + 显示 indicator
    page.goto(f"file://{ROOT}/output/preview/library.html?genre=guding", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2500)
    ind_visible = page.is_visible("#novel-filter-indicator")
    indicator_text = page.text_content("#novel-filter-indicator") or ""
    page.screenshot(path=str(OUT / "library-genre-filter.png"), full_page=False)
    print(f"✓ library.html?genre=guding: indicator visible={ind_visible}, text={indicator_text[:50]}")

    # 测试 3：library.html?genre=xuanhuan → 玄幻，demo_study 不在此类，应只有 demo_palace(古言)
    page.goto(f"file://{ROOT}/output/preview/library.html?genre=xianxia", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2500)
    indicator_text = page.text_content("#novel-filter-indicator") or ""
    page.screenshot(path=str(OUT / "library-genre-xianxia.png"), full_page=False)
    print(f"✓ library.html?genre=xianxia: indicator text={indicator_text[:50]}")

    # 测试 4：library.html?genre=cyberpunk → 应显示"暂无小说"空仓提示
    page.goto(f"file://{ROOT}/output/preview/library.html?genre=cyberpunk", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2500)
    indicator_text = page.text_content("#novel-filter-indicator") or ""
    page.screenshot(path=str(OUT / "library-genre-empty.png"), full_page=False)
    print(f"✓ library.html?genre=cyberpunk (空): indicator={indicator_text[:60]}")

    # 测试 5：commerce.html 单页完整跑
    page.goto(f"file://{ROOT}/output/preview/commerce.html", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(2500)
    page.click("#btn-eval-copyright")
    page.wait_for_timeout(800)
    page.click("#btn-eval-quality")
    page.wait_for_timeout(800)
    page.click("#btn-add-point")
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / "commerce-full-flow.png"), full_page=False)
    print("✓ commerce.html 完整流程")

    # 测试 6：plot-runner 5 题材切换
    for nid in ["demo_palace", "demo_study", "demo_forest", "demo_starship", "demo_youth"]:
        page.goto(f"file://{ROOT}/output/preview/plot-runner.html?novelId={nid}", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_timeout(2500)
        page.screenshot(path=str(OUT / f"runner-{nid}.png"), full_page=False)
        print(f"✓ plot-runner.html?novelId={nid}")

    browser.close()

if errors:
    print(f"\n⚠ {len(errors)} ERRORS:")
    for e in errors[:10]:
        print(f"  {e}")
else:
    print("\n✅ 全链路 0 错误")