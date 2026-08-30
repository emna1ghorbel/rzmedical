import type { ReactNode } from "react";
import type { CategorieListItem, SiteContentPublic } from "@/lib/types";
import { getSiteContent, getVisibleCategories, getBrands } from "@/lib/api";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { GlobalBannerCarousel } from "@/components/layout/GlobalBannerCarousel";
import type { MarqueListItem } from "@/lib/types";
import { SiteAlert } from "@/components/site/SiteAlert";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { CategoryProvider } from "@/providers/CategoryProvider";
import { HeroVideoProvider } from "@/providers/HeroVideoProvider";
import { CategoryOnboardingModal } from "@/components/category/CategoryOnboardingModal";

const EMPTY_CONTENT: SiteContentPublic = { annonces: [], bannieres: [], videoHero: null, alertes: [] };

/** Charge le chrome (catégories + contenu) de façon résiliente : le magasin
 *  reste affichable même si le backend est momentanément indisponible. */
async function loadChrome(): Promise<{
  categories: CategorieListItem[];
  marques: MarqueListItem[];
  content: SiteContentPublic;
}> {
  const [catRes, brandRes, contentRes] = await Promise.allSettled([
    getVisibleCategories(),
    getBrands(),
    getSiteContent(),
  ]);
  return {
    categories: catRes.status === "fulfilled" ? catRes.value : [],
    marques: brandRes.status === "fulfilled" ? brandRes.value : [],
    content: contentRes.status === "fulfilled" ? contentRes.value : EMPTY_CONTENT,
  };
}

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const { categories, marques, content } = await loadChrome();

  return (
    <CategoryProvider categories={categories}>
      <HeroVideoProvider>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Aller au contenu
      </a>

      {/* ── SiteHeader ───────────────────────────────────────────────
          Handles both AnnouncementBar and Main Header states.       */}
      <SiteHeader annonces={content.annonces} categories={categories} marques={marques} hasGlobalVideoHero={!!content.videoHero} />

      {/* ── StorefrontShell ───────────────────────────────────────────
          Flex-row container: [Sidebar | Main content].
          When sidebar opens its width animates 0→300px, naturally
          pushing the main content area to the right.
          The Header above is NOT inside this container.             */}
      <StorefrontShell categories={categories} marques={marques}>
        <main id="contenu" className="flex-1">
          {/* Pass video hero data to the home page via layout context */}
          {children}
        </main>

        <Footer categories={categories} />
      </StorefrontShell>

      {/* Surcouches modales globales */}
      <CartDrawer />
      <SearchOverlay />

      {/* Alertes admin dynamiques (promo, fermeture, etc.) — remplace AccountInvitationAlert si une alerte est active */}
      <SiteAlert alertes={content.alertes} />

      {/* ── Modal d'onboarding catégorie ──────────────────────────────── */}
      <CategoryOnboardingModal categories={categories} />

      {/* ── Chatbot IA ────────────────────────────────────────────────── */}
      <ChatWidget />
      </HeroVideoProvider>
    </CategoryProvider>
  );
}
