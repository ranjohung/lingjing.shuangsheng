# -*- coding: utf-8 -*-
"""v5.10 game 视图 3 张补拍（更长 wait）"""
import asyncio, os
from playwright.async_api import async_playwright

OUT = r"F:\开发软件项目文件\灵境 · 双生\output\preview\screenshots\v58"
BASE = "http://127.0.0.1:8765/redesign.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 854}, device_scale_factor=2)
        page = await ctx.new_page()

        async def prep():
            await page.goto(BASE, wait_until="networkidle")
            await page.evaluate("localStorage.clear();")
            await page.goto(BASE, wait_until="networkidle")
            await page.wait_for_timeout(800)

        async def shot(label, actions, file, wait_ms=3500):
            await prep()
            await page.evaluate(actions)
            await page.wait_for_timeout(wait_ms)
            await page.screenshot(path=os.path.join(OUT, file))
            print(f"  {file}")

        await shot("game", "goView('game'); openNovel('pavilion'); setTimeout(()=>startGame(false), 200);",
                   "v58-06-game.png", 3500)
        await shot("choice", "goView('game'); openNovel('pavilion'); setTimeout(()=>{startGame(false); setTimeout(()=>{const n=window.story&&window.story.pavilion&&window.story.pavilion.chapters[0]; if(n&&n.opts)showDialogue(n.opts[0].next);}, 800);}, 200);",
                   "v58-07-game-choice.png", 4500)
        await shot("npc", "goView('game'); openNovel('pavilion'); setTimeout(()=>{startGame(false); setTimeout(()=>askNPC(), 800);}, 200);",
                   "v58-08-npc.png", 4500)

        await browser.close()

asyncio.run(main())