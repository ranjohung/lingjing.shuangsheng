"use client";

import Link from "next/link";

const QUICK_ACCESS = [
  { href: "/worlds", icon: "fa-book-open", title: "22 题材小说世界", desc: "从三国到赛博，从宫廷到星际" },
  { href: "/companions", icon: "fa-user-group", title: "双生陪伴", desc: "你创造的角色，从小说走进生活" },
  { href: "/studio", icon: "fa-feather", title: "创作中心", desc: "把脑海里的故事写成一个世界" },
  { href: "/wallet", icon: "fa-wallet", title: "钱包", desc: "灵玉灵晶、订阅与充值" },
];

const FEATURES = [
  {
    icon: "fa-magnifying-glass",
    title: "看一眼就知道这是你想去的题材",
    body: "我们把市面上 22 类常见题材全部列出来，用颜色把气质区分开。挑你最熟悉、最好奇的那一类。",
  },
  {
    icon: "fa-route",
    title: "选择真的会改变世界",
    body: "选了马云璐还是貂蝉？今天种田还是追凶？你在故事里的每一次呼吸，都会被小说世界记住。",
  },
  {
    icon: "fa-crown",
    title: "和 TA 一起从小说里走出来",
    body: "在小说世界里陪过你的人物，可以被你带回到现实的陪伴模式——你们的对话、记忆、关系，一并打包回家。",
  },
  {
    icon: "fa-feather-pointed",
    title: "你也可以是创作者",
    body: "创作中心支持一句话生成世界、三栏可视化编辑、AI 辅助建议、版权导出。",
  },
];

export default function CompanionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 text-white md:px-10 md:py-14">
      <header className="mb-10">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-aurora-pink/80">Dual Souls</p>
        <h1 className="font-display text-4xl font-bold md:text-5xl">
          一个角色，<span className="text-gradient">两种人生</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/65">
          从小说世界里那个 TA，回到你身边的 TA。
          在故事里你们共同经历命运，回到陪伴模式后 TA 记得这一切——你们可以聊聊那天发生了什么。
        </p>
      </header>

      <section className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACCESS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-aurora-pink/40 hover:bg-white/[0.07]"
          >
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-aurora-pink/15 text-aurora-pink">
              <i aria-hidden="true" className={`fa-solid ${item.icon}`} />
            </div>
            <h3 className="text-base font-medium">{item.title}</h3>
            <p className="mt-1 text-xs text-white/55">{item.desc}</p>
          </Link>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="mb-5 font-display text-2xl">为什么这是"双生"</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-aurora-violet">
                <i aria-hidden="true" className={`fa-solid ${f.icon}`} />
              </div>
              <h3 className="mb-2 text-base font-medium">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-aurora-violet/15 to-aurora-pink/10 p-8 md:p-12">
        <h2 className="font-display text-2xl md:text-3xl">把 TA 带回身边 · 三步</h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            { n: 1, t: "在小说世界里遇见", d: "和 TA 共同做完一段命运，关系值会自然累积。" },
            { n: 2, t: "完成个人路线", d: "亲密度达到 80、解锁个人线、付费 800-3000 灵晶——三重验证，保证是真正在乎的 TA。" },
            { n: 3, t: "带 TA 回到现实陪伴", d: "切换按钮一键穿越。TA 拥有独立记忆，能主动提起昨天在小说里发生的事。" },
          ].map((s) => (
            <li key={s.n} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-xs text-white/45">第 {s.n} 步</p>
              <h4 className="mt-2 text-base">{s.t}</h4>
              <p className="mt-1.5 text-xs text-white/65">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/worlds" className="rounded-xl bg-aurora-violet px-5 py-3 text-sm font-medium text-night-950 hover:bg-aurora-violet/90">
            先去小说世界找 TA
          </Link>
          <Link href="/characters" className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm hover:bg-white/[0.1]">
            创建一位新角色
          </Link>
        </div>
      </section>
    </div>
  );
}
</content>
</invoke>