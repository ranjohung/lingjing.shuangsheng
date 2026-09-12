"""
回归测试 V17-A tabbar.js 路径自适应修复
模拟用户场景：从 product-preview.html（项目根）点击底部 Tab → 应跳到 output/preview/<tab>.html
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path("F:/开发软件项目文件/灵境 · 双生")
URL = "http://localhost:8767/product-preview.html"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--disable-web-security", "--no-sandbox"])
        ctx = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await ctx.new_page()
        # V20-C 启动页 splash 会把主界面藏进 .hidden 容器，预置跳过（同 v18a 做法）
        await page.add_init_script("try{localStorage.setItem('lingjing_onboarding_done','true')}catch(e){}")

        print("=" * 60)
        print("V17-A 路径自适应回归测试 · 修复 product-preview.html → Tab 跳转")
        print("=" * 60)

        # Step 1: 打开主页
        resp = await page.goto(URL, wait_until="domcontentloaded", timeout=10000)
        print(f"1. 打开主页: HTTP {resp.status} | URL={page.url}")
        assert resp.status == 200, f"主页 HTTP {resp.status} 应为 200"

        # Step 2: 等待 tabbar 挂载
        await page.wait_for_function("window.LJTabbar && window.LJTabbar.__mounted", timeout=5000)
        await page.wait_for_selector(".tabbar a[data-tab]", timeout=5000)

        # Step 3: 检查 tabbar.href 是否前缀 output/preview/
        hrefs = await page.eval_on_selector_all(
            ".tabbar a[data-tab]",
            "els => els.map(e => e.getAttribute('href'))"
        )
        print(f"2. 5 Tab href:")
        for h in hrefs:
            print(f"   - {h}")
        assert hrefs[0] == "product-preview.html", "home href wrong"
        for h in hrefs[1:]:
            assert h.startswith("output/preview/"), f"{h} missing prefix"
        assert "output/preview/heart-island.html" in hrefs, "xinyu missing prefix"

        # Step 4: 点击「心屿」Tab → 应跳到 output/preview/heart-island.html
        print("3. 点击「心屿」 Tab...")
        await page.locator(".tabbar a[data-tab='xinyu']").click()
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        print(f"   跳转后 URL: {page.url}")
        assert "output/preview/heart-island.html" in page.url, \
            f"❌ FAIL: 心屿跳错 URL ({page.url})"

        # Step 5: 检查心屿页面 5 Tab 全部正确加载
        await page.wait_for_selector(".tabbar a[data-tab]", timeout=5000)
        hrefs_h = await page.eval_on_selector_all(
            ".tabbar a[data-tab]",
            "els => els.map(e => e.getAttribute('href'))"
        )
        print(f"4. 心屿页 5 Tab href（应都是文件名，无前缀）:")
        for h in hrefs_h:
            print(f"   - {h}")
        assert all(not h.startswith("output/") for h in hrefs_h), \
            "❌ FAIL: 心屿页 tab 含 output/ 前缀（自反路径错）"

        # Step 6: 心屿页面再点「首页」 → 应跳到根 product-preview.html
        print("5. 心屿页点「首页」 Tab...")
        await page.locator(".tabbar a[data-tab='home']").click()
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        print(f"   跳转后 URL: {page.url}")
        assert page.url.rstrip("/").endswith("product-preview.html"), \
            f"❌ FAIL: 首页应跳到根 product-preview.html，实际 {page.url}"

        # Step 7: 主页点「世界」 Tab → output/preview/library.html
        await page.wait_for_selector(".tabbar a[data-tab='world']", timeout=5000)
        await page.locator(".tabbar a[data-tab='world']").click()
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        print(f"6. 主页点「世界」 → {page.url}")
        assert "output/preview/library.html" in page.url, f"❌ 世界跳转错: {page.url}"

        # Step 8: 主页点「创作」 Tab → output/preview/creator-center.html
        await page.goto(URL, wait_until="domcontentloaded")
        await page.wait_for_selector(".tabbar a[data-tab='create']", timeout=5000)
        await page.locator(".tabbar a[data-tab='create']").click()
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        print(f"7. 主页点「创作」 → {page.url}")
        assert "output/preview/creator-center.html" in page.url, f"❌ 创作跳转错: {page.url}"

        # Step 9: 主页点「我的」 Tab → output/preview/me.html
        await page.goto(URL, wait_until="domcontentloaded")
        await page.wait_for_selector(".tabbar a[data-tab='me']", timeout=5000)
        await page.locator(".tabbar a[data-tab='me']").click()
        await page.wait_for_load_state("domcontentloaded", timeout=10000)
        print(f"8. 主页点「我的」 → {page.url}")
        assert "output/preview/me.html" in page.url, f"❌ 我的跳转错: {page.url}"

        # Step 10: localStorage 验证
        ls = await page.evaluate("localStorage.getItem('lingjing_v5170_current_tab')")
        print(f"9. localStorage lingjing_v5170_current_tab = {ls}")
        assert ls == "me", f"❌ localStorage 应为 me，实际 {ls}"

        await browser.close()

        print("\n" + "=" * 60)
        print("✅ ALL PASS · V17-A 路径自适应修复回归 9/9")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
