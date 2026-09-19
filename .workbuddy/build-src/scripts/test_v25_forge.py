# -*- coding: utf-8 -*-
"""V25 小说世界自动生成 + 本地 SD/Blender 资产链路验收。"""
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("LJ_TEST_PORT", "8799"))
BASE = f"http://localhost:{PORT}"
OUT = REPO / "output" / "preview" / "screenshots" / "v25"
OUT.mkdir(parents=True, exist_ok=True)

PASS, FAIL, PAGE_ERRORS = [], [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  PASS " if cond else "  FAIL ") + name + (f"  [{detail}]" if detail and not cond else ""))


def start_server():
    try:
        socket.create_connection(("localhost", PORT), timeout=1).close()
        return None
    except OSError:
        pass
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        cwd=str(REPO),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(40):
        try:
            socket.create_connection(("localhost", PORT), timeout=1).close()
            return proc
        except OSError:
            time.sleep(0.25)
    raise RuntimeError("no server")


def main():
    srv = start_server()
    try:
        with sync_playwright() as p:
            br = p.chromium.launch()
            ctx = br.new_context(viewport={"width": 390, "height": 844})
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: PAGE_ERRORS.append(str(e)))

            # ---------- world-forge.html：选择公版书并生成世界 ----------
            pg.goto(f"{BASE}/output/preview/world-forge.html", wait_until="domcontentloaded")
            pg.wait_for_timeout(1200)
            check("1 公版书列表加载", pg.locator(".book").count() >= 4)
            pg.screenshot(path=str(OUT / "v25-01-forge-books.png"))

            # 点击《西游记》
            wk = pg.locator(".book").filter(has_text="西游记").first
            check("2 西游记卡片存在", wk.count() == 1)
            wk.click()
            pg.wait_for_timeout(800)
            check("3 已选状态更新", "已选：《西游记》" in pg.locator("#sel-status").inner_text())
            pg.screenshot(path=str(OUT / "v25-02-forge-selected.png"))

            # 生成世界蓝图
            pg.locator("#btn-forge").click()
            pg.wait_for_selector("#bp-title", state="visible", timeout=30000)
            pg.wait_for_timeout(1200)
            title = pg.locator("#bp-title").inner_text()
            check("4 生成成功标题", "西游记" in title, title)
            check("5 统计区非空", pg.locator("#bp-meta").inner_text().strip() != "")
            check("6 零删减校验通过", "✓" in pg.locator("#bp-checks").inner_text())
            pg.screenshot(path=str(OUT / "v25-03-forge-blueprint.png"))

            # ---------- world-view.html：沉浸模式展示本地资产 ----------
            pg.goto(f"{BASE}/output/preview/world-view.html?book=xiyouji", wait_until="domcontentloaded")
            pg.wait_for_timeout(1200)
            check("7 进入方式选择弹窗", pg.locator("#mode-veil").count() == 1)
            pg.screenshot(path=str(OUT / "v25-04-view-mode.png"))

            # 模式 A：原著阅读者
            pg.locator("#md-A").click()
            pg.wait_for_timeout(1500)
            check("8 主界面舞台出现", pg.locator(".stage").count() == 1)
            check("9 原著文字非空", len(pg.locator("#canon-text").inner_text()) >= 2)
            check("10 场景标题非空", pg.locator("#sc-cap").inner_text().strip() != "—")
            bg = pg.locator("#bg").get_attribute("src") or ""
            check("11 背景图已加载", bg.endswith(".png") or "gradient" in bg, bg)
            pg.screenshot(path=str(OUT / "v25-05-view-scene.png"))

            # 3D 场景弹窗
            pg.locator(".shot3d").click()
            pg.wait_for_timeout(800)
            check("12 3D 场景卡弹出", pg.locator("#m3d-card").count() == 1)
            pg.screenshot(path=str(OUT / "v25-06-view-3d.png"))
            pg.locator("#m3d-close").click(); pg.wait_for_timeout(200)

            # 热点交互：首个锚点可能无热点，继续切到带热点锚点
            for _ in range(8):
                if pg.locator(".hot").count() >= 1:
                    break
                pg.locator("#b-next").click(); pg.wait_for_timeout(400)
            hots = pg.locator(".hot")
            check("13 场景热点存在", hots.count() >= 1)
            if hots.count() >= 1:
                hots.first.click(); pg.wait_for_timeout(600)
                check("14 热点弹窗出现", pg.locator(".reveal").count() == 1)
                pg.screenshot(path=str(OUT / "v25-07-view-hot.png"))

            check("15 0 PageError", not PAGE_ERRORS, str(PAGE_ERRORS[:3]))
            br.close()
    finally:
        if srv:
            srv.terminate()
    print(f"\n===== V25 FORGE RESULT: {len(PASS)} PASS / {len(FAIL)} FAIL =====")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
