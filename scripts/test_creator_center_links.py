"""创作中心入口验收：小说辅助模拟器指向 V21，编辑作品指向编辑页"""
from playwright.sync_api import sync_playwright

PASS, FAIL = [], []


def check(name, cond, detail=''):
    (PASS if cond else FAIL).append(name)
    print(f"{'✅' if cond else '❌'} {name}{(' · ' + detail) if detail else ''}")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={'width': 480, 'height': 900}).new_page()
    page.add_init_script("localStorage.setItem('lingjing_v519_realname_done','true');")
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:8793/output/preview/creator-center.html', wait_until='domcontentloaded')
    page.wait_for_timeout(500)

    # 小说辅助模拟器入口
    sim = page.evaluate('''(() => {
        var a = document.querySelector('.func[href="novel-ai-helper.html"]');
        return {exists: !!a, onclick: a ? a.getAttribute('onclick') : '', text: a ? a.textContent : ''};
    })()''')
    check('小说辅助模拟器指向 novel-ai-helper.html', sim['exists'], sim['text'][:30])
    check('小说辅助模拟器带实名门控', sim['exists'] and 'LJRealname' in (sim['onclick'] or ''), sim['onclick'][:40])

    # 不应再指向扣子的 novel-editor.html
    bad = page.evaluate('!!document.querySelector(".func[href=\\'novel-editor.html\\']")')
    check('小说辅助模拟器不再指向 novel-editor.html', not bad)

    # 编辑作品入口
    edit = page.evaluate('''(() => {
        var a = document.querySelector('a.more[href="work-editor.html"]');
        return {exists: !!a, text: a ? a.textContent.trim() : ''};
    })()''')
    check('我的作品右侧有「编辑作品」入口', edit['exists'] and '编辑作品' in edit['text'], edit['text'])

    # 工作台「编辑作品」也存在
    wb_edit = page.evaluate('!!document.querySelector(".wb-item[href=\\'work-editor.html\\']")')
    check('工作台「编辑作品」按钮存在', wb_edit)

    critical = [e for e in errors if 'TypeError' in e or 'Cannot read' in e or 'ReferenceError' in e]
    check('无关键 JS 错误', len(critical) == 0, str(critical[:2])[:50])

    browser.close()

print('\n' + '=' * 50)
print(f'PASS: {len(PASS)} · FAIL: {len(FAIL)}')
print('=' * 50)
if FAIL:
    print('FAILED: ' + ', '.join(FAIL))
    raise SystemExit(1)
print('✅ 创作中心入口验收通过')
