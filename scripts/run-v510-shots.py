# -*- coding: utf-8 -*-
"""v5.10 redesign 全流程截图（Python Playwright SDK，浏览器常驻）"""
import asyncio, os
from playwright.async_api import async_playwright

OUT = r"F:\开发软件项目文件\灵境 · 双生\output\preview\screenshots\v58"
BASE = "http://127.0.0.1:8765/redesign.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 854}, device_scale_factor=2)
        page = await ctx.new_page()

        async def shot(label, actions=None, file=None):
            await page.goto(BASE, wait_until="networkidle")
            await page.evaluate("localStorage.clear();")
            await page.goto(BASE, wait_until="networkidle")
            await page.wait_for_timeout(800)
            if actions:
                await page.evaluate(actions)
                await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(OUT, file), full_page=False)
            print(f"  {file}")

        await shot("home",  None,                                "v58-01-home.png")
        await shot("all",   "goView('novel-list'); selectGenre('all');",        "v58-02-novel-all.png")
        await shot("class", "goView('novel-list'); selectGenre('classroom');",   "v58-03-class.png")
        await shot("neon",  "goView('novel-list'); selectGenre('neon');",        "v58-04-neon.png")
        await shot("detail","goView('novel-detail'); openNovel('pavilion');",    "v58-05-detail.png")
        await shot("game",  "goView('game'); openNovel('pavilion'); setTimeout(()=>startGame(false), 500); setTimeout(()=>{if(window.story&&window.story.pavilion)showDialogue(window.story.pavilion.chapters[0]);}, 1500);", "v58-06-game.png")
        await shot("choice","goView('game'); openNovel('pavilion'); setTimeout(()=>startGame(false), 500); setTimeout(()=>{const n=window.story&&window.story.pavilion&&window.story.pavilion.chapters[0]; if(n&&n.opts)showDialogue(n.opts[0].next);}, 1500);", "v58-07-game-choice.png")
        await shot("npc",   "goView('game'); openNovel('pavilion'); setTimeout(()=>startGame(false), 500); setTimeout(askNPC, 1500);", "v58-08-npc.png")
        await shot("comp",  "goView('companion');",                             "v58-09-companion.png")
        await shot("xian",  "goView('novel-list'); selectGenre('xianxia');",     "v58-10-xianxia.png")
        await shot("liv",   "goView('novel-list'); selectGenre('livingroom');",  "v58-11-living.png")
        await shot("stu",   "goView('studio');",                                "v58-12-studio.png")

        await browser.close()
        print("DONE")

asyncio.run(main())