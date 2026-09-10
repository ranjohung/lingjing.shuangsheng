"use client";

import { cn } from "@/lib/utils";

type Tone = "violet" | "pink" | "blue" | "gold" | "mint" | "neutral";

const tones: Record<Tone, string> = {
  violet: "bg-aurora-violet/15 text-[#c9c0ff] border-aurora-violet/25",
  pink: "bg-aurora-pink/15 text-aurora-pink border-aurora-pink/25",
  blue: "bg-aurora-blue/15 text-aurora-blue border-aurora-blue/25",
  gold: "bg-aurora-gold/15 text-aurora-gold border-aurora-gold/25",
  mint: "bg-aurora-mint/15 text-aurora-mint border-aurora-mint/25",
  neutral: "bg-white/8 text-white/50 border-white/10",
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {icon && <i className={icon} />}
      {children}
    </span>
  );
}
