"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCategory } from "@/providers/CategoryProvider";
import type { CategorieListItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { CheckIcon, XIcon } from "@/components/ui/icons";

// ─── Icônes SVG médicales inline ──────────────────────────────────────────

function IconToothSvg({ className }: { className?: string }) {
  return (
    <svg className={cn("w-8 h-8", className)} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M18 6C14 6 10 9 10 15c0 4 1 8 3 12l2 9c.5 2 1.5 3 3 3s2.5-1 3-3l1-5 1 5c.5 2 1.5 3 3 3s2.5-1 3-3l2-9c2-4 3-8 3-12 0-6-4-9-8-9-2 0-4 1-5 2-1-1-3-2-5-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

function IconHeartSvg({ className }: { className?: string }) {
  return (
    <svg className={cn("w-8 h-8", className)} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M24 40S8 28 8 18a8 8 0 0 1 16 0 8 8 0 0 1 16 0c0 10-16 22-16 22z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M24 18v8M20 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconMicroscopeSvg({ className }: { className?: string }) {
  return (
    <svg className={cn("w-8 h-8", className)} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="18" y="6" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 26v8M16 42h16M12 34h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="16" r="4" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function IconScalpelSvg({ className }: { className?: string }) {
  return (
    <svg className={cn("w-8 h-8", className)} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M8 40 32 16M32 16l6-6 4 4-6 6M26 22l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 40c2 0 6-4 10-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconPillSvg({ className }: { className?: string }) {
  return (
    <svg className={cn("w-8 h-8", className)} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="8" y="18" width="32" height="12" rx="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="18" x2="24" y2="30" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function IconBeakerSvg({ className }: { className?: string }) {
  return (
    <svg className={cn("w-8 h-8", className)} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M18 6v16L8 36a4 4 0 0 0 4 6h24a4 4 0 0 0 4-6L30 22V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="6" x2="32" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 34h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconGridSvg({ className }: { className?: string }) {
  return (
    <svg className={cn("w-8 h-8", className)} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="6" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="28" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="6" y="28" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="28" y="28" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

// ─── Mapping catégorie → icon + description + couleur ─────────────────────

type CategoryVisual = {
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
};

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  dentaire: {
    Icon: IconToothSvg,
    description: "Équipements, fauteuils, consommables et instruments dentaires",
    colorClass: "text-sky-600",
    bgClass: "bg-sky-50",
    borderClass: "border-sky-200",
    glowClass: "shadow-[0_0_30px_rgba(14,165,233,0.15)]",
  },
  médical: {
    Icon: IconHeartSvg,
    description: "Matériel médical général, monitoring et soins",
    colorClass: "text-rose-600",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    glowClass: "shadow-[0_0_30px_rgba(244,63,94,0.12)]",
  },
  medical: {
    Icon: IconHeartSvg,
    description: "Matériel médical général, monitoring et soins",
    colorClass: "text-rose-600",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    glowClass: "shadow-[0_0_30px_rgba(244,63,94,0.12)]",
  },
  diagnostic: {
    Icon: IconMicroscopeSvg,
    description: "Appareils de diagnostic, imagerie et analyse",
    colorClass: "text-violet-600",
    bgClass: "bg-violet-50",
    borderClass: "border-violet-200",
    glowClass: "shadow-[0_0_30px_rgba(139,92,246,0.12)]",
  },
  chirurgie: {
    Icon: IconScalpelSvg,
    description: "Instruments chirurgicaux, tables opératoires et stérilisation",
    colorClass: "text-slate-700",
    bgClass: "bg-slate-50",
    borderClass: "border-slate-200",
    glowClass: "shadow-[0_0_30px_rgba(100,116,139,0.12)]",
  },
  pharmacie: {
    Icon: IconPillSvg,
    description: "Médicaments, compléments et équipement pharmaceutique",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    glowClass: "shadow-[0_0_30px_rgba(16,185,129,0.12)]",
  },
  laboratoire: {
    Icon: IconBeakerSvg,
    description: "Équipements et consommables de laboratoire",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    glowClass: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
  },
};

const DEFAULT_VISUAL: CategoryVisual = {
  Icon: IconGridSvg,
  description: "Découvrez notre sélection de produits spécialisés",
  colorClass: "text-navy-700",
  bgClass: "bg-navy-50",
  borderClass: "border-navy-200",
  glowClass: "shadow-[0_0_30px_rgba(12,35,64,0.08)]",
};

function getCategoryVisual(nom: string): CategoryVisual {
  const key = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_VISUALS[key] ?? DEFAULT_VISUAL;
}

// ─── Composant principal ───────────────────────────────────────────────────

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
    // Légère pause pour voir l'animation de sélection avant de naviguer
    setTimeout(() => selectCategory(cat), 280);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-960/70 backdrop-blur-xl animate-fade-in" aria-hidden />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-3xl rounded-2xl outline-none overflow-hidden animate-modal-in",
          "bg-white border border-slate-200/80",
          "shadow-[0_40px_100px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.8)]",
        )}
      >
        {/* Subtle ambient top accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-navy-900 via-azure-500 to-navy-900 pointer-events-none" />

        {/* Header */}
        <div className="px-8 pt-9 pb-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-azure-200 bg-azure-50 px-4 py-1.5 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-azure-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-azure-700">
              RZMedical
            </span>
          </div>

          <h1
            id="onboarding-title"
            className="font-display text-2xl font-black text-navy-900 sm:text-3xl tracking-tight mb-2"
          >
            Que recherchez-vous ?
          </h1>
          <p className="text-[15px] text-slate-500 max-w-md mx-auto leading-relaxed">
            Sélectionnez une catégorie pour découvrir les produits, nouveautés et offres qui vous correspondent.
          </p>
        </div>

        {/* Category Grid */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((cat) => {
              const visual = getCategoryVisual(cat.nom);
              const isSelected = selected === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={cn(
                    "group relative flex flex-col items-center gap-3 rounded-xl p-5 text-left transition-all duration-200 border-2 outline-none",
                    "focus-visible:ring-2 focus-visible:ring-azure-500 focus-visible:ring-offset-2",
                    isSelected
                      ? cn("border-azure-500 bg-azure-50", visual.glowClass, "scale-[0.98]")
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-[2px] hover:shadow-md",
                  )}
                >
                  {/* Icon */}
                  <span
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-200",
                      isSelected
                        ? cn(visual.bgClass, visual.borderClass, visual.colorClass)
                        : cn("bg-slate-100 border-slate-200 text-slate-500", `group-hover:${visual.bgClass}`, `group-hover:${visual.borderClass}`, `group-hover:${visual.colorClass}`),
                    )}
                  >
                    <visual.Icon />
                  </span>

                  {/* Name */}
                  <div className="text-center">
                    <div className={cn(
                      "text-[14px] font-bold transition-colors duration-200",
                      isSelected ? "text-azure-700" : "text-navy-900 group-hover:text-navy-700",
                    )}>
                      {cat.nom}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-tight hidden sm:block">
                      {cat._count?.sousCategories ?? 0} sous-catégories
                    </div>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-azure-500 text-white animate-scale-in">
                      <CheckIcon size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-[12px] text-slate-400">
            Vous pouvez changer de catégorie à tout moment depuis le menu de navigation.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
