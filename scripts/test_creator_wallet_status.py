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
    server = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 390, "height": 844})
            page.add_init_script("localStorage.setItem('lingjing_onboarding_done','true');localStorage.setItem('lingjing_realname_verified','true');localStorage.setItem('lingjing_v519_realname_done','true');localStorage.setItem('lingjing_api_base','http://127.0.0.1:8897')")
            page.goto(f"http://127.0.0.1:{PORT}/index.html#/me", wait_until="domcontentloaded")
            frame = page.frame_locator("#stage")
            state = frame.locator("#lj-economy-state")
            state.wait_for(state="visible", timeout=10000)
            page.wait_for_timeout(700)
            text = state.inner_text()
            assert "钱包 API 在线" in text, text
            assert "交易流水" in text, text
            assert "收益结算服务仍未接入" in text, text
            page.screenshot(path=str(ROOT / "screenshots" / "creator-wallet-status.png"), full_page=True)
            print("CREATOR_WALLET_STATUS_PASS", text.encode("ascii", "backslashreplace").decode())
            browser.close()
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
