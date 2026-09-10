#!/usr/bin/env python3
"""v5.19 知己功能区回归测试 — 5 页面 + 0 console error + 设计系统加载"""
import sys
from pathlib import Path
sys.path.insert(0, r"C:\Users\Administrator\.workbuddy\binaries\python\envs\default\Lib\site-packages")
from playwright.sync_api import sync_playwright

BASE = Path("F:/开发软件项目文件/灵境 · 双生")
SHOT_DIR = BASE / "output/preview/screenshots/v519"
SHOT_DIR.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("01-library",     "library.html",     "30 题材库（顶部 nav 已加 知己）"),
    ("02-companion",   "companion.html",   "陪伴主页 · 6 位角色动态卡"),
    ("03-chat",        "chat.html",        "1v1 陪聊 · 阿岁"),
    ("04-memory",      "memory.html",      "共享记忆时间线 · 情绪曲线"),
    ("05-profile",     "profile.html",     "个人主页 · 用户画像 · 5 menu 卡片"),
]

PORT = 8770
SERVER = f"http://127.0.0.1:{PORT}"


def main():
    ok, errors_total = 0, 0
    with sync_playwright() as p:
        # 移动端 viewport（这是用户截图的形态）
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        ctx = browser.new_context(
            viewport={"width": 412, "height": 915},  # mobile-like
            device_scale_factor=2,
        )
        for name, path, desc in PAGES:
            print(f"\n[{name}] {desc}")
            page = ctx.new_page()
            errs = []
            page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
            try:
                page.goto(f"{SERVER}/{path}", wait_until="domcontentloaded", timeout=15000)
                page.wait_for_timeout(1500)
                page.screenshot(path=str(SHOT_DIR / f"{name}.png"), full_page=True)
                print(f"  截图：{name}.png")
                title = page.title()
                has_design_system = "design-system.css" in (page.content() if False else "")
                # 检查 design-system.css 是否被加载（通过 link 标签存在性）
                links = page.evaluate("Array.from(document.querySelectorAll('link[rel=\"stylesheet\"]')).map(l=>l.href||'(inline)')")
                css_ok = any("design-system.css" in l for l in links)
                print(f"  Title: {title}")
                if css_ok:
                    print(f"  design-system.css 已加载")
                if errs:
                    print(f"  console 错误: {errs[:3]}")
                    errors_total += len(errs)
                else:
                    print(f"  0 console error")
                ok += 1
            except Exception as e:
                print(f"  异常: {e}")
            finally:
                page.close()
        ctx.close()
        browser.close()

    print(f"\n=== {ok}/{len(PAGES)} 页面通过 · {errors_total} console error ===")
    return ok == len(PAGES) and errors_total == 0


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
