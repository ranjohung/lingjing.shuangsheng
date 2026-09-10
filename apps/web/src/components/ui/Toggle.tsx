"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  icon?: string;
}

export function Toggle({ checked, onChange, label, icon }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2.5"
      aria-pressed={checked}
    >
      <motion.span
        animate={{ backgroundColor: checked ? "rgba(139,124,246,0.9)" : "rgba(255,255,255,0.12)" }}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-white/10 transition-colors"
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "ml-0.5 inline-block h-5 w-5 rounded-full bg-white shadow",
            !checked && "ml-0.5",
          )}
          style={{ x: checked ? 20 : 0 }}
        />
      </motion.span>
      {(label || icon) && (
        <span className="flex items-center gap-1.5 text-xs text-white/60 group-hover:text-white/85">
          {icon && <i className={icon} />}
          {label}
        </span>
      )}
    </button>
  );
}
