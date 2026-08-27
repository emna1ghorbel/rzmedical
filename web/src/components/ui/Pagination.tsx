"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** If true, use URL search params (?page=N). If false, must provide onPageChange. */
  useUrl?: boolean;
  onPageChange?: (page: number) => void;
  className?: string;
}

function pageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function Pagination({
  currentPage,
  totalPages,
  useUrl = true,
  onPageChange,
  className,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function href(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  }

  function handleClick(page: number, e: React.MouseEvent) {
    if (!useUrl && onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  }

  const pages = pageRange(currentPage, totalPages);

  const itemClass = (active: boolean, disabled: boolean) =>
    cn(
      "flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border px-3 text-[13px] font-semibold transition-all duration-150 select-none outline-none",
      "focus-visible:ring-2 focus-visible:ring-azure-500 focus-visible:ring-offset-1",
      active
        ? "border-azure-500 bg-azure-500 text-white shadow-[0_2px_8px_rgba(14,165,233,0.4)]"
        : disabled
        ? "border-slate-200 bg-white text-slate-300 cursor-not-allowed pointer-events-none"
        : "border-slate-200 bg-white text-navy-700 hover:border-azure-300 hover:bg-azure-50 hover:text-azure-700 cursor-pointer",
    );

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1.5 py-8", className)}
    >
      {/* Previous */}
      <Link
        href={href(currentPage - 1)}
        onClick={(e) => handleClick(currentPage - 1, e)}
        aria-label="Page précédente"
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : 0}
        className={itemClass(false, currentPage === 1)}
      >
        <ChevronLeftIcon size={15} strokeWidth={2.5} />
      </Link>

      {/* Pages */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-9 w-9 items-center justify-center text-[13px] text-slate-400"
            aria-hidden
          >
            ···
          </span>
        ) : (
          <Link
            key={p}
            href={href(p as number)}
            onClick={(e) => handleClick(p as number, e)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
            className={itemClass(p === currentPage, false)}
          >
            {p}
          </Link>
        ),
      )}

      {/* Next */}
      <Link
        href={href(currentPage + 1)}
        onClick={(e) => handleClick(currentPage + 1, e)}
        aria-label="Page suivante"
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : 0}
        className={itemClass(false, currentPage === totalPages)}
      >
        <ChevronRightIcon size={15} strokeWidth={2.5} />
      </Link>
    </nav>
  );
}
