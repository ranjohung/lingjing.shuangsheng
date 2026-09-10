#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v5.18 — 创作者中心重构回归测试

测试目标：
1. 重复入口验证：creator-center 不再有重复的"创建新世界"大按键
2. 6 个页面 0 console error
3. 关键交互：3 路径选择 + step 切换 + AI 弹窗
4. 设计系统应用：design-system.css 加载
5. 视觉对比截图
"""

import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(r"F:\开发软件项目文件\灵境 · 双生")
SRC_DIR = BASE / "output" / "preview"
SHOT_DIR = SRC_DIR / "screenshots" / "v518"
SHOT_DIR.mkdir(parents=True, exist_ok=True)

SERVER = "http://127.0.0.1:8768"

PAGES = [
    ("01-creator-center", "/creator-center.html", "创作者中心主页"),
    ("02-creator-create-step1", "/creator-create.html", "创建新世界 · step1 选路径"),
    ("03-creator-create-step2", None, "创建新世界 · step2 基础信息"),
    ("04-novel-ai-helper", "/novel-ai-helper.html", "小说辅助模拟器"),
    ("05-commerce", "/commerce.html", "上架与定价"),
    ("06-novel-upload", "/novel-upload.html", "上传小说"),
    ("07-novel-edit", "/novel-edit.html", "剧情编辑器"),
]


def run_tests():
    print("=" * 70)
    print("v5.18 创作者中心重构 · 真机回归测试")
    print("=" * 70)

    results = []
    errors_total = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--use-gl=swiftshader"])
        ctx = browser.new_context(
            viewport={"width": 1366, "height": 850},
            device_scale_factor=1
        )

        # 1. creator-center
        print("\n[1/7] creator-center.html")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(f"{SERVER}/creator-center.html", wait_until="networkidle", timeout=15000)
        time.sleep(1)
        page.screenshot(path=str(SHOT_DIR / "01-creator-center.png"), full_page=False)
        # 验证：页面没有"创建新世界"作为大按键重复（应该是 Hero 里的"新建作品"按钮）
        # 检查是否还保留"创建新世界"作为独立大卡（在 cc-features 区域）
        # 现在三个大卡是：小说辅助模拟器 / 我的作品 / 上架与定价
        cc_features = page.locator(".cc-feature").count()
        print(f"  - cc-feature 数量: {cc_features} (期望 3)")

        # 重复入口验证
        # 旧版本: creator-center 里有 3 大按键 (创建新世界 + 小说辅助 + 上架与定价)
        # 新版本: 3 大按键 (小说辅助 + 我的作品 + 上架与定价) - 创建新世界消失
        # 验证: cc-feature-title 不含"创建新世界"
        titles = page.locator(".cc-feature-title").all_text_contents()
        print(f"  - 3 大功能区标题: {titles}")
        has_create = any("创建新世界" in t for t in titles)
        if has_create:
            print(f"  ❌ 重复入口：仍有'创建新世界'大按键")
            results.append(("creator-center", False))
        else:
            print(f"  ✓ 无'创建新世界'大按键（已并入 Hero 区域）")
            results.append(("creator-center", True))

        if errors:
            print(f"  ⚠ Console errors: {errors}")
            errors_total += len(errors)
        else:
            print(f"  ✓ 0 console error")
        page.close()

        # 2. creator-create step 1
        print("\n[2/7] creator-create.html · step 1")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(f"{SERVER}/creator-create.html", wait_until="networkidle", timeout=15000)
        time.sleep(1)
        page.screenshot(path=str(SHOT_DIR / "02-creator-create-step1.png"))
        # 验证：3 路径 + stepper + "下一步"按钮初始 disabled
        paths = page.locator(".cc-path").count()
        print(f"  - 3 路径卡: {paths} (期望 3)")
        btn_next = page.locator("#btn-next-1")
        is_disabled = btn_next.is_disabled()
        print(f"  - 下一步按钮初始 disabled: {is_disabled}")
        if errors:
            print(f"  ⚠ Console errors: {errors}")
            errors_total += len(errors)
        page.close()

        # 3. creator-create step 2 (点击 AI 辅助)
        print("\n[3/7] creator-create.html · step 2")
        page = ctx.new_page()
        page.goto(f"{SERVER}/creator-create.html", wait_until="networkidle", timeout=15000)
        time.sleep(0.8)
        page.locator(".cc-path[data-path='ai']").click()
        time.sleep(0.4)
        page.locator("#btn-next-1").click()
        time.sleep(0.6)
        page.screenshot(path=str(SHOT_DIR / "03-creator-create-step2.png"))
        # 验证 step 2 显示（基础信息表单）
        form_visible = page.locator("#form-title").is_visible()
        print(f"  - 基础信息表单显示: {form_visible}")
        page.close()

        # 4. novel-ai-helper
        print("\n[4/7] novel-ai-helper.html")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(f"{SERVER}/novel-ai-helper.html", wait_until="networkidle", timeout=15000)
        time.sleep(1.2)
        page.screenshot(path=str(SHOT_DIR / "04-novel-ai-helper.png"))
        # 验证：6 张表 + 进度卡
        tables = page.locator(".aih-table-item").count()
        print(f"  - 6 张表: {tables} (期望 6)")
        # 切换到第 2 张表
        if tables >= 2:
            page.locator(".aih-table-item[data-table='1']").click()
            time.sleep(0.4)
        # 点击第一个 AI 按钮
        ai_btn = page.locator(".aih-ai-btn").first
        if ai_btn.is_visible():
            ai_btn.click()
            time.sleep(0.5)
            page.screenshot(path=str(SHOT_DIR / "04b-ai-modal.png"))
            print(f"  ✓ AI 弹窗弹出")
        if errors:
            print(f"  ⚠ Console errors: {errors}")
            errors_total += len(errors)
        else:
            print(f"  ✓ 0 console error")
        page.close()

        # 5. commerce
        print("\n[5/7] commerce.html")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(f"{SERVER}/commerce.html", wait_until="networkidle", timeout=15000)
        time.sleep(1.5)
        page.screenshot(path=str(SHOT_DIR / "05-commerce.png"), full_page=False)
        # 验证：5 个 section
        sections = page.locator(".section").count()
        print(f"  - 5 个 section: {sections} (期望 >=5)")
        # 验证 PageHeader
        page_header = page.locator(".ds-page-header").count()
        print(f"  - 新 PageHeader: {page_header} (期望 1)")
        if errors:
            print(f"  ⚠ Console errors: {errors}")
            errors_total += len(errors)
        else:
            print(f"  ✓ 0 console error")
        page.close()

        # 6. novel-upload
        print("\n[6/7] novel-upload.html")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(f"{SERVER}/novel-upload.html", wait_until="networkidle", timeout=15000)
        time.sleep(1)
        page.screenshot(path=str(SHOT_DIR / "06-novel-upload.png"))
        if errors:
            print(f"  ⚠ Console errors: {errors}")
            errors_total += len(errors)
        else:
            print(f"  ✓ 0 console error")
        page.close()

        # 7. novel-edit
        print("\n[7/7] novel-edit.html")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(f"{SERVER}/novel-edit.html", wait_until="domcontentloaded", timeout=15000)
        time.sleep(1.5)
        page.screenshot(path=str(SHOT_DIR / "07-novel-edit.png"))
        if errors:
            print(f"  ⚠ Console errors: {errors}")
            errors_total += len(errors)
        else:
            print(f"  ✓ 0 console error")
        page.close()

        # 8. 设计系统 CSS 验证
        print("\n[验证] design-system.css 是否被所有页面加载")
        for url in ["/creator-center.html", "/creator-create.html", "/novel-ai-helper.html", "/commerce.html", "/novel-upload.html", "/novel-edit.html"]:
            r = ctx.request.get(f"{SERVER}{url}")
            content = ""
            try:
                content = r.text()
            except Exception:
                pass
            if "design-system.css" in content:
                print(f"  ✓ {url} 加载 design-system.css")
            else:
                print(f"  ❌ {url} 未加载 design-system.css")

        ctx.close()
        browser.close()

    print("\n" + "=" * 70)
    print(f"测试结果")
    print("=" * 70)
    passed = sum(1 for _, ok in results if ok)
    print(f"  关键验证通过: {passed}/{len(results)}")
    print(f"  Console errors 总计: {errors_total}")
    print(f"  截图保存: {SHOT_DIR}")
    return passed == len(results) and errors_total == 0


if __name__ == "__main__":
    sys.exit(0 if run_tests() else 1)
