"""v5.17 真机测试 — 创作者中心 + 小说辅助模拟器 + 上架与定价"""
from playwright.sync_api import sync_playwright
import sys, os, json

OUT = r"F:\开发软件项目文件\灵境 · 双生\output\preview\screenshots\v517"
os.makedirs(OUT, exist_ok=True)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=swiftshader", "--enable-webgl"]
        )
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, device_scale_factor=1)
        page = ctx.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

        results = []

        # === 测试 1: 创作者中心 ===
        print("[1/6] 创作者中心 creator-center.html")
        page.goto("http://127.0.0.1:8765/creator-center.html", wait_until="networkidle")
        page.wait_for_timeout(800)
        # 验证关键元素
        title = page.title()
        back_arrow = page.locator(".back-arrow").count()
        core_btns = page.locator(".core-btn").count()
        tabs_visible = page.locator(".section, .stats-row, .notice").count()
        page.screenshot(path=f"{OUT}/01-creator-center.png", full_page=True)
        results.append({"page": "creator-center", "title": title, "back_arrow": back_arrow, "core_btns": core_btns, "ok": back_arrow == 1 and core_btns >= 3})
        print(f"  title={title[:30]} back_arrow={back_arrow} core_btns={core_btns}")

        # === 测试 2: 创建新世界三入口 ===
        print("[2/6] 创建新世界 creator-create.html")
        page.goto("http://127.0.0.1:8765/creator-create.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        paths = page.locator(".path-card").count()
        back = page.locator(".back-arrow").count()
        page.screenshot(path=f"{OUT}/02-creator-create.png", full_page=True)
        results.append({"page": "creator-create", "paths": paths, "back": back, "ok": paths == 3 and back == 1})
        print(f"  paths={paths} back_arrow={back}")

        # === 测试 3: 小说辅助模拟器（基础信息表）===
        print("[3/6] 小说辅助模拟器 novel-ai-helper.html (基础信息)")
        page.goto("http://127.0.0.1:8765/novel-ai-helper.html", wait_until="networkidle")
        page.wait_for_timeout(800)
        tabs = page.locator(".tab").count()
        fields = page.locator(".field").count()
        ai_help_btns = page.locator(".ai-help-btn").count()
        page.screenshot(path=f"{OUT}/03-ai-helper-basic.png", full_page=True)
        results.append({"page": "ai-helper-basic", "tabs": tabs, "fields": fields, "ai_btns": ai_help_btns, "ok": tabs == 7 and fields > 0 and ai_help_btns > 0})
        print(f"  tabs={tabs} fields={fields} ai_help_btns={ai_help_btns}")

        # === 测试 4: AI 弹窗功能 ===
        print("[4/6] AI 弹窗 — 点击 🤖 帮我写")
        # 找到第一个 AI 按钮
        first_ai_btn = page.locator(".ai-help-btn").first
        first_ai_btn.click()
        page.wait_for_timeout(500)
        modal_visible = page.locator(".ai-modal").is_visible()
        options_count = page.locator(".ai-opt").count()
        page.screenshot(path=f"{OUT}/04-ai-modal.png", full_page=False)
        results.append({"page": "ai-modal", "visible": modal_visible, "options": options_count, "ok": modal_visible and options_count >= 2})
        print(f"  modal_visible={modal_visible} options={options_count}")
        # 关闭弹窗
        page.evaluate("closeAIModal()")
        page.wait_for_timeout(200)

        # === 测试 5: 切换到世界格局表 ===
        print("[5/6] 切换到世界格局表")
        page.locator(".tab[data-tab='world']").click()
        page.wait_for_timeout(500)
        world_fields = page.locator(".field").count()
        page.screenshot(path=f"{OUT}/05-ai-helper-world.png", full_page=True)
        results.append({"page": "ai-helper-world", "fields": world_fields, "ok": world_fields > 0})
        print(f"  world_fields={world_fields}")

        # === 测试 6: 上架与定价 ===
        print("[6/6] 上架与定价 commerce.html")
        page.goto("http://127.0.0.1:8765/commerce.html", wait_until="networkidle")
        page.wait_for_timeout(800)
        title = page.title()
        has_back_to_center = "creator-center" in (page.locator(".back-arrow").get_attribute("href") or "")
        sections = page.locator(".section").count()
        page.screenshot(path=f"{OUT}/06-commerce.png", full_page=True)
        results.append({"page": "commerce", "title": title, "back_to_center": has_back_to_center, "sections": sections, "ok": "上架与定价" in title and has_back_to_center})
        print(f"  title={title[:30]} back_to_center={has_back_to_center} sections={sections}")

        # === 测试 7: library.html 主导航 ===
        print("[7] library.html 主导航")
        page.goto("http://127.0.0.1:8765/library.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        nav_links = page.locator("nav a").all_text_contents()
        has_creator_center = any("创作者中心" in t for t in nav_links)
        page.screenshot(path=f"{OUT}/07-library-nav.png", full_page=False)
        results.append({"page": "library-nav", "nav_links": nav_links, "has_creator": has_creator_center, "ok": has_creator_center})
        print(f"  nav={nav_links} has_creator={has_creator_center}")

        # 总结
        print("\n========== 测试结果 ==========")
        all_ok = all(r["ok"] for r in results)
        for r in results:
            print(f"  [{'✓' if r['ok'] else '✗'}] {r['page']}")
        print(f"\n  Console Errors: {len(console_errors)}")
        for e in console_errors[:10]:
            print(f"    {e}")
        print(f"\n  Overall: {'PASS' if all_ok and not console_errors else 'FAIL'}")

        browser.close()

        # 写结果 JSON
        with open(f"{OUT}/test-result.json", "w", encoding="utf-8") as f:
            json.dump({"results": results, "errors": console_errors, "pass": all_ok and not console_errors}, f, ensure_ascii=False, indent=2)

        return 0 if (all_ok and not console_errors) else 1

if __name__ == "__main__":
    sys.exit(main())
