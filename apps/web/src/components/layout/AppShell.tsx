"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 5 Tab 主导航
 *  1. 我的世界 /  （角色 + 双生陪伴主舞台）
 *  2. 小说世界 /worlds （22 题材目录，用户最强调的需求）
 *  3. 双生陪伴 /companions （角色陪伴 + 日常交互）
 *  4. 创作中心 /studio （3 栏编辑器 + AI 辅助）
 *  5. 发现     /discover （推荐与活动）
 *  + 5 浮层：钱包 /wallet / 我的 /profile / 法律 /legal
 */
const NAV = [
  { href: "/", label: "我的世界", icon: "fa-moon", group: "primary" },
  { href: "/worlds", label: "小说世界", icon: "fa-book-open", group: "primary" },
  { href: "/companions", label: "双生陪伴", icon: "fa-user-group", group: "primary" },
  { href: "/studio", label: "创作中心", icon: "fa-feather", group: "primary" },
  { href: "/discover", label: "发现", icon: "fa-compass", group: "primary" },
] as const;

const SUBNAV = [
  { href: "/wallet", label: "钱包", icon: "fa-wallet" },
  { href: "/legal", label: "法律", icon: "fa-scale-balanced" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hidden = path.startsWith("/onboarding");
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen">
        <div className="aurora-bg" />

        {!hidden && (
          <>
            {/* 桌面侧栏 */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/10 bg-[#0e1525]/95 px-4 py-7 backdrop-blur md:flex">
              <Link href="/" className="mb-10 flex items-center gap-3 px-3">
                <img src="/icon.svg" alt="" className="h-10 w-10" />
                <span>
                  <strong className="block text-lg font-semibold tracking-wide">MIRAI</strong>
                  <span className="text-xs text-white/45">灵境 · 双生</span>
                </span>
              </Link>

              <p className="mb-2 px-3 text-[11px] uppercase tracking-wider text-white/35">主导航</p>
              <nav aria-label="主导航" className="space-y-1.5">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                      active(item.href)
                        ? "bg-[#27234d] text-[#d5c8f2] shadow-glow"
                        : "text-[#a4b1c4] hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <i aria-hidden="true" className={`fa-solid ${item.icon} w-5 text-center`} />
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 border-t border-white/10 px-3 pt-5">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">辅助</p>
                <nav aria-label="辅助" className="space-y-1.5">
                  {SUBNAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active(item.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors",
                        active(item.href)
                          ? "bg-white/[0.07] text-white"
                          : "text-white/55 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <i aria-hidden="true" className={`fa-solid ${item.icon} w-5 text-center`} />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="mt-auto border-t border-white/10 px-3 pt-6">
                <p className="text-sm text-white/75">一个角色，两种人生。</p>
                <p className="mt-2 text-xs leading-6 text-white/35">
                  在故事里经历命运，在现实中陪伴你。
                </p>
                <Link
                  href="/characters"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-aurora-violet/40 bg-aurora-violet/15 px-3 py-1.5 text-xs text-aurora-violet hover:bg-aurora-violet/25"
                >
                  <i aria-hidden="true" className="fa-solid fa-plus" />
                  创建新角色
                </Link>
              </div>
            </aside>

            {/* 移动顶栏 */}
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0e1525]/95 px-5 py-4 backdrop-blur md:hidden">
              <Link href="/" className="font-semibold tracking-wide">
                MIRAI <span className="ml-2 font-normal text-white/45">灵境</span>
              </Link>
              <Link href="/worlds" className="text-sm text-[#b6a6df]" aria-label="进入小说世界">
                小说世界 <i aria-hidden="true" className="fa-solid fa-arrow-right ml-1" />
              </Link>
            </header>
          </>
        )}

        <main id="main-content" className={cn(!hidden && "pb-24 md:pb-0 md:pl-60")}>
          {children}
        </main>

        {/* 移动端底部 Tab */}
        {!hidden && (
          <nav
            aria-label="移动端主导航"
            className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#0e1525]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur md:hidden"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active(item.href) ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 py-1 text-[10px]",
                  active(item.href) ? "text-[#cfbef0]" : "text-[#93a1b6]",
                )}
              >
                <i aria-hidden="true" className={`fa-solid ${item.icon} text-base`} />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </MotionConfig>
  );
}
</content>
</invoke>