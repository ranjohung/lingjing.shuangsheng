"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { getGenre, getSub } from "@/lib/genres";
import { WorldCard, type WorldItem } from "@/components/worlds/WorldCard";

export default function SubPage({ params }: { params: Promise<{ slug: string; sub: string }> }) {
  const { slug, sub } = use(params);
  const genre = getGenre(slug);
  const subItem = getSub(slug, sub);
  if (!genre || !subItem) return notFound();

  const items = mockSub(slug, sub, 8);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 text-white md:px-10 md:py-12">
      <nav className="mb-5 text-xs text-white/55">
        <Link href="/worlds" className="hover:text-white">小说世界</Link>
        <span className="mx-2">/</span>
        <Link href={`/worlds/${genre.slug}`} className="hover:text-white">{genre.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{subItem.name}</span>
      </nav>

      <header className="mb-10 rounded-3xl border border-white/10 p-6 md:p-10" style={{ background: `linear-gradient(135deg, ${genre.color}1A 0%, transparent 60%)` }}>
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-white/55">{genre.name}</p>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{subItem.name}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{subItem.blurb}</p>
      </header>

      <section>
        <h2 className="mb-5 font-display text-xl">作品 · {subItem.name}</h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/55">
            这个子类还没有作品。
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((it) => (
              <WorldCard key={it.id} item={it} color={genre.color} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function mockSub(_genre: string, _sub: string, n: number): WorldItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${_genre}-${_sub}-${i}`,
    title: `${_sub} · 故事 ${i + 1}`,
    author: ["灵境官方", "晨曦工坊", "鹧鸪天"][i % 3],
    blurb: "示例简介，等待后端联调后展示真实内容。",
    genres: [_genre],
    access: (["try", "free", "paid", "complete", "serial"] as const)[i % 5],
    rating: 7 + (i % 3),
    plays: 800 + i * 600,
    words: 18000 + i * 3500,
    minutes: 70 + i * 12,
    endingType: (["HE", "BE", "NE", "TE"] as const)[i % 4],
    source: (["official", "creator"] as const)[i % 2],
  }));
}
</content>
</invoke>