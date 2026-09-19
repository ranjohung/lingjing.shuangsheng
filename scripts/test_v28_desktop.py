# -*- coding: utf-8 -*-
"""V28-C Playwright 回归：
S0 桌面 letterbox（1150px 视口 stage=480 居中）
S1 novel-detail 内容（封面/评分/人气值/灵晶值/作品ID/标签）
S2 Tab 交互 + 点赞收藏持久化 + 评论发布
S3 全链路 world-hub 书卡 -> novel-detail -> 开始阅读 novel-game -> 返回 -> 详情 -> 返回 -> hub
S4 手机视口对照（390px 不受 letterbox 影响）+ pageerror/console 断言
截图 -> screenshots/v28/
"""
import functools, os, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("LJ_TEST_PORT", "8899"))
OUT = os.path.join(BASE, "screenshots", "v28")
os.makedirs(OUT, exist_ok=True)

SEED = """
try { localStorage.setItem('lingjing_onboarding_done','true'); } catch(e) {}
try { localStorage.setItem('lingjing_v519_realname_done','true'); } catch(e) {}
try { localStorage.setItem('lingjing_v5170_user', JSON.stringify({nickname:'测试',lingJing:9999,avatar:'👤'})); } catch(e) {}
"""


def nav(page, base, route, step):
    """query 变化 -> 完整导航 -> LJEnter；route 形如 novel-detail?book=xiyouji"""
    page.goto("%s?step=%s#/%s" % (base, step, route))


def F(page, sel):
    return page.frame_locator("#stage").locator(sel)


def wait_stage_fn(page, expr, timeout=8000):
    """等待 stage iframe 内 JS 表达式为真（同源 contentDocument）"""
    page.wait_for_function(
        "(function(){ var d=document.getElementById('stage'); if(!d) return false; try { var c=d.contentDocument; if(!c) return false; return !!(" + expr + "); } catch(e){ return false; } })()",
        timeout=timeout,
    )


