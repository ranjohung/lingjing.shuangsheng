# -*- coding: utf-8 -*-
"""
灵境 · 双生 V20-H · 公版小说语料库构建管线
40 本公版小说 raw → corpus/books/{id}.txt（统一 UTF-8 简体）+ manifest.json

来源：
- Jiasheng-Shi/Dream-of-the-Red-Chamber（四大名著 · 简体 txt）
- xp44mm/hanchuancaolu（漢川草廬 · 繁体按回分文件）
- nadeal/chtxt（世说新语/史记 · 繁体 txt）
- hanzhaodeng/chinese-ancient-text（诸子 · JSON）
- lndxquan/EPUB- + dev-chenxing（明清小说 · EPUB）
- Project Gutenberg（15 本外国经典 · 英文原版）
- Gutenberg #24099（二十年目睹之怪现状 · 繁体）
"""
import json, os, re, zipfile, html
from opencc import OpenCC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'corpus', 'raw')
HC = os.path.join(ROOT, 'corpus', 'hc', 'hanchuancaolu-master')
OUT = os.path.join(ROOT, 'corpus', 'books')
os.makedirs(OUT, exist_ok=True)
t2s = OpenCC('t2s')

# ---------- 工具 ----------
def write_book(bid, text):
    text = re.sub(r'\n{4,}', '\n\n\n', text).strip() + '\n'
    with open(os.path.join(OUT, bid + '.txt'), 'w', encoding='utf-8') as f:
        f.write(text)

def read(path):
    return open(path, encoding='utf-8').read()

def strip_gutenberg(text):
    """去 Gutenberg 头尾许可文本"""
    m = re.search(r'\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*', text)
    if m: text = text[m.end():]
    m = re.search(r'\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*', text)
    if m: text = text[:m.start()]
    return text.strip()

def epub_to_text(path):
    """EPUB → 纯文本（按 spine 顺序解 html）"""
    z = zipfile.ZipFile(path)
    names = z.namelist()
    # 找 opf 拿 spine 顺序
    opf = [n for n in names if n.endswith('.opf')]
    order = []
    if opf:
        opf_src = z.read(opf[0]).decode('utf-8', 'ignore')
        # idref 顺序
        idrefs = re.findall(r'<itemref[^>]*idref="([^"]+)"', opf_src, re.I)
        items = re.findall(r'<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"', opf_src, re.I)
        href_map = dict(items)
        base = os.path.dirname(opf[0])
        for ir in idrefs:
            h = href_map.get(ir)
            if h:
                p = (base + '/' + h) if base else h
                p = p.lstrip('/')
                if p in names: order.append(p)
    if not order:  # 兜底：所有 html 排序
        order = sorted([n for n in names if n.endswith(('.html', '.xhtml'))])
    parts = []
    for p in order:
        raw = z.read(p).decode('utf-8', 'ignore')
        raw = re.sub(r'<(script|style)[\s\S]*?</\1>', '', raw, flags=re.I)
        raw = re.sub(r'<(h\d|p|div|br)[^>]*>', '\n', raw, flags=re.I)
        raw = re.sub(r'<[^>]+>', '', raw)
        raw = html.unescape(raw)
        raw = re.sub(r'[ \t]+', ' ', raw)
        raw = re.sub(r'\n\s*\n+', '\n\n', raw)
        parts.append(raw.strip())
    return '\n\n'.join(x for x in parts if x)

def count_words(text, lang):
    if lang == 'zh':
        return len(re.findall(r'[\u4e00-\u9fff]', text))
    return len(re.findall(r'[A-Za-z]+', text))

def html_to_text(raw):
    raw = re.sub(r'<(script|style)[\s\S]*?</\1>', '', raw, flags=re.I)
    raw = re.sub(r'<br[^>]*>', '\n', raw, flags=re.I)
    raw = re.sub(r'</(p|div|h\d)>', '\n', raw, flags=re.I)
    raw = re.sub(r'<[^>]+>', '', raw)
    raw = html.unescape(raw)
    raw = re.sub(r'[ \t]+', ' ', raw)
    raw = re.sub(r'\n\s*\n+', '\n\n', raw)
    return raw.strip()

