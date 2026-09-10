"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";

export default function WorldItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  if (!id) return notFound();
  // 真实接入时根据 id 调后端；这里只渲染占位
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 text-white md:px-10 md:py-16">
      <nav className="mb-5 text-xs text-white/55">
        <Link href="/worlds" className="hover:text-white">小说世界</Link>
        <span className="mx-2">/</span>
        <span>作品 ID · {id}</span>
      </nav>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
          <i aria-hidden="true" className="fa-solid fa-circle-info" />
          作品详情页骨架 · 待后端联调
        </p>
        <h1 className="font-display text-3xl font-bold">作品详情</h1>
        <p className="mt-3 text-sm text-white/60">
          该页面在 MVP 第二阶段接入。在这里会展示：封面大图、作者卡、简介、章节目录、试读、试玩按钮、评论区、命运卡画廊、关联推荐。
        </p>
        <Link href="/worlds" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-sm hover:bg-white/[0.1]">
          <i aria-hidden="true" className="fa-solid fa-arrow-left" /> 返回小说世界
        </Link>
      </div>
    </div>
  );
}
</content>
</invoke>