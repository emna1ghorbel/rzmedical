"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useUI } from "@/providers/UIProvider";
import { Logo } from "@/components/ui/Logo";
import {
  CartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { CategorieListItem, MarqueListItem } from "@/lib/types";

export function Header({
  categories = [],
  marques = [],
  isTransparent = false,
  hideLogo = false,
}: {
  categories?: CategorieListItem[];
  marques?: MarqueListItem[];
  isTransparent?: boolean;
  hideLogo?: boolean;
}) {
  const { count, openCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { openSearch, mobileMenuOpen, toggleMobileMenu } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isGlass = isTransparent && !scrolled;

  return (
    <header
      className={cn(
        "w-full transition-all duration-500 ease-out",
        isGlass
          ? "bg-transparent border-b border-white/10 shadow-none"
          : scrolled && isTransparent
          ? "bg-navy-960/85 backdrop-blur-3xl border-b border-white/[0.08] shadow-[0_1px_0_rgba(255,255,255,0.05),0_12px_40px_rgba(0,0,0,0.5)]"
          : "bg-white/90 backdrop-blur-3xl border-b border-white shadow-[0_1px_0_rgba(255,255,255,1),0_8px_32px_rgba(12,35,64,0.08)]"
      )}
    >
      {/* Glossy top line (only visible in solid light mode) */}
      {!isGlass && (!scrolled || !isTransparent) && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-azure-500/30 to-transparent pointer-events-none" />
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[76px] lg:gap-8 lg:px-8 relative">

        {/* Hamburger */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Ouvrir le menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="sidebar-nav"
          className={cn(
            "-ml-2 group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden border border-transparent",
            isGlass
              ? "text-white/90 hover:bg-white/10 hover:border-white/20 hover:text-white"
              : "text-navy-700 hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm"
          )}
        >
          <MenuIcon size={24} className="transition-transform duration-300 group-hover:scale-110" />
        </button>

        {/* Brand Logo */}
        <Link
          href="/"
          aria-label="RZmedical — Accueil"
          className={cn(
            "shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-azure-500 transition-all duration-400 hover:scale-[1.04]",
            hideLogo ? "opacity-0 pointer-events-none" : "opacity-100",
            isGlass && "drop-shadow-[0_2px_12px_rgba(14,165,233,0.4)]"
          )}
        >
          <Logo tone={isGlass || (scrolled && isTransparent) ? "light" : "dark"} className="h-9 w-auto lg:h-10" />
        </Link>

        {/* Search Bar (Desktop center) */}
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <button
            type="button"
            onClick={openSearch}
            className={cn(
              "group relative flex h-12 w-full max-w-[460px] items-center gap-3 rounded-2xl border px-5 text-left text-[14px] font-medium transition-all duration-400 focus-visible:outline-none overflow-hidden",
              isGlass || (scrolled && isTransparent)
                ? "border-white/10 bg-white/[0.05] backdrop-blur-md text-white/60 hover:bg-white/[0.1] hover:border-white/25 hover:text-white/90 shadow-inner"
                : "border-slate-200/80 bg-slate-100/50 text-slate-500 hover:bg-white hover:border-azure-300 hover:shadow-[0_4px_20px_rgba(14,165,233,0.1)] hover:text-navy-900"
            )}
          >
            {/* Gloss reflection on light theme hover */}
            {!(isGlass || (scrolled && isTransparent)) && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
            )}
            
            <SearchIcon
              size={18}
              className={cn(
                "shrink-0 transition-transform duration-300 group-hover:scale-110",
                isGlass || (scrolled && isTransparent) ? "text-white/50 group-hover:text-azure-300" : "text-slate-400 group-hover:text-azure-500"
              )}
            />
            <span className="flex-1 truncate relative z-10">
              Rechercher un produit, une marque...
            </span>
            <div className={cn(
              "hidden flex-shrink-0 items-center justify-center rounded-lg px-2.5 py-1 text-[10px] font-bold xl:flex border transition-all duration-300 relative z-10",
              isGlass || (scrolled && isTransparent)
                ? "bg-white/10 text-white/70 border-white/10"
                : "bg-white text-slate-400 border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] group-hover:border-azure-200 group-hover:text-azure-600 group-hover:bg-azure-50"
            )}>
              <span className="mr-0.5 opacity-70">⌘</span>K
            </div>
          </button>
        </div>

        {/* Actions (Right) */}
        <div className="ml-auto flex shrink-0 items-center gap-3">

          {/* Search (Mobile icon) */}
          <button
            type="button"
            onClick={openSearch}
            aria-label="Rechercher"
            className={cn(
              "lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 border border-transparent",
              isGlass || (scrolled && isTransparent)
                ? "text-white/90 hover:bg-white/10 hover:border-white/20 hover:text-white"
                : "text-navy-700 hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm"
            )}
          >
            <SearchIcon size={22} />
          </button>

          <div className={cn("hidden h-6 w-[2px] rounded-full lg:block", isGlass || (scrolled && isTransparent) ? "bg-white/10" : "bg-slate-200")} />

          {/* Account / Login (Desktop) */}
          <Link
            href={isAuthenticated ? "/compte" : "/connexion"}
            aria-label={isAuthenticated ? "Mon compte" : "Se connecter"}
            className={cn(
              "group hidden lg:inline-flex h-11 items-center gap-3 rounded-2xl px-5 text-[14px] font-bold transition-all duration-300 border",
              isGlass || (scrolled && isTransparent)
                ? "border-white/10 bg-white/[0.05] text-white/90 hover:bg-white/[0.12] hover:border-white/25 hover:text-white shadow-inner"
                : "border-slate-200 bg-white text-navy-800 hover:border-azure-300 hover:text-azure-700 hover:bg-azure-50/30 shadow-sm hover:shadow-md hover:-translate-y-[1px]"
            )}
          >
            <span className={cn(
              "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-300",
              isGlass || (scrolled && isTransparent)
                ? "bg-white/10 text-white group-hover:bg-azure-500/30 group-hover:text-azure-300 group-hover:scale-110"
                : "bg-slate-100 text-slate-500 group-hover:bg-azure-100 group-hover:text-azure-600 group-hover:scale-110"
            )}>
              <UserIcon size={15} />
            </span>
            <span className="hidden xl:inline max-w-[110px] truncate relative z-10">
              {isAuthenticated
                ? user?.prenom
                  ? `${user.prenom}`
                  : "Mon compte"
                : "Connexion"}
            </span>
          </Link>

          {/* Account (Mobile) */}
          <Link
            href={isAuthenticated ? "/compte" : "/connexion"}
            aria-label={isAuthenticated ? "Mon compte" : "Se connecter"}
            className={cn(
              "lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 border",
              isGlass || (scrolled && isTransparent)
                ? "border-white/10 bg-white/[0.05] text-white/90 hover:bg-white/[0.12] hover:border-white/20 hover:scale-[1.05]"
                : "border-slate-200 bg-white text-navy-700 hover:border-azure-300 hover:text-azure-600 shadow-sm hover:shadow-md hover:scale-[1.05]"
            )}
          >
            <UserIcon size={20} />
          </Link>

          {/* Cart (Desktop) */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Panier (${count} article${count > 1 ? "s" : ""})`}
            className={cn(
              "group relative hidden lg:inline-flex h-11 items-center gap-3 rounded-2xl px-5 text-[14px] font-bold transition-all duration-300 border overflow-hidden",
              isGlass || (scrolled && isTransparent)
                ? "border-azure-400/30 bg-azure-500/20 text-white hover:bg-azure-500/30 hover:border-azure-400/60 shadow-[0_0_20px_rgba(14,165,233,0.15)] hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:-translate-y-[1px]"
                : "border-transparent bg-gradient-to-b from-azure-500 to-azure-600 text-white hover:from-azure-400 hover:to-azure-500 shadow-[0_4px_12px_rgba(14,165,233,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-[1px]"
            )}
          >
            {/* Button glare */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[scanLine_1.5s_ease-in-out] pointer-events-none" />

            <CartIcon size={19} className="transition-transform duration-300 group-hover:scale-110 relative z-10" />
            <span className="hidden xl:inline relative z-10">Panier</span>
            {count > 0 && (
              <span className={cn(
                "relative z-10 flex h-5.5 min-w-[1.375rem] px-1.5 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300 motion-safe:animate-badge-bump",
                isGlass || (scrolled && isTransparent)
                  ? "bg-white text-azure-700 shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                  : "bg-white text-azure-700 shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
              )}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          {/* Cart (Mobile) */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Panier (${count} article${count > 1 ? "s" : ""})`}
            className={cn(
              "lg:hidden relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300 border overflow-hidden",
              isGlass || (scrolled && isTransparent)
                ? "border-azure-400/30 bg-azure-500/20 text-white hover:bg-azure-500/30 hover:border-azure-400/60 shadow-[0_0_15px_rgba(14,165,233,0.2)] hover:scale-[1.05]"
                : "border-transparent bg-gradient-to-b from-azure-500 to-azure-600 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.05]"
            )}
          >
            <CartIcon size={20} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] px-0.5 items-center justify-center rounded-full bg-white text-[10px] font-black text-azure-700 shadow-md motion-safe:animate-badge-bump">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
