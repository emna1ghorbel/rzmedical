import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Pagination serveur : liens `<a>` vers `/catalogue?page=N&...filtres`.
 * Préserve tous les query-params existants (filtres, tri, etc.).
 */
export function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  // Reconstruit les query-params en excluant "page" (on le réinjecte par lien)
  function buildHref(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value !== undefined && value !== "") {
        params.set(key, value);
      }
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/catalogue${qs ? `?${qs}` : ""}`;
  }

  // Génère les numéros de pages visibles avec ellipses
  function getPageNumbers(): (number | "…")[] {
    const pages: (number | "…")[] = [];
    const delta = 2; // pages autour de la page courante

    // Toujours afficher la première page
    pages.push(1);

    const rangeStart = Math.max(2, currentPage - delta);
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

    if (rangeStart > 2) pages.push("…");

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (rangeEnd < totalPages - 1) pages.push("…");

    // Toujours afficher la dernière page
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }

  const pages = getPageNumbers();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const baseBtn =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azure-500";
  const sizeBtn = "min-w-[2.5rem] h-10 px-2";
  const arrowBtn = "h-10 px-3 gap-1.5";

  return (
    <nav
      aria-label="Pagination du catalogue"
      className="mt-12 flex items-center justify-center gap-1.5"
    >
      {/* Précédent */}
      {hasPrev ? (
        <Link
          href={buildHref(currentPage - 1)}
          className={cn(
            baseBtn,
            arrowBtn,
            "border border-slate-200 bg-white text-navy-700 hover:border-azure-300 hover:bg-azure-50 hover:text-azure-700 shadow-sm",
          )}
          aria-label="Page précédente"
        >
          <ChevronLeftIcon />
          <span className="hidden sm:inline">Précédent</span>
        </Link>
      ) : (
        <span
          className={cn(
            baseBtn,
            arrowBtn,
            "border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed",
          )}
          aria-disabled="true"
        >
          <ChevronLeftIcon />
          <span className="hidden sm:inline">Précédent</span>
        </span>
      )}

      {/* Numéros de pages */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className={cn(baseBtn, sizeBtn, "text-slate-400 cursor-default")}
              aria-hidden="true"
            >
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              className={cn(
                baseBtn,
                sizeBtn,
                "bg-azure-600 text-white shadow-md shadow-azure-500/25 cursor-default",
              )}
              aria-current="page"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className={cn(
                baseBtn,
                sizeBtn,
                "border border-slate-200 bg-white text-navy-700 hover:border-azure-300 hover:bg-azure-50 hover:text-azure-700 shadow-sm",
              )}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {/* Suivant */}
      {hasNext ? (
        <Link
          href={buildHref(currentPage + 1)}
          className={cn(
            baseBtn,
            arrowBtn,
            "border border-slate-200 bg-white text-navy-700 hover:border-azure-300 hover:bg-azure-50 hover:text-azure-700 shadow-sm",
          )}
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRightIcon />
        </Link>
      ) : (
        <span
          className={cn(
            baseBtn,
            arrowBtn,
            "border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed",
          )}
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRightIcon />
        </span>
      )}
    </nav>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
