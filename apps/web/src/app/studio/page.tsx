"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const LAYOUT = [
  { side: "left", title: "世界大纲", items: ["世界观设定 · 势力 · 时代", "人物 · 场景 · 道具", "章节大纲 · 关键抉择", "AI 自动续写提示"] },
  { side: "middle", title: "正文编辑", items: ["所见即所得 Markdown", "AI 续写 · 重写 · 润色", "自动保存 + 历史回滚", "版本对比"] },
  { side: "right", title: "状态 & 审核", items: ["多维属性（智慧/勇气/魅力/力量）", "关系值 / 命运卡", "UGC 审核状态", "试玩数据"] },
];

const STEPS = [
  { icon: "fa-magic-wand-sparkles", t: "一句话生成世界", d: "输入「我想要一个在下雨天东京咖啡馆发生的悬疑故事」，AI 会生成完整的世界 DNA、剧本大纲和主要角色。" },
  { icon: "fa-list-check", t: "三栏可视化编辑", d: "左侧大纲、中间正文、右侧状态——所见即所得，不需要懂 AI。" },
  { icon: "fa-arrow-rotate", t: "AI 辅助续写", d: "选中一段文字，让 AI 续写、改写、润色；不满意随时 Reject。" },
  { icon: "fa-cloud-arrow-up", t: "发布到世界", d: "一键发布到小说世界，进入试玩期。命中合规检查后才正式上架。" },
];

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 text-white md:px-10 md:py-14">
      <header className="mb-10">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-aurora-mint/80">Creator Studio</p>
        <h1 className="font-display text-4xl font-bold md:text-5xl">把脑海里的故事，<span className="text-gradient">写成一个世界</span></h1>
        <p className="mt-4 max-w-2xl text-base text-white/65">
          创作中心是创作者的工作台：左边搭世界观，右边写正文，右侧看角色与命运。
        </p>
      </header>

      {/* 三栏编辑器示意 */}
      <section className="mb-12 grid gap-4 lg:grid-cols-3">
        {LAYOUT.map((p, i) => (
          <motion.article
            key={p.side}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
              {p.side === "left" ? "侧栏 · 大纲" : p.side === "middle" ? "主区 · 正文" : "侧栏 · 状态"}
            </p>
            <h3 className="mt-2 mb-4 font-display text-xl">{p.title}</h3>
            <ul className="space-y-2 text-sm text-white/65">
              {p.items.map((it) => (
                <li key={it} className="flex items-start gap-2">
                  <i aria-hidden="true" className="fa-solid fa-check text-aurora-mint mt-1 text-xs" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </section>

      {/* 4 步流程 */}
      <section className="mb-10">
        <h2 className="mb-6 font-display text-2xl">创作流程 · 4 步</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-5">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-aurora-mint/15 text-aurora-mint">
                <i aria-hidden="true" className={`fa-solid ${s.icon}`} />
              </div>
              <p className="text-xs text-white/45">第 {i + 1} 步</p>
              <h3 className="mt-1 text-base">{s.t}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 状态栏 */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <h2 className="font-display text-xl">创作者等级</h2>
        <p className="mt-2 text-sm text-white/60">
          根据作品游玩量与评分晋级。等级越高，可发布的内容越多，平台分润比例越高。
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { l: "L1 青铜", c: "可发布 1 个世界", p: "30% 分润" },
            { l: "L2 白银", c: "可发布 3 个", p: "40% 分润" },
            { l: "L3 黄金", c: "可发布 10 个", p: "50% 分润" },
            { l: "L4 钻石", c: "无限发布", p: "60% 分润" },
            { l: "L5 传奇", c: "邀请制", p: "70% 分润" },
          ].map((t) => (
            <div key={t.l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-display text-sm">{t.l}</p>
              <p className="mt-1 text-xs text-white/55">{t.c}</p>
              <p className="mt-1 text-xs text-aurora-gold">{t.p}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/worlds" className="rounded-xl bg-aurora-mint px-5 py-3 text-sm font-medium text-night-950 hover:bg-aurora-mint/90">
          进入小说世界看看别人怎么写
        </Link>
        <button className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm hover:bg-white/[0.1]" type="button">
          一句话生成新世界（演示）
        </button>
      </div>
    </div>
  );
}
</content>
</invoke>