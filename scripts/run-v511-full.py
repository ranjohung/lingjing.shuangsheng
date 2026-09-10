# -*- coding: utf-8 -*-
"""v5.11 综合真机模拟：9 题材桌面 + 移动端 + 完整剧情链路 + 结局触发 + NPC"""
import asyncio, os, hashlib, json
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8765/game-3d.html"
OUT = "F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v511"
os.makedirs(OUT, exist_ok=True)

SCENES = ["pavilion", "classroom", "neon", "livingroom", "xianxia", "palace", "study", "forest", "starship"]

async def capture_scene(page, name, label, wait=2500):
    await page.evaluate(f"window.switchScene('{name}')")
    await page.wait_for_timeout(wait)
    shot = f"{OUT}/{label}.png"
    await page.screenshot(path=shot)
    fps = await page.evaluate("document.getElementById('fps')?.textContent || ''")
    dlg = await page.evaluate("document.getElementById('dlg')?.classList.contains('show') || false")
    h = hashlib.md5(open(shot, 'rb').read()).hexdigest()[:10]
    return f"{label:20} fps={fps:8} dlg={dlg} md5={h}"

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=["--use-gl=swiftshader"])
        results = {}

        # ========== 桌面端 (1280x800) ==========
        print("=" * 60)
        print("DESKTOP 1280x800")
        print("=" * 60)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(("PE", str(e))))
        page.on("console", lambda m: errs.append((m.type, m.text)) if m.type == "error" else None)
        await page.goto(URL)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)
        # 关 picker
        await page.evaluate("var p=document.getElementById('picker'); if(p) p.classList.add('hidden')")
        await page.wait_for_timeout(300)
        # 测 9 场景
        for s in SCENES:
            results[s+"-desktop"] = await capture_scene(page, s, f"{s}-desktop")
            print("  " + results[s+"-desktop"])
        # 测剧情链路（pavilion → 选项 → 结局）
        print()
        print("FULL FLOW: pavilion → 选项 → 结局")
        await page.evaluate("window.switchScene('pavilion')")
        await page.wait_for_timeout(2000)
        # 点 A 选项（拔剑相对）
        await page.evaluate("document.querySelectorAll('.opt')[0]?.click()")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{OUT}/flow-pavilion-A1.png")
        # 再点 A 选 ending 走向 bad
        await page.evaluate("document.querySelectorAll('.opt')[0]?.click()")
        await page.wait_for_timeout(2500)  # 等 ending modal
        em_open = await page.evaluate("document.getElementById('endingModal')?.classList.contains('show') || false")
        print(f"  endingModal after 2 options: {em_open}")
        await page.screenshot(path=f"{OUT}/flow-pavilion-ending.png")
        results["flow-pavilion"] = f"endingModal={em_open}"
        await ctx.close()

        # ========== 移动端 (412x915) ==========
        print()
        print("=" * 60)
        print("MOBILE 412x915 portrait")
        print("=" * 60)
        ctx = await browser.new_context(viewport={"width": 412, "height": 915}, is_mobile=True, has_touch=True, device_scale_factor=2)
        page = await ctx.new_page()
        await page.goto(URL)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)
        await page.evaluate("var p=document.getElementById('picker'); if(p) p.classList.add('hidden')")
        await page.wait_for_timeout(300)
        for s in ["palace", "study", "forest", "starship", "pavilion"]:
            results[s+"-mobile"] = await capture_scene(page, s, f"{s}-mobile", wait=2200)
            print("  " + results[s+"-mobile"])
        await ctx.close()

        # ========== 横屏 (812x 412) ==========
        print()
        print("=" * 60)
        print("LANDSCAPE 812x412")
        print("=" * 60)
        ctx = await browser.new_context(viewport={"width": 812, "height": 412}, is_mobile=True, has_touch=True, device_scale_factor=2)
        page = await ctx.new_page()
        await page.goto(URL)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)
        await page.evaluate("var p=document.getElementById('picker'); if(p) p.classList.add('hidden')")
        await page.wait_for_timeout(300)
        for s in ["palace", "neon"]:
            results[s+"-landscape"] = await capture_scene(page, s, f"{s}-landscape", wait=2200)
            print("  " + results[s+"-landscape"])
        await ctx.close()

        await browser.close()
        print()
        print(f"ERRORS={len(errs)}")
        for k, v in errs[:5]: print(f"  {k}: {v[:200]}")
        # 保存报告
        with open(f"{OUT}/_results.json", "w", encoding="utf-8") as f:
            json.dump({"results": results, "errors": errs[:5]}, f, ensure_ascii=False, indent=2)

asyncio.run(main())