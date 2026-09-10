# -*- coding: utf-8 -*-
"""v5.11 真机测试：9 题材全量 + FPS / console / 截图"""
import asyncio, os, hashlib, json
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8765/game-3d.html"
OUT = "F:/开发软件项目文件/灵境 · 双生/output/preview/screenshots/v511"
os.makedirs(OUT, exist_ok=True)

SCENES = ["palace", "study", "forest", "starship", "pavilion", "classroom", "neon", "livingroom", "xianxia"]

async def main():
    async with async_playwright() as pw:
        # Desktop Chromium
        browser = await pw.chromium.launch(args=["--use-gl=swiftshader"])
        ctx = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await ctx.new_page()
        errs, warns = [], []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: (errs if m.type == "error" else warns).append(m.text) if m.type in ("error", "warning") else None)
        await page.goto(URL)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)
        # 关掉 picker，进入 pavilion 默认（如有 picker 则先点 pavilion；否则跳过）
        # 试图点 #pickerGrid 第一项作为开场
        picker = await page.query_selector('#pickerGrid .picker-card')
        if picker:
            await page.evaluate("document.getElementById('picker').classList.add('hidden')")
            await page.wait_for_timeout(300)
        # 主屏截图
        await page.screenshot(path=f"{OUT}/00-start.png")
        # 测 9 个场景（通过 sceneBuilders 直接调用）
        for s in SCENES:
            try:
                await page.evaluate(f"typeof switchScene === 'function' && switchScene('{s}')")
                await page.wait_for_timeout(2500)  # 等 GLB 加载 + chapterIn
                # 取 FPS
                fps_text = await page.evaluate("document.getElementById('fps')?.textContent || ''")
                # 取对话是否弹出
                dlg = await page.evaluate("document.getElementById('dlg')?.classList.contains('show') || false")
                # 截图
                shot = f"{OUT}/{s}.png"
                await page.screenshot(path=shot)
                h = hashlib.md5(open(shot, 'rb').read()).hexdigest()[:10]
                print(f"  [{s:9}] fps={fps_text:10} dlg={dlg} md5={h}", flush=True)
            except Exception as e:
                print(f"  [{s:9}] FAIL: {e}", flush=True)
        # 移动视口测 1 题材
        await page.set_viewport_size({"width": 412, "height": 915})
        await page.evaluate("switchScene('palace')")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{OUT}/mobile-palace.png")
        print("  [mobile    ] palace captured", flush=True)
        await browser.close()
        print(f"\nERRORS={len(errs)} WARNS={len(warns)}")
        for e in errs[:5]: print("  ERR:", e[:200])
        for w in warns[:3]: print("  WARN:", w[:200])

asyncio.run(main())