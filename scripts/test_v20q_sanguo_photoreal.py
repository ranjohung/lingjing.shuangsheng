"""
V20-Q · 三国演义·真人摄影风格小说世界端到端测试
- 24 张 SD 真人摄影图存在（assets/scenes/sg_*.jpg）
- 主页 hero-bg 背景图加载（卷一封面）
- 12 卷缩略图渲染
- 12 关键回主图渲染（温酒斩华雄/空城计等）
- 收费点保留（卷解锁 20 灵晶 + 全书券 128 灵晶）
- 阅读流程：免费卷→付费卷→签到→兑换
"""
from playwright.sync_api import sync_playwright
import json, os, sys
from pathlib import Path

BASE = "http://localhost:8767"
SCENES = r"F:\开发软件项目文件\灵境 · 双生\assets\scenes"

results = []
errs = []

# ─── 静态：24 张图存在性 + 大小 + 命名规范 ───
import re
expect_ids = (
    [f"sg_v{v:02d}_cover" for v in range(1, 13)] +
    ["sg_ch05_huaxiong", "sg_ch06_3v1lvmbu", "sg_ch25_threevisits",
     "sg_ch30_wuchao", "sg_ch44_caoqianjiejian", "sg_ch47_zhouyu",
     "sg_ch49_huarong", "sg_ch61_zhaoyun", "sg_ch74_guagu",
     "sg_ch76_maicheng", "sg_ch91_baidi", "sg_ch95_emptycity"]
)
n_exist = 0
total_kb = 0
for sid in expect_ids:
    path = os.path.join(SCENES, sid + ".jpg")
    if os.path.exists(path):
        size_kb = os.path.getsize(path) // 1024
        total_kb += size_kb
        n_exist += 1
        results.append({"page": "static", "item": f"图 {sid}.jpg 存在", "result": "PASS", "sizeKB": size_kb})
    else:
        results.append({"page": "static", "item": f"图 {sid}.jpg 存在", "result": "FAIL"})
