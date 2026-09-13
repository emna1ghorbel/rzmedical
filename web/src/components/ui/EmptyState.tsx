import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** État vide premium — ambient glow icon, subtle container. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in select-none",
        className,
      )}
    >
      {icon && (
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          {/* Icon container */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 shadow-sm">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-[17px] font-bold text-navy-900 tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2.5 max-w-sm text-[14px] leading-relaxed text-slate-500">{description}</p>
      )}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
