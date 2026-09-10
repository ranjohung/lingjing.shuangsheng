"use client";

import Link from "next/link";

const TIERS = [
  {
    key: "free",
    name: "免费用户",
    price: "¥0 / 月",
    accent: "#9faec2",
    bullets: [
      "可创建 1 个世界",
      "最多 3 个角色",
      "每日 50 次对话额度",
      "每月 1 部基础小说生成",
      "含广告",
    ],
  },
  {
    key: "monthly",
    name: "灵境月卡",
    price: "¥18 / 月",
    accent: "#cfbef0",
    highlights: true,
    bullets: [
      "可创建 3 个世界",
      "每世界最多 10 个角色",
      "每日 200 灵玉（4×）",
      "无限对话额度",
      "高级小说生成 · 每月 3 部",
      "去广告 · 30 分钟语音",
    ],
  },
  {
    key: "star",
    name: "灵境星卡",
    price: "¥58 / 月",
    accent: "#ffd9a0",
    bullets: [
      "可创建 10 个世界",
      "每世界不限角色",
      "深度世界模拟（完整 NPC）",
      "高级 AI 模型 · 无限语音",
      "高级小说生成 · 每月 10 部",
      "专属头像框与称号",
    ],
  },
];

const RECHARGES = [
  { yuan: 6, jing: 600, bonus: 0 },
  { yuan: 30, jing: 3000, bonus: 100 },
  { yuan: 68, jing: 6800, bonus: 500 },
  { yuan: 128, jing: 12800, bonus: 1500 },
  { yuan: 328, jing: 32800, bonus: 5000 },
  { yuan: 648, jing: 64800, bonus: 10000 },
];

export default function WalletPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 text-white md:px-10 md:py-14">
      <header className="mb-8">
        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-aurora-gold/80">Wallet</p>
        <h1 className="font-display text-4xl font-bold">钱包</h1>
        <p className="mt-3 text-sm text-white/55">
          双货币体系：灵玉是免费货币（每日签到 / 任务获得），灵晶是付费货币（充值获得）。
        </p>
      </header>

      {/* 当前余额 */}
      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <BalanceCard label="灵玉 Lingyu" value={1280} unit="免费货币" accent="#7cf6c0" />
        <BalanceCard label="灵晶 Lingjing" value={680} unit="付费货币" accent="#cfbef0" />
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <p className="text-xs text-white/45">本月订阅</p>
          <p className="mt-2 font-display text-xl">灵境月卡 · 进行中</p>
          <p className="mt-2 text-xs text-white/55">到期 · 2026-10-09（30 天后）</p>
          <Link href="#" className="mt-3 inline-block text-xs text-aurora-violet hover:underline">
            管理订阅 →
          </Link>
        </div>
      </section>

      {/* 订阅档位 */}
      <section className="mb-12">
        <h2 className="mb-5 font-display text-2xl">订阅档位</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <article
              key={t.key}
              className={`relative rounded-3xl border p-6 transition-all ${t.highlights ? "border-aurora-violet bg-white/[0.06] shadow-glow" : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"}`}
            >
              {t.highlights && (
                <p className="absolute -top-3 right-4 rounded-full bg-aurora-violet px-3 py-1 text-[11px] font-semibold text-night-950">
                  推荐
                </p>
              )}
              <p className="text-xs text-white/45" style={{ color: t.accent }}>{t.name}</p>
              <p className="mt-2 font-display text-2xl">{t.price}</p>
              <ul className="mt-5 space-y-2 text-xs leading-relaxed text-white/70">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <i aria-hidden="true" className="fa-solid fa-check mt-0.5 text-aurora-mint" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm transition ${t.highlights ? "bg-aurora-violet text-night-950 hover:bg-aurora-violet/90" : "border border-white/15 bg-white/[0.05] hover:bg-white/[0.1]"}`}
                type="button"
              >
                {t.key === "free" ? "当前档位" : "立即升级"}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* 灵晶充值 */}
      <section className="mb-10">
        <h2 className="mb-5 font-display text-2xl">灵晶充值</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {RECHARGES.map((r) => (
            <button
              key={r.yuan}
              type="button"
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:-translate-y-0.5 hover:border-aurora-gold/40 hover:bg-white/[0.07]"
            >
              {r.bonus > 0 && (
                <span className="absolute right-2 top-2 rounded-full bg-aurora-gold/25 px-2 py-0.5 text-[10px] text-aurora-gold">
                  +{r.bonus} 赠
                </span>
              )}
              <p className="text-base font-semibold text-aurora-gold">¥ {r.yuan}</p>
              <p className="mt-1 font-display text-lg">{r.jing.toLocaleString()} 灵晶</p>
              <p className="mt-1 text-[11px] text-white/55">
                约 {(r.jing + r.bonus) / r.yuan} 灵晶/元
              </p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/45">
          1 元 ≈ 100 灵晶。优惠仅限当前会话有效；所有交易受 <Link href="/legal" className="underline">用户协议</Link> 约束。
        </p>
      </section>

      {/* 交易记录 */}
      <section>
        <h2 className="mb-3 font-display text-xl">近 30 天交易</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.04] text-left text-xs text-white/55">
              <tr>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">金额</th>
                <th className="px-4 py-3">余额</th>
                <th className="px-4 py-3">说明</th>
              </tr>
            </thead>
            <tbody className="text-white/75">
              {[
                { t: "09-09 22:01", k: "充值", v: "+¥30 / +3000 灵晶", b: "680 灵晶", d: "微信支付" },
                { t: "09-09 21:47", k: "订阅", v: "-¥18", b: "月卡生效", d: "灵境月卡" },
                { t: "09-09 08:15", k: "签到", v: "+200 灵玉", b: "1280 灵玉", d: "每日签到" },
                { t: "09-08 19:23", k: "消费", v: "-2 灵晶", b: "—", d: "抽卡" },
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white/55">{row.t}</td>
                  <td className="px-4 py-3">{row.k}</td>
                  <td className="px-4 py-3 text-aurora-mint">{row.v}</td>
                  <td className="px-4 py-3 text-white/55">{row.b}</td>
                  <td className="px-4 py-3 text-white/55">{row.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BalanceCard({ label, value, unit, accent }: { label: string; value: number; unit: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5">
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-2 font-display text-3xl" style={{ color: accent }}>
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[11px] text-white/45">{unit}</p>
      <p className="mt-3 text-[11px] text-white/45">充值即送赠币，不会过期。</p>
    </div>
  );
}
</content>
</invoke>