"""Repair the user's single HTML shell without removing embedded features."""
from pathlib import Path
import re, json, zipfile, datetime

root=Path(r'F:\开发软件项目文件\灵境 · 双生')
entry=root/'index.html'
raw=entry.read_text(encoding='utf-8-sig')
match=re.search(r'<script>var LJ_PAGES = (.*?);</script>',raw,re.S)
pages=json.loads(match[1])
original_keys=set(pages)
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
backup=root/'backups'/('single-entry-'+stamp+'.zip')
backup.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(backup,'w',zipfile.ZIP_DEFLATED) as z:
    z.write(entry,'index.html')

base=root/'output'/'preview'
missing=[]
def routed(js):
    # Only complete assignment statements; leave reads and LJNav fallback intact.
    js=re.sub(r'(?:(?:window|document)\.)?location\.href\s*=\s*([^;\n]+);',r'window.LJNav(\1);',js)
    js=js.replace("location.href=\\'interaction-manage.html\\'", "LJNav(\\'interaction-manage.html\\')")
    js=js.replace("location.href=\\'work-editor.html\\'", "LJNav(\\'work-editor.html\\')")
    return js

def inline_script(m):
    name=m[1]
    if re.match(r'https?:|//',name):return m[0]
    path=base/name
    if not path.is_file():missing.append(name);return m[0]
    js=routed(path.read_text(encoding='utf-8-sig'))
    if name=='js/tabbar.js':
        js=js.replace("var path = window.location.pathname || '';", "var path = (window.__LJ_PAGE__ || '') + '.html';")
    if name=='js/home.js':
        js=js.replace('world-forge.html?book=','world-view.html?book=')
        js=js.replace('（公版）','').replace("cat: '公版名著'","cat: '经典小说'")
        js=js.replace('120 回 · 沉浸式世界已生成','群雄逐鹿，走进三国').replace('120 回 · 大观园可探索','红楼旧梦，庭院相逢').replace('100 回 · 花果山/天宫场景','踏入花果山，开启西游').replace('120 回 · 梁山好汉世界','江湖相逢，水泊风云')
        js=js.replace('世界已生成 · 12 场景 · 8 立绘 · 5 3D','花果山 · 开篇体验').replace('100 回 · 自动生成世界','群雄逐鹿 · 开篇体验').replace('120 回 · 自动生成世界','红楼旧梦 · 开篇体验')
        js=js.replace('公版名著世界计划','走进经典故事').replace('40 部公版名著已接入小说世界自动生成','从一本小说，走进一段人生')
    if name=='js/plot-detail-data.js':
        js=js.replace('公版名著计划','走进小说世界').replace('自动生成为世界 · 可沉浸游玩','跟随故事，邂逅书中人').replace("badge: '公版'","badge: '故事'")
    return '<script data-bundled-source="'+name+'">\n'+js.replace('</script','<\\/script')+'\n</script>'

for key,page in list(pages.items()):
    page=re.sub(r'<script\s+src="([^"]+)"[^>]*>\s*</script>',inline_script,page)
    page=page.replace('window.__LJ_PARAMS__ =', 'window.__LJ_PAGE__ = '+json.dumps(key)+';\nwindow.__LJ_PARAMS__ =',1)
    # Existing embedded inline scripts already use LJNav in most places.
    def fix_inline(m):
        s=m[0]
        if 'window.LJNav = function' in s:return s
        return routed(s)
    page=re.sub(r'<script(?:\s[^>]*)?>.*?</script>',fix_inline,page,flags=re.S)
    if key=='library':
        page=page.replace('href="world-forge.html"','href="novel-shelf.html"').replace('>生成世界<','>小说世界<')
    if key=='world-view':
        page=page.replace('href="world-forge.html" aria-label="返回工作台"','href="novel-shelf.html" aria-label="返回小说世界"')
        page=page.replace("if (!WORLD) { LJNav('world-forge.html'); return; }", "if (!WORLD) { document.getElementById('mode-book').textContent='这部作品暂时无法进入，请返回书架选择其他作品。'; return; }")
        page=page.replace('fromLocal();\n  });', "WORLD=null; document.getElementById('mode-book').textContent='这部作品暂时无法进入，请返回书架。';\n  });")
        page=page.replace("'Canon Anchor ' + a.id + ' · 第' + a.chapter + '章 · ' + a.type + ' · 场景 ' + sc.scene_id + ' · 原文零删减'", "'第' + a.chapter + '章 · ' + (idx+1) + ' / ' + WORLD.anchors.length")
        page=page.replace('完整体验小说：原文 + 场景 + 镜头，按原著剧情推进，点击文字继续。','跟随原著剧情，点击文字继续。当前开放开篇体验。')
    pages[key]=page