# ---------- 书目定义 ----------
# (id, title, author, lang, kind, locator)
BOOKS = [
    # 四大名著（raw 简体 txt）
    ('hongloumeng', '红楼梦', '曹雪芹', 'zh', 'raw', 'hongloumeng.txt'),
    ('xiyouji', '西游记', '吴承恩', 'zh', 'raw', 'xiyouji.txt'),
    ('sanguoyanyi', '三国演义', '罗贯中', 'zh', 'raw', 'sanguoyanyi.txt'),
    ('shuihuzhuan', '水浒传', '施耐庵', 'zh', 'raw', 'shuihuzhuan.txt'),
    # chtxt txt（繁体，需转简）
    ('shishuo', '世说新语', '刘义庆', 'zh', 'chtxt', 'shishuo.txt'),
    ('shiji', '史记', '司马迁', 'zh', 'chtxt', 'shiji.txt'),
    # hanzhaodeng JSON（{name, description, articles:[{title, content}]})
    ('sanshi', '三十六计', '佚名', 'zh', 'json', 'sanshi.json'),
    ('shanhai', '山海经', '佚名', 'zh', 'json', 'shanhai.json'),
    ('caigen', '菜根谭', '洪应明', 'zh', 'json', 'caigen.json'),
    ('zizhi', '资治通鉴', '司马光', 'zh', 'json', 'zizhi.json'),
    ('yanshi', '颜氏家训', '颜之推', 'zh', 'json', 'yanshi.json'),
    # EPUB（简体）
    ('jinghuayuan', '镜花缘', '李汝珍', 'zh', 'epub', 'jinghuayuan.epub'),
    ('dongzhou', '东周列国志', '冯梦龙', 'zh', 'epub', 'dongzhou.epub'),
    ('laocan', '老残游记', '刘鹗', 'zh', 'epub', 'laocan.epub'),
    ('suitang', '隋唐演义', '褚人获', 'zh', 'epub', 'suitang.epub'),
    ('shuoyue', '说岳全传', '钱彩', 'zh', 'epub', 'shuoyue.epub'),
    ('guanchang', '官场现形记', '李宝嘉', 'zh', 'epub', 'guanchang.epub'),
    # Gutenberg 繁体 → 简体
    ('ershiyi', '二十年目睹之怪现状', '吴趼人', 'zh', 'gutenberg_zh', 'ershiyi.txt'),
    # 漢川草廬（目录名，繁体分回）
    ('liaozhai', '聊斋志异', '蒲松龄', 'zh', 'hc', '聊齋志異'),
    ('rulinwaishi', '儒林外史', '吴敬梓', 'zh', 'hc', '儒林外史'),
    ('fengshenyanyi', '封神演义', '许仲琳', 'zh', 'hc', '封神演义'),
    ('zhuangzi', '庄子', '庄周', 'zh', 'hc', '莊子'),
    ('sunzi', '孙子兵法', '孙武', 'zh', 'hc', '孫子'),
    ('daode', '道德经', '老子', 'zh', 'hc', '老子'),
    ('lunyu', '论语', '孔子弟子', 'zh', 'hc', '論語'),
    # 外国 15 本（Gutenberg 英文原版）
    ('pride-prejudice', '傲慢与偏见', '简·奥斯汀', 'en', 'gutenberg', 'pride-prejudice.txt'),
    ('wuthering', '呼啸山庄', '艾米莉·勃朗特', 'en', 'gutenberg', 'wuthering.txt'),
    ('jane-eyre', '简·爱', '夏洛蒂·勃朗特', 'en', 'gutenberg', 'jane-eyre.txt'),
    ('dracula', '德古拉', '布拉姆·斯托克', 'en', 'gutenberg', 'dracula.txt'),
    ('anna-karenina', '安娜·卡列尼娜', '列夫·托尔斯泰', 'en', 'gutenberg', 'anna-karenina.txt'),
    ('les-miserables', '悲惨世界', '维克多·雨果', 'en', 'gutenberg', 'les-miserables.txt'),
    ('notre-dame', '巴黎圣母院', '维克多·雨果', 'en', 'gutenberg', 'notre-dame.txt'),
    ('red-black', '红与黑', '司汤达', 'en', 'gutenberg', 'red-black.txt'),
    ('pere-goriot', '高老头', '巴尔扎克', 'en', 'gutenberg', 'pere-goriot.txt'),
    ('eugenie', '欧也妮·葛朗台', '巴尔扎克', 'en', 'gutenberg', 'eugenie.txt'),
    ('tess', '苔丝', '托马斯·哈代', 'en', 'gutenberg', 'tess.txt'),
    ('great-expectations', '远大前程', '查尔斯·狄更斯', 'en', 'gutenberg', 'great-expectations.txt'),
    ('tale-two-cities', '双城记', '查尔斯·狄更斯', 'en', 'gutenberg', 'tale-two-cities.txt'),
    ('oliver-twist', '雾都孤儿', '查尔斯·狄更斯', 'en', 'gutenberg', 'oliver-twist.txt'),
    ('sherlock', '福尔摩斯探案集', '阿瑟·柯南·道尔', 'en', 'gutenberg', 'sherlock.txt'),
]