print(f"\n静态图：{n_exist}/{len(expect_ids)} 张存在 · 总 {total_kb/1024:.1f}MB")

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-gl=swiftshader"])
    ctx = b.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.on("pageerror", lambda e: errs.append({"url": page.url, "msg": str(e)[:200]}))

    def exists(sel, label, pg):
        ok = page.evaluate(f"!!document.querySelector({sel!r})")
        results.append({"page": pg, "item": label, "result": "PASS" if ok else "FAIL", "sel": sel})
        return ok

    def count(sel, label, pg, min_n=1):
        n = page.evaluate(f"document.querySelectorAll({sel!r}).length")
        ok = n >= min_n
        results.append({"page": pg, "item": label, "result": "PASS" if ok else "FAIL", "n": n, "min": min_n})
        return ok

    # 预置：跳过实名 + 清付费状态（让付费卷仍是锁）+ 钱包充足以测全书券
    ctx.add_init_script("""
      try {
        localStorage.setItem('lingjing_v519_realname_done', 'true');
        localStorage.removeItem('lingjing_v520_sanguo_pass');
        localStorage.removeItem('lingjing_v520_sanguo_vols');
        localStorage.removeItem('lingjing_v520_sanguo_chs');
        localStorage.removeItem('lingjing_v520_sanguo_progress');
        // 钱包充足：1000 灵晶以买全书券 + 100 灵玉签到用
        localStorage.setItem('lingjing_v520_sanguo_wallet', JSON.stringify({jade:100, crystal:1000}));
      } catch(e) {}
    """)

    # ─── 主页加载 ───
    P = "sanguo-world.html"
    page.goto(BASE + "/output/preview/sanguo-world.html", wait_until="domcontentloaded")
    page.wait_for_timeout(2500)

    # A. Hero 背景图（卷一封面）
    hero_bg = page.evaluate("document.getElementById('sg-hero-bg')?.style.backgroundImage || ''")
    has_v1_cover = "sg_v01_cover" in hero_bg
    results.append({"page": P, "item": "Hero 背景图加载卷一封面", "result": "PASS" if has_v1_cover else "FAIL", "evidence": hero_bg[:80]})

    # B. 12 卷缩略图渲染
    n_thumb = page.evaluate("document.querySelectorAll('.sg-vol-thumb').length")
    results.append({"page": P, "item": "12 卷缩略图渲染", "result": "PASS" if n_thumb == 12 else "FAIL", "n": n_thumb})
    # 检查缩略图背景图 URL 包含正确文件名
    thumbs_with_url = page.evaluate("""
      Array.from(document.querySelectorAll('.sg-vol-thumb')).filter(t => 
        (t.style.backgroundImage || '').includes('sg_v')
      ).length
    """)
    results.append({"page": P, "item": "12 卷缩略图 URL 含 sg_v 真人图", "result": "PASS" if thumbs_with_url == 12 else "FAIL", "n": thumbs_with_url})

    # C. 钱包显示
    jade = page.evaluate("document.getElementById('sg-jade')?.textContent")
    crystal = page.evaluate("document.getElementById('sg-crystal')?.textContent")
    results.append({"page": P, "item": f"钱包显示（灵玉 {jade} / 灵晶 {crystal}）", "result": "PASS" if jade == "100" and crystal == "1000" else "FAIL"})

    # D. 签到按钮可点 + 灵玉 +10
    page.click("#sg-checkin", timeout=2000)
    page.wait_for_timeout(500)
    jade_after = page.evaluate("document.getElementById('sg-jade')?.textContent")
    results.append({"page": P, "item": "签到按钮 +10 灵玉", "result": "PASS" if jade_after == "110" else "FAIL", "after": jade_after})

    # E. 阅读券兑换弹窗
    page.click(".sg-perk-card:has(.p-t:text('阅读券'))", timeout=2000) if False else None
    # 用 evaluate 找阅读券卡
    found = page.evaluate("""
      Array.from(document.querySelectorAll('.sg-perk-card')).findIndex(c => c.textContent.includes('阅读券'))
    """)
    page.evaluate(f"document.querySelectorAll('.sg-perk-card')[{found}]?.click()")
    page.wait_for_timeout(500)
    sheet_open = page.evaluate("document.getElementById('sg-sheet')?.classList.contains('open')")
    results.append({"page": P, "item": "阅读券兑换弹窗打开", "result": "PASS" if sheet_open else "FAIL"})
    # 兑 1 张
    page.evaluate("SGWorld.exchange(1)")
    page.wait_for_timeout(500)
    tickets = page.evaluate("JSON.parse(localStorage.getItem('lingjing_v520_sanguo_tickets') || '0')")
    results.append({"page": P, "item": "兑换 1 张阅读券", "result": "PASS" if tickets >= 1 else "FAIL", "tickets": tickets})

    # F. 关闭弹窗 + 测试付费卷解锁
    page.evaluate("SGWorld.closeSheet()")
    page.wait_for_timeout(300)
    # 找第一个锁的卷（v2）
    page.evaluate("document.querySelectorAll('.v-tag.lock')[0]?.click()")
    page.wait_for_timeout(500)
    vol_sheet = page.evaluate("document.getElementById('sg-sheet')?.classList.contains('open')")
    results.append({"page": P, "item": "付费卷解锁弹窗打开", "result": "PASS" if vol_sheet else "FAIL"})

    # G. 买卷 20 灵晶
    page.evaluate("SGWorld.buyVol(2)")
    page.wait_for_timeout(500)
    crystal_after = page.evaluate("document.getElementById('sg-crystal')?.textContent")
    vol2_owned = page.evaluate("JSON.parse(localStorage.getItem('lingjing_v520_sanguo_vols') || '[]').indexOf(2) >= 0")
    results.append({"page": P, "item": "买卷 2 扣 20 灵晶", "result": "PASS" if crystal_after == "980" and vol2_owned else "FAIL", "crystal": crystal_after})

    # G+. 买全书券（让卷十/十一/十二全解锁，第 95 回需卷十）
    page.evaluate("SGWorld.buyPass()")
    page.wait_for_timeout(500)
    has_pass = page.evaluate("JSON.parse(localStorage.getItem('lingjing_v520_sanguo_pass') || 'false') === true")
    results.append({"page": P, "item": "买全书券 128 灵晶解锁所有卷", "result": "PASS" if has_pass else "FAIL"})

    # H. 读第 11 回（卷二首回，付费卷但已买）— 检查章顶部主图
    page.evaluate("SGWorld.readChapter(11)")
    page.wait_for_timeout(800)
    reader_open = page.evaluate("document.getElementById('sg-reader')?.classList.contains('open')")
    results.append({"page": P, "item": "读第 11 回阅读器打开", "result": "PASS" if reader_open else "FAIL"})

    # I. 读第 5 回（关键回 · 温酒斩华雄）— 验证章顶部主图
    page.evaluate("SGWorld.closeReader()")
    page.wait_for_timeout(300)
    page.evaluate("SGWorld.readChapter(5)")
    page.wait_for_timeout(800)
    has_ch05_img = page.evaluate("""
      !!document.querySelector('#sg-article .sg-chapter-img') &&
      (document.querySelector('#sg-article .sg-chapter-img').style.backgroundImage || '').includes('sg_ch05_huaxiong')
    """)
    results.append({"page": P, "item": "关键回 5（温酒斩华雄）章顶主图", "result": "PASS" if has_ch05_img else "FAIL"})

    # J. 读第 95 回（关键回 · 空城计）— 验证章顶部主图
    page.evaluate("SGWorld.readChapter(95)")
    page.wait_for_timeout(800)
    has_ch95_img = page.evaluate("""
      !!document.querySelector('#sg-article .sg-chapter-img') &&
      (document.querySelector('#sg-article .sg-chapter-img').style.backgroundImage || '').includes('sg_ch95_emptycity')
    """)
    results.append({"page": P, "item": "关键回 95（空城计）章顶主图", "result": "PASS" if has_ch95_img else "FAIL"})

    # K. 读第 1 回（普通回，无主图）
    page.evaluate("SGWorld.readChapter(1)")
    page.wait_for_timeout(800)
    no_ch01_img = page.evaluate("!document.querySelector('#sg-article .sg-chapter-img')")
    results.append({"page": P, "item": "非关键回 1 无章顶主图（正确）", "result": "PASS" if no_ch01_img else "FAIL"})

    b.close()

