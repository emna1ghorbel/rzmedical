"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUI } from "@/providers/UIProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useCategory } from "@/providers/CategoryProvider";
import { cn } from "@/lib/cn";
import type { CategorieListItem, MarqueListItem } from "@/lib/types";
import { imageUrl } from "@/lib/api";
import type { ReactNode } from "react";
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

const SIDEBAR_W = 340;

export function StorefrontShell({
  children,
  categories = [],
  marques = [],
}: {
  children: ReactNode;
  categories?: CategorieListItem[];
  marques?: MarqueListItem[];
}) {
  const { mobileMenuOpen, closeMobileMenu } = useUI();
  const { isAuthenticated, user } = useAuth();
  const { openCart, count } = useCart();
  const { selectedCategory, categorySlug } = useCategory();

  const [subCatOpen, setSubCatOpen] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

  useEffect(() => {
    if (!mobileMenuOpen) {
      setSubCatOpen(false);
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
  const activeCat = selectedCategory
    ? categories.find((c) => c.id === selectedCategory.id) ?? selectedCategory
    : null;
  const activeSubs = activeCat?.sousCategories ?? [];

  const hasDiscountBar = isAuthenticated && Boolean(user?.remise && user.remise > 0);
  const topOffset = 112 + (hasDiscountBar ? 37 : 0);

  return (
    <>
      {/* ── Sidebar (Premium Light Theme 3D) ────────────────────── */}
      <div
        id="sidebar-nav"
        aria-hidden={!mobileMenuOpen}
        role="complementary"
        aria-label="Menu de navigation"
        className="fixed left-0 z-30 overflow-hidden bg-white/90 backdrop-blur-3xl border-r border-slate-200/60 shadow-[20px_0_60px_rgba(0,0,0,0.06),_1px_0_0_rgba(255,255,255,0.8)_inset] transition-all duration-500 ease-out-quint"
        style={{
          top: topOffset,
          width: mobileMenuOpen ? SIDEBAR_W : 0,
          height: `calc(100vh - ${topOffset}px)`,
        }}
      >
        <div
          className="flex h-full flex-col overflow-y-auto overscroll-contain relative"
          style={{ width: SIDEBAR_W }}
        >
          {/* Ambient Glows inside the sidebar */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-azure-200/20 rounded-full blur-[80px] pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-[80px] pointer-events-none -z-10" />
          
          <div className="absolute inset-0 grid-pattern opacity-[0.05] pointer-events-none -z-10" />

          {/* Sidebar logo row */}
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/50 px-7 relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-white pointer-events-none" />
            <span className="flex-shrink-0 text-[14px] font-black text-navy-900 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-azure-500 animate-pulse" />
              Menu
            </span>
            <button
              onClick={closeMobileMenu}
              aria-label="Fermer le menu"
              className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-navy-900 shadow-sm transition-all duration-300"
            >
              <XIcon size={18} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>

          {/* Sidebar navigation */}
          <nav aria-label="Navigation latérale" className="flex-1 overflow-y-auto px-4 py-6 z-10">
            {/* ── Liens rapides ───────────────────────────────── */}
            <ul className="mb-8 grid gap-2.5">
              {[
                { href: "/", label: "Accueil", Icon: HomeIcon, color: "azure" },
                { href: "/catalogue?promo=1", label: "Promotions", Icon: TagIcon, color: "error" },
                { href: "/catalogue?filter=new", label: "Nouveautés", Icon: SparklesIcon, color: "amber" },
                { href: "/catalogue", label: "Catalogue", Icon: PackageIcon, color: "navy" },
              ].map(({ href, label, Icon, color }) => (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={closeMobileMenu}
                    className="group flex w-full items-center gap-4 rounded-2xl bg-white/50 border border-slate-200/60 p-2.5 pr-5 text-[15px] font-bold text-navy-900 transition-all duration-300 hover:bg-white hover:border-azure-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,1)_inset]"
                  >
                    <span className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 border bg-gradient-to-br shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                      color === "azure" && "from-azure-50 to-white border-azure-100 text-azure-600 group-hover:scale-105 group-hover:border-azure-200 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.2)]",
                      color === "error" && "from-red-50 to-white border-red-100 text-red-500 group-hover:scale-105 group-hover:border-red-200 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
                      color === "amber" && "from-amber-50 to-white border-amber-100 text-amber-500 group-hover:scale-105 group-hover:border-amber-200 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                      color === "navy" && "from-slate-50 to-white border-slate-200 text-slate-600 group-hover:scale-105 group-hover:border-slate-300 group-hover:text-navy-900 group-hover:shadow-[0_0_15px_rgba(0,0,0,0.06)]"
                    )}>
                      <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
                    </span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* ── Category-specific quick links (when a category is active) ── */}
            {selectedCategory && (
              <>
                <div className="mb-4 flex items-center justify-between px-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-azure-600">
                    {selectedCategory.nom}
                  </span>
                </div>
                <ul className="mb-8 grid gap-2.5">
                  {[
                    { href: `/${categorySlug}`, label: "Accueil", Icon: HomeIcon, color: "azure" },
                    { href: `/${categorySlug}/nouveautes`, label: "Nouveautés", Icon: SparklesIcon, color: "amber" },
                    { href: `/${categorySlug}/promotions`, label: "Promotions", Icon: TagIcon, color: "error" },
                    { href: `/${categorySlug}/sous-categories`, label: "Rayons", Icon: PackageIcon, color: "navy" },
                    { href: `/${categorySlug}/marques`, label: "Marques", Icon: PackageIcon, color: "navy" },
                  ].map(({ href, label, Icon, color }, idx) => (
                    <li key={`${label}-${idx}`}>
                      <Link
                        href={href}
                        onClick={closeMobileMenu}
                        className="group flex w-full items-center gap-4 rounded-2xl bg-white/50 border border-slate-200/60 p-2.5 pr-5 text-[15px] font-bold text-navy-900 transition-all duration-300 hover:bg-white hover:border-azure-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,1)_inset]"
                      >
                        <span className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 border bg-gradient-to-br shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
                          color === "azure" && "from-azure-50 to-white border-azure-100 text-azure-600 group-hover:scale-105 group-hover:border-azure-200 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.2)]",
                          color === "error" && "from-red-50 to-white border-red-100 text-red-500 group-hover:scale-105 group-hover:border-red-200 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
                          color === "amber" && "from-amber-50 to-white border-amber-100 text-amber-500 group-hover:scale-105 group-hover:border-amber-200 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                          color === "navy" && "from-slate-50 to-white border-slate-200 text-slate-600 group-hover:scale-105 group-hover:border-slate-300 group-hover:text-navy-900 group-hover:shadow-[0_0_15px_rgba(0,0,0,0.06)]"
                        )}>
                          <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
                        </span>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* ── Explorer les sous-catégories ─────────── */}
            <div className="mb-8">
              <div className="mb-5 flex items-center justify-between px-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Explorer les sous-catégories
                </span>
                {activeSubs.length > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-azure-100 px-2 text-[10px] font-black text-azure-600">
                    {activeSubs.length}
                  </span>
                )}
              </div>

              {activeCat ? (
                <ul className="grid gap-2">
                  {activeSubs.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-white/40 px-4 py-4 text-center text-[13px] font-medium text-slate-400">
                      Aucune sous-catégorie disponible.
                    </li>
                  ) : (
                    activeSubs.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/catalogue?sousCategorieId=${sub.id}`}
                          onClick={closeMobileMenu}
                          className="group flex w-full items-center gap-3.5 rounded-2xl bg-white border border-slate-200/60 px-4 py-3 text-[14px] font-semibold text-navy-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-azure-200 hover:bg-white hover:shadow-[0_4px_16px_rgba(14,165,233,0.08),0_1px_0_rgba(255,255,255,1)_inset] hover:text-azure-700"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-400 transition-all duration-300 group-hover:bg-azure-50 group-hover:border-azure-200 group-hover:text-azure-500 group-hover:shadow-[0_0_10px_rgba(14,165,233,0.15)]">
                            <PackageIcon size={15} className="transition-transform duration-300 group-hover:scale-110" />
                          </span>
                          <span className="flex-1 truncate">{sub.nom}</span>
                          <ChevronDownIcon size={14} className="shrink-0 -rotate-90 text-slate-300 transition-all duration-300 group-hover:text-azure-400 group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 px-4 py-5 text-center">
                  <p className="text-[13px] font-medium text-slate-400">
                    Sélectionnez une catégorie pour voir ses sous-catégories.
                  </p>
                </div>
              )}
            </div>

            <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* ── Marques ─────────── */}
            {marques.length > 0 && (
              <div className="mb-8">
                <p className="mb-5 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Marques
                </p>

                <div className="max-h-[420px] overflow-y-auto overscroll-contain pr-1">
                  <ul className="grid grid-cols-4 gap-2">
                    {marques.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/catalogue?marqueId=${m.id}`}
                          onClick={closeMobileMenu}
                          className="group flex flex-col items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-azure-200 hover:shadow-[0_4px_12px_rgba(14,165,233,0.1)]"
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
                </div>
              </div>
            )}

            <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* ── Compte & Panier ──────────────────────────── */}
            <div className="mb-8">
              <span className="mb-4 block px-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                Mon Espace
              </span>
              <ul className="grid gap-2.5">
                <li>
                  <Link
                    href={isAuthenticated ? "/compte" : "/connexion"}
                    onClick={closeMobileMenu}
                    className="group flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-2.5 pr-5 text-[14px] font-bold text-navy-900 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all group-hover:bg-azure-50 group-hover:text-azure-600 border border-slate-200">
                      <UserIcon size={18} />
                    </span>
                    {isAuthenticated
                      ? user?.prenom ? `${user.prenom}` : "Mon compte"
                      : "Se connecter / S'inscrire"}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => { closeMobileMenu(); openCart(); }}
                    className="group flex w-full cursor-pointer items-center justify-between rounded-2xl bg-white border border-slate-200 p-2.5 pr-5 text-[14px] font-bold text-navy-900 shadow-sm transition-all hover:border-azure-300 hover:shadow-[0_4px_12px_rgba(14,165,233,0.1)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all group-hover:bg-azure-500 group-hover:text-white border border-slate-200 group-hover:border-azure-500">
                        <CartIcon size={18} />
                      </span>
                      Panier
                    </div>
                    {count > 0 && (
                      <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-azure-500 px-2 text-[11px] font-black text-white shadow-[0_2px_5px_rgba(14,165,233,0.4)]">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </div>

            {/* ── Liens secondaires ────────────────────────── */}
            <ul className="flex justify-center gap-4 pb-8">
              <li>
                <Link
                  href="/a-propos"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[12px] font-bold text-slate-500 transition-all hover:bg-white hover:text-navy-900 hover:shadow-sm"
                >
                  <InfoIcon size={14} className="text-slate-400" />
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[12px] font-bold text-slate-500 transition-all hover:bg-white hover:text-navy-900 hover:shadow-sm"
                >
                  <MailIcon size={14} className="text-slate-400" />
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div 
        className="flex min-w-0 flex-1 flex-col"
        style={{
          marginLeft: mobileMenuOpen ? SIDEBAR_W : 0,
          transition: "margin-left 500ms cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Shadow overlay over main content when menu is open */}
        <div 
          className={cn(
            "fixed inset-0 z-20 bg-slate-900/10 backdrop-blur-[1px] transition-opacity duration-500 pointer-events-none lg:hidden",
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          )}
          aria-hidden="true"
        />
        {children}
      </div>
    </>
  );
}