ZH_CHAPTER_RE = re.compile(r'^第[一二三四五六七八九十百千零〇两0-9]{1,8}[回章节卷][^\n]{0,40}$', re.M)

def split_chapters(text, lang):
    """返回 (章节数, 章节标题列表)"""
    if lang == 'en':
        # 英文按 CHAPTER 标记
        ms = re.findall(r'^(CHAPTER [IVXLC0-9]+[^\n]{0,60})$', text, re.M)
        if ms: return len(ms), ms[:5]
        return 1, []
    ms = re.findall(r'^(第[一二三四五六七八九十百千零〇两0-9]{1,8}[回章节卷][^\n]{0,40})$', text, re.M)
    if ms: return len(ms), [t2s.convert(m) for m in ms[:5]]
    return 1, []

manifest = []
for bid, title, author, lang, kind, loc in BOOKS:
    try:
        if kind == 'raw':
            text = read(os.path.join(RAW, loc))
        elif kind == 'chtxt':
            src = read(os.path.join(RAW, loc))
            # 去 # 开头注释头
            lines = [l for l in src.split('\n') if not l.startswith('#')]
            text = t2s.convert('\n'.join(lines))
        elif kind == 'json':
            d = json.loads(read(os.path.join(RAW, loc)))
            parts = []
            for a in d.get('articles', []):
                t = a.get('title', '')
                c = a.get('content', '')
                if isinstance(c, list):
                    c = '\n'.join(str(x) for x in c)
                parts.append((t + '\n' if t else '') + str(c))
            text = t2s.convert('\n\n'.join(parts))
        elif kind == 'epub':
            text = t2s.convert(epub_to_text(os.path.join(RAW, loc)))
        elif kind == 'gutenberg_zh':
            text = t2s.convert(strip_gutenberg(read(os.path.join(RAW, loc))))
        elif kind == 'gutenberg':
            text = strip_gutenberg(read(os.path.join(RAW, loc)))
        elif kind == 'hc':
            folder = os.path.join(HC, loc)
            if not os.path.isdir(folder):
                zp = os.path.join(ROOT, 'corpus', 'hanchuancaolu.zip')
                zz = zipfile.ZipFile(zp)
                for name in zz.namelist():
                    if ('/' + loc + '/') in name and name.endswith(('.txt', '.html', '.xhtml')):
                        zz.extract(name, os.path.join(ROOT, 'corpus', 'hc'))
            files = sorted(f for f in os.listdir(folder)
                           if f.endswith(('.txt', '.html', '.xhtml')))
            parts = []
            for fn in files:
                src = read(os.path.join(folder, fn))
                if fn.endswith(('.html', '.xhtml')):
                    src = html_to_text(src)
                parts.append(src)
            text = t2s.convert('\n\n'.join(parts))
        write_book(bid, text)
        nch, sample_titles = split_chapters(text, lang)
        manifest.append({
            'id': bid, 'title': title, 'author': author, 'lang': lang,
            'words': count_words(text, lang), 'chapters': nch,
            'sizeBytes': os.path.getsize(os.path.join(OUT, bid + '.txt')),
            'sampleTitles': sample_titles,
        })
        print(f'OK  {bid:18} {manifest[-1]["words"]:>9} 字 {nch:>4} 章')
    except Exception as e:
        print(f'ERR {bid}: {e}')
        manifest.append({'id': bid, 'title': title, 'error': str(e)})

with open(os.path.join(ROOT, 'corpus', 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
print(f'\nmanifest: {len(manifest)} books → corpus/manifest.json')
