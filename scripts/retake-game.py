# -*- coding: utf-8 -*-
"""v58-07 + v58-08 单独补拍"""
import asyncio, os
from playwright.async_api import async_playwright

OUT = r"F:\开发软件项目文件\灵境 · 双生\output\preview\screenshots\v58"
BASE = "http://127.0.0.1:8765/redesign.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 854}, device_scale_factor=2)
        page = await ctx.new_page()

        # v58-07: 选项推进
        await page.goto(BASE, wait_until="networkidle")
        await page.evaluate("localStorage.clear();")
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.click("text=立即开玩")
        await page.wait_for_timeout(2500)
        # 选第一项
        opts = await page.query_selector_all('.game-opt:not(.npc)')
        if opts:
            await opts[0].click()
            await page.wait_for_timeout(2500)
        await page.screenshot(path=os.path.join(OUT, "v58-07-game-choice.png"))
        print("v58-07 done")

        # v58-08: 再选第二项触发 NPC (西游记 story 的某个节点有 NPC)
        await page.goto(BASE, wait_until="networkidle")
        await page.evaluate("localStorage.clear();")
        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.click("text=立即开玩")
        await page.wait_for_timeout(2500)
        # 多选几项直到遇到 NPC 选项
        for _ in range(3):
            opts2 = await page.query_selector_all('.game-opt:not(.npc)')
            npc_opts = await page.query_selector_all('.game-opt.npc')
            if npc_opts:
                await npc_opts[0].click()
                await page.wait_for_timeout(2500)
                break
            elif opts2:
                await opts2[0].click()
                await page.wait_for_timeout(2000)
            else:
                break
        await page.screenshot(path=os.path.join(OUT, "v58-08-npc.png"))
        print("v58-08 done")

        await browser.close()

asyncio.run(main())