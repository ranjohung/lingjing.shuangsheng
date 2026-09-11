"""V17-A tabbar.js 行为验证 · 复用 design-system 同款 Playwright 配置"""
from playwright.sync_api import sync_playwright
import sys, pathlib

ROOT = pathlib.Path(r"F:\开发软件项目文件\灵境 · 双生")
URL = "file:///" + str(ROOT / "product-preview.html").replace("\\", "/")

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--use-gl=swiftshader", "--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 480, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(("pageerror", str(e))))
    page.on("console", lambda m: errors.append(("console:" + m.type, m.text)) if m.type in ("error","warning") else None)
    page.goto(URL)
    page.wait_for_load_state("networkidle")

    # 关闭启动页（如有 splash 遮罩）
    page.evaluate("var s = document.getElementById('splash'); if (s) s.style.display='none'")
    page.wait_for_timeout(200)

    # 滚动到 V17-A 演示区
    page.evaluate("document.getElementById('v17a-tabbar-demo').scrollIntoView({block:'center'})")
    page.wait_for_timeout(200)

    # 1. tabbar.js 应已挂载
    has_api = page.evaluate("typeof window.LJTabbar === 'object' && window.LJTabbar.__mounted === true")
    print(f"[1] LJTabbar 已挂载: {has_api}")

    # 2. localStorage KEY 正确
    sk = page.evaluate("window.LJTabbar && window.LJTabbar.STORAGE_KEY")
    print(f"[2] STORAGE_KEY = {sk!r}  -> {'OK' if sk == 'lingjing_v5170_current_tab' else 'FAIL'}")

    # 3. 当前 tab 推断
    cur = page.evaluate("window.LJTabbar.getCurrent()")
    print(f"[3] getCurrent() = {cur!r}  -> {'OK' if cur == 'home' else 'FAIL'}")

    # 4. TABS 配置完整
    tabs = page.evaluate("window.LJTabbar.TABS.map(function(t){return t.id})")
    print(f"[4] TABS = {tabs}")

    # 5. demo tabbar 切换测试（精确选 demo 容器）
    page.click('#v17a-tabbar-demo a[data-tab="xinyu"]')
    page.wait_for_timeout(200)
    active1 = page.evaluate("document.querySelector('#v17a-tabbar-demo a.active').getAttribute('data-tab')")
    saved1 = page.evaluate("localStorage.getItem('lingjing_v5170_current_tab')")
    print(f"[5] 点 xinyu 后 demo active={active1}, saved={saved1}  -> {'OK' if active1=='xinyu' and saved1=='xinyu' else 'FAIL'}")

    page.click('#v17a-tabbar-demo a[data-tab="world"]')
    page.wait_for_timeout(200)
    active2 = page.evaluate("document.querySelector('#v17a-tabbar-demo a.active').getAttribute('data-tab')")
    saved2 = page.evaluate("localStorage.getItem('lingjing_v5170_current_tab')")
    print(f"[6] 点 world 后 demo active={active2}, saved={saved2}  -> {'OK' if active2=='world' and saved2=='world' else 'FAIL'}")

    # 7. setBadge 测试（精准选真实挂载的 tabbar：含 data-tab 但非 demo 容器内）
    page.evaluate("window.LJTabbar.setBadge('me', 3)")
    badge_txt = page.evaluate("Array.from(document.querySelectorAll('.tabbar a[data-tab=\"me\"] .badge')).map(function(n){return n.textContent}).join('|')")
    print(f"[7] setBadge('me',3) -> badge text = {badge_txt!r}  -> {'OK' if '3' in (badge_txt or '') else 'FAIL'}")

    # 8. 截图
    page.screenshot(path=str(ROOT / "output" / "preview" / "screenshots" / "v17-a-tabbar.png"), full_page=False)
    print(f"[8] 截图已保存")

    # 9. 错误汇总
    if errors:
        print(f"[!] 运行时告警:")
        for kind, msg in errors[:5]:
            print(f"    {kind}: {msg[:120]}")
    else:
        print(f"[9] 0 个错误/告警")

    browser.close()