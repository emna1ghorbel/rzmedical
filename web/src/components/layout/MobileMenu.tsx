"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUI } from "@/providers/UIProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useCart } from "@/providers/CartProvider";
import { Logo } from "@/components/ui/Logo";
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
            href="/"
            onClick={closeMobileMenu}
            aria-label="RZmedical — Accueil"
            className="group relative flex-shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-azure-500/50 transition-all duration-300 hover:scale-105"
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

          <div className="my-6 h-[1px] bg-border/50" />

          {/* Catégories Accordion */}
          {categories.length > 0 && (
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
                  Catégories
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
                  <Link
                    href="/catalogue"
                    onClick={closeMobileMenu}
                    className={cn(
                      "mb-4 block w-full rounded-xl px-4 py-3 text-base font-medium transition-all duration-300",
                      "text-azure-600 hover:bg-azure-50",
                      "hover:text-azure-700"
                    )}
                  >
                    ← Tout le catalogue
                  </Link>

                  {categories.map((cat) => {
                    const subs = cat.sousCategories ?? [];
                    return (
                      <div key={cat.id} className="mb-5">
                        <p className="mb-2 px-3 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                          {cat.nom}
                        </p>
                        <ul className="grid gap-0.75">
                          {subs.length === 0 ? (
                            <li>
                              <Link
                                href={`/catalogue?categorieId=${cat.id}`}
                                onClick={closeMobileMenu}
                                className={cn(
                                  "block w-full rounded-xl px-4 py-3 text-base font-medium transition-all duration-300",
                                  "text-navy-700 hover:bg-navy-50",
                                  "hover:text-navy-900"
                                )}
                              >
                                Tous les produits
                              </Link>
                            </li>
                          ) : (
                            subs.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={`/catalogue?sousCategorieId=${sub.id}`}
                                  onClick={closeMobileMenu}
                                  className={cn(
                                    "block w-full rounded-xl px-4 py-3 text-base font-medium transition-all duration-300",
                                    "text-navy-700 hover:bg-navy-50",
                                    "hover:text-navy-900"
                                  )}
                                >
                                  {sub.nom}
                                </Link>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="my-6 h-[1px] bg-border/50" />

          {/* Marques Accordion */}
          {marques.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setBrandsOpen(!brandsOpen)}
                aria-expanded={brandsOpen}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-5 py-4 text-left text-base font-medium transition-all duration-300",
                  brandsOpen
                    ? "bg-azure-50/60 backdrop-blur-sm text-azure-700 hover:bg-azure-100"
                    : "text-navy-800 hover:bg-navy-50 hover:text-navy-900"
                )}
              >
                <span className="flex items-center gap-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Nos Marques
                </span>
                <ChevronDownIcon
                  size={18}
                  className={cn(
                    "shrink-0 transition-transform duration-400",
                    brandsOpen ? "rotate-180 text-azure-600 transition-transform duration-400" : "text-slate-400 group-hover:text-slate-500"
                  )}
                />
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)",
                  brandsOpen ? "max-h-[650px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="ml-4 mt-3 border-l-2 border-azure-100/50 pl-4">
                  <div className="relative mb-4">
                    <SearchIcon
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400/80"
                    />
                    <input
                      type="text"
                      placeholder="Rechercher une marque..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full rounded-xl border border-border/50 bg-white/80 backdrop-blur-sm py-4 pl-10 pr-5 text-base font-medium outline-none transition-all duration-300 focus:border-azure-500 focus:ring-azure-500/20 focus:bg-white"
                    />
                  </div>

                  <ul className="grid max-h-[400px] gap-0.75 overflow-y-auto">
                    {filteredMarques.length === 0 ? (
                      <li className="py-4 text-center text-base font-medium text-slate-400">
                        Aucune marque trouvée.
                      </li>
                    ) : (
                      filteredMarques.map((m) => (
                        <li key={m.id}>
                          <Link
                            href={`/catalogue?marqueId=${m.id}`}
                            onClick={closeMobileMenu}
                            className={cn(
                              "flex w-full items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-all duration-300",
                              "text-navy-700 hover:bg-navy-50",
                              "hover:text-navy-900"
                            )}
                          >
                            {m.logo ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/90 backdrop-blur-sm border border-border/50">
                                <Image
                                  src={m.logo}
                                  alt={m.nom}
                                  fill
                                  sizes="40px"
                                  className="object-contain p-1"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50/80 backdrop-blur-sm flex items-center justify-center text-base font-semibold text-slate-400/80">
                                {m.nom.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="truncate">{m.nom}</span>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </>
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
}
