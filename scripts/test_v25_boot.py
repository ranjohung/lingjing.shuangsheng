# -*- coding: utf-8 -*-
"""V25 启动逻辑验收：第二次登录陪伴AI打招呼界面（PRD-v25 §3）。
单文件应用架构（build_single_html.py）：boot-greeting 在 home iframe 内执行，
localStorage 与父页同源共享；测试经 frame_locator('#stage') 探测 iframe 内 UI。
"""
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]
PORT = int(os.environ.get("LJ_TEST_PORT", "8798"))
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
    proc = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)],
                            cwd=str(REPO), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
            U = f"{BASE}/index.html"
            # 预置已完成新手引导 → 外壳直接 LJEnter 进入 home iframe（boot-greeting 所在层）
            pg.add_init_script("try{localStorage.setItem('lingjing_onboarding_done','true')}catch(e){}")
            fl = pg.frame_locator("#stage")

            # 第一次登录：无打招呼
            pg.goto(U, wait_until="domcontentloaded"); pg.wait_for_timeout(1500)
            check("1 首次登录无打招呼界面", fl.locator("#lj-boot-greet").count() == 0)
            check("2 logins=1", pg.evaluate("JSON.parse(localStorage.getItem('lingjing_v525_boot_v1')).logins") == 1)

            # 第二次登录（清 sessionStorage 模拟新会话）
            pg.evaluate("sessionStorage.clear()")
            pg.reload(wait_until="domcontentloaded"); pg.wait_for_timeout(1600)
            check("3 第二次登录出现全屏打招呼", fl.locator("#lj-boot-greet").count() == 1)
            check("4 陪伴AI身份标注", "阿岁" in fl.locator("#lj-boot-greet").inner_text())
            check("5 问候语非空（分时段）", len(fl.locator("#ljBootText").inner_text()) >= 4)
            check("6 进入灵境按钮", fl.locator("#ljBootEnter").count() == 1)
            pg.screenshot(path=str(OUT / "v25-01-boot-greeting.png"))

            # 点击进入 → 消失；会话内刷新不重复
            fl.locator("#ljBootEnter").click(); pg.wait_for_timeout(600)
            check("7 点击后界面消失", fl.locator("#lj-boot-greet").count() == 0)
            pg.reload(wait_until="domcontentloaded"); pg.wait_for_timeout(1500)
            check("8 同会话刷新不重复", fl.locator("#lj-boot-greet").count() == 0)

            # 单文件路由内切换到创作中心
            pg.evaluate("LJ.go('creator-center')"); pg.wait_for_timeout(800)
            check("9 创作中心显示编辑我的作品", fl.locator("text=编辑我的作品").count() >= 1)

            check("10 0 PageError", not PAGE_ERRORS, str(PAGE_ERRORS[:2]))
            br.close()
    finally:
        if srv:
            srv.terminate()
    print(f"\n===== V25 RESULT: {len(PASS)} PASS / {len(FAIL)} FAIL =====")
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
