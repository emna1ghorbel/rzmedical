import Link from "next/link";
import { ChevronRightIcon } from "./icons";
import { cn } from "@/lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
}

export function Breadcrumb({
  items,
  tone = "default",
  className,
}: {
  items: BreadcrumbItem[];
  tone?: "default" | "light";
  className?: string;
}) {
  const light = tone === "light";

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn("mb-5 select-none animate-reveal-up", className)}
    >
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1.5 text-xs sm:text-sm",
          light ? "text-white/75" : "text-muted",
        )}
      >
        <li>
          <Link
            href="/"
            className={cn(
              "transition-colors duration-200",
              light
                ? "hover:text-white focus-visible:text-white"
                : "hover:text-azure-600 focus-visible:text-azure-600",
            )}
          >
            Accueil
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              <ChevronRightIcon
                size={13}
                className={cn("shrink-0", light ? "text-white/45" : "text-faint")}
              />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors duration-200",
                    light
                      ? "hover:text-white focus-visible:text-white"
                      : "hover:text-azure-600 focus-visible:text-azure-600",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate max-w-[150px] font-semibold sm:max-w-none",
                    light ? "text-white" : "text-navy-900",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
