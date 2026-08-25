"use client";

import { useState } from "react";
import type {
  CategorieListItem,
  MarqueListItem,
  SousCategorieListItem,
} from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { SlidersIcon } from "@/components/ui/icons";
import { Filters } from "./Filters";

/** Bouton « Filtres » (mobile/tablette) ouvrant le panneau de filtres en modale. */
export function MobileFilters({
  categories,
  subcategories,
  brands,
  activeCount = 0,
}: {
  categories: CategorieListItem[];
  subcategories: SousCategorieListItem[];
  brands: MarqueListItem[];
  activeCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3.5 text-sm font-medium text-navy-800 transition-colors hover:border-navy-300 lg:hidden"
      >
        <SlidersIcon size={17} />
        Filtres
        {activeCount > 0 && (
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Filtrer les produits"
        size="sm"
      >
        <Filters
          categories={categories}
          subcategories={subcategories}
          brands={brands}
          onNavigate={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
