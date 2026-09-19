# -*- coding: utf-8 -*-
"""V28-B：新建 novel-detail 小说详细介绍页（橙光式，货币=灵晶）
+ 路由改造：world-hub 书卡 -> novel-detail；novel-game 返回 -> novel-detail
用法：python scripts/v28_build.py
"""
import io, json, re, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(BASE, "index.html")

html = io.open(PATH, encoding="utf-8").read()
m = re.search(r"var LJ_PAGES\s*=\s*", html)
assert m, "LJ_PAGES not found"
start = html.index("{", m.end())
depth = 0; i = start; instr = False; esc = False
while i < len(html):
    c = html[i]
    if instr:
        if esc: esc = False
        elif c == "\\": esc = True
        elif c == '"': instr = False
    else:
        if c == '"': instr = True
        elif c == "{": depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
    i += 1
end = i + 1
pages = json.loads(html[start:end])
print("pages before:", len(pages))
assert "novel-detail" not in pages, "novel-detail already exists"

# =====================================================================
# novel-detail 页面模板
# =====================================================================
PAGE = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head><base href="__LJ_BASE__" /><script>
window.__LJ_PAGE__ = "novel-detail";
window.__LJ_PARAMS__ = __LJ_QS__;
window.__LJ_HASHV__ = __LJ_HASH__;
window.LJSearch = function () { var v = window.__LJ_PARAMS__; return v ? v : location.search; };
window.LJHashVal = function () { var v = window.__LJ_HASHV__; return v ? v : location.hash; };
window.LJNav = function (url) {
  if (typeof url === 'string') {
    var m = /([\w.\-]+)\.html(\?[^#]*)?(#.*)?$/.exec(url);
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
</script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>小说详情 — 灵境 · 双生</title>
<meta name="theme-color" content="#1A1A2E" />
<link rel="stylesheet" href="css/mobile-lock.css" />
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:100%; height:100%; background:#0A0A1A; color:#EAEAF0; font-family:-apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif; }
body { padding-bottom:88px; overflow-x:hidden; }
button { font-family:inherit; }

/* 顶栏 */
.nd-top { position:sticky; top:0; z-index:50; display:flex; align-items:center; gap:10px; padding:12px 14px 10px; background:linear-gradient(180deg,#0A0A1A 72%,rgba(10,10,26,0)); }
.nd-back { width:34px; height:34px; border-radius:50%; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#EAEAF0; font-size:18px; line-height:1; cursor:pointer; flex-shrink:0; }
.nd-title { font-size:16px; font-weight:700; }
.nd-wid { margin-left:auto; font-size:10px; color:rgba(234,234,240,.4); letter-spacing:.5px; }

/* hero 封面 */
.nd-hero { display:flex; gap:14px; padding:6px 16px 14px; }
.nd-cover { width:118px; aspect-ratio:3/4; border-radius:12px; position:relative; overflow:hidden; flex-shrink:0; box-shadow:0 8px 24px rgba(0,0,0,.45); }
.nd-cover .emoji { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:50px; }
.nd-cover .badge { position:absolute; top:8px; left:8px; font-size:9px; padding:2px 7px; border-radius:8px; background:rgba(233,69,96,.92); color:#fff; }
.nd-hinfo { flex:1; min-width:0; display:flex; flex-direction:column; justify-content:flex-end; gap:6px; }
.nd-hname { font-size:21px; font-weight:800; line-height:1.25; }
.nd-hauthor { font-size:12px; color:rgba(234,234,240,.55); }
.nd-hch { font-size:11px; color:rgba(234,234,240,.45); }

/* 数据行：评分 / 人气值 / 灵晶值 */
.nd-stats { display:flex; margin:0 16px 12px; background:#15152B; border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:10px 0; }
.nd-stat { flex:1; text-align:center; }
.nd-stat b { display:block; font-size:15px; color:#FFD166; }
.nd-stat:nth-child(2) b { color:#E94560; }
.nd-stat:nth-child(3) b { color:#6C5CE7; }
.nd-stat span { font-size:10px; color:rgba(234,234,240,.45); }

/* 标签 */
.nd-tags { display:flex; flex-wrap:wrap; gap:6px; padding:0 16px 14px; }
.nd-tag { font-size:10px; padding:3px 9px; border-radius:10px; background:rgba(108,92,231,.14); color:#B9AFFF; border:1px solid rgba(108,92,231,.3); }

/* Tab */
.nd-tabs { display:flex; margin:0 16px; border-bottom:1px solid rgba(255,255,255,.08); position:sticky; top:56px; z-index:40; background:#0A0A1A; }
.nd-tab { flex:1; text-align:center; padding:10px 0 9px; font-size:13px; color:rgba(234,234,240,.5); cursor:pointer; border-bottom:2px solid transparent; user-select:none; }
.nd-tab.on { color:#fff; border-color:#E94560; font-weight:700; }
.nd-panel { display:none; padding:2px 16px 20px; }
.nd-panel.on { display:block; }

/* 详情 panel */
.nd-sec { font-size:14px; font-weight:700; margin:16px 0 8px; display:flex; align-items:center; gap:6px; }
.nd-sec::before { content:""; width:3px; height:14px; background:linear-gradient(180deg,#E94560,#6C5CE7); border-radius:2px; }
.nd-desc { font-size:12.5px; line-height:1.8; color:rgba(234,234,240,.78); }
.nd-updates { border-left:1px dashed rgba(255,255,255,.14); margin-left:5px; }
.nd-up { position:relative; padding:6px 0 6px 14px; }
.nd-up::before { content:""; position:absolute; left:-3.5px; top:13px; width:6px; height:6px; border-radius:50%; background:#00B894; }
.nd-up b { font-size:12px; color:#00B894; }
.nd-up p { font-size:11.5px; color:rgba(234,234,240,.6); margin-top:2px; }
.nd-pay { margin-top:14px; background:linear-gradient(135deg,rgba(108,92,231,.14),rgba(233,69,96,.10)); border:1px solid rgba(108,92,231,.35); border-radius:12px; padding:12px 14px; }
.nd-pay b { font-size:13px; color:#B9AFFF; }
.nd-pay p { font-size:11px; color:rgba(234,234,240,.6); line-height:1.7; margin-top:4px; }
.nd-cast { display:flex; gap:10px; flex-wrap:wrap; }
.nd-cast-i { display:flex; align-items:center; gap:6px; background:#15152B; border:1px solid rgba(255,255,255,.07); border-radius:20px; padding:5px 11px 5px 6px; font-size:11px; }
.nd-cast-i em { font-style:normal; font-size:15px; }

/* 角色 panel */
.nd-role { display:flex; gap:12px; background:#15152B; border:1px solid rgba(255,255,255,.06); border-radius:12px; padding:12px; margin-bottom:10px; }
.nd-role .avatar { width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#2A2A55,#1E1E3F); display:flex; align-items:center; justify-content:center; font-size:23px; flex-shrink:0; }
.nd-role b { font-size:13px; }
.nd-role p { font-size:11px; color:rgba(234,234,240,.55); margin-top:3px; line-height:1.6; }

/* 互动 panel */
.nd-acts { display:flex; gap:10px; margin:14px 0 4px; }
.nd-act-btn { flex:1; text-align:center; padding:12px 0; border-radius:12px; background:#15152B; border:1px solid rgba(255,255,255,.08); font-size:12px; cursor:pointer; user-select:none; }
.nd-act-btn.on { border-color:#E94560; color:#E94560; background:rgba(233,69,96,.10); }
.nd-cmt { display:flex; gap:10px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.05); }
.nd-cmt .avatar { width:34px; height:34px; border-radius:50%; background:#2A2A55; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.nd-cmt .body { flex:1; min-width:0; }
.nd-cmt b { font-size:11.5px; color:rgba(234,234,240,.7); }
.nd-cmt p { font-size:12px; line-height:1.6; margin-top:3px; }
.nd-cmt time { font-size:9.5px; color:rgba(234,234,240,.35); }
.nd-cmt-form { display:flex; gap:8px; margin-top:12px; }
.nd-cmt-form input { flex:1; min-width:0; background:#15152B; border:1px solid rgba(255,255,255,.1); border-radius:20px; padding:9px 14px; color:#EAEAF0; font-size:12px; outline:none; }
.nd-cmt-form input:focus { border-color:rgba(233,69,96,.5); }
.nd-cmt-form button { background:linear-gradient(135deg,#E94560,#6C5CE7); border:0; color:#fff; border-radius:20px; padding:0 16px; font-size:12px; cursor:pointer; }

/* 底部操作栏：点赞 / 收藏 / 世界游客 / 开始阅读 */
.nd-bar { position:fixed; left:0; right:0; bottom:0; z-index:60; display:flex; align-items:center; gap:10px; padding:10px 14px calc(10px + env(safe-area-inset-bottom)); background:rgba(13,13,26,.96); border-top:1px solid rgba(255,255,255,.08); backdrop-filter:blur(10px); }
.nd-bar .ico { width:42px; height:42px; border-radius:50%; background:#15152B; border:1px solid rgba(255,255,255,.1); display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:13px; cursor:pointer; color:rgba(234,234,240,.75); flex-shrink:0; user-select:none; }
.nd-bar .ico.on { color:#E94560; border-color:#E94560; background:rgba(233,69,96,.10); }
.nd-bar .ico small { font-size:8px; transform:scale(.9); }
.nd-bar .tour { padding:0 13px; height:42px; border-radius:21px; border:1px solid rgba(255,255,255,.16); background:transparent; color:#EAEAF0; font-size:12px; cursor:pointer; white-space:nowrap; flex-shrink:0; }
.nd-bar .read { flex:1; height:42px; border:0; border-radius:21px; background:linear-gradient(135deg,#E94560,#6C5CE7); color:#fff; font-size:14px; font-weight:700; cursor:pointer; }
.nd-bar .read:active { transform:scale(.98); }

/* toast */
.nd-toast { position:fixed; left:50%; bottom:106px; transform:translateX(-50%) translateY(14px); background:rgba(233,69,96,.92); color:#fff; font-size:12px; padding:8px 16px; border-radius:18px; opacity:0; transition:all .25s; pointer-events:none; z-index:99; max-width:78%; text-align:center; }
.nd-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
</style>
</head>
<body>

<div class="nd-top">
  <button class="nd-back" id="nd-back" aria-label="返回">‹</button>
  <div class="nd-title">小说详情</div>
  <div class="nd-wid" id="nd-wid"></div>
</div>

<div class="nd-hero">
  <div class="nd-cover" id="nd-cover"><div class="emoji" id="nd-emoji">📖</div><div class="badge" id="nd-badge">公版名著</div></div>
  <div class="nd-hinfo">
    <div class="nd-hname" id="nd-name">—</div>
    <div class="nd-hauthor" id="nd-author">—</div>
    <div class="nd-hch" id="nd-ch"></div>
  </div>
</div>

<div class="nd-stats">
  <div class="nd-stat"><b id="nd-score">—</b><span>评分</span></div>
  <div class="nd-stat"><b id="nd-pop">—</b><span>人气值</span></div>
  <div class="nd-stat"><b id="nd-crystal">—</b><span>灵晶值</span></div>
</div>

<div class="nd-tags" id="nd-tags"></div>

<div class="nd-tabs" id="nd-tabs">
  <div class="nd-tab on" data-tab="info">详情</div>
  <div class="nd-tab" data-tab="roles">角色</div>
  <div class="nd-tab" data-tab="talk">互动</div>
</div>

<div class="nd-panel on" id="panel-info">
  <div class="nd-sec">作品简介</div>
  <div class="nd-desc" id="nd-desc"></div>
  <div class="nd-sec">更新日志</div>
  <div class="nd-updates" id="nd-updates"></div>
  <div class="nd-pay">
    <b>付费信息</b>
    <p id="nd-pay-text"></p>
    <p>章节与打赏收益归创作者所有 · 灵晶余额可在「我的-钱包」查看（演示数据）</p>
  </div>
  <div class="nd-sec">特别参演</div>
  <div class="nd-cast" id="nd-cast"></div>
</div>

<div class="nd-panel" id="panel-roles">
  <div class="nd-sec">主要角色</div>
  <div id="nd-roles"></div>
</div>

<div class="nd-panel" id="panel-talk">
  <div class="nd-acts">
    <div class="nd-act-btn" id="nd-like2">♡ 点赞 · <span id="nd-like-n">0</span></div>
    <div class="nd-act-btn" id="nd-col2">☆ 收藏 · <span id="nd-col-n">0</span></div>
  </div>
  <div class="nd-sec">读者评论</div>
  <div id="nd-cmts"></div>
  <div class="nd-cmt-form">
    <input id="nd-cmt-input" placeholder="说说你的读后感…" maxlength="60" />
    <button id="nd-cmt-send">发布</button>
  </div>
</div>

<div class="nd-bar">
  <div class="ico" id="nd-like">♡<small>点赞</small></div>
  <div class="ico" id="nd-col">☆<small>收藏</small></div>
  <button class="tour" id="nd-tour">世界游客</button>
  <button class="read" id="nd-read">▶ 开始阅读</button>
</div>

<div class="nd-toast" id="nd-toast"></div>

<script>
window.__LJ_PAGE__ = 'novel-detail';

/* ====== 书目数据（与世界页 WORLDS / 剧情页 BOOK_META 对齐 · 货币一律灵晶）====== */
var BOOKS = {
  xiyouji: { name:'西游记', author:'吴承恩（公版）', emoji:'🐒', badge:'公版名著',
    grad:'linear-gradient(160deg,#4A3728,#1A1A0A)', score:'9.6', popText:'12.8万', crystal:'3.6万',
    wid:'LJ-1001', chapters:100, free:3, price:10, likes:8642, cols:3120,
    tags:['公版名著','神魔玄幻','取经冒险'],
    desc:'东胜神洲傲来国一块仙石迸出石猴，求仙学道、大闹天宫，被压五行山下五百年；后随唐僧西行取经，一路降妖伏魔，历经九九八十一难，终成正果。',
    updates:[
      { v:'V22 · 世界引擎', d:'行内标注 / 选项分支 / 人物卡接入沉浸阅读' },
      { v:'V20-X · 上线', d:'影视化小说世界首次开放 · 支持进度存档' }],
    roles:[
      { n:'孙悟空', d:'齐天大圣 · 火眼金睛，一路护师西行', e:'🐒' },
      { n:'唐僧', d:'十世修行的取经人，慈悲为怀', e:'🧘' },
      { n:'猪八戒', d:'天蓬元帅下凡，贪吃恋家', e:'🐷' },
      { n:'沙僧', d:'卷帘大将，任劳任怨的挑担人', e:'🧔' }],
    comments:[
      { u:'取经人', e:'🐒', t:'三打白骨精那段太揪心了，选项都不敢乱点。', time:'2小时前' },
      { u:'云栈洞主', e:'🌙', t:'八戒的台词太有梗了，一边骂一边笑。', time:'昨天' }] },
  hongloumeng: { name:'红楼梦', author:'曹雪芹（公版）', emoji:'🌸', badge:'公版名著',
    grad:'linear-gradient(160deg,#3D2A3D,#2A1A2A)', score:'9.8', popText:'10.2万', crystal:'2.9万',
    wid:'LJ-1002', chapters:120, free:3, price:10, likes:9210, cols:3865,
    tags:['公版名著','世情小说','大观园'],
    desc:'女娲补天遗石下凡历劫，衔玉而生的贾宝玉在大观园中与林黛玉、薛宝钗等一众姐妹相伴成长，见证钟鸣鼎食之家的繁华与幻灭，道尽「千红一哭、万艳同悲」。',
    updates:[
      { v:'V22 · 世界引擎', d:'行内标注 / 选项分支 / 人物卡接入沉浸阅读' },
      { v:'V20-X · 上线', d:'影视化小说世界首次开放 · 支持进度存档' }],
    roles:[
      { n:'贾宝玉', d:'衔玉而生的大观园少爷，情不情', e:'💎' },
      { n:'林黛玉', d:'绛珠仙草转世，诗魂与泪光', e:'🌸' },
      { n:'薛宝钗', d:'蘅芜苑主人，端庄豁达', e:'🌷' },
      { n:'王熙凤', d:'荣国府管家奶奶，明是一盆火', e:'🔥' }],
    comments:[
      { u:'潇湘夜雨', e:'🌸', t:'黛玉葬花那一章做得太美了。', time:'3小时前' },
      { u:'怡红公子', e:'🍃', t:'第一次觉得文言白话这么好读。', time:'2天前' }] },
  sanguoyanyi: { name:'三国演义', author:'罗贯中（公版）', emoji:'⚔️', badge:'公版名著',
    grad:'linear-gradient(160deg,#2D2A3D,#1A1A2E)', score:'9.4', popText:'8.6万', crystal:'2.2万',
    wid:'LJ-1003', chapters:120, free:3, price:10, likes:7488, cols:2633,
    tags:['公版名著','战争权谋','英雄史诗'],
    desc:'东汉末年群雄并起，魏蜀吴三分天下：桃园结义、火烧赤壁、六出祁山……乱世之中英雄辈出，权谋与忠义交织成一部波澜壮阔的史诗。',
    updates:[
      { v:'V22 · 世界引擎', d:'行内标注 / 选项分支 / 人物卡接入沉浸阅读' },
      { v:'V20-X · 上线', d:'影视化小说世界首次开放 · 支持进度存档' }],
    roles:[
      { n:'刘备', d:'织席贩履出身，仁德为先', e:'🏆' },
      { n:'关羽', d:'温酒斩华雄，义薄云天', e:'🗡️' },
      { n:'诸葛亮', d:'隆中对定三分，鞠躬尽瘁', e:'🪶' },
      { n:'曹操', d:'治世之能臣，乱世之枭雄', e:'👑' }],
    comments:[
      { u:'卧龙粉丝', e:'🪶', t:'舌战群江东那段太爽了。', time:'5小时前' },
      { u:'单刀赴会', e:'🗡️', t:'关羽的气魄扑面而来。', time:'前天' }] },
  shuihuzhuan: { name:'水浒传', author:'施耐庵（公版）', emoji:'🏹', badge:'公版名著 · 生成中',
    grad:'linear-gradient(160deg,#2D3D2A,#1A2A1A)', score:'9.1', popText:'5.4万', crystal:'1.3万',
    wid:'LJ-1004', chapters:100, free:3, price:10, likes:4120, cols:1587,
    tags:['公版名著','江湖侠义','梁山好汉'],
    desc:'北宋末年朝纲不振，一百单八将因不同际遇聚义梁山泊，替天行道；从快意恩仇到受招安征四方，写尽江湖儿女的豪情与悲歌。',
    updates:[
      { v:'V28 · 预告', d:'世界生成中 · 先开放前章试读' },
      { v:'V22 · 世界引擎', d:'行内标注 / 选项分支 / 人物卡接入沉浸阅读' }],
    roles:[
      { n:'宋江', d:'及时雨，梁山泊主', e:'🚩' },
      { n:'林冲', d:'风雪山神庙，逼上梁山', e:'❄️' },
      { n:'武松', d:'景阳冈打虎，快意恩仇', e:'🐯' },
      { n:'鲁智深', d:'倒拔垂杨柳，禅杖开路', e:'🌳' }],
    comments:[
      { u:'打虎英雄', e:'🐯', t:'武松打虎那段节奏感一流。', time:'1小时前' },
      { u:'雪夜林冲', e:'❄️', t:'等着开放完整版。', time:'昨天' }] },
  liaozhai: { name:'聊斋志异', author:'蒲松龄（公版）', emoji:'👻', badge:'公版名著',
    grad:'linear-gradient(160deg,#23303D,#101820)', score:'9.3', popText:'6.8万', crystal:'1.8万',
    wid:'LJ-1005', chapters:80, free:5, price:8, likes:5233, cols:2098,
    tags:['公版名著','志怪传奇','花妖狐魅'],
    desc:'书斋孤灯之下，花妖狐魅纷至沓来：聂小倩的痴情、画皮的诡谲、婴宁的笑靥……以谈狐说鬼之笔，写尽人间百态与至情至性。',
    updates:[
      { v:'V22 · 世界引擎', d:'行内标注 / 选项分支 / 人物卡接入沉浸阅读' },
      { v:'V21 · 上线', d:'兰若寺夜话篇开放' }],
    roles:[
      { n:'聂小倩', d:'兰若寺中女鬼，痴情不改', e:'🌙' },
      { n:'宁采臣', d:'正直书生，坐怀不乱', e:'📜' },
      { n:'燕赤霞', d:'剑客道士，降妖除魔', e:'⚔️' },
      { n:'婴宁', d:'爱笑的狐女，天真烂漫', e:'🌼' }],
    comments:[
      { u:'兰若寺常客', e:'🌙', t:'小倩的眼神戏绝了。', time:'4小时前' },
      { u:'夜读人', e:'🕯️', t:'志怪氛围感拉满，夜里读有点上头。', time:'3天前' }] },
  taohuayuan: { name:'桃花源记', author:'陶渊明（公版）', emoji:'🌺', badge:'短篇体验',
    grad:'linear-gradient(160deg,#2A3D2A,#1A2A1A)', score:'9.0', popText:'3.2万', crystal:'0.9万',
    wid:'LJ-1006', chapters:1, free:1, price:0, likes:2210, cols:945, noTour:true,
    tags:['公版名著','短篇体验','田园秘境'],
    desc:'武陵渔人沿溪而行，忽逢桃花林，落英缤纷；穿过山口，别有天地——阡陌交通、鸡犬相闻，避秦时乱的先民在此怡然自乐。一段东方乌托邦的千年想象。',
    updates:[
      { v:'V20-X · 上线', d:'内嵌示例世界 · 随开随读' },
      { v:'免费体验', d:'不设付费章节 · 适合新读者入门' }],
    roles:[
      { n:'武陵渔人', d:'误入秘境的引路人', e:'🛶' },
      { n:'避世先民', d:'不知有汉，无论魏晋', e:'🏡' }],
    comments:[
      { u:'武陵人', e:'🛶', t:'读完想去山里住一个月。', time:'6小时前' },
      { u:'五柳门下', e:'🌺', t:'短小但回味无穷。', time:'1周前' }] }
};

var STORE_KEY = 'lingjing_v528_detail';
var cur = null; var meta = null; var st = null;

function loadState(bid) {
  try {
    var raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    var s = raw[bid];
    if (!s || typeof s !== 'object') s = {};
    return { liked: !!s.liked, collected: !!s.collected, mine: Array.isArray(s.mine) ? s.mine : [] };
  } catch (e) { return { liked: false, collected: false, mine: [] }; }
}
function saveState(bid, s) {
  try {
    var raw = {};
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e2) { raw = {}; }
    raw[bid] = s;
    localStorage.setItem(STORE_KEY, JSON.stringify(raw));
  } catch (e3) {}
}
function toast(msg) {
  var t = document.getElementById('nd-toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._tm);
  toast._tm = setTimeout(function () { t.classList.remove('show'); }, 1800);
}
function switchTab(name) {
  var tabs = document.querySelectorAll('#nd-tabs .nd-tab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].getAttribute('data-tab') === name);
  var panels = ['info', 'roles', 'talk'];
  for (var j = 0; j < panels.length; j++) {
    document.getElementById('panel-' + panels[j]).classList.toggle('on', panels[j] === name);
  }
}
function render() {
  document.getElementById('nd-wid').textContent = '作品ID · ' + meta.wid;
  var cover = document.getElementById('nd-cover');
  cover.style.background = meta.grad;
  document.getElementById('nd-emoji').textContent = meta.emoji;
  document.getElementById('nd-badge').textContent = meta.badge;
  document.getElementById('nd-name').textContent = meta.name;
  document.getElementById('nd-author').textContent = meta.author;
  document.getElementById('nd-ch').textContent = meta.price > 0
    ? '全 ' + meta.chapters + ' 章 · 前 ' + meta.free + ' 章免费'
    : (meta.chapters > 1 ? '全 ' + meta.chapters + ' 章 · 免费阅读' : '单章 · 免费阅读');
  document.getElementById('nd-score').textContent = meta.score;
  document.getElementById('nd-pop').textContent = meta.popText;
  document.getElementById('nd-crystal').textContent = meta.crystal;
  var th = '';
  for (var t = 0; t < meta.tags.length; t++) th += '<span class="nd-tag"># ' + meta.tags[t] + '</span>';
  document.getElementById('nd-tags').innerHTML = th;
  document.getElementById('nd-desc').textContent = meta.desc;
  var uh = '';
  for (var u = 0; u < meta.updates.length; u++) {
    uh += '<div class="nd-up"><b>' + meta.updates[u].v + '</b><p>' + meta.updates[u].d + '</p></div>';
  }
  document.getElementById('nd-updates').innerHTML = uh;
  document.getElementById('nd-pay-text').textContent = meta.price > 0
    ? '前 ' + meta.free + ' 章免费试读 · 后续章节 ' + meta.price + ' 灵晶/章'
    : '免费体验 · 不设付费章节';
  var ch = '';
  for (var c = 0; c < meta.roles.length; c++) {
    ch += '<span class="nd-cast-i"><em>' + meta.roles[c].e + '</em>' + meta.roles[c].n + '</span>';
  }
  document.getElementById('nd-cast').innerHTML = ch;
  var rh = '';
  for (var r = 0; r < meta.roles.length; r++) {
    rh += '<div class="nd-role"><div class="avatar">' + meta.roles[r].e + '</div><div><b>' + meta.roles[r].n + '</b><p>' + meta.roles[r].d + '</p></div></div>';
  }
  document.getElementById('nd-roles').innerHTML = rh;
  var tour = document.getElementById('nd-tour');
  tour.style.display = meta.noTour ? 'none' : '';
  renderComments();
  refreshActs();
}
function renderComments() {
  var box = document.getElementById('nd-cmts');
  var html_all = '';
  var mine = st.mine;
  for (var m = mine.length - 1; m >= 0; m--) {
    html_all += '<div class="nd-cmt"><div class="avatar">🙂</div><div class="body"><b>我（测试）</b><p>' + mine[m].t.replace(/</g, '&lt;') + '</p><time>刚刚</time></div></div>';
  }
  for (var c = 0; c < meta.comments.length; c++) {
    var cm = meta.comments[c];
    html_all += '<div class="nd-cmt"><div class="avatar">' + cm.e + '</div><div class="body"><b>' + cm.u + '</b><p>' + cm.t + '</p><time>' + cm.time + '</time></div></div>';
  }
  box.innerHTML = html_all;
}
function refreshActs() {
  var likeN = meta.likes + (st.liked ? 1 : 0);
  var colN = meta.cols + (st.collected ? 1 : 0);
  document.getElementById('nd-like').className = 'ico' + (st.liked ? ' on' : '');
  document.getElementById('nd-like').innerHTML = (st.liked ? '❤️' : '♡') + '<small>点赞</small>';
  document.getElementById('nd-col').className = 'ico' + (st.collected ? ' on' : '');
  document.getElementById('nd-col').innerHTML = (st.collected ? '⭐' : '☆') + '<small>收藏</small>';
  document.getElementById('nd-like-n').textContent = likeN;
  document.getElementById('nd-col-n').textContent = colN;
  document.getElementById('nd-like2').className = 'nd-act-btn' + (st.liked ? ' on' : '');
  document.getElementById('nd-like2').innerHTML = (st.liked ? '❤️' : '♡') + ' 点赞 · <span id="nd-like-n">' + likeN + '</span>';
  document.getElementById('nd-col2').className = 'nd-act-btn' + (st.collected ? ' on' : '');
  document.getElementById('nd-col2').innerHTML = (st.collected ? '⭐' : '☆') + ' 收藏 · <span id="nd-col-n">' + colN + '</span>';
}
function toggleLike() {
  st.liked = !st.liked;
  saveState(cur, st);
  refreshActs();
  toast(st.liked ? '已点赞 · 感谢支持' : '已取消点赞');
}
function toggleCollect() {
  st.collected = !st.collected;
  saveState(cur, st);
  refreshActs();
  toast(st.collected ? '已加入收藏' : '已取消收藏');
}
function submitComment() {
  var inp = document.getElementById('nd-cmt-input');
  var v = (inp.value || '').trim();
  if (!v) { toast('先写点什么再发布吧'); return; }
  st.mine.push({ t: v });
  saveState(cur, st);
  inp.value = '';
  renderComments();
  switchTab('talk');
  toast('评论已发布');
}
function startReading() {
  var url = cur === 'taohuayuan' ? 'novel-game.html?demo=1' : 'novel-game.html?book=' + cur;
  toast('正在进入「' + meta.name + '」…');
  window.LJNav(url);
}
function worldTour() {
  window.LJNav('world-view.html?book=' + cur);
}
function init() {
  var q = (window.LJSearch ? window.LJSearch() : '') || location.search || '';
  var mm = /book=([a-z]+)/.exec(q);
  var bid = mm ? mm[1] : 'xiyouji';
  if (!BOOKS[bid]) { bid = 'xiyouji'; toast('未找到该书目，已为你推荐：西游记'); }
  cur = bid; meta = BOOKS[bid]; st = loadState(bid);
  document.title = meta.name + ' · 小说详情 — 灵境 · 双生';
  render();
  document.getElementById('nd-back').addEventListener('click', function () { window.LJBack(); });
  var tabs = document.querySelectorAll('#nd-tabs .nd-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () { switchTab(this.getAttribute('data-tab')); });
  }
  document.getElementById('nd-like').addEventListener('click', toggleLike);
  document.getElementById('nd-like2').addEventListener('click', toggleLike);
  document.getElementById('nd-col').addEventListener('click', toggleCollect);
  document.getElementById('nd-col2').addEventListener('click', toggleCollect);
  document.getElementById('nd-cmt-send').addEventListener('click', submitComment);
  document.getElementById('nd-cmt-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitComment(); });
  document.getElementById('nd-read').addEventListener('click', startReading);
  document.getElementById('nd-tour').addEventListener('click', worldTour);
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
</script>
<script>
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
  if (!h || /^[a-zA-Z][\w+.\-]*:/.test(h)) return;
  if (/([\w.\-]+)\.html(\?|#|$)/.test(h)) {
    e.preventDefault();
    window.LJNav(h);
  }
}, true);
</script>
</body>
</html>'''

pages["novel-detail"] = PAGE
print("novel-detail len:", len(PAGE))

# =====================================================================
# 路由改造 1：world-hub enterWorld -> novel-detail
# =====================================================================
wh = pages["world-hub"]
old_enter = """      // 先确保 world 页签被选中
      const wv = 'world-view' + qs;
      LJ.go('world-view', 'book=' + bookId);
    } else {
      // fallback: 直接改 iframe src
      location.href = 'world-view.html' + qs;
    }
  } catch(e) {
    toast('正在进入 ' + bookId + ' …');
    location.href = 'world-view.html' + qs;
  }"""
new_enter = """      // V28-B：书卡点击 -> 橙光式小说详细介绍页（详情/角色/互动 + 开始阅读）
      LJ.go('novel-detail', 'book=' + bookId);
    } else {
      // fallback: 直接改 iframe src
      location.href = 'novel-detail.html' + qs;
    }
  } catch(e) {
    toast('正在进入 ' + bookId + ' …');
    location.href = 'novel-detail.html' + qs;
  }"""
assert wh.count(old_enter) == 1, "world-hub enterWorld anchor x%d" % wh.count(old_enter)
pages["world-hub"] = wh.replace(old_enter, new_enter)
print("world-hub enterWorld -> novel-detail OK")

# =====================================================================
# 路由改造 2：novel-game 顶部返回（游戏中/书目模式 = 退出游戏回详情页）
# =====================================================================
ng = pages["novel-game"]
old_home = """  /* ---------- 返回目录 ---------- */
  $('#ng-btn-home').addEventListener('click', function () {
    // V20-X：游戏中退出 → 回到 splash（再选「继续/重新」）
    if (state.book && state.bookHash) {
      showMode('upload');
      showSplash();
    } else {
      showSplash();
    }
  });"""
new_home = """  /* ---------- 返回目录 ---------- */
  $('#ng-btn-home').addEventListener('click', function () {
    // V28-B：带书目参数进入（来自小说详情页）→ 返回 = 退出游戏，回到详情页
    if (/[?&]book=/.test(location.search)) {
      showMode('upload');
      LJBack();
      return;
    }
    // V20-X：自由模式保持原逻辑（游戏中退出 → 回到 splash 再选「继续/重新」）
    if (state.book && state.bookHash) {
      showMode('upload');
      showSplash();
    } else {
      showSplash();
    }
  });"""
assert ng.count(old_home) == 1, "novel-game ng-btn-home anchor x%d" % ng.count(old_home)
ng = ng.replace(old_home, new_home)

old_entry = """  $('#ng-entry-back').addEventListener('click', function () {
    $('#ng-entry-mask').classList.remove('open');
  });"""
new_entry = """  $('#ng-entry-back').addEventListener('click', function () {
    // V28-B：带书目参数进入（来自小说详情页）→ 返回 = 退出回详情页
    if (/[?&]book=/.test(location.search)) {
      LJBack();
      return;
    }
    $('#ng-entry-mask').classList.remove('open');
  });"""
assert ng.count(old_entry) == 1, "novel-game ng-entry-back anchor x%d" % ng.count(old_entry)
ng = ng.replace(old_entry, new_entry)
pages["novel-game"] = ng
print("novel-game back routes -> novel-detail OK")

# =====================================================================
# 写回 index.html（dumps + </ 转义，V27 已验证流程）
# =====================================================================
new_json = json.dumps(pages, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
html_new = html[:start] + new_json + html[end:]
io.open(PATH, "w", encoding="utf-8", newline="").write(html_new)
print("index.html: %d -> %d chars" % (len(html), len(html_new)))
print("pages after:", len(pages))
