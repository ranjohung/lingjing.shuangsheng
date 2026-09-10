"""v5.17 深度测试：质量检测报告 + AI 提问 + 伏笔台账"""
from playwright.sync_api import sync_playwright
import sys, os, json

OUT = r"F:\开发软件项目文件\灵境 · 双生\output\preview\screenshots\v517"
os.makedirs(OUT, exist_ok=True)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

        results = []

        # === 测试 1: 自动质量检测 ===
        print("[1/3] 自动质量检测报告")
        page.goto("http://127.0.0.1:8765/novel-ai-helper.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        # 模拟填写一些字段以触发有意义的检测
        page.evaluate("""
            window.NovelOutline.saveField('self', 'basic', 'book_title', '测试小说', false);
            window.CharacterProfile.saveProfile('self', {
                character_name: '主角',
                gender: '男',
                age: '25岁'
            });
            window.Foreshadowing.add('self', {
                foreshadow_id: 'F001',
                content: '神秘戒指',
                planted_chapter: 3,
                expected_recover_chapter: 12,
                foreshadow_type: '物件伏笔',
                importance: 0.85
            });
        """)
        page.wait_for_timeout(300)
        # 点击运行质量检测按钮
        page.evaluate("runQualityCheck()")
        page.wait_for_timeout(800)
        report_visible = page.locator("#report-panel").is_visible()
        grade = page.locator("#report-grade").inner_text() if report_visible else ""
        stats = page.locator("#stat-pass, #stat-warn, #stat-fail").all_text_contents()
        dim_count = page.locator(".dim").count()
        page.screenshot(path=f"{OUT}/08-quality-report.png", full_page=True)
        results.append({"page": "quality", "report_visible": report_visible, "grade": grade, "stats": stats, "dims": dim_count, "ok": report_visible and dim_count == 6})
        print(f"  visible={report_visible} grade={grade} stats={stats} dims={dim_count}")

        # === 测试 2: AI 格外提问（场景描写）===
        print("[2/3] AI 格外提问 — 场景描写")
        page.evaluate("openQuestion('scene_description')")
        page.wait_for_timeout(500)
        q_versions = page.locator(".q-version").count()
        recommendation = page.locator(".q-recommendation").count()
        page.screenshot(path=f"{OUT}/09-ai-question.png", full_page=True)
        results.append({"page": "ai-question", "versions": q_versions, "recommendation": recommendation, "ok": q_versions >= 3 and recommendation >= 1})
        print(f"  versions={q_versions} recommendation={recommendation}")

        # === 测试 3: 伏笔台账 ===
        print("[3/3] 伏笔台账 tab")
        page.locator(".tab[data-tab='foreshadow']").click()
        page.wait_for_timeout(500)
        reminders = page.locator("h4:has-text('⚠️')").count()
        fs_total = page.locator(".stat-card:has-text('伏笔总数')").count()
        page.screenshot(path=f"{OUT}/10-foreshadow.png", full_page=True)
        results.append({"page": "foreshadow", "reminders": reminders, "ok": fs_total >= 1})
        print(f"  reminders={reminders}")

        print("\n========== 深度测试结果 ==========")
        all_ok = all(r["ok"] for r in results)
        for r in results:
            print(f"  [{'✓' if r['ok'] else '✗'}] {r['page']}")
        print(f"\n  Console Errors: {len(console_errors)}")
        for e in console_errors[:10]:
            print(f"    {e}")
        print(f"\n  Overall: {'PASS' if all_ok and not console_errors else 'FAIL'}")

        browser.close()
        with open(f"{OUT}/deep-test-result.json", "w", encoding="utf-8") as f:
            json.dump({"results": results, "errors": console_errors, "pass": all_ok and not console_errors}, f, ensure_ascii=False, indent=2)
        return 0 if (all_ok and not console_errors) else 1

if __name__ == "__main__":
    sys.exit(main())
