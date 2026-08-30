"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCategory } from "@/providers/CategoryProvider";
import type { CategorieListItem } from "@/lib/types";
import { cn } from "@/lib/cn";

const ACCENT = "#2196d2";

export function CategoryOnboardingModal({
  categories,
}: {
  categories: CategorieListItem[];
}) {
  const { isOnboardingOpen, selectCategory } = useCategory();
  const [selected, setSelected] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !isOnboardingOpen) return null;

  const handleSelect = (cat: CategorieListItem) => {
    setSelected(cat.id);
    setTimeout(() => selectCategory(cat), 180);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="absolute inset-0 bg-navy-950/85" aria-hidden />

      <div
        style={{ animation: "rzIn 380ms cubic-bezier(0.16,1,0.3,1) both" }}
        className="relative w-full max-w-[420px] bg-white border border-slate-200"
      >
        {/* Filet d'accent latéral, pas horizontal — casse la symétrie top-down attendue */}
        <div className="flex">
          <div className="w-[3px] shrink-0" style={{ background: ACCENT }} aria-hidden />

          <div className="flex-1 min-w-0">
            {/* En-tête décalé, non centré, avec numérotation contextuelle */}
            <div className="pl-6 pr-7 pt-7 pb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Étape 1 sur 1
              </span>
              <h1
                id="onboarding-title"
                className="mt-1.5 font-serif text-[21px] font-medium text-navy-900 leading-[1.15]"
              >
                Configurez votre catalogue
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500 max-w-[92%]">
                Choisissez le rayon dans lequel vous exercez. RZ Medical
                adapte automatiquement les produits affichés.
              </p>
            </div>

            {/* Liste avec index numérique — remplace le point décoratif par un repère fonctionnel */}
            <div className="pb-2">
              {categories.map((cat, i) => {
                const isSelected = selected === cat.id;
                const isLast = i === categories.length - 1;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={cn(
                      "group relative flex w-full items-baseline gap-3 pl-6 pr-7 py-3 text-left outline-none transition-colors duration-150",
                      !isLast && "border-b border-slate-100",
                      isSelected ? "bg-[#2196d2]/[0.06]" : "hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "font-serif text-[12px] tabular-nums shrink-0 transition-colors",
                        isSelected ? "text-[#2196d2]" : "text-slate-300 group-hover:text-slate-400",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "flex-1 min-w-0 truncate text-[14px] transition-colors",
                        isSelected
                          ? "font-semibold text-navy-900"
                          : "font-normal text-slate-700 group-hover:text-navy-900",
                      )}
                    >
                      {cat.nom}
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "text-[12px] font-serif italic shrink-0 transition-all duration-150",
                        isSelected
                          ? "opacity-100 translate-x-0 text-[#2196d2]"
                          : "opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 text-slate-400",
                      )}
                    >
                      choisi
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rzIn {
          from { opacity: 0; transform: translateX(-6px) translateY(4px); }
          to { opacity: 1; transform: translateX(0) translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}