# -*- coding: utf-8 -*-
"""修复 index.html LJ_PAGES 内未转义的 </script>（浏览器会提前终止脚本导致 JSON 泄漏）"""
import re, sys

PATH = r'F:/开发软件项目文件/灵境 · 双生/index.html'
h = open(PATH, encoding='utf-8').read()

m = re.search(r'var LJ_PAGES = (.*?);</script>', h, re.S)
if not m:
    print('FATAL: LJ_PAGES 未找到'); sys.exit(1)
payload = m.group(1)
pstart, pend = m.start(1), m.end(1)

# 1) 统计裸 </script>（前一个字符不是反斜杠）
raws = []
i = 0
while True:
    j = payload.find('</script>', i)
    if j < 0:
        break
    if j == 0 or payload[j-1] != '\\':
        raws.append(j)
    i = j + 1
print('裸 </script> 数:', len(raws))

# 2) 定位所属页面键
keys = [(mm.start(1), mm.group(1)) for mm in re.finditer(r'"([a-z0-9-]+)":"<!DOCTYPE', payload)]
def owner(pos):
    o = None
    for s, k in keys:
        if s <= pos:
            o = k
        else:
            break
    return o
from collections import Counter
print('分布:', dict(Counter(owner(p) for p in raws)))

# 3) 执行转义：从后往前替换 </script> -> <\/script>
new_payload = payload
for j in reversed(raws):
    new_payload = new_payload[:j] + '<\\/script>' + new_payload[j+len('</script>'):]

# 4) 回写（payload 内不变的部分保持字节一致）
fixed = h[:pstart] + new_payload + h[pend:]
open(PATH, 'w', encoding='utf-8', newline='').write(fixed)

# 5) 自检：重新解析
h2 = open(PATH, encoding='utf-8').read()
m2 = re.search(r'var LJ_PAGES = (.*?);</script>', h2, re.S)
pages = json.loads(m2.group(1).replace('<\\\\/', '</') if False else m2.group(1).replace('<\\/', '</'))
print('修复后页面键数:', len(pages))
left = len(re.findall(r'(?<!\\)</script>', m2.group(1)))
print('修复后残留裸 </script>:', left)
