import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** En-tête de section premium avec gradient eyebrow pill et titre fort. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "Voir tout",
  className,
  dark = false,
  extraAction,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  dark?: boolean;
  extraAction?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 select-none animate-reveal-up",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 mb-4"
            style={dark ? {
              borderColor: "rgba(14,165,233,0.2)",
              background: "rgba(14,165,233,0.08)",
            } : {
              borderColor: "rgba(14,165,233,0.2)",
              background: "linear-gradient(135deg, rgba(14,165,233,0.06), rgba(34,211,238,0.04))",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-azure-400 animate-pulse" />
            <p className={cn(
              "text-[10px] font-black uppercase tracking-[0.18em]",
              dark ? "text-azure-400" : "text-azure-600"
            )}>
              {eyebrow}
            </p>
          </div>
        )}
        <h2 className={cn(
          "font-display font-black tracking-tight leading-tight",
          dark ? "text-white" : "text-navy-900"
        )}>
          {title}
        </h2>
        {description && (
          <p className={cn(
            "mt-3 text-[15px] leading-relaxed",
            dark ? "text-navy-200/70" : "text-slate-500"
          )}>
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col items-start sm:items-end gap-3 shrink-0 mt-2 sm:mt-0">
        {extraAction}
        {href && (
          <Link
            href={href}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-bold transition-all duration-200",
              dark
                ? "border-azure-500/25 text-azure-400 hover:border-azure-400/50 hover:text-azure-300 hover:bg-azure-500/10"
                : "border-azure-200 text-azure-600 hover:border-azure-400 hover:text-azure-700 hover:bg-azure-50 shadow-sm"
            )}
          >
            {linkLabel}
            <ArrowRightIcon
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
