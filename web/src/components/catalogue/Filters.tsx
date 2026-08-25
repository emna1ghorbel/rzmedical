"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  CategorieListItem,
  MarqueListItem,
  SousCategorieListItem,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

interface FiltersProps {
  categories: CategorieListItem[];
  subcategories: SousCategorieListItem[];
  brands: MarqueListItem[];
  onNavigate?: () => void; // ex. fermer le tiroir mobile après un choix
}

export function Filters({
  categories,
  subcategories,
  brands,
  onNavigate,
}: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categorieId = searchParams.get("categorieId");
  const sousCategorieId = searchParams.get("sousCategorieId");
  const marqueId = searchParams.get("marqueId");
  const promo = searchParams.get("promo");
  const disponible = searchParams.get("disponible");
  const urlMin = searchParams.get("minPrix") ?? "";
  const urlMax = searchParams.get("maxPrix") ?? "";

  const [minPrix, setMinPrix] = useState(urlMin);
  const [maxPrix, setMaxPrix] = useState(urlMax);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categorie: true,
    sousCategorie: true,
    marque: true,
    prix: true,
    options: true,
  });

  // Resynchronise les champs prix quand l'URL change (navigation, reset).
  useEffect(() => {
    setMinPrix(urlMin);
    setMaxPrix(urlMax);
  }, [urlMin, urlMax]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const commit = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      onNavigate?.();
    },
    [searchParams, router, pathname, onNavigate],
  );

  // Sous-catégories affichées : limitées à la catégorie sélectionnée le cas échéant.
  const visibleSubs = useMemo(() => {
    if (!categorieId) return subcategories;
    const id = Number(categorieId);
    return subcategories.filter((s) => s.categorie?.id === id);
  }, [subcategories, categorieId]);

  const visibleBrands = useMemo(() => {
    if (!categorieId) return brands;
    const id = Number(categorieId);
    return brands.filter((b) => b.categorie?.id === id);
  }, [brands, categorieId]);

  const activeCount =
    (categorieId ? 1 : 0) +
    (sousCategorieId ? 1 : 0) +
    (marqueId ? 1 : 0) +
    (promo ? 1 : 0) +
    (disponible ? 1 : 0) +
    (urlMin || urlMax ? 1 : 0);

  const resetAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of [
      "categorieId",
      "sousCategorieId",
      "marqueId",
      "promo",
      "disponible",
      "minPrix",
      "maxPrix",
    ]) {
      params.delete(k);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    onNavigate?.();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy-900">
          Filtres
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="text-xs font-semibold text-azure-600 transition-colors hover:text-azure-700 cursor-pointer"
          >
            Réinitialiser ({activeCount})
          </button>
        )}
      </div>

      {/* Catégorie */}
      <FilterSection
        title="Catégorie"
        isOpen={openSections.categorie}
        onToggle={() => toggleSection("categorie")}
      >
        <OptionButton
          selected={!categorieId}
          onClick={() =>
            commit({ categorieId: null, sousCategorieId: null, marqueId: null })
          }
        >
          Toutes les catégories
        </OptionButton>
        {categories.map((cat) => (
          <OptionButton
            key={cat.id}
            selected={categorieId === String(cat.id)}
            onClick={() =>
              commit({
                categorieId: String(cat.id),
                sousCategorieId: null,
                marqueId: null,
              })
            }
          >
            {cat.nom}
          </OptionButton>
        ))}
      </FilterSection>

      {/* Sous-catégorie */}
      {visibleSubs.length > 0 && (
        <FilterSection
          title="Sous-catégorie"
          isOpen={openSections.sousCategorie}
          onToggle={() => toggleSection("sousCategorie")}
        >
          <OptionButton
            selected={!sousCategorieId}
            onClick={() => commit({ sousCategorieId: null })}
          >
            Toutes
          </OptionButton>
          {visibleSubs.map((sub) => (
            <OptionButton
              key={sub.id}
              selected={sousCategorieId === String(sub.id)}
              onClick={() => commit({ sousCategorieId: String(sub.id) })}
            >
              {sub.nom}
            </OptionButton>
          ))}
        </FilterSection>
      )}

      {/* Marque */}
      {visibleBrands.length > 0 && (
        <FilterSection
          title="Marque"
          isOpen={openSections.marque}
          onToggle={() => toggleSection("marque")}
        >
          <OptionButton
            selected={!marqueId}
            onClick={() => commit({ marqueId: null })}
          >
            Toutes les marques
          </OptionButton>
          {visibleBrands.map((brand) => (
            <OptionButton
              key={brand.id}
              selected={marqueId === String(brand.id)}
              onClick={() => commit({ marqueId: String(brand.id) })}
            >
              {brand.nom}
            </OptionButton>
          ))}
        </FilterSection>
      )}

      {/* Prix */}
      <FilterSection
        title="Prix (DT)"
        isOpen={openSections.prix}
        onToggle={() => toggleSection("prix")}
      >
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrix}
            onChange={(e) => setMinPrix(e.target.value)}
            placeholder="Min"
            aria-label="Prix minimum"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-navy-900 outline-none focus:border-azure-405 focus:ring-4 focus:ring-azure-500/10"
          />
          <span className="text-faint">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrix}
            onChange={(e) => setMaxPrix(e.target.value)}
            placeholder="Max"
            aria-label="Prix maximum"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-navy-900 outline-none focus:border-azure-405 focus:ring-4 focus:ring-azure-500/10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          fullWidth
          className="mt-2.5"
          onClick={() =>
            commit({
              minPrix: minPrix.trim() || null,
              maxPrix: maxPrix.trim() || null,
            })
          }
        >
          Appliquer
        </Button>
      </FilterSection>

      {/* Options */}
      <FilterSection
        title="Options"
        isOpen={openSections.options}
        onToggle={() => toggleSection("options")}
      >
        <div className="mt-1 flex flex-col gap-0.5">
          <CheckboxRow
            checked={promo === "1"}
            onChange={(v) => commit({ promo: v ? "1" : null })}
            label="En promotion"
          />
          <CheckboxRow
            checked={disponible === "1"}
            onChange={(v) => commit({ disponible: v ? "1" : null })}
            label="En stock uniquement"
          />
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  children,
  isOpen = true,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section className="border-b border-border/50 pb-3.5 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-1 text-left text-[13px] font-bold text-navy-900 cursor-pointer select-none"
      >
        <span>{title}</span>
        <ChevronDownIcon
          size={16}
          className={cn(
            "text-faint transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "flex flex-col gap-1 overflow-hidden transition-all duration-300 ease-out-soft mt-1",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        )}
      >
        {children}
      </div>
    </section>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors duration-200 cursor-pointer select-none",
        selected
          ? "bg-azure-50 font-bold text-azure-700"
          : "text-navy-700 hover:bg-navy-50/50 hover:text-navy-950",
      )}
    >
      <span className="truncate">{children}</span>
      {selected && <CheckIcon size={15} className="shrink-0 text-azure-600 animate-scale-in" />}
    </button>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-navy-700 transition-all duration-200 hover:bg-navy-50/50 select-none">
      <span
        className={cn(
          "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-accent bg-accent text-white"
            : "border-border-strong bg-surface",
        )}
      >
        {checked && <CheckIcon size={12} className="animate-scale-in" />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="font-medium text-navy-800">{label}</span>
    </label>
  );
}
