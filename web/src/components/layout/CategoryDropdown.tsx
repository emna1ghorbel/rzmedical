"use client";

import { useEffect, useRef, useState } from "react";
import { useCategory } from "@/providers/CategoryProvider";
import type { CategorieListItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";

export function CategoryDropdown({
  isGlass = false,
}: {
  isGlass?: boolean;
}) {
  const { selectedCategory, categories, switchCategory } = useCategory();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (cat: CategorieListItem) => {
    switchCategory(cat);
    setOpen(false);
  };

  const label = selectedCategory?.nom ?? "Catégorie";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Catégorie sélectionnée : ${label}. Cliquer pour changer.`}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-bold transition-all duration-300 border outline-none shrink-0",
          "focus-visible:ring-2 focus-visible:ring-azure-500 focus-visible:ring-offset-1",
          isGlass
            ? "border-white/20 bg-white/10 text-white/90 hover:bg-white/20 hover:border-white/30"
            : "border-azure-200/80 bg-azure-50 text-azure-700 hover:bg-azure-100 hover:border-azure-300 hover:shadow-sm",
          open && !isGlass && "bg-azure-100 border-azure-400 shadow-sm",
          open && isGlass && "bg-white/20 border-white/40",
        )}
      >
        {/* Active indicator dot */}
        <span className={cn(
          "h-2 w-2 rounded-full flex-shrink-0 transition-colors",
          isGlass ? "bg-azure-300" : "bg-azure-500",
        )} />
        <span className="max-w-[75px] xs:max-w-[95px] sm:max-w-[140px] truncate">{label}</span>
        <ChevronDownIcon
          size={14}
          strokeWidth={2.5}
          className={cn(
            "transition-transform duration-300 flex-shrink-0",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Choisir une catégorie"
          className={cn(
            "absolute left-0 top-full mt-2 z-[60] min-w-[200px] rounded-xl border border-slate-200 bg-white py-1.5",
            "shadow-[0_8px_40px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.8)_inset]",
            "animate-fade-in",
          )}
        >
          {categories.map((cat) => {
            const isActive = cat.id === selectedCategory?.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(cat)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 text-left outline-none",
                  "focus-visible:bg-slate-50",
                  isActive
                    ? "bg-azure-50 text-azure-700 font-bold"
                    : "text-navy-800 hover:bg-slate-50 hover:text-navy-900",
                )}
              >
                <span className="flex-1 truncate">{cat.nom}</span>
                {isActive && (
                  <CheckIcon size={14} strokeWidth={2.5} className="text-azure-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
