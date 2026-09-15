import re
import subprocess

def text_of(html):
    html = re.sub(r'<script[\s\S]*?</script>', '', html)
    html = re.sub(r'<style[\s\S]*?</style>', '', html)
    html = re.sub(r'<[^>]+>', '\n', html)
    lines = [l.strip() for l in html.split('\n')]
    return [l for l in lines if l]

head = subprocess.run(['git', 'show', 'HEAD:output/preview/creator-center.html'],
                      capture_output=True).stdout.decode('utf-8')
cur = open('output/preview/creator-center.html', encoding='utf-8').read()

a = text_of(head)
b = text_of(cur)

import difflib
d = list(difflib.unified_diff(a, b, 'HEAD(我的V21)', 'WORK(扣子V23)', lineterm='', n=1))
print('\n'.join(d[:200]))
print('\n...diff 总行数:', len(d))