# A shelf of already prepared worlds. No parser, upload, generation or LLM is called.
cards=[]
for book in ('xiyouji','hongloumeng','sanguoyanyi','shuihuzhuan'):
    w=json.loads((base/'worlds'/f'{book}.json').read_text(encoding='utf-8-sig'))
    img=next((b['image'] for b in w['assets']['backgrounds'] if b.get('image') and (base/b['image']).exists()),'')
    cards.append(f'<a class="book" href="world-view.html?book={book}"><img src="{img}" alt="{w["meta"]["title"]}场景封面"><div><small>开篇体验</small><h2>{w["meta"]["title"]}</h2><p>{w["meta"]["author"]}</p><strong>进入故事 →</strong></div></a>')
shelf='''<!doctype html><html lang="zh-CN"><head><base href="__LJ_BASE__"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小说世界 · 灵境 · 双生</title><style>
*{box-sizing:border-box}body{margin:0;background:#111a20;color:#f2ecdc;font-family:"Microsoft YaHei",sans-serif}header,main{max-width:1180px;margin:auto;padding:28px}nav{display:flex;gap:26px;flex-wrap:wrap}a{color:inherit;text-decoration:none}header{border-bottom:1px solid #ffffff20}h1{font:42px "SimSun",serif;margin:35px 0 15px}p{color:#b5bcb8;line-height:1.8}.books{display:grid;grid-template-columns:repeat(2,1fr);gap:24px}.book{position:relative;min-height:290px;overflow:hidden;border:1px solid #ffffff30;border-radius:8px}.book img{position:absolute;width:100%;height:100%;object-fit:cover}.book div{position:relative;padding:95px 28px 25px;background:linear-gradient(0deg,#071216 0%,#07121699 50%,transparent);height:100%}.book h2{font:32px "SimSun",serif}.book strong{color:#e4cb94}.book:hover{border-color:#e4cb94}a:focus-visible{outline:3px solid #e4cb94}@media(max-width:650px){.books{grid-template-columns:1fr}h1{font-size:32px}}
</style></head><body><header><nav><a href="index.html">灵境 · 双生</a><a href="library.html">世界</a><a href="heart-island.html">心屿</a><a href="creator-center.html">创作</a><a href="me.html">我的</a></nav></header><main><h1>走进书中的世界</h1><p>赴一场书中之约，亲历一段故事。</p><div class="books">'''+''.join(cards)+'''</div></main><script>document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;e.preventDefault();var m=/([\w-]+)\.html(\?[^#]*)?/.exec(a.getAttribute('href'));if(m)parent.postMessage({lj:'go',id:m[1],qs:m[2]||''},'*')});</script></body></html>'''
pages['novel-shelf']=shelf
# Put a dependable, prominent world entry on the home and world pages, preserving everything else.
for key in ('home','library'):
    banner='<a href="novel-shelf.html" style="display:block;margin:18px;padding:22px;border:1px solid #d5bf8755;border-radius:14px;background:#203239;color:#f3e7ca;text-decoration:none"><strong style="font-size:21px">小说世界　进入书中的人生 →</strong><p style="margin:8px 0 0;font-size:13px">西游记 · 红楼梦 · 三国演义 · 水浒传</p></a>'
    pages[key]=re.sub(r'(<body[^>]*>)',lambda m:m[0]+banner,pages[key],count=1)

assert original_keys <= pages.keys()
encoded=json.dumps(pages,ensure_ascii=False,separators=(',',':')).replace('</script','<\/script')
# Preserve literal closing script tags after JSON parsing while keeping outer HTML safe.
new=raw[:match.start(1)]+encoded+raw[match.end(1):]
new=new.replace("if (!LJ_PAGES[id]) id = 'home';", "if (id === 'world-forge' && /^(home|library|novel-shelf|plot-detail|world-view)$/.test(CUR)) { id = qs && /book=/.test(qs) ? 'world-view' : 'novel-shelf'; }\n  if (!LJ_PAGES[id]) id = 'home';")
new=new.replace("if (!d || !d.lj) return;", "if (e.source !== stage.contentWindow || !d || !d.lj) return;")
entry.write_text(new,encoding='utf-8')
report={'entry':str(entry),'backup':str(backup),'preserved_pages':len(original_keys),'total_pages':len(pages),'missing_scripts':sorted(set(missing))}
(root/'backups'/'repair-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
