import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "neutral"
  | "navy"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "promo"
  | "new"
  | "gold";
type BadgeSize = "sm" | "md";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100/80 text-slate-700 border border-slate-200/60 shadow-sm",
  navy: "bg-navy-900/10 text-navy-800 border border-navy-200/50 shadow-sm",
  accent: "bg-azure-50 text-azure-700 border border-azure-200/60 shadow-[0_0_8px_rgba(14,165,233,0.12)]",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-[0_0_8px_rgba(18,183,106,0.12)]",
  warning: "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-[0_0_8px_rgba(247,144,9,0.12)]",
  error: "bg-red-50 text-red-700 border border-red-200/60 shadow-[0_0_8px_rgba(240,68,56,0.12)]",
  promo: "bg-gradient-to-r from-red-500 to-rose-500 text-white border border-red-400/30 shadow-[0_0_12px_rgba(240,68,56,0.35)]",
  new: "bg-gradient-to-r from-azure-500 to-electric-500 text-white border border-azure-400/30 shadow-[0_0_12px_rgba(14,165,233,0.35)]",
  gold: "bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border border-amber-300/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "text-[10px] px-2 py-0.5 gap-1 tracking-wide",
  md: "text-[11px] px-2.5 py-1 gap-1.5 tracking-wide",
};

export function Badge({
  variant = "neutral",
  size = "md",
  className,
  children,
}: {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold leading-none uppercase",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
