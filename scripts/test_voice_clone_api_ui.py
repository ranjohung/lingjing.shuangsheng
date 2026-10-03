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
            page.goto(f'http://127.0.0.1:{PORT}/index.html#/voice-clone', wait_until='domcontentloaded')
            frame = page.frame_locator('#stage')
            frame.locator('#legalAgree').check()
            messages = []
            page.on('dialog', lambda dialog: (messages.append(dialog.message), dialog.accept()))
            frame.locator('#genBtn').click()
            page.wait_for_timeout(700)
            text = frame.locator('body').inner_text()
            assert messages and '任务已提交' in messages[-1]
            assert '不会伪造试听结果' in messages[-1]
            page.screenshot(path=str(ROOT / 'screenshots' / 'voice-clone-api-ui.png'), full_page=True)
            print('VOICE_CLONE_API_UI_PASS', messages[-1].encode('ascii', 'backslashreplace').decode())
            browser.close()
    finally:
        server.shutdown()


if __name__ == '__main__':
    main()
