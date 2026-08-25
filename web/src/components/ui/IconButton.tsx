import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type IconButtonVariant = "ghost" | "outline" | "solid" | "soft";
type IconButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: "text-navy-700 hover:bg-navy-50",
  outline:
    "border border-border-strong bg-surface text-navy-700 hover:bg-surface-2 hover:border-navy-300",
  solid: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  soft: "bg-navy-50 text-navy-800 hover:bg-navy-100",
};

const SIZES: Record<IconButtonSize, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Intitulé accessible obligatoire (bouton sans texte visible). */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60 cursor-pointer",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
