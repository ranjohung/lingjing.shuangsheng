# -*- coding: utf-8 -*-
"""
extract_pages.py — 从单文件 index.html 反向提取页面源码

用途：
  用户要求项目里只保留 index.html 一个 HTML 文件。本脚本把内联在
  index.html 的 LJ_PAGES 还原为独立源文件，存放于
  .workbuddy/build-src/preview/（隐藏构建目录），供
  build_single_html.py 再次构建使用。

剥离规则（对应 transform() 的注入）：
  1. <base href="__LJ_BASE__" />
  2. BRIDGE_HEAD  <script> ... window.__LJ_PARAMS__ ... </script>
  3. BRIDGE_BODY  <script> document.addEventListener('click' ... LJNav(h) ... </script>

注意：
  - home 页由 build_single_html.py 从多页版外壳重建，此处跳过不导出。
  - 页面代码里的 LJSearch()/LJHashVal()/LJNav() 调用保留原样，
    重新构建时 transform() 的正则不会再匹配（幂等）。
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
INDEX = ROOT / 'index.html'
OUT_DIR = ROOT / '.workbuddy' / 'build-src' / 'preview'

RE_BASE = re.compile(r'<base href="__LJ_BASE__"\s*/>')
RE_BRIDGE_HEAD = re.compile(
    r'<script>\s*window\.__LJ_PARAMS__\s*=\s*__LJ_QS__;.*?</script>',
    re.S)
RE_BRIDGE_BODY = re.compile(
    r'<script>\s*document\.addEventListener\(\'click\', function \(e\) \{.*?LJNav\(h\);.*?</script>\s*\n?',
    re.S)


def strip_bridge(html):
    html = RE_BASE.sub('', html)
    html = RE_BRIDGE_HEAD.sub('', html)
    html = RE_BRIDGE_BODY.sub('', html)
    return html


def main():
    s = INDEX.read_text(encoding='utf-8')
    m = re.search(r'<script>var LJ_PAGES = (.*?);</script>', s, re.S)
    if not m:
        print('ERROR: LJ_PAGES not found')
        return 1
    payload = m.group(1)
    # build 时把 </ 转义为 <\/ 防止提前闭合 script，此处还原
    payload = payload.replace('<\\/', '</')
    pages = json.loads(payload)
    print('LJ_PAGES 共 {} 页'.format(len(pages)))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    n = 0
    for pid, html in pages.items():
        if pid == 'home':
            continue  # home 由 build_single_html.py 从外壳重建
        clean = strip_bridge(html)
        # 校验：剥离后不应再残留桥标记
        if '__LJ_PARAMS__' in clean or 'LJNav(h);' in clean:
            print('WARN  {} 桥剥离不干净'.format(pid))
        (OUT_DIR / (pid + '.html')).write_text(clean, encoding='utf-8')
        n += 1
    print('导出 {} 页 -> {}'.format(n, OUT_DIR))
    return 0


if __name__ == '__main__':
    sys.exit(main())
