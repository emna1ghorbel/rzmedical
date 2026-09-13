"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  CategorieListItem,
  MarqueListItem,
  SousCategorieListItem,
} from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { SlidersIcon } from "@/components/ui/icons";
import { Filters } from "./Filters";

interface MobileFiltersProps {
  categories: CategorieListItem[];
  subcategories: SousCategorieListItem[];
  brands: MarqueListItem[];
  hideCategory?: boolean;
  currentCategorieId?: string;
  currentSousCategorieId?: string;
}

/** Bouton « Filtres » (mobile/tablette) ouvrant le panneau de filtres en modale. */
export function MobileFilters({
  categories,
  subcategories,
  brands,
  hideCategory = false,
  currentCategorieId,
  currentSousCategorieId,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  const categorieId = searchParams.get("categorieId") ?? currentCategorieId;
  const sousCategorieId = searchParams.get("sousCategorieId") ?? currentSousCategorieId;
  const marqueId = searchParams.get("marqueId");
  const promo = searchParams.get("promo");
  const disponible = searchParams.get("disponible");
  const minPrix = searchParams.get("minPrix");
  const maxPrix = searchParams.get("maxPrix");

  const activeCount =
    (!hideCategory && categorieId ? 1 : 0) +
    (sousCategorieId ? 1 : 0) +
    (marqueId ? 1 : 0) +
    (promo ? 1 : 0) +
    (disponible ? 1 : 0) +
    (minPrix || maxPrix ? 1 : 0);

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
          hideCategory={hideCategory}
          onNavigate={() => setOpen(false)}
          currentCategorieId={currentCategorieId}
          currentSousCategorieId={currentSousCategorieId}
        />
      </Modal>
    </>
  );
}
