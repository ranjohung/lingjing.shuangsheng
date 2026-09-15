import re
import subprocess

head = subprocess.run(['git', 'show', 'HEAD:output/preview/creator-center.html'],
                      capture_output=True).stdout.decode('utf-8')
cur = open('output/preview/creator-center.html', encoding='utf-8').read()


def links(html):
    out = []
    for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>([\s\S]{0,220}?)</a>', html):
        href = m.group(1)
        inner = m.group(2)
        txt = re.sub(r'<[^>]+>', ' ', inner)
        txt = re.sub(r'\s+', ' ', txt).strip()
        if href.startswith('css') or href.startswith('../../'):
            continue
        out.append((href, txt[:40]))
    return out


a = links(head)
b = links(cur)

print('=== 链接集合差异 ===')
sa = set(a)
sb = set(b)
print('--- 仅在我的版本 (HEAD) ---')
for x in a:
    if x not in sb:
        print('  ', x)
print('--- 仅在扣子版本 (WORK) ---')
for x in b:
    if x not in sa:
        print('  ', x)
