import functools
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8899


def main():
    handler = functools.partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *args, **kwargs: None
    server = ThreadingHTTPServer(('127.0.0.1', PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={'width': 390, 'height': 844})
            page.add_init_script("localStorage.setItem('lingjing_onboarding_done','true');localStorage.setItem('lingjing_realname_verified','true');localStorage.setItem('lingjing_v519_realname_done','true');localStorage.setItem('lingjing_api_base','http://127.0.0.1:8897')")
            page.goto(f'http://127.0.0.1:{PORT}/index.html#/home', wait_until='domcontentloaded')
            page.evaluate("""async () => { const r = await fetch('http://127.0.0.1:8897/api/characters', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'发布测试角色', persona:'用于验证作者公开控制的测试角色'})}); if (!r.ok && r.status !== 402) throw new Error('seed character failed: '+r.status); }""")
            page.goto(f'http://127.0.0.1:{PORT}/index.html#/home', wait_until='domcontentloaded')
            page.evaluate("LJ.go('my-characters', '', '', true)")
            frame = page.frame_locator('#stage')
            page.wait_for_timeout(1200)
            print('FRAME_TEXT', frame.locator('body').inner_text()[:180].encode('ascii', 'backslashreplace').decode())
            frame.locator('.mc-list .mc-item').first.wait_for(state='visible', timeout=10000)
            button = frame.locator('.mc-publish').first
            button.wait_for(state='visible', timeout=10000)
            assert '公开' in button.inner_text() or '已公开' in button.inner_text()
            page.screenshot(path=str(ROOT / 'screenshots' / 'character-publish-ui.png'), full_page=True)
            print('CHARACTER_PUBLISH_UI_PASS', button.inner_text().encode('ascii', 'backslashreplace').decode())
            browser.close()
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
