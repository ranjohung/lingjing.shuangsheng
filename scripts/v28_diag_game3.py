# -*- coding: utf-8 -*-
"""诊断3：抓 404 资源 URL"""
import functools, os, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8913
SEED = "try{localStorage.setItem('lingjing_onboarding_done','true');}catch(e){}"

def main():
    handler = functools.partial(SimpleHTTPRequestHandler, directory=BASE)
    handler.log_message = lambda *a, **k: None
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d/index.html" % PORT
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_context(viewport={"width": 1150, "height": 800}).new_page()
        pg.add_init_script(SEED)
        pg.on("response", lambda r: print("404:", r.url) if r.status == 404 else None)
        # S3 链路复现
        pg.goto("%s?step=d3a#/world-hub" % base)
        pg.wait_for_timeout(2500)
        pg.frame_locator("#stage").locator(".featured").click()
        pg.wait_for_timeout(1500)
        pg.frame_locator("#stage").locator("#nd-read").click()
        pg.wait_for_timeout(4000)
        b.close()

main()
