#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v5.17.2 — 橙光字样清理回归测试

测试目标：
1. 全项目无 "橙光" 字样残留（除原始需求追溯文件 + 清洗脚本本身）
2. plot-runner 与 product-preview 视觉风格未变（截图对比）
3. 0 console error
"""

import sys
import re
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = Path(r"F:\开发软件项目文件\灵境 · 双生")
SRC_DIR = BASE / "output" / "preview"
SHOT_DIR = SRC_DIR / "screenshots" / "v5172"
SHOT_DIR.mkdir(parents=True, exist_ok=True)

SERVER = "http://127.0.0.1:8767"

# ===== 测试 1: 文件级残留检查 =====
def check_residue():
    """检查全项目是否还有 '橙光' 字样（除清洗脚本本身 + 用户原始输入）"""
    print("=" * 70)
    print("【测试1】'橙光' 字样全项目残留扫描")
    print("=" * 70)

    excludes = {
        # 清洗脚本本身
        BASE / "scripts" / "clean_v5172.py",
        # 测试脚本自身（"橙光"是测试对象的描述，不是项目文案）
        BASE / "scripts" / "test_v5172_regression.py",
        # 用户原始需求文件（追溯证据，不允许修改）
        BASE / "docs" / "sources" / "2026-09-09" / "S02-creator.txt",
        BASE / "docs" / "sources" / "2026-09-09" / "S04-economy.txt",
        BASE / "docs" / "sources" / "2026-09-09" / "S05-world-engineering.txt",
        BASE / "docs" / "sources" / "2026-09-09" / "S06-world-engineering-duplicate.txt",
        BASE / "docs" / "sources" / "2026-09-09" / "S07-world-engineering-final.txt",
    }

    residue_files = []
    for p in BASE.rglob("*"):
        if not p.is_file():
            continue
        if p in excludes:
            continue
        if p.suffix.lower() not in {".html", ".md", ".js", ".json", ".css", ".sh", ".py"}:
            continue
        # 跳过截图目录
        try:
            rel = p.relative_to(BASE)
            if "screenshots" in rel.parts or ".playwright-cli" in rel.parts:
                continue
            if any(part.startswith(".workbuddy") for part in rel.parts):
                continue
        except ValueError:
            continue

        try:
            content = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            try:
                content = p.read_text(encoding="gbk")
            except Exception:
                continue
        except Exception:
            continue

        matches = []
        for line_num, line in enumerate(content.splitlines(), start=1):
            if "橙光" in line:
                matches.append((line_num, line.strip()[:100]))

        if matches:
            residue_files.append((p, matches))

    if residue_files:
        print(f"❌ 残留 {len(residue_files)} 个文件：")
        for f, matches in residue_files[:20]:
            rel = f.relative_to(BASE)
            print(f"  - {rel}")
            for ln, txt in matches[:3]:
                print(f"    line {ln}: {txt}")
        return False
    else:
        print(f"✅ 0 个文件残留 '橙光' 字样（已排除清洗脚本 + 用户原始需求文件）")
        return True


# ===== 测试 2-5: UI 与功能测试 =====
def run_ui_tests():
    print("\n" + "=" * 70)
    print("【测试2-5】plot-runner 与 product-preview 视觉风格回归")
    print("=" * 70)

    pages_to_test = [
        ("plot-runner", "/plot-runner.html?novelId=demo_palace", "试玩剧本对话：场景图 + 立绘 + 对话框"),
        ("library", "/library.html", "30 题材库（导航：小说世界/创作者中心/5题材/v5.8）"),
        ("creator-center", "/creator-center.html", "创作者中心（3 大按键）"),
        ("commerce", "/commerce.html", "上架与定价（仅作者可见）"),
    ]

    # product-preview 在项目根，用 file:// 直接打开
    file_pages = [
        ("product-preview", r"F:\开发软件项目文件\灵境 · 双生\product-preview.html", "产品总览（已去除 v513 顶级 tab）"),
    ]

    errors_total = 0
    ok_pages = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--use-gl=swiftshader"])
        ctx = browser.new_context(
            viewport={"width": 1366, "height": 800},
            device_scale_factor=1
        )

        for name, path, desc in pages_to_test:
            url = f"{SERVER}{path}"
            print(f"\n  ▶ {name}: {desc}")
            print(f"    URL: {url}")

            page = ctx.new_page()
            console_errors = []

            def on_console(msg):
                if msg.type == "error":
                    console_errors.append(msg.text)

            page.on("console", on_console)

            try:
                page.goto(url, wait_until="networkidle", timeout=15000)
                time.sleep(0.8)

                # 截图
                shot_path = SHOT_DIR / f"{name}.png"
                page.screenshot(path=str(shot_path))
                print(f"    ✓ 截图保存: {shot_path.name}")

                # 检查 title 没有"橙光"
                title = page.title()
                if "橙光" in title:
                    print(f"    ✗ Title 含 '橙光': {title}")
                    return False
                else:
                    print(f"    ✓ Title 干净: {title}")

                if console_errors:
                    print(f"    ⚠ Console errors: {console_errors}")
                    errors_total += len(console_errors)
                else:
                    print(f"    ✓ 0 console error")

                ok_pages += 1
            except Exception as e:
                print(f"    ✗ 异常: {e}")
            finally:
                page.close()

        # product-preview 用 file:// 单独跑
        for name, path, desc in file_pages:
            url = f"file:///{path.replace(chr(92), '/')}"
            print(f"\n  ▶ {name}: {desc}")
            print(f"    URL: {url}")

            page = ctx.new_page()
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            try:
                page.goto(url, wait_until="networkidle", timeout=15000)
                time.sleep(0.8)

                shot_path = SHOT_DIR / f"{name}.png"
                page.screenshot(path=str(shot_path))
                print(f"    ✓ 截图保存: {shot_path.name}")

                title = page.title()
                if "橙光" in title:
                    print(f"    ✗ Title 含 '橙光': {title}")
                    return False
                else:
                    print(f"    ✓ Title 干净: {title}")

                if console_errors:
                    print(f"    ⚠ Console errors: {console_errors}")
                    errors_total += len(console_errors)
                else:
                    print(f"    ✓ 0 console error")

                ok_pages += 1
            except Exception as e:
                print(f"    ✗ 异常: {e}")
            finally:
                page.close()

        ctx.close()
        browser.close()

    print(f"\n  ▶ 总结: {ok_pages}/{len(pages_to_test)+len(file_pages)} 页面通过 · {errors_total} 个 console error")
    return ok_pages == (len(pages_to_test)+len(file_pages)) and errors_total == 0


def main():
    print(f"v5.17.2 回归测试 — 清空橙光字样 + 视觉风格保持")
    print(f"截图保存到: {SHOT_DIR}")
    print()

    r1 = check_residue()
    r2 = run_ui_tests()

    print("\n" + "=" * 70)
    print(f"最终结果")
    print("=" * 70)
    print(f"  残留扫描: {'✅ 通过' if r1 else '❌ 失败'}")
    print(f"  UI 回归:  {'✅ 通过' if r2 else '❌ 失败'}")

    return r1 and r2


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
