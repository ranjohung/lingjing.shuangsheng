# -*- coding: utf-8 -*-
"""
build_single_html.py — 生成「单文件应用」index.html

背景：
  此前 index.html 只有首页，底栏「世界 / 心屿 / 创作 / 我的」及全部功能
  分散在 output/preview/ 下的 58 个 HTML 里。用户要求「只需要 index.html
  一个文件」，且双击（file://）与本地服务（http://）两种方式都要能用。

做法：
  1. 读取 output/preview/*.html 全部页面，逐个注入「路由桥」：
       - <base> 修正相对路径（srcdoc 会继承父文档 URL，需显式指向 output/preview/）
       - location.search / location.hash → 走父层传入的查询串
       - location.href = X / location.replace(X) → 走父层路由
       - 捕获 <a> 点击，跨页链接交给父层切换
  2. 页面全文以 JSON 形式内联进 index.html（PAGES 表）
  3. index.html 外壳 = 启动页 + 注册登录 + 新手引导 + 全屏 iframe 舞台 + 路由
  4. 外壳自身的「首页」正文单独打包成 PAGES['home']

输出：
  index.html                （单文件应用）
  index.multipage.bak.html  （改造前的多页版入口，已由外部备份）
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
PREVIEW = ROOT / '.workbuddy' / 'build-src' / 'preview'
OLD_INDEX = ROOT / '.workbuddy' / 'build-src' / 'index.multipage.bak.html'
OUT = ROOT / 'index.html'

PH_BASE = '__LJ_BASE__'
PH_QS = '__LJ_QS__'
PH_HASH = '__LJ_HASH__'

# 桥：放在 <head> 之后，页面自身脚本之前，保证 LJSearch / LJNav 已被定义
BRIDGE_HEAD = '''<script>
window.__LJ_PARAMS__ = __LJ_QS__;
window.__LJ_HASHV__ = __LJ_HASH__;
window.LJSearch = function () { var v = window.__LJ_PARAMS__; return v ? v : location.search; };
window.LJHashVal = function () { var v = window.__LJ_HASHV__; return v ? v : location.hash; };
window.LJNav = function (url) {
  if (typeof url === 'string') {
    var m = /([\\w.\\-]+)\\.html(\\?[^#]*)?(#.*)?$/.exec(url);
    if (m) {
      try { parent.postMessage({ lj: 'go', id: m[1], qs: m[2] || '', hash: m[3] || '' }, '*'); return; } catch (err) {}
    }
    try { parent.LJ.goUrl(url); return; } catch (err2) {}
  }
  location.href = url;
};
window.LJBack = function () {
  try { parent.postMessage({ lj: 'back' }, '*'); } catch (err) { history.back(); }
};
</script>'''

# 桥：放在 </body> 之前，接管链接点击
BRIDGE_BODY = '''<script>
document.addEventListener('click', function (e) {
  var el = e.target;
  while (el && el.nodeType === 1 && el.tagName !== 'A') el = el.parentElement;
  if (!el || el.tagName !== 'A') return;
  var h = el.getAttribute('href') || '';
  if (h.charAt(0) === '#') {
    if (h.length > 1) {
      e.preventDefault();
      var t = document.getElementById(h.slice(1));
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { window.dispatchEvent(new Event('hashchange')); } catch (err) {}
    }
    return;
  }
  if (!h || /^[a-zA-Z][\\w+.\\-]*:/.test(h)) return;
  if (/([\\w.\\-]+)\\.html(\\?|#|$)/.test(h)) {
    e.preventDefault();
    window.LJNav(h);
  }
}, true);
</script>'''

SHELL_JS = '''/* =====================================================================
 * 单文件应用 · 路由内核
 * 页面全部内联在 LJ_PAGES 中，通过 iframe srcdoc 渲染，
 * 相对路径由注入的 <base> 修正到 output/preview/。
 * ===================================================================== */
var stage = document.getElementById('stage');
var CUR = '';

function ljBase() {
  return new URL('output/preview/', location.href).href;
}

function buildDoc(id, qs, hash) {
  var html = LJ_PAGES[id];
  if (!html) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
      'body{background:#0d0d1a;color:#EAEAF0;font-family:sans-serif;padding:70px 24px;text-align:center}' +
      '</style></head><body><h2>页面不存在</h2><p style="opacity:.55;margin-top:10px">' + id + '</p></body></html>';
  }
  var base = ljBase();
  var out = html.split('__LJ_BASE__').join(base);
  out = out.split('__LJ_QS__').join(JSON.stringify(qs || ''));
  out = out.split('__LJ_HASH__').join(JSON.stringify(hash || ''));
  return out;
}

var LJ = window.LJ = {};

LJ.go = function (id, qs, hash) {
  if (!id || id === 'index' || id === 'product-preview') id = 'home';
  if (!LJ_PAGES[id]) id = 'home';
  CUR = id;
  qs = qs || '';
  hash = hash || '';
  try { history.replaceState(null, '', '#/' + id + qs + hash); } catch (e) {}
  stage.classList.add('on');
  document.body.classList.add('stage-on');
  stage.srcdoc = buildDoc(id, qs, hash);
};

LJ.goUrl = function (url) {
  var m = /([\\w.\\-]+)\\.html(\\?[^#]*)?(#.*)?$/.exec(url || '');
  if (m) { LJ.go(m[1], m[2] || '', m[3] || ''); return; }
  location.href = url;
};

window.addEventListener('message', function (e) {
  var d = e.data;
  if (!d || !d.lj) return;
  if (d.lj === 'go') { LJ.go(d.id, d.qs, d.hash); }
  else if (d.lj === 'back') { LJ.go('home'); }
});

function LJEnter() {
  var ids = ['splash-overlay', 'login-overlay', 'onb-overlay'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.classList.add('hidden');
  }
  var h = (location.hash || '').replace(/^#\\//, '');
  var m = /^([\\w.\\-]+)(\\?[^#]*)?(#.*)?$/.exec(h);
  if (m && LJ_PAGES[m[1]]) { LJ.go(m[1], m[2] || '', m[3] || ''); }
  else { LJ.go('home'); }
}
window.LJEnter = LJEnter;'''

SHELL_TEMPLATE = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#1A1A2E" />
<title>灵境 · 双生</title>
<meta name="description" content="灵境·双生 · 沉浸剧情对话 + 世界图书馆 + 心屿陪伴 + 小说世界游戏 + 创作中心" />
<link rel="stylesheet" href="output/preview/css/shell-v64.css" />
<link rel="stylesheet" href="output/preview/css/mobile-lock.css" />
<style>
__SHELL_CSS__

/* ============ 单文件应用容器 ============ */
html, body { height: 100%; }
#stage {
  position: fixed; inset: 0; width: 100%; height: 100%;
  border: 0; background: #0d0d1a; display: none; z-index: 1;
}
#stage.on { display: block; }
body.stage-on { overflow: hidden; }
</style>
</head>
<body>

__SHELL_HTML__

<iframe id="stage" title="灵境 · 双生"></iframe>

<script>var LJ_PAGES = __LJ_PAGES__;</script>
<script>
__SHELL_JS__
</script>
__ONB_JS__
__TOAST_JS__
</body>
</html>
'''


def read(p):
    return p.read_text(encoding='utf-8')


def transform(html, pid):
    """给单个页面注入路由桥并改写绝对导航

    注意顺序：必须「先改写页面自身、后注入桥」。
    否则桥里 LJSearch 自身的 location.search 会被再次替换成 LJSearch()，
    形成无限递归（Maximum call stack size exceeded）。
    """
    # 1) 参数读取
    html = html.replace('window.location.search', 'LJSearch()')
    html = re.sub(r'(?<![\w.])location\.search', 'LJSearch()', html)
    html = html.replace('window.location.hash', 'LJHashVal()')
    html = re.sub(r'(?<![\w.])location\.hash', 'LJHashVal()', html)

    # 2) 导航
    html = re.sub(r'(?:window\.)?location\.href\s*=(?!=)\s*([^;\n]+);', r'LJNav(\1);', html)
    html = re.sub(r'(?:window\.)?location\.replace\(', 'LJNav(', html)

    # 3) 注入 <base>（srcdoc 会继承父文档 URL，需显式指向 output/preview/）与路由桥
    m_head = re.search(r'<head[^>]*>', html)
    inject = '<base href="' + PH_BASE + '" />' + BRIDGE_HEAD
    if m_head:
        i = m_head.end()
        html = html[:i] + inject + html[i:]
    else:
        html = inject + html

    # 4) 点击接管
    if '</body>' in html:
        html = html.replace('</body>', BRIDGE_BODY + '\n</body>', 1)
    else:
        html += BRIDGE_BODY
    return html


def extract_shell(old):
    """从旧多页首页里拆出：外壳 CSS / 启动登录引导 HTML / 首页正文 / 两段脚本"""
    css = re.search(r'(?s)<style>(.*?)</style>', old)
    shell_css = css.group(1) if css else ''

    i1 = old.index('<!-- ============ V20-C · 启动页 splash ============ -->')
    i2 = old.index('<div id="app"')
    shell_html = old[i1:i2]

    i3 = old.index('<div id="app"')
    i4 = old.index('<!-- Toast -->')
    home_body = old[i3:i4]

    blocks = re.findall(r'(?s)<script>(.*?)</script>', old)
    onb_js, toast_js = '', ''
    for b in blocks:
        if 'STORAGE' in b and 'ONB_DONE' in b:
            onb_js = b
        elif 'LJToast' in b:
            toast_js = b
    return shell_css, shell_html, home_body, onb_js, toast_js


def build_home(body, shell_css):
    """把旧首页正文包装成一个可内联的独立页面"""
    body = body.replace('<div id="app" class="hidden"', '<div id="app"')
    # 去掉开发元数据镜像行
    body = re.sub(r'\s*<!-- V22-2 状态镜像.*?-->', '', body, flags=re.S)
    body = re.sub(r'\s*<div style="margin-top:10px;font-size:10px;color:rgba\(160,160,176,\.45\)"[^>]*>.*?</div>', '', body, flags=re.S)
    doc = (
        '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n'
        '<meta charset="UTF-8" />\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n'
        '<title>首页 · 灵境 · 双生</title>\n'
        '<link rel="stylesheet" href="css/shell-v64.css" />\n'
        '<link rel="stylesheet" href="css/mobile-lock.css" />\n'
        '<style>\n' + shell_css + '\n</style>\n'
        '</head>\n<body>\n\n' + body + '\n'
        '<div id="toast"></div>\n'
        '<script src="js/home.js"></script>\n'
        '<script src="js/tabbar.js"></script>\n'
        '<script src="js/boot-greeting.js"></script>\n'
        '</body>\n</html>\n'
    )
    # 与其它页面走同一套注入：<base> 修正相对路径 + 路由桥
    return transform(doc, 'home')


def main():
    if not OLD_INDEX.exists():
        print('ERROR: 缺少备份文件 ' + str(OLD_INDEX))
        return 1
    old = read(OLD_INDEX)
    shell_css, shell_html, home_body, onb_js, toast_js = extract_shell(old)

    # 新手引导里原本直接显示 #app，现在改为进入单文件舞台
    onb_js = onb_js.replace(
        'appEl.classList.remove(\'hidden\');',
        'if (window.LJEnter) { window.LJEnter(); }'
    )

    pages = {'home': build_home(home_body, shell_css)}

    only = None
    if len(sys.argv) > 2 and sys.argv[1] == '--only':
        only = set(sys.argv[2].split(','))

    srcs = sorted(PREVIEW.glob('*.html'))
    skipped = []
    for p in srcs:
        pid = p.stem
        if only and pid not in only:
            skipped.append(pid)
            continue
        pages[pid] = transform(read(p), pid)

    payload = json.dumps(pages, ensure_ascii=False, separators=(',', ':'))
    # 内联 JSON 里若出现 </script> 会提前闭合宿主 script
    payload = payload.replace('</', '<\\/')

    shell = SHELL_TEMPLATE
    shell = shell.replace('__SHELL_CSS__', shell_css)
    shell = shell.replace('__SHELL_HTML__', shell_html)
    shell = shell.replace('__SHELL_JS__', SHELL_JS)
    shell = shell.replace('__ONB_JS__', '<script>' + onb_js + '</script>')
    shell = shell.replace('__TOAST_JS__', '<script>' + toast_js + '</script>')
    shell = shell.replace('__LJ_PAGES__', payload)

    OUT.write_text(shell, encoding='utf-8')

    print('生成 ' + str(OUT))
    print('  内联页面 {} 个'.format(len(pages)))
    if skipped:
        print('  跳过 {} 个（--only 模式）'.format(len(skipped)))
    print('  体积 {:.1f} MB'.format(len(shell.encode('utf-8')) / 1048576))
    return 0


if __name__ == '__main__':
    sys.exit(main())
