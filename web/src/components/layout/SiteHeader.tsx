
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { DiscountBar } from "./DiscountBar";
import { Header } from "./Header";
import type { CategorieListItem, MarqueListItem, AnnonceSite } from "@/lib/types";
import { cn } from "@/lib/cn";
import { toSlug } from "@/lib/slug";

export function SiteHeader({
  annonces = [],
  categories = [],
  marques = [],
  hasHeroVideo = false,
}: {
  annonces?: AnnonceSite[];
  categories?: CategorieListItem[];
  marques?: MarqueListItem[];
  hasHeroVideo?: boolean;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const segments = pathname.split("/").filter(Boolean);

  // Le mode vidéo s'affiche sur la page d'accueil (/) et sur l'accueil d'une catégorie (/[category])
  const isCategoryHome = segments.length === 1 && categories?.some(c => toSlug(c.nom) === segments[0]);
  const isHeroPage = isHome || isCategoryHome;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial check
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showVideoHeader = isHeroPage && hasHeroVideo;

  // Si on est dans le mode vidéo au tout début (non scrollé)
  const isInitialVideoState = showVideoHeader && !scrolled;

  return (
    <div
      className={cn(
        "w-full z-50 flex flex-col",
        // Si c'est la page d'accueil avec vidéo, le header flotte au-dessus du contenu
        // Sinon, il est ancré et repousse le contenu
        showVideoHeader ? "fixed top-0 left-0 right-0" : "sticky top-0"
      )}
    >
      {/* Container de la barre d'annonce */}
      <div
        className={cn(
          "w-full transition-all duration-500 overflow-hidden",
          isInitialVideoState
            ? "h-0 opacity-0 -translate-y-full"
            : "opacity-100 translate-y-0"
        )}
      >
        <div className="h-9">
          <AnnouncementBar annonces={annonces} />
        </div>
        <DiscountBar />
      </div>

      {/* Container du header principal - Single Header component */}
      <div className="w-full">
        <Header
          categories={categories}
          marques={marques}
          isTransparent={isInitialVideoState}
          hideLogo={isInitialVideoState}
        />
      </div>
    </div>
  );
}
