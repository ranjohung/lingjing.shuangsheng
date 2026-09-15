import {API_BASE_URL} from "./api";
export type Card=Record<string,string>;
export type Chapter={id:string;title:string;goal:string;conflict:string;cast:string;events:string;previous:string;next:string;text:string;price:number};
export type WorkDocument={brief:Record<string,string>;genres:string[];outline:Record<string,string>;locked:boolean;chapters:Chapter[];characters:Card[];scenes:Card[];dialogues:Card[];foreshadowing:Card[];props:{id:string;name:string;description:string;image:string;price:number}[]};
export type Work={id:string;title:string;revision:number;document:WorkDocument;updated_at:string};
export const newChapter=():Chapter=>({id:crypto.randomUUID(),title:"新章节",goal:"",conflict:"",cast:"",events:"",previous:"",next:"",text:"",price:0});
export async function authorRequest<T>(path:string,body?:unknown,method="POST"):Promise<T>{
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
}
export const cardFields:Record<string,string[]>={characters:["姓名","性别","年龄","外形","性格特点","家庭关系","感情经历","社会阶层","生活习惯","成长经历","职业身份","目标","说话风格","口癖","句长偏好","常用词","绝不会说的词","绝不会做的事","一定会做的事","底线"],scenes:["场景编号","场景地点","场景时间","在场人物","场景目标","核心冲突","场景类型","情绪曲线","关键描写细节","场景结尾"],dialogues:["对话双方","对话场景","对话目标","双方关系","情绪基调","关键信息"],foreshadowing:["伏笔编号","伏笔内容","埋设章节","预计回收章节","伏笔类型","重要度","状态"]};
