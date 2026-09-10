"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export interface WorldItem {
  id: string;
  title: string;
  author: string;
  cover?: string; // 真上线后用渐变占位
  blurb: string;
  genres: string[];
  access: "try" | "free" | "paid" | "complete" | "serial";
  rating: number;
  plays: number;
  words: number;
  minutes: number;
  endingType?: "HE" | "BE" | "NE" | "TE" | "HIDDEN";
  source: "official" | "creator" | "ai" | "public";
}

interface Props {
  item: WorldItem;
  color?: string;
}

/**
 * 作品卡：放进 22 题材目录主区。
 * 视觉：1:1 封面 + 题材标签 + 标题 + 一行作者 + 评分 + 状态徽章。
 * 状态有 "试读/免费/付费/完结/连载 + HE/BE/NE/TE/HIDDEN"。
 */
export function WorldCard({ item, color = "#8b7cf6" }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <Link href={`/worlds/item/${item.id}`} aria-label={`查看《${item.title}》详情`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
        {/* 封面区：占位渐变 + 标题 */}
        <div
          className="relative aspect-[3/4] overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${color}66 0%, ${color}22 60%, #0d0b22 100%)`,
          }}
        >
          <div className="absolute inset-0 flex items-end justify-between p-3">
            <div className="flex flex-wrap gap-1">
              {item.genres.slice(0, 2).map((g) => (
                <span key={g} className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] backdrop-blur">
                  {g}
                </span>
              ))}
            </div>
            {item.endingType && <span className="rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">{item.endingType}</span>}
          </div>
          <div className="absolute bottom-12 left-3 right-3 line-clamp-2 text-balance font-display text-base font-semibold leading-tight text-white drop-shadow-md">
            {item.title}
          </div>
        </div>

        {/* 元信息 */}
        <div className="space-y-1.5 p-3">
          <p className="line-clamp-2 text-xs leading-relaxed text-white/55">{item.blurb}</p>
          <p className="text-[11px] text-white/40">@ {item.author}</p>
          <div className="flex items-center justify-between text-[10px] text-white/55">
            <span className="flex items-center gap-1">
              <i aria-hidden="true" className="fa-solid fa-star text-amber-300" />
              {item.rating.toFixed(1)}
              <span className="ml-1 text-white/35">· {formatPlays(item.plays)} 游玩</span>
            </span>
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-white/70">
              {accessLabel(item.access)}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function formatPlays(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function accessLabel(a: WorldItem["access"]): string {
  switch (a) {
    case "try": return "试读";
    case "free": return "免费";
    case "paid": return "付费";
    case "complete": return "完结";
    case "serial": return "连载";
  }
}
</content>
</invoke>