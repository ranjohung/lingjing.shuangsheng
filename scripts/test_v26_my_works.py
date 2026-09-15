#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V26 编辑我的作品 · 历史作品全集页回归
  1. creator-center：内嵌作品长列表已移除，「编辑我的作品」为功能按键
  2. 点击按键 → my-works.html（历史全集：已发布/草稿待续写/审核中/已下架/角色道具）
  3. 历史记录 ≥ 7 部（生成+上传+未完工），筛选项齐全
  4. 「继续续写」→ work-editor.html?w=<id>&tab=edit（作品选择/编辑器正常）
  5. my-works 创作Tab 高亮、手机锁宽、0 第三方名
端口 8799（惯例：v26 独占，避免并行冲突）
"""
import json
import threading
import time
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright

ROOT = r"F:\开发软件项目文件\灵境 · 双生"
PORT = 8799
BASE = f"http://127.0.0.1:{PORT}"
OUT = ROOT + r"\screenshots"

results = []
def check(name, ok, extra=""):
    results.append((name, bool(ok), extra))
    print(("✅" if ok else "❌") + f" {name}" + (f" | {extra}" if extra and not ok else ""))

def run_server():
    handler = partial(SimpleHTTPRequestHandler, directory=ROOT)
    httpd = HTTPServer(("127.0.0.1", PORT), handler)
    httpd.serve_forever()

threading.Thread(target=run_server, daemon=True).start()
time.sleep(0.8)

def goto(pg, url):
    pg.goto(url, wait_until="domcontentloaded")
    pg.wait_for_timeout(600)

with sync_playwright() as p:
    browser = p.chromium.launch()
    pg = browser.new_page(viewport={"width": 390, "height": 844})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('__lj_test_init_done','1')}catch(e){}")

    # ---------- 1. creator-center 改造 ----------
    print("== 1 creator-center ==")
    goto(pg, f"{BASE}/output/preview/creator-center.html")
    check("1.1 内嵌作品长列表已移除", pg.locator(".work-list").count() == 0)
    check("1.2 编辑我的作品功能按键存在", pg.locator("a.func[href='my-works.html']").count() == 1)
    check("1.3 按键文案正确", "编辑我的作品" in (pg.locator("a.func[href='my-works.html'] .t").inner_text() or ""))
    check("1.4 其余功能区按键保留(共5卡)", pg.locator(".func-grid .func").count() == 5)
    pg.screenshot(path=OUT + r"\v26-01-creator-center.png")

    # ---------- 2. 点击进入 my-works ----------
    print("== 2 进入历史全集 ==")
    pg.locator("a.func[href='my-works.html']").click()
    pg.wait_for_url("**/my-works.html")
    pg.wait_for_timeout(800)
    check("2.1 跳转 my-works.html", "my-works" in pg.url)
    check("2.2 页面标题", "编辑我的作品" in pg.title())
    cards = pg.locator("#mw-list .mw-item")
    check("2.3 历史作品 ≥ 7 部", cards.count() >= 7, str(cards.count()))
    check("2.4 西游记(已发布)在列", cards.filter(has_text="西游记").count() >= 1)
    check("2.5 红楼梦草稿·待续写在列", cards.filter(has_text="红楼梦").filter(has_text="待续写").count() >= 1)
    check("2.6 筛选 6 项(全部/已发布/草稿/审核/下架/角色道具)", pg.locator("#mw-tabs .mw-tab").count() == 6)
    check("2.7 创作Tab高亮", pg.evaluate("!!document.querySelector('.tabbar a.t-create.active')"))
    pg.screenshot(path=OUT + r"\v26-02-my-works-all.png", full_page=True)

    # ---------- 3. 筛选 ----------
    print("== 3 筛选 ==")
    pg.locator("#mw-tabs .mw-tab[data-tab='draft']").click(); pg.wait_for_timeout(300)
    d_cnt = pg.locator("#mw-list .mw-item").count()
    check("3.1 草稿·待续写筛选有结果且全为草稿", d_cnt >= 3 and pg.locator("#mw-list .tag.draft").count() == d_cnt, f"{d_cnt}")
    pg.locator("#mw-tabs .mw-tab[data-tab='review']").click(); pg.wait_for_timeout(300)
    check("3.2 审核中有记录", pg.locator("#mw-list .mw-item").count() >= 1)
    pg.locator("#mw-tabs .mw-tab[data-tab='asset']").click(); pg.wait_for_timeout(300)
    check("3.3 角色·道具筛选有记录(库内真实数据)", pg.locator("#mw-list .mw-item").count() >= 2)
    pg.locator("#mw-tabs .mw-tab[data-tab='all']").click(); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT + r"\v26-03-my-works-draft.png")

    # ---------- 4. 继续续写 → work-editor ----------
    print("== 4 编辑直达 ==")
    card = pg.locator("#mw-list .mw-item").filter(has_text="红楼梦").first
    href = card.locator("a.primary").get_attribute("href")
    check("4.1 草稿主操作=继续续写→编辑器", "work-editor.html?w=shenhai" in (href or ""), str(href))
    card.locator("a.primary").click()
    pg.wait_for_url("**/work-editor.html*")
    pg.wait_for_timeout(600)
    check("4.2 编辑器打开且标题为红楼梦", "《红楼梦》" in (pg.locator("#workTitle").inner_text() or ""))
    pg.go_back(wait_until="domcontentloaded"); pg.wait_for_timeout(600)

    # 已发布作品操作组：编辑 + 收费 + 数据 + 预览
    xy = pg.locator("#mw-list .mw-item").filter(has_text="西游记").first
    check("4.3 已发布作品含收费/数据/预览", all(xy.locator(f"a:has-text('{t}')").count() >= 1 for t in ["收费", "数据", "预览"]))

    # ---------- 5. 质量线 ----------
    print("== 5 质量 ==")
    check("5.1 0 页面 JS 错误", len(errs) == 0, "; ".join(errs[:2]))
    html = open(ROOT + r"\output\preview\my-works.html", encoding="utf-8").read()
    for bad in ["橙光", "星野", "丸子", "哔哩", "bilibili"]:
        check(f"5.2 无第三方名 {bad}", bad not in html)
    check("5.3 手机锁宽 css", "mobile-lock.css" in html)
    browser.close()

fails = [r for r in results if not r[1]]
print(f"\n==== V26 my-works 回归：{len(results)-len(fails)}/{len(results)} 通过 ====")
raise SystemExit(1 if fails else 0)
