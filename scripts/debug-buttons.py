# -*- coding: utf-8 -*-
"""调试 立即开玩 按钮行为"""
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 480, "height": 854})
        page = await ctx.new_page()
        await page.goto("http://127.0.0.1:8765/redesign.html", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        # 找按钮
        btn = await page.query_selector("text=立即开玩")
        print("button found:", btn is not None)
        if btn:
            print("button onclick:", await btn.get_attribute("onclick"))
            print("button inner:", (await btn.inner_text()).strip())
            print("button HTML:", (await btn.evaluate("e => e.outerHTML"))[:200])
        # 列出所有 "立即开玩"
        matches = await page.query_selector_all("text=立即开玩")
        print(f"{len(matches)} matches")
        # 也找 "立即" 类
        all_btns = await page.query_selector_all("button, a")
        for b in all_btns:
            t = await b.inner_text()
            if "开玩" in t or "进入" in t or "立即" in t:
                print("btn:", t.strip(), "onclick:", await b.get_attribute("onclick"))

        await browser.close()

asyncio.run(main())