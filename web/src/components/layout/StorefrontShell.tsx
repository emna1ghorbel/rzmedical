"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUI } from "@/providers/UIProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { cn } from "@/lib/cn";
import type { CategorieListItem, MarqueListItem } from "@/lib/types";
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

  const [openCatId, setOpenCatId] = useState<number | null>(null);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");

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

            <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* ── Catégories ─────────── */}
            {categories.length > 0 && (
              <div className="mb-8">
                <div className="mb-5 flex items-center justify-between px-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Explorer les catégories
                  </span>
                  <Link
                    href="/catalogue"
                    onClick={closeMobileMenu}
                    className="text-[12px] font-bold text-azure-600 hover:text-azure-700 hover:underline"
                  >
                    Tout voir
                  </Link>
                </div>

                <ul className="grid gap-2">
                  {categories.map((cat) => {
                    const subs = cat.sousCategories ?? [];
                    const isOpen = openCatId === cat.id;

                    return (
                      <li key={cat.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenCatId(isOpen ? null : cat.id)}
                          aria-expanded={isOpen}
                          className={cn(
                            "group flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all duration-300 border",
                            isOpen
                              ? "bg-white border-azure-200 shadow-[0_4px_16px_rgba(14,165,233,0.1),0_1px_0_rgba(255,255,255,1)_inset]"
                              : "bg-white/40 border-transparent text-navy-800 hover:bg-white hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]",
                          )}
                        >
                          <span className="flex items-center gap-3 text-[14px] font-bold">
                            <span className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                              isOpen
                                ? "bg-azure-50 text-azure-600"
                                : "bg-slate-100 text-slate-500 group-hover:bg-azure-50 group-hover:text-azure-500"
                            )}>
                              <PackageIcon size={16} className={cn("transition-transform duration-300", isOpen && "scale-110")} />
                            </span>
                            {cat.nom}
                            {subs.length > 0 && (
                              <span
                                className={cn(
                                  "ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[10px] font-black transition-colors",
                                  isOpen ? "bg-azure-500 text-white shadow-[0_2px_5px_rgba(14,165,233,0.4)]" : "bg-slate-200 text-slate-600",
                                )}
                              >
                                {subs.length}
                              </span>
                            )}
                          </span>
                          <ChevronDownIcon
                            size={16}
                            className={cn(
                              "shrink-0 transition-transform duration-400",
                              isOpen ? "rotate-180 text-azure-600" : "text-slate-400 group-hover:text-azure-500",
                            )}
                          />
                        </button>

                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-400 ease-out-quint relative",
                            isOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0",
                          )}
                        >
                          <div className="absolute left-[31px] top-2 bottom-2 w-px bg-gradient-to-b from-azure-200 to-transparent" />
                          <ul className="ml-[30px] pl-5 space-y-1 relative pb-2">
                            
                            <li>
                              <Link
                                href={`/catalogue?categorieId=${cat.id}`}
                                onClick={closeMobileMenu}
                                className="group/link flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-bold text-azure-600 transition-all hover:bg-azure-50 hover:shadow-sm"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-azure-400 group-hover/link:scale-125 transition-transform" />
                                Tous les produits
                              </Link>
                            </li>
                            {subs.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={`/catalogue?sousCategorieId=${sub.id}`}
                                  onClick={closeMobileMenu}
                                  className="group/link flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition-all hover:bg-white hover:text-navy-900 hover:shadow-sm border border-transparent hover:border-slate-100"
                                >
                                  <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300 group-hover/link:bg-azure-400 group-hover/link:scale-150 transition-all" />
                                  {sub.nom}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* ── Marques ─────────── */}
            {marques.length > 0 && (
              <div className="mb-8">
                <button
                  type="button"
                  onClick={() => setBrandsOpen(!brandsOpen)}
                  aria-expanded={brandsOpen}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-all duration-300",
                    brandsOpen
                      ? "bg-slate-50 border border-slate-200 text-navy-900 shadow-sm"
                      : "bg-transparent border border-transparent text-navy-800 hover:bg-slate-50 hover:border-slate-200",
                  )}
                >
                  <span className="flex items-center gap-3 text-[14px] font-bold">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", brandsOpen ? "bg-white border-slate-200 shadow-sm" : "border-transparent bg-slate-50 group-hover:bg-white group-hover:border-slate-200 group-hover:shadow-sm")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={brandsOpen ? "text-navy-900" : "text-slate-500"}>
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </span>
                    Nos Marques
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className={cn(
                      "shrink-0 transition-transform duration-400",
                      brandsOpen ? "rotate-180 text-navy-900" : "text-slate-400",
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-400 ease-out-quint",
                    brandsOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
                    <div className="relative mb-3">
                      <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une marque..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-[13px] font-medium outline-none transition-all focus:border-azure-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                      />
                    </div>
                    <ul className="grid max-h-56 gap-1 overflow-y-auto pr-1">
                      {filteredMarques.length === 0 ? (
                        <li className="py-4 text-center text-[12.5px] font-medium text-slate-400">Aucune marque trouvée.</li>
                      ) : (
                        filteredMarques.map((m) => (
                          <li key={m.id}>
                            <Link
                              href={`/catalogue?marqueId=${m.id}`}
                              onClick={closeMobileMenu}
                              className="flex items-center gap-3 rounded-xl p-2 text-[13px] font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-navy-900 hover:shadow-sm border border-transparent hover:border-slate-200"
                            >
                              {m.logo ? (
                                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm">
                                  <Image
                                    src={m.logo}
                                    alt={m.nom}
                                    fill
                                    sizes="32px"
                                    className="object-contain p-1"
                                  />
                                </div>
                              ) : (
                                <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-400 shadow-sm">
                                  {m.nom.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span>{m.nom}</span>
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
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
