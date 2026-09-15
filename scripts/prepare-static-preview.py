from pathlib import Path
import shutil,re
root=Path('.'); original=Path('F:/开发软件项目文件/MIRAI灵境/apps/web/src'); base=root/'scripts/static-preview'; base.mkdir(parents=True,exist_ok=True)
for name in ['app/creator/page.tsx','app/works/page.tsx','app/works/[id]/page.tsx','app/works/author.css','app/world/page.tsx','app/world/world.css','lib/genres.ts','lib/author-api.ts']:
 p=base/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(original/name,p)
p=base/'lib/api.ts';p.write_text('export const API_BASE_URL="";\n',encoding='utf-8')
p=base/'lib/author-api.ts';s=p.read_text(encoding='utf-8');s=re.sub(r'export async function authorRequest[^\n]+', '''export async function authorRequest<T>(path:string,body?:unknown,method="POST"):Promise<T>{
 const key="lingjing-static-works-v1";
 let works:Work[];try{works=JSON.parse(localStorage.getItem(key)||"[]");if(!Array.isArray(works))throw Error()}catch{throw Error("本地作品数据无法读取，请先备份浏览器数据")}
 const data=body as {title:string;document:WorkDocument;revision:number}|undefined;
 if(!data){if(!path)return works as T;const w=works.find(w=>w.id===path.slice(1));if(!w)throw Error("此浏览器中未找到该作品");return w as T}
 if(!data.title.trim())throw Error("作品名称不能为空");
 for(const item of [...data.document.chapters,...data.document.props])if(!Number.isInteger(item.price)||item.price<0||item.price>5000)throw Error("价格必须为0–5000整数灵晶");
 const old=works.find(w=>w.id===path.slice(1));
 if(path&&(!old||old.revision!==data.revision))throw Error("作品版本已变化，请保留内容后重新载入");
 if(old?.document.locked&&JSON.stringify(old.document.outline)!==JSON.stringify(data.document.outline))throw Error("请先保存解锁状态，再修改大纲");
 const saved={id:old?.id||crypto.randomUUID(),title:data.title,document:data.document,revision:(old?.revision||0)+1,updated_at:new Date().toISOString()};
 const next=old?works.map(w=>w.id===old.id?saved:w):[saved,...works];
 try{localStorage.setItem(key,JSON.stringify(next))}catch{throw Error("浏览器存储空间不足，保存未完成；请缩小图片并保留当前正文")}
 return saved as T;
}''',s);p.write_text(s,encoding='utf-8')
# Static preview must describe its actual persistence, never a server save.
for p in base.rglob('*.tsx'):
 s=p.read_text(encoding='utf-8').replace('已保存到服务器','已保存到此浏览器').replace('服务器','此浏览器');p.write_text(s,encoding='utf-8')
p=base/'app/world/page.tsx';s=p.read_text(encoding='utf-8').replace('/assets/world/','output/latest/assets/');p.write_text(s,encoding='utf-8')
p=base/'app/world/world.css';s=p.read_text(encoding='utf-8').replace("url('/assets/world/moon-pavilion.png')","url('./assets/moon-pavilion.png')");p.write_text(s,encoding='utf-8')
(base/'navigation.tsx').write_text('''export function useRouter(){return {push:(path:string)=>{location.hash=path},replace:(path:string)=>{location.replace("#"+path)}}}
export function useParams<T>(){return {id:location.hash.split("/")[2]||""} as T}
''',encoding='utf-8')
(base/'link.tsx').write_text('''import React from "react";export default function Link({href,children,...props}:any){return <a {...props} href={href.startsWith("/")?"#"+href:href}>{children}</a>}
''',encoding='utf-8')
(base/'entry.tsx').write_text('''import React,{useEffect,useState} from "react";import {createRoot} from "react-dom/client";import World from "./app/world/page";import Creator from "./app/creator/page";import Works from "./app/works/page";import Editor from "./app/works/[id]/page";
function App(){const [path,setPath]=useState(location.hash.slice(1)||"/world");useEffect(()=>{const handler=()=>setPath(location.hash.slice(1)||"/world");addEventListener("hashchange",handler);return()=>removeEventListener("hashchange",handler)},[]);return <><div className="preview-notice">产品静态体验 · 草稿仅保存在此浏览器，未连接账号、云端AI或支付。<a href="#/world">小说世界</a><a href="#/creator">写新小说</a><a href="#/works">我的作品</a></div>{path==="/world"?<World/>:path==="/creator"?<Creator/>:path==="/works"?<Works/>:path.startsWith("/works/")&&path!=="/works/import"?<Editor key={path}/>:<div className="author-page"><h1>此模块尚未接入静态体验</h1><p>小说辅助模拟器和作品编辑可直接使用；原稿导入、陪伴和云端能力仍在本地产品中开发。</p><a href="#/works">返回我的作品</a></div>}</>}
createRoot(document.getElementById("root")!).render(<App/>);
''',encoding='utf-8')
out=root/'output/latest';(out/'assets').mkdir(parents=True,exist_ok=True)
for name in ['moon-pavilion.png','moon-guide.png']:
 shutil.copyfile(Path('F:/开发软件项目文件/MIRAI灵境/apps/web/public/assets/world')/name,out/'assets'/name)
(root/'product-preview.html').write_text('''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>灵境 · 双生 · 产品体验</title><link rel="stylesheet" href="output/latest/app.css"><style>body{margin:0;background:#101d2b;color:#edf1f6;font-family:"Microsoft YaHei",sans-serif}*{box-sizing:border-box}.preview-notice{padding:9px 16px;background:#162a38;font-size:12px;line-height:1.8;display:flex;flex-wrap:wrap;gap:14px}.preview-notice a{color:#d3c1e7}.vn-stage{height:calc(100dvh - 44px)}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid #d3c1e7;outline-offset:3px}</style></head><body><div id="root"></div><noscript>请启用JavaScript使用交互产品预览。</noscript><script src="output/latest/app.js"></script></body></html>''',encoding='utf-8')
