# -*- coding: utf-8 -*-
"""v5.10 game 类 3 张补拍 — 通过点击页面按钮触发，避免 eval 跨 scope 问题"""
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

        # 1. v58-06-game: 直接进入游戏（开玩按钮）
        await prep()
        # 首页有"立即开玩"按钮 + 雨夜等你卡片
        await page.click("text=立即开玩", timeout=8000)
        await page.wait_for_timeout(3500)
        await page.screenshot(path=os.path.join(OUT, "v58-06-game.png"))
        print("  v58-06-game.png")

        # 2. v58-07-game-choice: 选第一个选项
        await prep()
        await page.click("text=立即开玩", timeout=8000)
        await page.wait_for_timeout(2500)
        # 选项按钮：第一个 opt
        opts = await page.query_selector_all("button.opt")
        if opts:
            await opts[0].click()
            await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(OUT, "v58-07-game-choice.png"))
        print("  v58-07-game-choice.png")

        # 3. v58-08-npc: 触发 NPC
        await prep()
        await page.click("text=立即开玩", timeout=8000)
        await page.wait_for_timeout(2000)
        # 找 NPC 按钮（"问 柳蝉"等）
        npc_btn = await page.query_selector("text=问")
        if npc_btn:
            await npc_btn.click()
            await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(OUT, "v58-08-npc.png"))
        print("  v58-08-npc.png")

        await browser.close()

asyncio.run(main())