"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  GENRES,
  CROSS_TAGS,
  SOURCE_OPTIONS,
  RELATION_OPTIONS,
  ACCESS_OPTIONS,
  SORT_OPTIONS,
  type Genre,
} from "@/lib/genres";
import { GenreHeroCard } from "@/components/worlds/GenreHeroCard";
import { GenreChip } from "@/components/worlds/GenreChip";
import { WorldCard, type WorldItem } from "@/components/worlds/WorldCard";

/**
 * /worlds — 22 题材小说世界目录
 * 设计依据：docs/UI_DESIGN_GUIDE.md §UI-06.2
 *
 * 视图层：
 * 1. 顶部搜索 + 22 主类横滑
 * 2. 子类 Chip（当前选中主类）
 * 3. 跨类标签 Chip（穿越/重生/系统等）
 * 4. 排序 + 来源 + 关系 + 视觉 + 状态 多维筛选
 * 5. 题材封面墙（22 张 GenreHeroCard，3 列）
 * 6. 热门推荐 6 张 WorldCard（合集）
 *
 * 状态：受控筛选、空态、加载（mock 同步完成）
 */
export default function WorldsPage() {
  const reduce = useReducedMotion();
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [crossTags, setCrossTags] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [access, setAccess] = useState<string[]>([]);
  const [sort, setSort] = useState<string>("hot");
  const [q, setQ] = useState("");

  const activeGenre = useMemo<Genre | null>(
    () => (activeSlug === "all" ? null : GENRES.find((g) => g.slug === activeSlug) ?? null),
    [activeSlug],
  );

  // 子类随主类重置
  useEffect(() => {
    setActiveSub(null);
  }, [activeSlug]);

  // mock 推荐作品
  const hotPicks = useMemo<WorldItem[]>(() => mockHotPicks(activeSlug), [activeSlug]);
  const subs = activeGenre?.subs ?? [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 text-white md:px-10 md:py-12">
      {/* 顶部 Hero */}
      <header className="mb-8 md:mb-10">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-aurora-violet/80">
          Lingjing · Story Worlds
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
          进入<span className="text-gradient"> 你想活过 </span>的那个故事
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
          按市面上 22 类题材分门别类。从三国到赛博，从宫廷到星际——选择一个题材，挑一位角色，故事会以你的选择向前推进。
        </p>

        {/* 搜索 */}
        <div className="mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur focus-within:border-aurora-violet/60">
          <i aria-hidden="true" className="fa-solid fa-magnifying-glass text-white/45" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜作品 / 角色 / 题材（如：吕布 / 修仙 / 穿越）"
            aria-label="搜索作品、角色或题材"
            className="w-full bg-transparent text-sm placeholder:text-white/35 focus:outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="清空搜索" className="text-xs text-white/45 hover:text-white">
              清空
            </button>
          )}
        </div>
      </header>

      {/* 主类 Chip 横滑 */}
      <section aria-label="题材主类" className="mb-6">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
          <GenreChip
            label="全部"
            active={activeSlug === "all"}
            onClick={() => setActiveSlug("all")}
          />
          {GENRES.map((g) => (
            <GenreChip
              key={g.slug}
              label={g.name}
              active={activeSlug === g.slug}
              color={g.color}
              onClick={() => setActiveSlug(g.slug)}
            />
          ))}
        </div>
      </section>

      {/* 子类 Chip（仅选中具体主类时显示） */}
      {subs.length > 0 && (
        <section aria-label="子类" className="mb-6">
          <div className="-mx-5 flex flex-wrap gap-2 px-5 md:mx-0 md:px-0">
            <GenreChip label="全部子类" active={!activeSub} onClick={() => setActiveSub(null)} />
            {subs.map((s) => (
              <GenreChip
                key={s.slug}
                label={s.name}
                active={activeSub === s.slug}
                color={activeGenre?.color}
                onClick={() => setActiveSub(s.slug)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 跨类标签 */}
      <section aria-label="跨类标签" className="mb-6">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
          {CROSS_TAGS.map((t) => (
            <GenreChip
              key={t.slug}
              label={t.name}
              count={t.count}
              active={crossTags.includes(t.slug)}
              onClick={() =>
                setCrossTags((prev) =>
                  prev.includes(t.slug) ? prev.filter((x) => x !== t.slug) : [...prev, t.slug],
                )
              }
            />
          ))}
        </div>
      </section>

      {/* 筛选 + 排序 */}
      <section className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs">
        <FilterGroup
          label="来源"
          options={SOURCE_OPTIONS.map((o) => ({ slug: o.slug, label: o.name }))}
          selected={sources}
          onToggle={(s) =>
            setSources((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
          }
        />
        <FilterGroup
          label="状态"
          options={ACCESS_OPTIONS.map((o) => ({ slug: o.slug, label: o.name }))}
          selected={access}
          onToggle={(s) =>
            setAccess((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
          }
        />
        <FilterGroup
          label="关系"
          options={RELATION_OPTIONS.map((o) => ({ slug: o.slug, label: o.name }))}
          selected={[]}
          onToggle={() => {}}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-white/55">排序</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="排序"
            className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.slug} value={o.slug} className="bg-slate-900">
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 题材封面墙（22 张，仅在"全部"时显示） */}
      {activeSlug === "all" && (
        <section aria-labelledby="genres" className="mb-12">
          <h2 id="genres" className="mb-5 text-base font-medium tracking-wide text-white/75">
            22 主类 · 一眼纵览
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {GENRES.map((g, i) => (
              <GenreHeroCard key={g.slug} genre={g} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* 选中具体主类时显示 — 该类详情 + 作品列表 */}
      {activeGenre && (
        <section className="mb-10 rounded-3xl border border-white/10 p-6 md:p-8" style={{ background: `linear-gradient(135deg, ${activeGenre.color}1A 0%, transparent 60%)` }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/45">{activeGenre.audience} · 热度 {activeGenre.heat}</p>
              <h2 className="font-display text-3xl font-bold">{activeGenre.name}</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/65">{activeGenre.blurb}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-xl bg-aurora-violet px-5 py-2.5 text-sm font-medium text-night-950 transition hover:bg-aurora-violet/90">
                开始一段
              </button>
              <button className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm hover:bg-white/[0.1]">
                我想写一个 {activeGenre.name} 世界
              </button>
            </div>
          </div>
          {activeSub && (
            <p className="mt-4 text-xs text-white/55">
              当前子类：<span className="text-white">{activeGenre.subs.find((s) => s.slug === activeSub)?.name}</span> ·{" "}
              <span className="text-white/45">{activeGenre.subs.find((s) => s.slug === activeSub)?.blurb}</span>
            </p>
          )}
        </section>
      )}

      {/* 作品流（始终显示） */}
      <section aria-labelledby="works">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="works" className="font-display text-xl font-medium">
            {activeGenre ? `${activeGenre.name} · 推荐` : "热门推荐"}
          </h2>
          <button className="text-xs text-white/55 hover:text-white">查看全部 →</button>
        </div>
        {hotPicks.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {hotPicks.map((it) => (
              <WorldCard key={it.id} item={it} color={activeGenre?.color} />
            ))}
          </div>
        ) : (
          <EmptyState onClear={() => setCrossTags([])} />
        )}
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { slug: string; label: string }[];
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/55">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <GenreChip
            key={o.slug}
            label={o.label}
            active={selected.includes(o.slug)}
            onClick={() => onToggle(o.slug)}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white/[0.05] text-white/40">
        <i aria-hidden="true" className="fa-solid fa-feather" />
      </div>
      <p className="text-sm text-white/70">当前筛选下还没有作品。</p>
      <p className="mt-1 text-xs text-white/45">试着清空一些标签，或换一个题材。</p>
      <button
        onClick={onClear}
        className="mt-4 inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs hover:bg-white/[0.1]"
      >
        清空跨类筛选
      </button>
    </div>
  );
}

/**
 * Mock 推荐 — 用真实题材颜色 + 不同 access 状态演示视觉。
 * 真实接入时由后端 World OS / Story Library 推荐接口返回。
 */
function mockHotPicks(slug: string): WorldItem[] {
  if (slug !== "all" && slug !== "xianxia") return []; // 模拟"筛选较冷时无作品"的空态
  const items: WorldItem[] = [
    {
      id: "three-kingdoms-lvbu",
      title: "三国·吕布篇",
      author: "灵境官方",
      blurb: "你将以怎样的身份，重新走上那条不归路？",
      genres: ["历史", "战争"],
      access: "try",
      rating: 9.2,
      plays: 12_500,
      words: 38_000,
      minutes: 120,
      endingType: "BE",
      source: "public",
    },
    {
      id: "cultivation-rising",
      title: "凡人修仙：灵根凡，志不凡",
      author: "晨曦工坊",
      blurb: "散修无依，你靠的是一步一脚印的狠劲。",
      genres: ["仙侠"],
      access: "free",
      rating: 8.8,
      plays: 9_300,
      words: 26_000,
      minutes: 95,
      endingType: "HE",
      source: "creator",
    },
    {
      id: "kaiserkabin",
      title: "太后在上",
      author: "鹧鸪天",
      blurb: "深宫六院的规矩与真心。",
      genres: ["古代言情"],
      access: "paid",
      rating: 9.0,
      plays: 18_400,
      words: 64_000,
      minutes: 240,
      endingType: "TE",
      source: "creator",
    },
    {
      id: "cyber-rose",
      title: "赛博玫瑰",
      author: "蓝鸟工作室",
      blurb: "霓虹不夜城，每一条街道都是新的副本。",
      genres: ["赛博朋克", "科幻"],
      access: "complete",
      rating: 8.7,
      plays: 7_800,
      words: 41_000,
      minutes: 160,
      endingType: "NE",
      source: "official",
    },
    {
      id: "campus-jun",
      title: "同桌的你",
      author: "纸鸢文字",
      blurb: "教室窗外的蝉鸣，比谁都记得我们。",
      genres: ["青春校园"],
      access: "free",
      rating: 8.5,
      plays: 5_600,
      words: 18_000,
      minutes: 70,
      endingType: "HE",
      source: "creator",
    },
    {
      id: "mystery-case-7",
      title: "第七个访客",
      author: "无尘",
      blurb: "看似密室，却藏着十年心结。",
      genres: ["悬疑", "本格"],
      access: "paid",
      rating: 9.4,
      plays: 4_200,
      words: 22_000,
      minutes: 90,
      endingType: "TE",
      source: "creator",
    },
    {
      id: "isekai-revive",
      title: "我转生成了最强 NPC",
      author: "云起东方",
      blurb: "但我不想当主角，我只想种田。",
      genres: ["轻小说", "转生"],
      access: "serial",
      rating: 8.6,
      plays: 6_700,
      words: 32_000,
      minutes: 110,
      source: "creator",
    },
    {
      id: "magic-academy",
      title: "魔法学院的夜班",
      author: "灵境官方",
      blurb: "塔顶的灯永远不灭，因为总有人在等。",
      genres: ["奇幻", "校园"],
      access: "try",
      rating: 8.9,
      plays: 8_900,
      words: 28_000,
      minutes: 100,
      endingType: "HE",
      source: "official",
    },
    {
      id: "deep-blue",
      title: "深海四万米",
      author: "潜渊",
      blurb: "潜水器的舱门，从来不让回来的人拿到。",
      genres: ["末日", "科幻"],
      access: "paid",
      rating: 9.1,
      plays: 3_400,
      words: 30_000,
      minutes: 120,
      endingType: "BE",
      source: "creator",
    },
    {
      id: "mom-friend",
      title: "闺蜜三十岁",
      author: "听风",
      blurb: "十年前的约定，今年才算数。",
      genres: ["女性群像"],
      access: "free",
      rating: 8.4,
      plays: 2_900,
      words: 19_000,
      minutes: 75,
      endingType: "HE",
      source: "creator",
    },
  ];
  return items;
}
</content>
</invoke>