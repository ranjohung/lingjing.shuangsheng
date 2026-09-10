"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { getCharacters, type Character } from "@/lib/api";
import { storyRequest, type Story, type StorySession, type Destiny } from "@/lib/story-api";

const action = "rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed";
const field = "w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white";
const names: Record<string, string> = { wisdom: "智慧", courage: "勇气", charm: "魅力", strength: "力量" };
const routeNames: Record<string, string> = { power: "霸主之路", bond: "情义之路" };

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [sessions, setSessions] = useState<StorySession[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [session, setSession] = useState<StorySession | null>(null);
  const [mode, setMode] = useState("canonical");
  const [name, setName] = useState("");
  const [background, setBackground] = useState("");
  const [character, setCharacter] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [card, setCard] = useState<Destiny | null>(null);
  const [selected, setSelected] = useState<Story | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const [catalog, records, people] = await Promise.all([storyRequest<Story[]>("stories"), storyRequest<StorySession[]>("story-sessions"), getCharacters()]);
      setStories(catalog); setSessions(records); setCharacters(people.filter(c => !c.is_preset));
    } catch (e) { setError(e instanceof Error ? e.message : "无法连接服务，请重试"); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function run(fn: () => Promise<void>) {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "操作失败，请重试"); }
    finally { setBusy(false); }
  }
  async function update(path: string, body?: unknown) {
    const next = await storyRequest<StorySession>(path, body);
    setSession(next); setCard(null);
    setSessions(previous => [next, ...previous.filter(s => s.id !== next.id)]);
  }
  async function downloadCard() {
    if (!card) return;
    const canvas = document.createElement("canvas"); canvas.width = 900; canvas.height = 1200;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("浏览器暂不支持图片导出");
    ctx.fillStyle = "#171327"; ctx.fillRect(0, 0, 900, 1200);
    ctx.strokeStyle = "#ad98de"; ctx.strokeRect(35, 35, 830, 1130);
    let y = 100;
    function line(text: string, size: number, color = "#f4edf9") {
      ctx!.font = `${size}px sans-serif`; ctx!.fillStyle = color;
      let row = "";
      for (const char of text) {
        if (ctx!.measureText(row + char).width > 740) { ctx!.fillText(row, 80, y); y += size * 1.7; row = ""; }
        row += char;
      }
      ctx!.fillText(row, 80, y); y += size * 1.7 + 20;
    }
    line("MIRAI / 命运卡", 24, "#c9b5ef"); line(card.story_title, 32);
    line(`${card.character_name} · ${card.route}`, 26); line(`${card.ending.type} / ${card.ending.title}`, 40);
    line(card.ending.description, 24); card.key_choices.forEach((choice, i) => line(`${i + 1}. ${choice}`, 22));
    ctx.fillStyle = "#c9b5ef"; ctx.font = "22px sans-serif"; ctx.fillText(card.watermark, 80, 1120);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("图片生成失败")), "image/png"));
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "MIRAI-命运卡.png"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="mx-auto max-w-6xl px-5 py-10 text-white md:px-10">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-xs tracking-[0.25em] text-purple-300">MIRAI · 平行人生</p><h1 className="text-3xl font-semibold">{session ? session.story_title : "活进你喜欢的故事里"}</h1><p className="mt-3 text-sm text-white/55">阅读、相遇、抉择，让每一段经历留下回响。</p></div>
      {session && <button className={action} disabled={busy} onClick={() => { setSession(null); setCard(null); setSelected(null); }}>返回故事库</button>}
    </header>
    <p className="mb-6 rounded-xl border border-amber-300/20 bg-amber-200/5 px-4 py-3 text-xs leading-6 text-amber-100/80">开发试玩：吕布篇为原创分支改编稿，部分情节偏离原著。{session && session.storage_mode !== "development_memory" ? "当前游玩记录已写入数据库。" : "未配置故事数据库时，进度只在本次后端运行期间保留，服务重启后会丢失。"}</p>
    {error && <div role="alert" className="mb-5 flex flex-wrap gap-3 rounded-xl bg-red-400/10 p-4 text-sm text-red-200">{error}<button className="underline" disabled={busy} onClick={() => void (session ? run(() => update(`story-sessions/${session.id}`)) : load())}>刷新重试</button></div>}
    {loading && <p role="status">正在打开故事库…</p>}
    {!loading && !session && <>
      <div className="grid gap-5 md:grid-cols-3">{stories.map((s, i) => <article key={s.id} className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6">
        <span className="mb-8 text-5xl text-purple-200/40">0{i + 1}</span><p className="mb-2 text-xs text-purple-200">{s.playable ? "可试玩 · 作者开发稿" : "剧本筹备中"}</p><h2 className="text-xl">{s.title}</h2><p className="my-4 flex-1 text-sm leading-7 text-white/55">{s.description}</p><p className="mb-5 text-xs text-white/50">{s.chapter_count}章 · 每路线{s.path_choices}次选择 · {s.ending_count}种结局{s.playable ? "" : "（目标）"}</p><button disabled={!s.playable || busy} className={action} onClick={() => { setError(""); setSelected(s); }}>{s.playable ? "选择入世身份" : "尚未开放"}</button>
      </article>)}</div>
      {selected && <Modal open={!!selected} onClose={() => { if (!busy) setSelected(null); }} title="你将以怎样的身份入世？"><p className="my-3 text-sm leading-7 text-white/55">本篇开放吕布视角。自建人物将作为平行世界中的替身，继承吕布的军务和人际处境；背景保留在人物档案中，当前剧本沿用同一事件结构。</p>
        <label className="mb-4 block">入世方式<select aria-label="入世方式" className={`${field} mt-2`} value={mode} onChange={e => setMode(e.target.value)}><option className="bg-slate-900" value="canonical">扮演原著人物 · 吕布</option><option className="bg-slate-900" value="custom">创建本次故事人物</option><option className="bg-slate-900" value="character">选择已有自建人物</option></select></label>
        {mode === "custom" && <div className="mb-4 grid gap-4"><label>人物姓名<input aria-label="人物姓名" className={`${field} mt-2`} maxLength={20} value={name} onChange={e => setName(e.target.value)} /></label><label>入世背景<textarea aria-label="入世背景" className={`${field} mt-2`} maxLength={500} value={background} onChange={e => setBackground(e.target.value)} placeholder="你如何来到这个平行世界？" /></label></div>}
        {mode === "character" && <label className="mb-4 block">已有自建人物<select aria-label="已有自建人物" className={`${field} mt-2`} value={character} onChange={e => setCharacter(e.target.value)}><option className="bg-slate-900" value="">请选择人物</option>{characters.map(c => <option className="bg-slate-900" key={c.id} value={c.id}>{c.name}</option>)}</select>{!characters.length && <Link className="mt-3 inline-block text-purple-200 underline" href="/characters">先去创建一位人物</Link>}</label>}
        <button className={action} disabled={busy || (mode === "custom" && (!name.trim() || !background.trim())) || (mode === "character" && !character)} onClick={() => void run(async () => { await update("story-sessions", { story_id: selected.id, identity_mode: mode, name, background, character_id: character || null }); setSelected(null); })}>{busy ? "正在入世…" : "开始这一世"}</button>
        {error && <p role="alert" className="mt-4 text-sm text-red-200">{error}</p>}
      </Modal>}
      <section className="mt-10"><h2 className="mb-4 text-xl">本次运行中的人生记录</h2>{!sessions.length && <p className="text-sm text-white/40">还没有游玩记录，选择一部故事开始。</p>}<div className="grid gap-3">{sessions.map(s => <button disabled={busy} key={s.id} className={`${action} text-left`} onClick={() => void run(() => update(`story-sessions/${s.id}`))}>{s.identity.name} · {s.story_title}<span className="ml-4 text-white/50">{s.completed_choices}/{s.total_choices} · {s.ending?.title ?? "继续故事"}</span></button>)}</div></section>
    </>}
    {session && <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <section aria-live="polite" className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-9">
        <div className="mb-5 flex justify-between gap-4 text-xs text-purple-200"><span>{session.node?.chapter_title ?? "终章 · 命运落定"}</span><span>{session.completed_choices}/{session.total_choices} 次选择</span></div><progress aria-label="故事进度" className="mb-8 h-1 w-full accent-purple-300" value={session.completed_choices} max={session.total_choices} />
        {session.node && <><p className="mb-4 text-xs text-white/40">{session.node.location} · 与{session.node.npc}相遇</p><h2 className="mb-6 text-2xl">{session.node.title}</h2><p className="mb-10 text-lg leading-9 text-white/80">{session.node.text}</p><div className="grid gap-3">{session.node.options.map((o, i) => <button disabled={busy} className={`${action} py-4 text-left`} key={o.id} onClick={() => void run(() => update(`story-sessions/${session.id}/choices`, { choice_id: session.node!.id, option_id: o.id, expected_revision: session.revision }))}><span className="mr-4 text-purple-200">{String.fromCharCode(65+i)}</span>{o.text}</button>)}</div></>}
        {session.ending && <><p className="mb-4 text-purple-200">{session.ending.type}{session.ending.hidden ? " · 隐藏结局已解锁" : ""}</p><h2 className="mb-6 text-3xl">{session.ending.title}</h2><p className="mb-8 text-lg leading-9 text-white/80">{session.ending.description}</p><button disabled={busy} className={action} onClick={() => void run(async () => setCard(await storyRequest<Destiny>(`story-sessions/${session.id}/destiny`)))}>生成命运卡</button></>}
        {card && <article className="mt-6 rounded-2xl border border-purple-300/30 p-6" aria-label="命运卡"><h3 className="text-xl">{card.character_name} · {card.ending.title}</h3><ul className="my-4 space-y-3 text-sm text-white/60">{card.key_choices.map((c, i) => <li key={i}>{c}</li>)}</ul><p className="mb-4 text-xs text-purple-200">{card.watermark} · 仅自己可见</p><button className={action} disabled={busy} onClick={() => void run(downloadCard)}>下载命运卡图片</button></article>}
        {session.history.length > 0 && <details className="mt-8 border-t border-white/10 pt-5"><summary className="cursor-pointer text-sm text-white/60">回看与回溯 · {session.history.length}段经历</summary><p className="mt-3 text-xs text-white/40">回到某次选择前，会撤销该次及之后的属性、关系和路线变化。</p><ol className="mt-4 space-y-4">{session.history.map((event, i) => <li key={`${event.choice_id}-${i}`} className="flex items-center justify-between gap-3 text-sm"><span><span className="text-white/40">{i+1}. {event.title}</span><br />{event.text}</span><button className={action} disabled={busy} onClick={() => void run(() => update(`story-sessions/${session.id}/rewind`, { target_count: i, expected_revision: session.revision }))}>回到选择前</button></li>)}</ol></details>}
      </section>
      <aside className="space-y-5"><section className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs text-white/40">此世身份</p><h2 className="my-2 text-xl">{session.identity.name}</h2><p className="break-words text-sm leading-6 text-white/50">{session.identity.background}</p><p className="mt-4 text-sm text-purple-200">{session.state.route ? routeNames[session.state.route] : "共通路线 · 命运未定"}</p></section><section className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="mb-4 text-sm">人物状态</h3>{Object.entries(session.state.attributes).map(([key, value]) => <div className="mb-3" key={key}><p className="mb-1 flex justify-between text-xs text-white/60"><span>{names[key] ?? key}</span><span>{value}</span></p><progress aria-label={names[key] ?? key} className="h-1 w-full accent-purple-300" value={value} max={100} /></div>)}</section><section className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="mb-4 text-sm">此世人物关系</h3>{Object.entries(session.state.relationships).map(([npc, value]) => <p className="mb-2 flex justify-between text-sm text-white/60" key={npc}><span>{npc}</span><span>{value}</span></p>)}{!Object.keys(session.state.relationships).length && <p className="text-xs text-white/40">关系将随着相遇逐渐展开。</p>}</section></aside>
    </div>}
  </div>;
}
