"""v5.15 全项目代码审查 — Playwright 自动化测试
   覆盖 9 个 HTML 页面 + 关键交互路径
   捕获：console error / pageerror / 网络失败 / 关键 DOM 缺失
"""
from playwright.sync_api import sync_playwright
import os, json, sys, time
from pathlib import Path

ROOT = Path("F:/开发软件项目文件/灵境 · 双生")
OUT = ROOT / "output/preview/screenshots/audit"
OUT.mkdir(parents=True, exist_ok=True)

# 9 个页面 + 关键参数
PAGES = [
    {"name": "catalog", "url": "catalog.html", "wait": 2000, "viewport": (1440, 900)},
    {"name": "library", "url": "library.html", "wait": 1500, "viewport": (1440, 900)},
    {"name": "novel-upload", "url": "novel-upload.html", "wait": 1000, "viewport": (1440, 900)},
    {"name": "novel-edit", "url": "novel-edit.html?novelId=demo_palace", "wait": 1500, "viewport": (1440, 900)},
    {"name": "plot-runner", "url": "plot-runner.html?novelId=demo_palace", "wait": 2000, "viewport": (1440, 900)},
    {"name": "commerce", "url": "commerce.html", "wait": 2000, "viewport": (1440, 900)},
    {"name": "game-3d", "url": "game-3d.html", "wait": 3000, "viewport": (1440, 900)},
    {"name": "games", "url": "games.html", "wait": 1500, "viewport": (1440, 900)},
    {"name": "redesign", "url": "redesign.html", "wait": 2000, "viewport": (1440, 900)},
]

# 关键交互测试
INTERACTIONS = [
    {"page": "library", "action": "click_first_genre_card"},
    {"page": "novel-upload", "action": "click_first_genre_opt"},
    {"page": "plot-runner", "action": "click_dialogue_box"},
    {"page": "plot-runner", "action": "click_first_choice"},
    {"page": "plot-runner", "action": "open_history"},
    {"page": "plot-runner", "action": "open_save_panel"},
    {"page": "commerce", "action": "click_evaluate_copyright"},
    {"page": "commerce", "action": "click_evaluate_quality"},
    {"page": "commerce", "action": "open_add_point_modal"},
    {"page": "commerce", "action": "open_ai_helper"},
]

