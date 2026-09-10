"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  label: string;
  active?: boolean;
  color?: string;
  onClick?: () => void;
  count?: number;
}

/**
 * 题材 chip：用在桌面横向滚动条 / 子类导航 / 跨类标签。
 * 可控尺寸：默认 md（28px 高），可换 sm/lg。颜色继承自 Genre。
 */
export function GenreChip({ label, active, color, onClick, count }: Props) {
  const reduce = useReducedMotion();
  const base =
    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors";
  const idle = "border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white";
  const onStyle = active && color
    ? { borderColor: color, color: "#fff", backgroundColor: `${color}33` }
    : active
    ? { borderColor: "#cfbef0", color: "#fff", backgroundColor: "#ffffff14" }
    : undefined;

  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={`${base} ${active ? "" : idle}`}
      style={onStyle}
    >
      {label}
      {typeof count === "number" && (
        <span className="text-[10px] text-white/45">{count}</span>
      )}
    </motion.button>
  );
}
</content>
</invoke>