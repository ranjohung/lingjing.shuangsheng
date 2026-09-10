"use client";
import {useEffect,useState} from "react";
import {getRelationship,type Character,type RelationshipData} from "@/lib/api";
import {ScenePicker} from "./ScenePicker";
import {useSceneStore} from "@/store/useSceneStore";
const emotions:Record<string,string>={happy:"愉快",sad:"低落",angry:"生气",shy:"害羞",surprised:"惊讶",calm:"平静",thinking:"思考",confused:"疑惑",disappointed:"失落",excited:"兴奋",awkward:"有些拘谨"};
export function CharacterStage({character,expression}:{character?:Character;expression?:string;animation?:string}){
 const [relationship,setRelationship]=useState<RelationshipData|null>(null),[picker,setPicker]=useState(false),[imageFailed,setImageFailed]=useState(false);
 const {selectedKey,load,scenes}=useSceneStore();
 useEffect(()=>{load()},[load]);
 useEffect(()=>{let alive=true;setRelationship(null);setImageFailed(false);if(character)getRelationship(character.id).then(r=>{if(alive)setRelationship(r)}).catch(()=>{});return()=>{alive=false}},[character?.id,expression]);
 const portrait=character?.id==='preset_ling'?'/assets/characters/ling-realistic-v1.png':null;
 return <section className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl border border-[#344058] bg-[#1b2839]">
 {portrait&&!imageFailed?<img src={portrait} onError={()=>setImageFailed(true)} alt={`${character?.name}的AI生成写实形象`} className="absolute inset-0 h-full w-full object-cover object-top"/>:<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1c2a3d] text-[#aab8cc]"><i aria-hidden="true" className="fa-regular fa-user text-6xl"/><p className="text-sm">{imageFailed?'形象暂时无法加载，仍可继续对话':'此人物的形象正在准备中'}</p></div>}
 <div className="absolute inset-0 bg-gradient-to-t from-[#0b1321] via-transparent to-[#0b1321]/40"/>
 <header className="relative flex items-center justify-between gap-3 p-5"><span className="rounded-lg bg-[#101722]/70 px-3 py-2 text-xs text-white/80">AI生成形象</span><button onClick={()=>setPicker(true)} className="rounded-lg bg-[#101722]/70 px-3 py-2 text-xs text-white/80"><i aria-hidden="true" className="fa-solid fa-sliders mr-2"/>{scenes.find(s=>s.key===selectedKey)?.name??'选择场景'}</button></header>
 <div className="relative mt-auto p-6"><p className="mb-2 text-xs text-[#c7b9e5]">{expression?emotions[expression]??'与你相处':'等待一次对话'}</p><h2 className="text-3xl font-semibold">{character?.name??'你的伙伴'}</h2><p className="mt-3 line-clamp-2 max-w-md text-sm leading-7 text-white/65">{character?.persona??'选择一位人物，开始交流。'}</p><div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/15 pt-4">{[['trust','信任'],['intimacy','亲密'],['familiarity','熟悉']].map(([key,label])=><div key={key}><p className="mb-2 text-xs text-white/60">{label} <span className="float-right">{relationship?Math.round((relationship.dimensions[key]??0)*100):'—'}</span></p><progress aria-label={label} className="h-1 w-full" max={100} value={(relationship?.dimensions[key]??0)*100}/></div>)}</div></div>
 <ScenePicker open={picker} onClose={()=>setPicker(false)}/>
 </section>
}
