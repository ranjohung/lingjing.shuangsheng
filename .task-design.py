from pathlib import Path
def write(path,text):
 p=Path(path);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text.strip()+'\n',encoding='utf-8')
write('docs/frontend/13-design-system.md','''# MIRAI 设计系统 v1
2026-09-09。用户要求专业、完整、有官方产品感的界面。沿用Next.js/Tailwind/Zustand，新增Radix Dialog；既有Motion负责状态转换，尊重减少动态效果设置。

## 设计决策
色板：深海底色#101722、面板#182231、边界#303d50、正文#edf1f6、次级#9faec2、鸢尾强调#b6a6df。面向互动小说的长时间阅读与角色工作室，颜色低刺激，强调层级和内容资产。
字体：Noto Sans SC/系统字体负责UI；故事标题可用现有Noto Serif SC。标题32/24，正文16，辅助13。正文最大约70字宽。
布局：桌面固定224px导航与主内容；移动端4项底部导航；引导页采用人物插画与表单双栏，阅读器强调场景、正文、选择以及可收起人物状态。

```
导航 | 页面标题、当前状态
     | 场景/人物主视觉 | 进入故事或角色操作
     | 内容与记录     | 当前人物状态
```

已审视旧界面：满屏星点、重复光环、彩色渐变按钮和泛化圆卡弱化了小说主题。改为安静书库与人物画面，保留适量圆角和清晰分隔，只在对话框及步骤变化时动画。所有按钮有键盘焦点；错误与重试使用明确文案。

基础来源：[Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)、[Motion减少动态效果](https://motion.dev/docs/react-use-reduced-motion)。使用开源基础组件，不把第三方演示主题整套照搬。
''')
write('apps/web/src/components/ui/Modal.tsx','''"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, type ReactNode } from "react";
interface ModalProps { open: boolean; onClose: () => void; title?: string; icon?: string; children: ReactNode }
export function Modal({open,onClose,title,icon,children}:ModalProps) {
 const previousFocus=useRef<HTMLElement|null>(null);
 return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose()}}><Dialog.Portal>
   <Dialog.Overlay className="dialog-overlay" />
   <Dialog.Content className="dialog-content" aria-describedby={undefined}
     onOpenAutoFocus={()=>{previousFocus.current=document.activeElement as HTMLElement}}
     onCloseAutoFocus={event=>{if(previousFocus.current?.isConnected){event.preventDefault();previousFocus.current.focus()}}}>
     <div className="mb-6 flex items-center justify-between gap-4"><Dialog.Title className="text-lg font-semibold">{icon&&<i aria-hidden="true" className={`${icon} mr-2 text-purple-200`} />}{title??"操作面板"}</Dialog.Title><Dialog.Close asChild><button aria-label="关闭对话框" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"><i aria-hidden="true" className="fa-solid fa-xmark" /></button></Dialog.Close></div>
     {children}
   </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
''')
write('apps/web/src/components/layout/AppShell.tsx','''"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";
const NAV=[{href:"/stories",label:"故事书库",icon:"fa-book-open"},{href:"/",label:"我的世界",icon:"fa-moon"},{href:"/characters",label:"人物工作室",icon:"fa-user-group"},{href:"/memories",label:"记忆档案",icon:"fa-bookmark"}];
export function AppShell({children}:{children:React.ReactNode}) {
 const path=usePathname(),hidden=path.startsWith('/onboarding');
 const active=(href:string)=>href==='/'?path==='/':path.startsWith(href);
 return <MotionConfig reducedMotion="user"><div className="min-h-screen"><div className="aurora-bg"/>
 {!hidden&&<><aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-white/10 bg-[#111a27] px-4 py-7 md:flex">
 <Link href="/stories" className="mb-12 flex items-center gap-3 px-3"><img src="/icon.svg" alt="" className="h-10 w-10"/><span><strong className="block text-lg font-semibold tracking-wide">MIRAI</strong><span className="text-xs text-white/45">灵境 · 平行人生</span></span></Link>
 <p className="mb-3 px-4 text-xs text-white/35">你的空间</p><nav aria-label="主导航" className="space-y-2">{NAV.map(item=><Link key={item.href} href={item.href} aria-current={active(item.href)?'page':undefined} className={cn('flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm transition-colors',active(item.href)?'bg-[#28324a] text-[#d5c8f2]':'text-[#a4b1c4] hover:bg-white/5 hover:text-white')}><i aria-hidden="true" className={`fa-solid ${item.icon} w-5 text-center`}/>{item.label}</Link>)}</nav>
 <div className="mt-auto border-t border-white/10 px-3 pt-6"><p className="text-sm text-white/75">每个选择，都有回响。</p><p className="mt-2 text-xs leading-6 text-white/35">你的角色、经历与新的可能。</p><a href="/development-progress.html" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs text-[#b6a6df]"><i aria-hidden="true" className="fa-solid fa-list-check"/>开发进度</a></div>
 </aside><header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#111a27]/95 px-5 py-4 backdrop-blur md:hidden"><Link href="/stories" className="font-semibold tracking-wide">MIRAI <span className="ml-2 font-normal text-white/45">灵境</span></Link><a aria-label="查看开发进度" href="/development-progress.html" className="text-sm text-[#b6a6df]">开发进度</a></header></>}
 <main id="main-content" className={cn(!hidden&&'pb-24 md:pb-0 md:pl-56')}>{children}</main>
 {!hidden&&<nav aria-label="移动端主导航" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#111a27]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">{NAV.map(item=><Link key={item.href} href={item.href} aria-current={active(item.href)?'page':undefined} className={cn('flex min-w-0 flex-col items-center gap-2 py-1 text-[11px]',active(item.href)?'text-[#cfbef0]':'text-[#93a1b6]')}><i aria-hidden="true" className={`fa-solid ${item.icon} text-base`}/>{item.label}</Link>)}</nav>}
 </div></MotionConfig>;
}
''')
write('apps/web/src/app/globals.css','''@tailwind base;
@tailwind components;
@tailwind utilities;
:root{color-scheme:dark;--glass-bg:#182231;--glass-border:#303d50;--text-primary:#edf1f6;--text-secondary:#9faec2}
*{box-sizing:border-box}html,body{min-height:100%}body{margin:0;background:#101722;color:var(--text-primary);font-family:"Noto Sans SC","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
button,a,input,textarea,select,summary{-webkit-tap-highlight-color:transparent}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid #b6a6df;outline-offset:4px}
.aurora-bg{position:fixed;inset:0;z-index:-1;background:linear-gradient(145deg,#131d2b,#101722 60%)}.starfield{display:none}
@layer components{.glass{background:var(--glass-bg);border:1px solid var(--glass-border);box-shadow:0 12px 32px #080e1818}.glass-deep{background:#182231;border:1px solid #344058;box-shadow:0 24px 80px #0007}.text-gradient{color:#d1c3ed;background:none;-webkit-text-fill-color:currentColor}}
.dialog-overlay{position:fixed;inset:0;z-index:60;background:#050a13b8;backdrop-filter:blur(5px);animation:dialog-in .16s ease-out}
.dialog-content{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:61;width:calc(100% - 32px);max-width:520px;max-height:88dvh;overflow-y:auto;padding:28px;background:#182231;border:1px solid #344058;border-radius:20px;box-shadow:0 30px 100px #0008;animation:dialog-in .16s ease-out}
@keyframes dialog-in{from{opacity:0}to{opacity:1}}
::-webkit-scrollbar{width:7px;height:7px}::-webkit-scrollbar-thumb{background:#4c5b73;border-radius:10px}input:-webkit-autofill{-webkit-text-fill-color:#edf1f6;transition:background-color 9999s ease-in-out 0s}
progress{appearance:none;border:0;background:#344058;border-radius:10px;overflow:hidden}progress::-webkit-progress-bar{background:#344058}progress::-webkit-progress-value{background:#b6a6df}progress::-moz-progress-bar{background:#b6a6df}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
''')
p=Path('apps/web/src/components/ui/Button.tsx');s=p.read_text(encoding='utf-8').replace('bg-gradient-to-br from-aurora-violet to-[#6d5ce0] text-white shadow-glow hover:brightness-110 border border-white/10','bg-[#b6a6df] text-[#171a29] hover:bg-[#c8b9ec] border border-transparent');p.write_text(s,encoding='utf-8')
write('apps/web/src/app/onboarding/page.tsx','''"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence,motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useProfileStore } from "@/store/useProfileStore";
import { useCharacterStore } from "@/store/useCharacterStore";
export default function OnboardingPage(){
 const router=useRouter(),{load:loadProfile,save}=useProfileStore(),{load:loadCharacters,select}=useCharacterStore();
 const [step,setStep]=useState(0),[nickname,setNickname]=useState(''),[companion,setCompanion]=useState('preset_ling'),[saving,setSaving]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true;Promise.all([loadProfile(),loadCharacters()]).then(([p])=>{if(alive&&p.onboarded)router.replace('/')}).catch(()=>{if(alive)setError('暂时无法连接服务。请确认后端运行后重试。')});return()=>{alive=false}},[loadProfile,loadCharacters,router]);
 async function finish(destination:string){setSaving(true);setError('');try{await save({nickname:nickname.trim(),onboarded:true,companion_id:companion});select(companion);router.replace(destination)}catch{setError('保存未完成，你填写的内容已保留，请重试。')}finally{setSaving(false)}}
 return <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.05fr_1fr]">
 <section className="relative hidden min-h-screen overflow-hidden bg-[#1c2835] lg:block" aria-label="角色插画"><img src="/assets/characters/ling-portrait.png" alt="灵，身着深蓝外套的黑发角色" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"/><div className="absolute inset-0 bg-gradient-to-t from-[#0f1725] via-[#0f1725]/10 to-transparent"/><Link href="/stories" className="absolute left-12 top-10 flex items-center gap-3 text-lg font-semibold"><img src="/icon.svg" alt="" className="h-10 w-10"/>MIRAI 灵境</Link><div className="absolute inset-x-12 bottom-14"><p className="mb-3 text-sm text-white/65">角色陪伴与平行人生</p><h1 className="font-display text-4xl leading-relaxed">相遇，从你的选择开始。</h1><p className="mt-5 max-w-md text-sm leading-7 text-white/65">在熟悉的故事里成为另一个自己，也在日常的对话中，留下属于你的记忆。</p></div></section>
 <section className="flex min-h-screen flex-col px-6 py-8 sm:px-14 lg:px-16"><header className="flex items-center justify-between"><Link href="/stories" className="text-sm text-white/60 lg:invisible">MIRAI 灵境</Link><a className="text-xs text-[#b6a6df]" href="/development-progress.html">查看开发进度</a></header>
 <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12"><div className="mb-10 flex gap-2" aria-label={`引导步骤 ${step+1}/3`}>{[0,1,2].map(i=><span key={i} className={`h-1 w-10 rounded-full ${i<=step?'bg-[#b6a6df]':'bg-white/10'}`}/>)}</div>
 <AnimatePresence mode="wait"><motion.div key={step} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}}>
 {step===0&&<><p className="mb-4 text-sm text-[#b6a6df]">欢迎来到灵境</p><h2 className="text-3xl font-semibold leading-snug">故事里的下一页，<br/>由你来写。</h2><p className="mt-6 text-sm leading-8 text-[#9faec2]">选择人物进入小说世界，经历相遇、抉择与不同的结局。也可以创建自己的伙伴，慢慢建立共同的记忆。</p><div className="my-8 divide-y divide-white/10"><p className="py-4 text-sm"><i aria-hidden="true" className="fa-solid fa-book-open mr-4 text-[#b6a6df]"/>探索多路线互动故事</p><p className="py-4 text-sm"><i aria-hidden="true" className="fa-solid fa-user-group mr-4 text-[#b6a6df]"/>创建你的人物与陪伴关系</p><p className="py-4 text-sm"><i aria-hidden="true" className="fa-solid fa-bookmark mr-4 text-[#b6a6df]"/>回看经历，收藏命运卡</p></div><Button size="lg" className="w-full" onClick={()=>setStep(1)}>开始设置</Button><Link href="/stories" className="mt-5 block text-center text-sm text-white/50">先看看故事书库</Link></>}
 {step===1&&<><h2 className="text-3xl font-semibold">希望怎么称呼你？</h2><p className="my-5 text-sm leading-7 text-[#9faec2]">这里的昵称用于界面称呼。进入不同故事时，你还可以选择新的身份。</p><label className="mb-2 block text-sm" htmlFor="nickname">你的昵称</label><input id="nickname" autoFocus value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={20} onKeyDown={e=>{if(e.key==='Enter'&&nickname.trim())setStep(2)}} placeholder="输入昵称" className="h-14 w-full rounded-xl border border-[#344058] bg-[#182231] px-4 text-lg"/><div className="mt-8 flex gap-3"><Button variant="ghost" onClick={()=>setStep(0)}>返回</Button><Button size="lg" className="flex-1" disabled={!nickname.trim()} onClick={()=>setStep(2)}>继续</Button></div></>}
 {step===2&&<><h2 className="text-3xl font-semibold">选择第一位伙伴</h2><p className="my-5 text-sm leading-7 text-[#9faec2]">{nickname}，从一次简单的相遇开始。之后可以在人物工作室创建自己的角色。</p><div role="radiogroup" aria-label="选择伙伴" className="grid gap-3">{[{id:'preset_ling',name:'灵',description:'温柔、敏锐，擅长倾听。'},{id:'preset_xiaoman',name:'小满',description:'元气、直率，喜欢分享日常。'}].map(c=><button role="radio" aria-checked={companion===c.id} key={c.id} onClick={()=>setCompanion(c.id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left ${companion===c.id?'border-[#b6a6df] bg-[#28324a]':'border-[#344058] bg-[#182231]'}`}>{c.id==='preset_ling'?<img src="/assets/characters/ling-portrait.png" alt="" className="h-16 w-16 rounded-xl object-cover"/>:<span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#334152] text-2xl">满</span>}<span className="flex-1"><strong className="block font-medium">{c.name}</strong><span className="mt-1 block text-xs text-[#9faec2]">{c.description}</span></span><i aria-hidden="true" className={`fa-regular ${companion===c.id?'fa-circle-check':'fa-circle'} text-[#b6a6df]`}/></button>)}</div><div className="mt-8 grid gap-3"><Button size="lg" disabled={saving} onClick={()=>void finish('/stories')}>{saving?'正在保存…':'进入故事书库'}</Button><Button variant="glass" disabled={saving} onClick={()=>void finish('/')}>先与伙伴聊天</Button><Button variant="ghost" disabled={saving} onClick={()=>setStep(1)}>返回</Button></div></>}
 </motion.div></AnimatePresence>{error&&<div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-300/5 p-4 text-sm leading-6 text-red-200">{error}<button className="ml-2 underline" onClick={()=>window.location.reload()}>重新连接</button></div>}</div>
 <footer className="mx-auto max-w-md text-xs leading-6 text-[#75859b]">开发体验版 · AI角色是虚构人物，不代表真实人格或情感。产品不提供心理诊断与治疗；正式实名及年龄核验尚未接通。</footer>
 </section></div>
}
''')
print('Design system, shell, accessible modal and onboarding updated')
