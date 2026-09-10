"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GENRES, getGenre } from "@/lib/genres";
import { WorldCard, type WorldItem } from "@/components/worlds/WorldCard";

export default function GenreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const genre = getGenre(slug);
  if (!genre) return notFound();

  const reduce = useReducedMotion();
  const items = mockForGenre(genre.slug);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 text-white md:px-10 md:py-12">
      {/* Hero */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 p-8 md:p-12"
        style={{
          background: `radial-gradient(120% 100% at 0% 0%, ${genre.color}40 0%, ${genre.colorAlt}20 40%, transparent 70%)`,
        }}
      >
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-white/60">
          Story Worlds / {genre.name}
        </p>
        <h1 className="font-display text-4xl font-bold md:text-6xl">{genre.name}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">{genre.blurb}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-xl px-5 py-3 text-sm font-semibold transition hover:scale-[1.02]" style={{ background: genre.color, color: "#0d0b22" }}>
            开始一段 {genre.name}
          </button>
          <Link href="/studio" className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm backdrop-blur hover:bg-white/[0.1]">
            我想写一个 {genre.name} 世界
          </Link>
        </div>
      </motion.section>

      {/* 子类导航 */}
      <section aria-label="子类" className="mb-10">
        <h2 className="mb-4 font-display text-base text-white/75">子类</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {genre.subs.map((s) => (
            <Link
              key={s.slug}
              href={`/worlds/${genre.slug}/${s.slug}`}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-3.5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07]"
            >
              <p className="mb-1 text-sm font-medium text-white">{s.name}</p>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-white/55">{s.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 作品流 */}
      <section aria-label="作品">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl">{genre.name} · 作品</h2>
          <button className="text-xs text-white/55 hover:text-white">查看全部 →</button>
        </div>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/55">
            这个题材还没有作品，先去 <Link href="/studio" className="text-aurora-violet underline">创作一个</Link>。
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

function mockForGenre(slug: string): WorldItem[] {
  // 给每个题材 6-10 张占位作品。真实接入时由后端。
  const base: WorldItem[] = [];
  const titles: Record<string, string[]> = {
    xuanhuan: ["灵主归来", "大唐遗卷", "剑破万域", "元灵之书", "九霄战仙"],
    xianxia: ["凡人修仙：灵根凡，志不凡", "天剑宗外门", "逍遥山河", "问道青云", "丹药师的日常"],
    wuxia: ["白马啸西风", "江湖夜雨十年灯", "剑指中原", "武林外传·新章"],
    qihuan: ["魔法学院的夜班", "龙与圣杯", "深渊的第八层"],
    dushi: ["北上广不下班", "创业第二年", "城市边缘", "邻居的猫", "总监的午后"],
    xianshi: ["巷尾的早餐铺", "妈妈在的城市", "老厂记忆"],
    lishi: ["三国·吕布篇", "锦衣卫日记", "正德皇帝下班", "末代状元"],
    junshi: ["太平洋上空的七分钟", "谍影重重第三部", "野战医院"],
    kehuan: ["赛博玫瑰", "深空四百年", "AI 觉醒纪元", "黑洞岸边"],
    mori: ["深海四万米", "废土便利店", "避难所 03"],
    xuanyi: ["第七个访客", "雨夜密室", "神探不在场证明"],
    jingsong: ["村的第七夜", "克苏鲁的早班"],
    "xiandai-yanqing": ["那个他", "假装不喜欢", "电梯里的第二次相遇"],
    "gudai-yanqing": ["太后在上", "后宫记事", "王妃的自我修养", "凤冠霞帔"],
    "huanxiang-yanqing": ["仙君你别想跑", "和妖的二三事", "星际女将军的逃家日常"],
    "qingchun-xiaoyuan": ["同桌的你", "高三那年", "校园广播站"],
    youxi: ["我转生成了最强 NPC", "全息公会", "电竞编年史"],
    tiyu: ["替补上场", "弯道赢家", "教练不在家"],
    "wuxian-liu": ["无限副本·灯塔", "诸天快递员", "快穿小夫妻"],
    qingxiaoshuo: ["我才不要转生呢", "异世界的便利店", "师父是冒牌货"],
    "nvxing-qunxiang": ["闺蜜三十岁", "她们的名字", "三个人的房间"],
    "duoyuan-qinggan": ["我们都没有错", "百合花开的那天", "无 CP 大冒险"],
    ertong: ["小狐狸的月亮", "森林里的小邮差", "童话镇新住客"],
    qita: ["用户自建·黑塔", "一周一段短篇", "声音剧合集"],
  };
  const list = titles[slug] ?? [];
  list.forEach((t, i) => ({
    id: `${slug}-${i}`,
    title: t,
    author: ["灵境官方", "晨曦工坊", "鹧鸪天", "蓝鸟工作室", "听风", "无尘"][i % 6],
    blurb: "这里是一段作品简介，体验从这里开始。",
    genres: [slug],
    access: (["try", "free", "paid", "complete", "serial"] as const)[i % 5],
    rating: 7 + (i % 3) + (i % 7) / 10,
    plays: 1000 + i * 1300,
    words: 20000 + i * 4000,
    minutes: 80 + i * 15,
    endingType: (["HE", "BE", "NE", "TE", "HIDDEN"] as const)[i % 5],
    source: (["official", "creator", "ai", "public"] as const)[i % 4],
  }));
  return base.concat(...list.map((t, i) => ({
    id: `${slug}-${i}`,
    title: t,
    author: ["灵境官方", "晨曦工坊", "鹧鸪天", "蓝鸟工作室", "听风", "无尘"][i % 6],
    blurb: "这里是一段作品简介，体验从这里开始。",
    genres: [slug],
    access: (["try", "free", "paid", "complete", "serial"] as const)[i % 5],
    rating: 7 + (i % 3) + (i % 7) / 10,
    plays: 1000 + i * 1300,
    words: 20000 + i * 4000,
    minutes: 80 + i * 15,
    endingType: (["HE", "BE", "NE", "TE", "HIDDEN"] as const)[i % 5],
    source: (["official", "creator", "ai", "public"] as const)[i % 4],
  })));
}
</content>
</invoke>