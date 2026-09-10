"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CharacterStage } from "@/components/stage/CharacterStage";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useCharacterStore } from "@/store/useCharacterStore";
import { useChatStore } from "@/store/useChatStore";
import { useProfileStore } from "@/store/useProfileStore";
import { GENRES } from "@/lib/genres";

export default function HomePage() {
  const router = useRouter();
  const { characters, selectedId, selected, load } = useCharacterStore();
  const { nickname, onboarded, loaded: profileLoaded, load: loadProfile } = useProfileStore();
  const messagesByCharacter = useChatStore((s) => s.messagesByCharacter);
  const lastExpression = [...(messagesByCharacter[selectedId] ?? [])]
    .reverse()
    .find((m) => m.role === "character")?.expression;
  const lastAnimation = [...(messagesByCharacter[selectedId] ?? [])]
    .reverse()
    .find((m) => m.role === "character")?.animation;

  useEffect(() => {
    load();
    loadProfile();
  }, [load, loadProfile]);

  useEffect(() => {
    if (profileLoaded && !onboarded) router.replace("/onboarding");
  }, [profileLoaded, onboarded, router]);

  if (!onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/30">
        <i className="fa-solid fa-spinner fa-spin mr-2" /> 正在进入灵境…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col p-4 md:p-6">
      {/* 顶部品牌 + 入口 */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-end justify-between"
      >
        <div>
          <p className="font-brand text-sm tracking-[0.3em] text-aurora-violet/80">MIRAI · 灵境</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">
            <span className="text-gradient">{nickname || "我"}</span>的世界
          </h1>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/worlds"
            className="rounded-xl bg-aurora-violet px-4 py-2 text-sm font-medium text-night-950 shadow-glow hover:bg-aurora-violet/90"
          >
            <i aria-hidden="true" className="fa-solid fa-book-open mr-2" />
            进入小说世界
          </Link>
          <Link
            href="/companions"
            className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-sm backdrop-blur hover:bg-white/[0.1]"
          >
            <i aria-hidden="true" className="fa-solid fa-user-group mr-2" />
            双生陪伴
          </Link>
        </div>
        <div className="hidden items-center gap-2 text-[11px] text-white/35 md:flex">
          <i className="fa-solid fa-shield-halved text-aurora-mint" />
          开发体验版 · AI虚构角色
        </div>
      </motion.header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(340px,5fr)_minmax(380px,7fr)]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="min-h-[340px] lg:min-h-0"
        >
          <CharacterStage character={selected()} expression={lastExpression} animation={lastAnimation} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.16 }}
          className="min-h-[520px] lg:min-h-0"
        >
          <ChatPanel />
        </motion.div>
      </div>

      {/* 22 题材快捷入口条 */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        aria-label="22 题材快捷入口"
        className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur"
      >
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/45">Quick Genres · 22 类</p>
            <p className="text-xs text-white/55">从三国到赛博，22 类题材一键进入</p>
          </div>
          <Link href="/worlds" className="text-xs text-aurora-violet hover:underline">
            看全部 →
          </Link>
        </div>
        <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
          {GENRES.slice(0, 12).map((g) => (
            <Link
              key={g.slug}
              href={`/worlds/${g.slug}`}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs transition hover:-translate-y-0.5 hover:border-white/25"
              style={{ background: `linear-gradient(135deg, ${g.color}25, transparent)` }}
            >
              <i aria-hidden="true" className={`fa-solid ${iconSlug(g.icon)} text-base`} style={{ color: g.color }} />
              <span className="text-white/85">{g.name}</span>
            </Link>
          ))}
        </div>
      </motion.section>

      {characters.length === 0 && (
        <p className="mt-4 text-center text-xs text-white/30">
          <i className="fa-solid fa-spinner fa-spin mr-1" />
          正在连接服务，请稍候；若持续无响应，请刷新重试。
        </p>
      )}
    </div>
  );
}

function iconSlug(icon: string): string {
  switch (icon) {
    case "scroll-old": return "fa-scroll-torah";
    case "heart-three": return "fa-heart-half-stroke";
    case "more": return "fa-ellipsis";
    default: return `fa-${icon}`;
  }
}
</content>
</invoke>