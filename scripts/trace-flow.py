# -*- coding: utf-8 -*-
"""完整流程 trace：从首页 → 开玩 → 选项 → NPC"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 854})
        page = await ctx.new_page()
        await page.goto("http://127.0.0.1:8765/redesign.html", wait_until="networkidle")
        await page.wait_for_timeout(800)
        # 点开玩
        await page.click("text=立即开玩")
        await page.wait_for_timeout(3500)
        info = await page.evaluate("""(function(){
            const v = document.getElementById('view-game');
            const dlg = document.getElementById('dlg');
            const dlgT = document.querySelector('#dlg-text');
            const opts = Array.from(document.querySelectorAll('button.opt')).map(o => o.textContent.trim());
            const char = document.getElementById('gameChar');
            const charStyle = char ? char.style.cssText : 'none';
            const scene = document.getElementById('gameScene');
            const sceneStyle = scene ? scene.style.cssText : 'none';
            return {
                url: location.href,
                gameViewActive: v ? v.className : 'no view-game',
                dlgShown: dlg ? dlg.className : 'no dlg',
                dlgText: dlgT ? dlgT.textContent.substring(0, 80) : 'none',
                optionsCount: opts.length,
                options: opts.slice(0, 3),
                charStyle: charStyle.substring(0, 200),
                sceneStyle: sceneStyle.substring(0, 200),
                currentNovel: typeof currentNovel !== 'undefined' ? currentNovel && currentNovel.title : 'undef'
            };
        })()""")
        print("after 开玩 click + 3.5s:")
        for k, v in info.items(): print(f"  {k}: {v}")
        await browser.close()

asyncio.run(main())