errors_global = []
results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    for page_cfg in PAGES:
        page_name = page_cfg["name"]
        url_path = page_cfg["url"]
        w, h = page_cfg["viewport"]
        wait_ms = page_cfg["wait"]
        errors = []
        url = f"file://{ROOT}/output/preview/{url_path}"

        ctx = browser.new_context(viewport={"width": w, "height": h})
        page = ctx.new_page()

        def on_console(msg):
            if msg.type in ("error",):
                errors.append(f"[{msg.type}] {msg.text[:200]}")
        def on_pageerror(err):
            errors.append(f"[pageerror] {str(err)[:200]}")
        def on_requestfailed(req):
            if "file://" in req.url:
                errors.append(f"[reqfail] {req.url.split('/')[-1]} · {req.failure}")
        page.on("console", on_console)
        page.on("pageerror", on_pageerror)
        page.on("requestfailed", on_requestfailed)

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(wait_ms)
            screenshot = OUT / f"{page_name}-01-load.png"
            page.screenshot(path=str(screenshot), full_page=False)
        except Exception as e:
            errors.append(f"[goto-fail] {str(e)[:200]}")

        # 关键元素检查
        try:
            title = page.title()
        except Exception as e:
            title = f"<error: {e}>"

        results[page_name] = {
            "title": title,
            "errors": errors,
            "url": url_path,
            "screenshot": str(screenshot) if 'screenshot' in dir() else None,
        }
        ctx.close()

        if errors:
            print(f"⚠ {page_name}: {len(errors)} issues")
            for e in errors[:3]:
                print(f"    {e}")
        else:
            print(f"✓ {page_name}: 0 errors · title={title[:60]}")

    # 关键交互测试
    print("\n=== 关键交互测试 ===")
    interactions_results = {}
    for it in INTERACTIONS:
        page_name = it["page"]
        action = it["action"]
        # 找到对应的 url
        url_path = next((p["url"] for p in PAGES if p["name"] == page_name), None)
        if not url_path: continue
        url = f"file://{ROOT}/output/preview/{url_path}"
        w, h = 1440, 900

        ctx = browser.new_context(viewport={"width": w, "height": h})
        page = ctx.new_page()
        ie = []
        page.on("console", lambda msg: msg.type == "error" and ie.append(f"[err] {msg.text[:150]}"))
        page.on("pageerror", lambda err: ie.append(f"[pe] {str(err)[:150]}"))

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(2500)

            if action == "click_first_genre_card":
                # library.html 30 题材卡片
                page.click("#genre-grid .genre-card, .genre-card, #genre-grid > div", timeout=3000)
                page.wait_for_timeout(800)
                ss = OUT / f"interact-{page_name}-genre.png"
                page.screenshot(path=str(ss))
                url_after = page.url
                interactions_results[f"{page_name}/{action}"] = {"errors": ie, "url_after": url_after}
            elif action == "click_first_genre_opt":
                page.click(".genre-opt", timeout=3000)
                page.wait_for_timeout(500)
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "click_dialogue_box":
                page.click("#plot-dlg, .plot-dlg", timeout=3000)
                page.wait_for_timeout(300)
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "click_first_choice":
                page.click(".opt-btn, .plot-opt", timeout=3000)
                page.wait_for_timeout(500)
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "open_history":
                page.click("#tb-history", timeout=3000)
                page.wait_for_timeout(500)
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "open_save_panel":
                page.click("#tb-save", timeout=3000)
                page.wait_for_timeout(500)
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "click_evaluate_copyright":
                page.click("#btn-eval-copyright", timeout=3000)
                page.wait_for_timeout(800)
                ss = OUT / f"interact-{page_name}-copyright.png"
                page.screenshot(path=str(ss))
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "click_evaluate_quality":
                page.click("#btn-eval-quality", timeout=3000)
                page.wait_for_timeout(800)
                ss = OUT / f"interact-{page_name}-quality.png"
                page.screenshot(path=str(ss))
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "open_add_point_modal":
                page.click("#btn-add-point", timeout=3000)
                page.wait_for_timeout(500)
                ss = OUT / f"interact-{page_name}-addpoint.png"
                page.screenshot(path=str(ss))
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}
            elif action == "open_ai_helper":
                page.click("#btn-add-point", timeout=3000)
                page.wait_for_timeout(400)
                # 触发 AI 辅助（找一个 🤖 按钮）
                page.click(".ai-help-btn, [data-ai-trigger]", timeout=2000)
                page.wait_for_timeout(500)
                ss = OUT / f"interact-{page_name}-ai.png"
                page.screenshot(path=str(ss))
                interactions_results[f"{page_name}/{action}"] = {"errors": ie}

        except Exception as e:
            ie.append(f"[action-fail] {str(e)[:200]}")
            interactions_results[f"{page_name}/{action}"] = {"errors": ie}

        ctx.close()

        if ie:
            print(f"⚠ {page_name}/{action}: {len(ie)} issues")
            for e in ie[:3]:
                print(f"    {e}")
        else:
            print(f"✓ {page_name}/{action}")

    browser.close()

# 汇总
print("\n=== 汇总 ===")
total_errors = sum(len(r["errors"]) for r in results.values())
print(f"页面加载错误: {total_errors}")
for name, r in results.items():
    print(f"  {name}: {len(r['errors'])} err · {r['title'][:40]}")

ie_total = sum(len(r["errors"]) for r in interactions_results.values())
print(f"交互错误: {ie_total}")
for k, r in interactions_results.items():
    if r.get("url_after"):
        print(f"  {k}: → {r['url_after'].split('/')[-1]}")

# 写出审查报告
report = {
    "page_loads": results,
    "interactions": interactions_results,
    "summary": {
        "total_page_errors": total_errors,
        "total_interaction_errors": ie_total
    }
}
with open(OUT / "audit-report.json", "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(f"\n报告已存: {OUT}/audit-report.json")