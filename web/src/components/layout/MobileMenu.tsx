"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUI } from "@/providers/UIProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCart } from "@/providers/CartProvider";
import { useCategory } from "@/providers/CategoryProvider";
import { useCompany } from "@/providers/CompanyProvider";
import { Logo } from "@/components/ui/Logo";
import { imageUrl } from "@/lib/api";
import type { CategorieListItem, MarqueListItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  ChevronDownIcon,
  PackageIcon,
  SparklesIcon,
  TagIcon,
  UserIcon,
  HomeIcon,
  CartIcon,
  InfoIcon,
  MailIcon,
  SearchIcon,
  XIcon,
} from "@/components/ui/icons";

export function MobileMenu({
  categories = [],
  marques = [],
}: {
  categories?: CategorieListItem[];
  marques?: MarqueListItem[];
}) {
  const { mobileMenuOpen, closeMobileMenu } = useUI();
  const { isAuthenticated, user } = useAuth();
  const { openCart, count } = useCart();
  const { selectedCategory, categorySlug } = useCategory();
  const company = useCompany();

  const [openCatId, setOpenCatId] = useState<number | null>(null);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

  const ref = useFocusTrap<HTMLElement>(mobileMenuOpen);

  // Close on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen, closeMobileMenu]);

  // Reset state when menu closes
  useEffect(() => {
    if (!mobileMenuOpen) {
      setOpenCatId(null);
      setBrandsOpen(false);
      setBrandSearch("");
    }
  }, [mobileMenuOpen]);

  const filteredMarques = useMemo(() => {
    if (!brandSearch.trim()) return marques;
    const q = brandSearch.toLowerCase();
    return marques.filter((m) => m.nom.toLowerCase().includes(q));
  }, [marques, brandSearch]);

  // Si une catégorie est sélectionnée, on cible ses sous-catégories.
  // Sinon on retombe sur la liste complète des catégories.
  const activeCat = selectedCategory
    ? categories.find((c) => c.id === selectedCategory.id) ?? selectedCategory
    : null;
  const activeSubs = activeCat?.sousCategories ?? [];
  const catAccordionLabel = activeCat
    ? "Explorer les sous-catégories"
    : "Explorer les catégories";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-400 lg:hidden",
        mobileMenuOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      )}
      aria-hidden={!mobileMenuOpen}
    >
      {/* Semi-transparent dark overlay with enhanced blur */}
      <div
        onClick={closeMobileMenu}
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-xl transition-opacity duration-400"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation principale"
        tabIndex={-1}
        className={cn(
          "absolute left-0 top-0 flex h-full w-[85%] max-w-[360px] flex-col bg-white/80 backdrop-blur-lg border-border/70 shadow-2xl transition-transform duration-400 cubic-bezier(0.16, 1, 0.3, 1) outline-none",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-border/50 px-5 pt-4">
          <Link
            href={categorySlug ? `/${categorySlug}` : "/"}
            onClick={closeMobileMenu}
            aria-label={`${company?.nomSociete || "RZMedical"} - Accueil`}
            className="shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-azure-500/50 transition-all duration-300 hover:scale-105"
          >
            <Logo tone="dark" className="h-11 w-auto" />
          </Link>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-navy-600 hover:bg-navy-50/50 hover:text-navy-900 transition-all duration-300 transform-group-hover-scale-110"
            aria-label="Fermer le menu"
          >
            <XIcon size={22} strokeWidth={2} className="transition-transform duration-300" />
          </button>
        </div>

        {/* Scrollable links */}
        <nav
          aria-label="Navigation mobile"
          className="flex-1 overflow-y-auto px-5 pt-4 pb-8"
        >
          {/* Quick links */}
          <ul className="mb-6 grid gap-0.75">
            <li>
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl px-5 py-3 text-base font-medium transition-all duration-300",
                  "text-navy-900 hover:bg-navy-50",
                  "hover:text-navy-950"
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50/90 backdrop-blur-sm text-navy-600/90 transition-all duration-300 group-hover:bg-navy-900 group-hover:text-white">
                  <HomeIcon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                </span>
                Accueil
              </Link>
            </li>
            <li>
              <Link
                href="/catalogue?promo=1"
                onClick={closeMobileMenu}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl px-5 py-3 text-base font-medium transition-all duration-300",
                  "text-error hover:bg-error/50",
                  "hover:text-error"
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/50 backdrop-blur-sm text-error/90 transition-all duration-300 group-hover:bg-error group-hover:text-white">
                  <TagIcon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                </span>
                Promotions
              </Link>
            </li>
            <li>
              <Link
                href="/catalogue?filter=new"
                onClick={closeMobileMenu}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl px-5 py-3 text-base font-medium transition-all duration-300",
                  "text-azure-600 hover:bg-azure-50",
                  "hover:text-azure-700"
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-azure-50 backdrop-blur-sm text-azure-600/90 transition-all duration-300 group-hover:bg-azure-600 group-hover:text-white">
                  <SparklesIcon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                </span>
                Nouveautés
              </Link>
            </li>
            <li>
              <Link
                href="/catalogue"
                onClick={closeMobileMenu}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl px-5 py-3 text-base font-medium transition-all duration-300",
                  "text-navy-900 hover:bg-navy-50",
                  "hover:text-navy-950"
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 backdrop-blur-sm text-navy-600/90 transition-all duration-300 group-hover:bg-navy-900 group-hover:text-white">
                  <PackageIcon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                </span>
                Catalogue complet
              </Link>
            </li>
          </ul>

          {/* Category-specific quick links (when a category is active) */}
          {selectedCategory && (
            <>
              <div className="my-4 h-[1px] bg-border/50" />
              <p className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.14em] text-azure-600">
                {selectedCategory.nom}
              </p>
              <ul className="mb-6 grid gap-0.75">
                {[
                  { href: `/${categorySlug}`, label: "Accueil", icon: HomeIcon, color: "text-navy-900 hover:bg-navy-50", iconBg: "bg-navy-50 group-hover:bg-navy-900 group-hover:text-white" },
                  { href: `/${categorySlug}/nouveautes`, label: "Nouveautés", icon: SparklesIcon, color: "text-azure-600 hover:bg-azure-50", iconBg: "bg-azure-50 group-hover:bg-azure-600 group-hover:text-white" },
                  { href: `/${categorySlug}/promotions`, label: "Promotions", icon: TagIcon, color: "text-error hover:bg-error/5", iconBg: "bg-error/10 group-hover:bg-error group-hover:text-white" },
                  { href: `/${categorySlug}/sous-categories`, label: "Rayons", icon: PackageIcon, color: "text-navy-900 hover:bg-navy-50", iconBg: "bg-navy-50 group-hover:bg-navy-900 group-hover:text-white" },
                  { href: `/${categorySlug}/marques`, label: "Marques", icon: PackageIcon, color: "text-navy-900 hover:bg-navy-50", iconBg: "bg-navy-50 group-hover:bg-navy-900 group-hover:text-white" },
                ].map(({ href, label, icon: Icon, color, iconBg }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "group flex w-full items-center gap-4 rounded-xl px-5 py-3 text-[15px] font-medium transition-all duration-300",
                        color
                      )}
                    >
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-current transition-all duration-300", iconBg)}>
                        <Icon size={17} className="transition-transform duration-300 group-hover:scale-110" />
                      </span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="my-6 h-[1px] bg-border/50" />

          {/* Catégories Accordion */}
          <>
            <button
              type="button"
              onClick={() => setOpenCatId(openCatId === -1 ? null : -1)}
              aria-expanded={openCatId === -1}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-5 py-4 text-left text-base font-medium transition-all duration-300",
                openCatId === -1
                  ? "bg-azure-50/60 backdrop-blur-sm text-azure-700 hover:bg-azure-100"
                  : "text-navy-800 hover:bg-navy-50 hover:text-navy-900"
              )}
            >
              <span className="flex items-center gap-3">
                <PackageIcon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                Explorer les sous-catégories
              </span>
              <ChevronDownIcon
                size={18}
                className={cn(
                  "shrink-0 transition-transform duration-400",
                  openCatId === -1 ? "rotate-180 text-azure-600 transition-transform duration-400" : "text-slate-400 group-hover:text-slate-500"
                )}
              />
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)",
                openCatId === -1 ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="ml-4 mt-3 border-l-2 border-azure-100/50 pl-4">
                {activeCat ? (
                  // --- Mode "sous-catégories de la catégorie sélectionnée" ---
                  <>
                    <Link
                      href={`/${categorySlug}`}
                      onClick={closeMobileMenu}
                      className="mb-4 block w-full rounded-xl px-4 py-3 text-base font-medium text-azure-600 hover:bg-azure-50 hover:text-azure-700 transition-all duration-300"
                    >
                      ← Toute la catégorie {activeCat.nom}
                    </Link>

                    {activeSubs.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-400">
                        Aucune sous-catégorie disponible.
                      </p>
                    ) : (
                      <ul className="grid gap-0.75">
                        {activeSubs.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/catalogue?sousCategorieId=${sub.id}`}
                              onClick={closeMobileMenu}
                              className="block w-full rounded-xl px-4 py-3 text-base font-medium text-navy-700 hover:bg-navy-50 hover:text-navy-900 transition-all duration-300"
                            >
                              {sub.nom}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  // No category selected: show a placeholder message
                  <p className="px-3 py-2 text-sm text-slate-400">
                    Veuillez sélectionner une catégorie pour voir ses sous-catégories.
                  </p>
                )}
              </div>
            </div>
          </>

          <div className="my-6 h-[1px] bg-border/50" />

          {/* Marques Grid */}
          {marques.length > 0 && (
            <div>
              <p className="mb-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Marques
              </p>

              {/* Search */}
              <div className="relative mb-4">
                <SearchIcon
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400/80"
                />
                <input
                  type="text"
                  placeholder="Rechercher une marque..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm py-2.5 pl-9 pr-4 text-[13px] font-medium outline-none transition-all duration-300 focus:border-azure-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                />
              </div>

              {/* Grid */}
              <div className="max-h-[420px] overflow-y-auto overscroll-contain pr-1">
                {filteredMarques.length === 0 ? (
                  <p className="py-6 text-center text-[13px] font-medium text-slate-400">
                    Aucune marque trouvée.
                  </p>
                ) : (
                  <ul className="grid grid-cols-4 gap-2">
                    {filteredMarques.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/catalogue?marqueId=${m.id}`}
                          onClick={closeMobileMenu}
                          className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-azure-200 hover:shadow-[0_4px_12px_rgba(14,165,233,0.1)] active:scale-[0.97]"
                        >
                          {m.logo ? (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                              <Image
                                src={imageUrl(m.logo)}
                                alt={m.nom}
                                fill
                                sizes="48px"
                                unoptimized
                                className="object-contain p-0.5"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[16px] font-bold text-slate-400">
                              {m.nom.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="w-full truncate text-center text-[10px] font-bold uppercase tracking-wide text-navy-700 group-hover:text-azure-600">
                            {m.nom}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="my-6 h-[1px] bg-border/50" />

          {/* Compte & Panier */}
          <ul className="grid gap-0.75">
            <li>
              <Link
                href={isAuthenticated ? "/compte" : "/connexion"}
                onClick={closeMobileMenu}
                className={cn(
                  "group flex w-full items-center gap-4 rounded-xl px-5 py-4 text-base font-medium transition-all duration-300",
                  "text-navy-900 hover:bg-navy-50",
                  "hover:text-navy-950"
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50/90 backdrop-blur-sm text-navy-600/90 transition-all duration-300 group-hover:bg-navy-900 group-hover:text-white">
                  <UserIcon size={20} className="transition-transform duration-300 group-hover:scale-110" />
                </span>
                {isAuthenticated
                  ? user?.prenom
                    ? `Mon Compte (${user.prenom})`
                    : "Mon compte"
                  : "Se connecter / S'inscrire"}
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  openCart();
                }}
                className={cn(
                  "group flex w-full cursor-pointer items-center justify-between rounded-xl px-5 py-4 text-base font-medium transition-all duration-300",
                  "text-navy-900 hover:bg-navy-50",
                  "hover:text-navy-950"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50/90 backdrop-blur-sm text-navy-600/90 transition-all duration-300 group-hover:bg-navy-900 group-hover:text-white">
                    <CartIcon size={20} className="transition-transform duration-300 group-hover:scale-110" />
                  </span>
                  Panier
                </div>
                {count > 0 && (
                  <span className="flex h-9 w-[2.5rem] items-center justify-center rounded-full bg-azure-500/90 backdrop-blur-sm text-[12px] font-bold text-white shadow-inner ring-2 ring-white/20 motion-safe:animate-badge-bump">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            </li>
          </ul>

          <div className="my-6 h-[1px] bg-border/50" />

          {/* Footer links */}
          <ul className="grid gap-0.75 pb-6">
            <li>
              <Link
                href="/a-propos"
                onClick={closeMobileMenu}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-5 py-3 text-base font-medium transition-all duration-300",
                  "text-navy-600 hover:bg-navy-50",
                  "hover:text-navy-900"
                )}
              >
                <InfoIcon size={18} className="transition-transform duration-300 group-hover:scale-110 text-slate-400/80" />
                À propos de nous
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                onClick={closeMobileMenu}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-5 py-3 text-base font-medium transition-all duration-300",
                  "text-navy-600 hover:bg-navy-50",
                  "hover:text-navy-900"
                )}
              >
                <MailIcon size={18} className="transition-transform duration-300 group-hover:scale-110 text-slate-400/80" />
                Contactez-nous
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
  console.log("DEBUG selectedCategory:", selectedCategory);
  console.log("DEBUG categorySlug:", categorySlug);
  console.log("DEBUG activeCat:", activeCat);
}