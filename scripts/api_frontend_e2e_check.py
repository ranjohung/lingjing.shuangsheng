from playwright.sync_api import sync_playwright


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        requests = []
        page.on("request", lambda request: requests.append((request.method, request.url, dict(request.headers))))
        page.goto("about:blank")
        page.add_script_tag(path="F:/开发软件项目文件/灵境 · 双生/output/preview/js/novel-world-runtime.js")
        result = page.evaluate("""async () => {
          window.LJ_API_BASE = 'http://127.0.0.1:8000';
          window.LJ_AUTH_TOKEN = 'test-token';
          Object.defineProperty(window, 'localStorage', { value: { setItem() {}, getItem() { return null; } } });
          const R = window.NovelWorldRuntime;
          if (!R || !R.saveGame) return {ok:false, reason:'runtime-not-mounted'};
          const original = window.fetch;
          const calls = [];
          window.fetch = (url, options) => { calls.push({url, options}); return Promise.resolve({ok:true, status:200, json:async()=>({})}); };
          const saved = R.saveGame('auto');
          await new Promise(resolve => setTimeout(resolve, 20));
          window.fetch = async () => ({ ok:true, status:200, json:async()=>({save:{state:{route:'REMOTE', actionIndex:3}}}) });
          const remote = await R.loadGameRemote('auto');
          window.fetch = original;
          return {ok:true, saved, remote, calls:calls.map(x => ({url:x.url, headers:x.options.headers, body:x.options.body}))};
        }""")
        print('raw-result', result)
        assert result["ok"] and result["saved"]
        assert result["calls"] and result["calls"][0]["url"].endswith('/api/v1/world-saves/demo/0')
        assert result["calls"][0]["headers"]["Authorization"] == 'Bearer test-token'
        assert result["remote"]["route"] == 'REMOTE'
        print(result)
        browser.close()


if __name__ == "__main__":
    main()
