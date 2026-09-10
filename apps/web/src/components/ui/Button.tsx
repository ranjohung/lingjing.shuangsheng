"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "glass" | "danger" | "gold";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#b6a6df] text-[#171a29] hover:bg-[#c8b9ec] border border-transparent",
  gold: "bg-gradient-to-br from-[#ffd9a0] to-[#f0a868] text-[#3a2a12] font-semibold hover:brightness-105 border border-white/20",
  ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/5",
  glass: "glass text-white/85 hover:bg-white/10",
  danger: "bg-red-500/15 text-red-300 border border-red-400/30 hover:bg-red-500/25",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
  icon: "h-10 w-10 rounded-xl justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: props.disabled ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
