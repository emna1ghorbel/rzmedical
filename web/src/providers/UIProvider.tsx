"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface UIContextValue {
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  mobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

/**
 * État des surcouches d'interface pilotées depuis le header mais rendues au
 * niveau de la mise en page (overlay de recherche, menu mobile). Le tiroir
 * panier possède son propre état dans CartProvider.
 */
export function UIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((v) => !v), []);

  // Verrouille le défilement du corps tant que la recherche plein écran est ouverte.
  useEffect(() => {
    if (!searchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [searchOpen]);

  const value = useMemo<UIContextValue>(
    () => ({
      searchOpen,
      openSearch,
      closeSearch,
      mobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      toggleMobileMenu,
    }),
    [
      searchOpen,
      openSearch,
      closeSearch,
      mobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      toggleMobileMenu,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI doit être utilisé dans <UIProvider>");
  return ctx;
}
