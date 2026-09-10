"use client";

import Link from "next/link";

const ITEMS = [
  {
    icon: "fa-file-shield",
    title: "隐私政策",
    desc: "我们如何收集、存储与处理你的对话、记忆与情感数据。",
    href: "/legal/privacy",
    updated: "2026-08-15",
  },
  {
    icon: "fa-handshake",
    title: "用户协议",
    desc: "你与灵境之间的权利、义务与边界，包括虚拟物品、订阅、退款。",
    href: "/legal/terms",
    updated: "2026-08-15",
  },
  {
    icon: "fa-id-card",
    title: "实名认证说明",
    desc: "为什么我们要求实名、怎么认证、用在了哪里、不收任何费用。",
    href: "/legal/realname",
    updated: "2026-08-20",
  },
  {
    icon: "fa-user-shield",
    title: "未成年人保护政策",
    desc: "18 岁以下无法注册的承诺、监护人模式、限玩机制、家长直通车。",
    href: "/legal/minors",
    updated: "2026-08-20",
  },
  {
    icon: "fa-brain",
    title: "AI 心理陪伴安全声明",
    desc: "我们不是心理咨询师、不做临床诊断、紧急情况下我们该怎么办。",
    href: "/legal/ai-safety",
    updated: "2026-08-22",
  },
  {
    icon: "fa-triangle-exclamation",
    title: "自伤 / 紧急援助",
    desc: "如你或身边的人正处于危机中，请优先联系下列热线。",
    href: "/legal/emergency",
    updated: "2026-09-01",
  },
  {
    icon: "fa-people-arrows",
    title: "作品举报与申诉",
    desc: "如何举报违规内容、创作者如何申诉、对违规的处置流程。",
    href: "/legal/report",
    updated: "2026-09-01",
  },
  {
    icon: "fa-coins",
    title: "退款与充值规则",
    desc: "虚拟物品不退、订阅可取消、未成年人误充如何处理。",
    href: "/legal/refund",
    updated: "2026-09-01",
  },
  {
    icon: "fa-copyright",
    title: "版权与二创指南",
    desc: "你的版权我们不收、平台上传的协议、第三方授权、二次创作的边界。",
    href: "/legal/copyright",
    updated: "2026-09-01",
  },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 text-white md:px-10 md:py-16">
      <header className="mb-8">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/55">Legal Center</p>
        <h1 className="font-display text-4xl font-bold">法律与安全</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/65">
          灵境是一款情感陪伴 + 互动叙事产品。我们对法律与心理安全保持非常高的门槛——所有文案都在等法务正式核验前为草稿状态。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06]"
          >
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-aurora-violet/15 text-aurora-violet">
              <i aria-hidden="true" className={`fa-solid ${it.icon}`} />
            </div>
            <h3 className="font-display text-base">{it.title}</h3>
            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/55">{it.desc}</p>
            <p className="mt-3 text-[10px] text-white/35">最近更新 · {it.updated}</p>
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6">
        <p className="flex items-start gap-3 text-xs leading-relaxed text-amber-100/85">
          <i aria-hidden="true" className="fa-solid fa-circle-info mt-0.5 text-amber-300" />
          <span>
            本页所有链接的内容仍为<strong className="font-semibold"> 草稿状态 </strong>，
            在法务正式核验完成前不得以上线版本使用。
            <Link href="/legal/audit" className="ml-1 underline">查看审核进度</Link>。
          </span>
        </p>
      </section>
    </div>
  );
}
</content>
</invoke>