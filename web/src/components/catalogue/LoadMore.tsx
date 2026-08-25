"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { PRODUCT_GRID_CLASS } from "./ProductGrid";
import { cn } from "@/lib/cn";

/**
 * Pagination d'affichage côté client : les produits sont rendus côté serveur
 * (SEO) puis dévoilés par lots. `resetKey` réinitialise le compteur quand les
 * filtres changent.
 */
export function LoadMore({
  items,
  total,
  pageSize = 12,
  resetKey,
  className,
}: {
  items: ReactNode[];
  total?: number;
  pageSize?: number;
  resetKey?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(pageSize);
  const count = total ?? items.length;

  useEffect(() => {
    setVisible(pageSize);
  }, [resetKey, pageSize]);

  const shown = items.slice(0, visible);
  const remaining = items.length - visible;

  return (
    <div className={className}>
      <div className={PRODUCT_GRID_CLASS}>{shown}</div>

      {remaining > 0 && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {Math.min(visible, items.length)} produit
            {Math.min(visible, items.length) > 1 ? "s" : ""} sur {count}
          </p>
          <div
            className="h-1 w-40 overflow-hidden rounded-full bg-navy-100"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{
                width: `${Math.min(100, (visible / items.length) * 100)}%`,
              }}
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisible((v) => v + pageSize)}
            className={cn("mt-1")}
          >
            Afficher plus de produits
          </Button>
        </div>
      )}
    </div>
  );
}
