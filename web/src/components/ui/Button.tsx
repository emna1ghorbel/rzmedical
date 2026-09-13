import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { SpinnerIcon } from "./icons";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

interface VariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-azure-500 focus-visible:ring-offset-2 outline-none cursor-pointer";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "btn-3d-primary text-white rounded-xl",
  accent:
    "btn-3d-accent text-white rounded-xl",
  secondary:
    "relative overflow-hidden bg-white/[0.06] text-navy-100 border border-white/10 hover:bg-white/[0.1] hover:border-white/20 hover:-translate-y-[1px] hover:shadow-lg active:translate-y-[1px] active:scale-[0.98] rounded-xl transition-all duration-200",
  outline:
    "relative border border-slate-200 bg-white text-navy-800 hover:border-azure-300 hover:bg-azure-50/50 hover:-translate-y-[1px] hover:shadow-md active:translate-y-[1px] active:scale-[0.98] rounded-xl transition-all duration-200 shadow-sm",
  ghost:
    "text-navy-700 hover:bg-navy-50 hover:text-azure-600 hover:-translate-y-[1px] active:scale-[0.97] rounded-lg transition-all duration-200",
  danger:
    "relative overflow-hidden bg-red-600 text-white rounded-xl shadow-sm hover:bg-red-700 hover:-translate-y-[1px] hover:shadow active:translate-y-[1px] active:scale-[0.98] transition-all duration-200",
  success:
    "relative overflow-hidden bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 hover:-translate-y-[1px] hover:shadow active:translate-y-[1px] active:scale-[0.98] transition-all duration-200",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
  xl: "h-14 px-8 text-base",
};

/** Classes d'un bouton — réutilisable sur un <Link> pour un CTA lien. */
export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: VariantProps = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full");
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-[pulse_0.6s_ease-in-out_0s_infinite]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-[pulse_0.6s_ease-in-out_0.15s_infinite]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-[pulse_0.6s_ease-in-out_0.3s_infinite]" />
        </span>
      )}
      {!loading && children}
    </button>
  );
}