# 汇总
out = Path(r"F:\开发软件项目文件\灵境 · 双生\scripts\v20q_sanguo_photoreal_audit.json")
out.write_text(json.dumps({"results": results, "pageerrors": errs}, ensure_ascii=False, indent=2))
passed = sum(1 for r in results if r["result"] == "PASS")
failed = sum(1 for r in results if r["result"] == "FAIL")
partial = sum(1 for r in results if r["result"] in ("PARTIAL", "TIMEOUT"))
print(f"\n========= V20-Q 三国真人摄影小说世界 审计 总结 =========")
print(f"PASS: {passed}  FAIL: {failed}  PARTIAL/TIMEOUT: {partial}  PageError: {len(errs)}")
print()
for r in results:
    if r["result"] != "PASS":
        print(f"  [{r['result']:7}] {r.get('page',''):25} {r.get('item','')}")
if errs:
    print("\nPAGE ERRORS:")
    for e in errs:
        print(f"  - {e}")
print("\n" + "=" * 60)
status = "通过" if (failed == 0 and partial == 0 and len(errs) == 0) else f"有 {failed} 失败 + {partial} 部分 + {len(errs)} 错误"
print(f"V20-Q 三国真人摄影小说世界：{passed} PASS · {status}")
print("=" * 60)
sys.exit(0 if failed == 0 else 1)