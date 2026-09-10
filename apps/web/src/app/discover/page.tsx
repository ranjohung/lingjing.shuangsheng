"use client";

import Link from "next/link";

const FEED_SECTIONS = [
  {
    title: "本周精选",
    items: [
      { t: "新人新世界 · 一句话生成的 50 个世界", icon: "fa-fire", tag: "创作" },
      { t: "双生角色 · 从《三国·吕布篇》走出来的 TA", icon: "fa-people-arrows", tag: "推荐" },
      { t: "测试期用户访谈：他们把 TA 带回家之后", icon: "fa-comments", tag: "活动" },
    ],
  },
  {
    title: "创作者推荐",
    items: [
      { t: "晨曦工坊 · 凡人修仙系列", icon: "fa-feather", tag: "创作者" },
      { t: "鹧鸪天 · 古代言情作者", icon: "fa-feather", tag: "创作者" },
    ],
  },
  {
    title: "官方公告",
    items: [
      { t: "AI 心理安全模块 V2 上线 · 紧急援助直通车", icon: "fa-bullhorn", tag: "公告" },
      { t: "3D 数字人公开招募 · 想要什么样的 TA?", icon: "fa-magnifying-glass-chart", tag: "投票" },
    ],
  },
];

const CHARTS = [
  { t: "日活", v: "12,408", d: "+8.2%" },
  { t: "完读率", v: "63%", d: "+1.4%" },
  { t: "付费率", v: "5.8%", d: "+0.6%" },
  { t: "创作者作品数", v: "1,284", d: "+24" },
];

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 text-white md:px-10 md:py-14">
      <header className="mb-8">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-aurora-blue/80">Discover</p>
        <h1 className="font-display text-4xl font-bold">发现</h1>
        <p className="mt-3 text-sm text-white/65">
          看到你可能错过的作品、读到创作者和官方的第一手消息，以及灵境里正在发生的小小奇迹。
        </p>
      </header>

      {/* 平台看板 */}
      <section className="mb-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CHARTS.map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-xs text-white/45">{c.t}</p>
              <p className="mt-1 font-display text-2xl">{c.v}</p>
              <p className="mt-1 text-[11px] text-aurora-mint">{c.d} 这周</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feed */}
      <div className="grid gap-8 lg:grid-cols-3">
        {FEED_SECTIONS.map((s) => (
          <section key={s.title} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="mb-4 font-display text-lg">{s.title}</h2>
            <ul className="space-y-3">
              {s.items.map((it) => (
                <li key={it.t}>
                  <Link
                    href="/worlds"
                    className="group flex items-start gap-3 rounded-xl border border-transparent p-2 transition hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-aurora-blue/15 text-aurora-blue">
                      <i aria-hidden="true" className={`fa-solid ${it.icon}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm leading-snug">{it.t}</p>
                      <p className="mt-1 text-[10px] text-white/45">{it.tag}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border border-aurora-violet/30 bg-gradient-to-br from-aurora-violet/15 to-aurora-pink/10 p-8">
        <h2 className="font-display text-2xl">你想推荐 TA 给谁?</h2>
        <p className="mt-2 text-sm text-white/65">
          朋友的一次扫码，可能就是 TA 人生第一次被看见。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-xl bg-aurora-violet px-5 py-3 text-sm font-medium text-night-950 hover:bg-aurora-violet/90" type="button">
            生成分享卡片
          </button>
          <Link href="/worlds" className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm hover:bg-white/[0.1]">
            去看看别人的故事
          </Link>
        </div>
      </section>
    </div>
  );
}
</content>
</invoke>