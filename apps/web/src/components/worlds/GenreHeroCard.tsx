"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { type Genre } from "@/lib/genres";

interface Props {
  genre: Genre;
  index: number;
}

/**
 * 单个主类大卡，22 个组件组成目录"封面墙"。
 * 视觉：用题材主色 35% 透明 + 渐变叠层 + icon + 名字 + 三条最高频子类 + 作品数。
 * 桌面 3 列 / 平板 2 列 / 手机 1 列。
 */
export function GenreHeroCard({ genre, index }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.03, 0.4) }}
      className="group relative overflow-hidden rounded-3xl"
    >
      <Link
        href={`/worlds/${genre.slug}`}
        aria-label={`进入 ${genre.name} 题材`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 120% at 0% 0%, ${genre.color}55 0%, ${genre.colorAlt}28 40%, transparent 75%)`,
          }}
        />
        <div className="relative flex h-44 flex-col justify-between border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/20 group-hover:bg-white/[0.07]">
          <div className="flex items-start justify-between">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ background: `${genre.color}33`, color: "#fff" }}
            >
              <i aria-hidden="true" className={`fa-solid fa-${iconFor(genre.icon)}`} />
            </div>
            <span className="rounded-full bg-black/30 px-2.5 py-1 text-[10px] tracking-wider text-white/70">
              {heatLabel(genre.heat)}
            </span>
          </div>

          <div>
            <h3 className="font-display text-2xl font-semibold leading-tight text-white">{genre.name}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{genre.blurb}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {genre.subs.slice(0, 3).map((s) => (
              <span
                key={s.slug}
                className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/65"
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function iconFor(icon: Genre["icon"]): string {
  switch (icon) {
    case "scroll": return "scroll";
    case "scroll-old": return "scroll-torah";
    case "cloud": return "cloud";
    case "sword": return "gavel";
    case "dragon": return "dragon";
    case "city": return "city";
    case "home": return "house";
    case "helmet": return "helmet-battle";
    case "rocket": return "rocket";
    case "biohazard": return "biohazard";
    case "search": return "magnifying-glass";
    case "ghost": return "ghost";
    case "heart": return "heart";
    case "fan": return "fan";
    case "sparkle": return "sparkles";
    case "backpack": return "bag-shopping";
    case "gamepad": return "gamepad";
    case "trophy": return "trophy";
    case "repeat": return "rotate";
    case "book": return "book";
    case "users": return "users";
    case "heart-three": return "heart-half-stroke";
    case "balloon": return "balloon";
    case "more": return "ellipsis";
    default: return "book";
  }
}

function heatLabel(h: number): string {
  if (h >= 90) return "热门";
  if (h >= 80) return "推荐";
  if (h >= 70) return "精选";
  return "新";
}
</content>
</invoke>