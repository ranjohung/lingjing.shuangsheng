# -*- coding: utf-8 -*-
"""全项目链接/资源/存储接口静态审查 (V20-I AUDIT)
扫描 output/preview/*.html + product-preview.html：
1. 所有内部链接 (href / location.href / window.open) 目标文件是否存在
2. 所有 <script src> / <link href> 本地资源是否存在
3. 所有 fetch() 路径是否存在
4. localStorage key 收集与前后缀分组
5. onclick 跳转函数收集
"""
import os, re, json, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREVIEW = os.path.join(ROOT, 'output', 'preview')
HTML_DIR = PREVIEW
# product-preview.html 在仓库根
EXTRA = [os.path.join(ROOT, 'product-preview.html')]
# apps/web/public 里的副本单独记录（不算 preview 主交付物）

pages = sorted([os.path.join(HTML_DIR, f) for f in os.listdir(HTML_DIR) if f.endswith('.html')]) + EXTRA

RE_HREF = re.compile(r'href=["\']([^"\'#]+?)["\']')
RE_LOC = re.compile(r'(?:location\.href|window\.location\.href|location\.assign|window\.open)\s*\(?\s*["\']([^"\']+)["\']')
RE_SCRIPT = re.compile(r'<script[^>]+src=["\']([^"\']+)["\']')
RE_CSS = re.compile(r'<link[^>]+href=["\']([^"\']+\.css)["\']')
RE_FETCH = re.compile(r'fetch\(\s*[`"\']([^`"\']+)[`"\']')
RE_LS_SET = re.compile(r'localStorage\.setItem\(\s*[`"\']([^`"\']+)[`"\']')
RE_LS_GET = re.compile(r'localStorage\.getItem\(\s*[`"\']([^`"\']+)[`"\']')
RE_LS_RM = re.compile(r'localStorage\.removeItem\(\s*[`"\']([^`"\']+)[`"\']')
RE_JSHREF = re.compile(r'[\'"]([a-zA-Z0-9_\-]+\.html)[\'"]')

def file_exists(base_dir, path):
    if path.startswith(('http://', 'https://', '//', 'data:', 'mailto:')):
        return 'external'
    if path.startswith('?') or path.startswith('#'):
        return 'anchor'
    p = path.split('#')[0].split('?')[0]
    if not p:
        return 'anchor'
    full = os.path.normpath(os.path.join(base_dir, p))
    return 'ok' if os.path.exists(full) else 'MISSING'

report = {'broken_links': [], 'missing_assets': [], 'fetch_missing': [], 'ls_keys': {}, 'page_count': len(pages), 'links_by_page': {}}

for page in pages:
    rel = os.path.relpath(page, ROOT)
    txt = open(page, encoding='utf-8').read()
    base_dir = os.path.dirname(page)
    issues = []
    # <a href> + <link css>
    for m in RE_HREF.findall(txt):
        st = file_exists(base_dir, m)
        if st == 'MISSING':
            issues.append(('href', m))
    for m in RE_CSS.findall(txt):
        st = file_exists(base_dir, m)
        if st == 'MISSING':
            report['missing_assets'].append((rel, m))
    for m in RE_SCRIPT.findall(txt):
        st = file_exists(base_dir, m)
        if st == 'MISSING':
            report['missing_assets'].append((rel, m))
    for m in RE_LOC.findall(txt):
        st = file_exists(base_dir, m)
        if st == 'MISSING':
            issues.append(('js-nav', m))
    for m in RE_FETCH.findall(txt):
        st = file_exists(base_dir, m)
        if st == 'MISSING':
            report['fetch_missing'].append((rel, m))
    # .html 字符串出现在 JS 里 (动态跳转)
    for m in set(RE_JSHREF.findall(txt)):
        if m in ('plot-runner.html',):
            pass
        st = file_exists(base_dir, m)
        if st == 'MISSING':
            issues.append(('js-str', m))
    if issues:
        report['broken_links'].append((rel, sorted(set(issues))))
    # localStorage keys
    for m in RE_LS_SET.findall(txt):
        report['ls_keys'].setdefault(m, {'set': [], 'get': [], 'rm': []})['set'].append(rel)
    for m in RE_LS_GET.findall(txt):
        report['ls_keys'].setdefault(m, {'set': [], 'get': [], 'rm': []})['get'].append(rel)
    for m in RE_LS_RM.findall(txt):
        report['ls_keys'].setdefault(m, {'set': [], 'get': [], 'rm': []})['rm'].append(rel)

# JS 模块也扫一遍（storage / fetch）
jsdir = os.path.join(PREVIEW, 'js')
for f in sorted(os.listdir(jsdir)):
    if not f.endswith('.js'):
        continue
    txt = open(os.path.join(jsdir, f), encoding='utf-8').read()
    rel = 'output/preview/js/' + f
    for m in RE_FETCH.findall(txt):
        st = file_exists(PREVIEW, m)
        if st == 'MISSING':
            report['fetch_missing'].append((rel, m))
    for m in RE_LS_SET.findall(txt):
        report['ls_keys'].setdefault(m, {'set': [], 'get': [], 'rm': []})['set'].append(rel)
    for m in RE_LS_GET.findall(txt):
        report['ls_keys'].setdefault(m, {'set': [], 'get': [], 'rm': []})['get'].append(rel)
    for m in RE_LS_RM.findall(txt):
        report['ls_keys'].setdefault(m, {'set': [], 'get': [], 'rm': []})['rm'].append(rel)
    for m in set(RE_JSHREF.findall(txt)):
        st = file_exists(PREVIEW, m)
        if st == 'MISSING':
            report['broken_links'].append((rel, [('js-str', m)]))

# 去重
report['broken_links'] = [(p, i) for p, i in report['broken_links']]
print(json.dumps({
    'pages': report['page_count'],
    'broken_links': report['broken_links'],
    'missing_assets': report['missing_assets'],
    'fetch_missing': report['fetch_missing'],
    'ls_key_count': len(report['ls_keys']),
}, ensure_ascii=False, indent=1))

# ls keys 只写不读 / 只读不写统计
wo = [k for k, v in report['ls_keys'].items() if v['set'] and not v['get']]
ro = [k for k, v in report['ls_keys'].items() if v['get'] and not v['set']]
print('\n-- KEYS write-only (set but never get):')
for k in sorted(wo):
    print('  ', k, '<-', report['ls_keys'][k]['set'])
print('-- KEYS read-only (get but never set):')
for k in sorted(ro):
    print('  ', k, '<-', report['ls_keys'][k]['get'])

with open(os.path.join(ROOT, 'scripts', 'audit_link_result.json'), 'w', encoding='utf-8') as fp:
    json.dump(report, fp, ensure_ascii=False, indent=1)
print('\nsaved -> scripts/audit_link_result.json')