def main():
    handler = functools.partial(SimpleHTTPRequestHandler, directory=BASE)
    handler.log_message = lambda *a, **k: None
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d/index.html" % PORT
    print("server on", base)

    pageerrors, conserr = [], []
    results = []

    def check(name, cond):
        results.append((name, bool(cond)))
        print(("  PASS " if cond else "  FAIL ") + name)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()

        # ============ 桌面 1150x800 ============
        ctx = browser.new_context(viewport={"width": 1150, "height": 800})
        page = ctx.new_page()
        page.on("pageerror", lambda e: pageerrors.append(str(e)))
        page.on("console", lambda m: conserr.append(m.text) if m.type == "error" else None)
        page.add_init_script(SEED)

        step = int(time.time())
        print("[S0] 桌面 letterbox")
        nav(page, base, "novel-detail?book=xiyouji", step)
        page.wait_for_function("document.getElementById('stage').classList.contains('on')", timeout=10000)
        page.wait_for_timeout(600)
        box = page.locator("#stage").bounding_box()
        print("  stage bbox:", box)
        check("S0a 桌面 stage 宽=480", abs(box["width"] - 480) < 3)
        check("S0b 桌面 stage 水平居中 x=335", abs(box["x"] - 335) < 3)
        page.screenshot(path=os.path.join(OUT, "s00_letterbox_desktop.png"))

        print("[S1] novel-detail 内容")
        wait_stage_fn(page, "c.querySelector('#nd-name') && c.querySelector('#nd-name').textContent.trim()==='西游记'")
        check("S1a 书名=西游记", F(page, "#nd-name").inner_text().strip() == "西游记")
        check("S1b 作者=吴承恩（公版）", "吴承恩" in F(page, "#nd-author").inner_text())
        check("S1c 作品ID LJ-1001", "LJ-1001" in F(page, "#nd-wid").inner_text())
        check("S1d 评分 9.6", F(page, "#nd-score").inner_text().strip() == "9.6")
        check("S1e 人气值 12.8万", F(page, "#nd-pop").inner_text().strip() == "12.8万")
        check("S1f 灵晶值 3.6万", F(page, "#nd-crystal").inner_text().strip() == "3.6万")
        check("S1g 标签 3 个", F(page, "#nd-tags .nd-tag").count() == 3)
        check("S1h 底部开始阅读", F(page, "#nd-read").is_visible())
        check("S1i 付费信息含灵晶", "灵晶" in F(page, "#nd-pay-text").inner_text())
        page.screenshot(path=os.path.join(OUT, "s01_detail_hero.png"))

        print("[S2] Tab 交互 + 点赞收藏 + 评论")
        F(page, "#nd-tabs .nd-tab[data-tab='roles']").click()
        page.wait_for_timeout(300)
        check("S2a 角色 Tab 4 张卡", F(page, "#panel-roles .nd-role").count() == 4)
        check("S2b 孙悟空角色卡", "孙悟空" in F(page, "#panel-roles").inner_text())
        page.screenshot(path=os.path.join(OUT, "s02_detail_roles.png"))

        F(page, "#nd-tabs .nd-tab[data-tab='talk']").click()
        page.wait_for_timeout(300)
        check("S2c 初始评论 2 条", F(page, "#nd-cmts .nd-cmt").count() == 2)
        F(page, "#nd-cmt-input").fill("边读边选太上头了，八戒笑死我")
        F(page, "#nd-cmt-send").click()
        page.wait_for_timeout(400)
        check("S2d 评论发布后 3 条", F(page, "#nd-cmts .nd-cmt").count() == 3)
        check("S2e 我的评论在列表", "八戒" in F(page, "#nd-cmts").inner_text())

        F(page, "#nd-like").click()
        page.wait_for_timeout(300)
        check("S2f 点赞态 on", "on" in (F(page, "#nd-like").get_attribute("class") or ""))
        check("S2g 点赞数 8643", "8643" in F(page, "#nd-like2").inner_text())
        F(page, "#nd-col2").click()
        page.wait_for_timeout(300)
        check("S2h 收藏态 on", "on" in (F(page, "#nd-col2").get_attribute("class") or ""))
        page.screenshot(path=os.path.join(OUT, "s03_detail_talk_acts.png"))

        # 持久化：带新 step 强刷
        nav(page, base, "novel-detail?book=xiyouji", str(step) + "2")
        wait_stage_fn(page, "c.querySelector('#nd-name') && c.querySelector('#nd-name').textContent.trim()==='西游记'")
        page.wait_for_timeout(400)
        check("S2i 刷新后点赞保持", "on" in (F(page, "#nd-like").get_attribute("class") or ""))
        check("S2j 刷新后收藏保持", "on" in (F(page, "#nd-col").get_attribute("class") or ""))
        check("S2k 刷新后评论保持 3 条", F(page, "#nd-cmts .nd-cmt").count() == 3)

        print("[S3] 全链路：world-hub 书卡 -> 详情 -> 游戏 -> 返回链")
        nav(page, base, "world-hub", str(step) + "3")
        wait_stage_fn(page, "c.querySelector('.featured')", timeout=12000)
        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(OUT, "s04_world_hub.png"))
        F(page, ".featured").click()
        wait_stage_fn(page, "c.querySelector('#nd-name') && c.querySelector('#nd-name').textContent.trim()==='西游记'")
        page.wait_for_timeout(400)
        check("S3a 书卡进入详情页", "novel-detail" in page.url)
        F(page, "#nd-read").click()
        wait_stage_fn(page, "c.querySelector('#ng-splash-title') && c.querySelector('#ng-splash-title').textContent.indexOf('西游') >= 0", timeout=12000)
        page.wait_for_timeout(800)
        check("S3b 开始阅读进入游戏页", "novel-game" in page.url)
        check("S3c 游戏页书名含西游", "西游" in F(page, "#ng-splash-title").inner_text())
        page.screenshot(path=os.path.join(OUT, "s05_novelgame_splash.png"))

        # 入口遮罩（继续/重新/返回）自动弹出，走「‹ 返回」退出链路（V28-B 改造点）
        F(page, "#ng-entry-back").click()
        wait_stage_fn(page, "c.querySelector('#nd-name') && c.querySelector('#nd-name').textContent.trim()==='西游记'")
        page.wait_for_timeout(400)
        check("S3d 游戏返回->详情页", "novel-detail" in page.url)
        page.screenshot(path=os.path.join(OUT, "s06_back_to_detail.png"))
        F(page, "#nd-back").click()
        wait_stage_fn(page, "c.querySelector('.tb-title') && c.querySelector('.tb-title').textContent.indexOf('小说世界') >= 0", timeout=10000)
        page.wait_for_timeout(400)
        check("S3e 详情返回->世界页", "world-hub" in page.url)
        page.screenshot(path=os.path.join(OUT, "s07_back_to_hub.png"))

        print("[S4] pageerror / console 断言（桌面上下文）")
        check("S4a pageerror=0", len(pageerrors) == 0)
        if pageerrors:
            print("   pageerrors:", pageerrors[:3])
        check("S4b console.error=0", len(conserr) == 0)
        if conserr:
            print("   conserr:", conserr[:3])
        ctx.close()

        # ============ 手机 390x844 对照 ============
        print("[S5] 手机视口对照（letterbox 不生效）")
        ctx2 = browser.new_context(viewport={"width": 390, "height": 844})
        p2 = ctx2.new_page()
        p2.on("pageerror", lambda e: pageerrors.append(str(e)))
        p2.add_init_script(SEED)
        nav(p2, base, "novel-detail?book=hongloumeng", str(step) + "5")
        p2.wait_for_function("document.getElementById('stage').classList.contains('on')", timeout=10000)
        p2.wait_for_timeout(600)
        box2 = p2.locator("#stage").bounding_box()
        print("  stage bbox:", box2)
        check("S5a 手机 stage 全宽 390", abs(box2["width"] - 390) < 3)
        check("S5b 手机 stage x=0", abs(box2["x"]) < 3)
        check("S5c 红楼梦详情渲染", wait_stage_fn(p2, "c.querySelector('#nd-name') && c.querySelector('#nd-name').textContent.trim()==='红楼梦'", timeout=6000) or True)
        p2.screenshot(path=os.path.join(OUT, "s08_mobile_detail.png"))
        ctx2.close()
        browser.close()

    fails = [n for n, okc in results if not okc]
    print("\n===== V28 回归汇总：%d/%d 通过 =====" % (len(results) - len(fails), len(results)))
    for n in fails:
        print("  FAILED:", n)
    raise SystemExit(1 if fails else 0)


if __name__ == "__main__":
    main()
