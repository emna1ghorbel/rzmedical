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
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import type { CategorieListItem } from "@/lib/types";
import { toSlug, findCategoryBySlug } from "@/lib/slug";

// ---------------------------------------------------------------------------
// Stockage local
// ---------------------------------------------------------------------------
const STORAGE_KEY = "rz_selected_category";

function readFromStorage(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeToStorage(id: number | null) {
  if (typeof window === "undefined") return;
  try {
    if (id === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export interface CategoryContextValue {
  /** Catégorie actuellement sélectionnée (null = non choisie). */
  selectedCategory: CategorieListItem | null;
  /** Toutes les catégories visibles chargées depuis le layout. */
  categories: CategorieListItem[];
  /** True si l'utilisateur doit encore choisir une catégorie. */
  needsOnboarding: boolean;
  /** Ouvrir/Fermer le modal d'onboarding. */
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  /** Sélectionner une catégorie — navigue vers /{slug} et persiste. */
  selectCategory: (category: CategorieListItem, targetPath?: string) => void;
  /** Changer de catégorie depuis n'importe quelle page en préservant l'intent. */
  switchCategory: (category: CategorieListItem) => void;
  /** Slug de la catégorie courante. */
  categorySlug: string;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

// ---------------------------------------------------------------------------
// Chemins de sections préservées lors d'un changement de catégorie
// ---------------------------------------------------------------------------
const PRESERVED_SECTIONS = ["promotions", "nouveautes", "sous-categories", "marques"];

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function CategoryProvider({
  children,
  categories = [],
}: {
  children: ReactNode;
  categories?: CategorieListItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<CategorieListItem | null>(() => {
    // Initialisation SSR-safe depuis l'URL
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0] ?? "";
    return firstSegment ? (findCategoryBySlug(categories, firstSegment) ?? null) : null;
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Slug de la catégorie courante
  const categorySlug = useMemo(
    () => (selectedCategory ? toSlug(selectedCategory.nom) : ""),
    [selectedCategory],
  );

  // -------------------------------------------------------------------
  // Initialisation : URL -> Activité Utilisateur -> LocalStorage -> Onboarding
  // -------------------------------------------------------------------
  useEffect(() => {
    if (initialized || categories.length === 0) return;

    // 1. L'URL correspond-elle à un slug de catégorie ?
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0] ?? "";
    const catFromUrl = firstSegment ? findCategoryBySlug(categories, firstSegment) : null;

    if (catFromUrl) {
      setSelectedCategory(catFromUrl);
      writeToStorage(catFromUrl.id);
      setInitialized(true);
      return;
    }

    // 2. Si l'utilisateur est connecté et a une activité enregistrée :
    if (user?.activiteCategoryId) {
      const catFromUser = categories.find((c) => c.id === user.activiteCategoryId);
      if (catFromUser) {
        setSelectedCategory(catFromUser);
        writeToStorage(catFromUser.id);
        setInitialized(true);
        if (pathname === "/") {
          router.replace(`/${toSlug(catFromUser.nom)}`);
        }
        return;
      }
    }

    // 3. Existe-t-il une préférence en localStorage ?
    const storedId = readFromStorage();
    const catFromStorage = storedId ? categories.find((c) => c.id === storedId) : null;

    if (catFromStorage) {
      setSelectedCategory(catFromStorage);
      setInitialized(true);
      
      // Si l'utilisateur a déjà une catégorie et arrive sur /, on le redirige directement
      if (pathname === "/") {
        router.replace(`/${toSlug(catFromStorage.nom)}`);
      }
      return;
    }

    // 3. Ni URL ni localStorage
    setInitialized(true);
    if (pathname === "/") {
      // S'il n'a pas de catégorie et arrive sur /, on affiche l'alerte pour l'obliger à choisir
      setIsOnboardingOpen(true);
    }

    // 4. Par défaut, on initialise juste
    setInitialized(true);
  }, [categories, initialized, pathname, router]);

  // -------------------------------------------------------------------
  // Synchronisation avec l'URL : quand l'URL change (navigation),
  // mettre à jour la catégorie si le premier segment correspond.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!initialized || categories.length === 0) return;
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0] ?? "";
    if (!firstSegment) return;
    const catFromUrl = findCategoryBySlug(categories, firstSegment);
    if (catFromUrl && catFromUrl.id !== selectedCategory?.id) {
      setSelectedCategory(catFromUrl);
      writeToStorage(catFromUrl.id);
    }
  }, [pathname, categories, initialized, selectedCategory?.id]);

  const openOnboarding = useCallback(() => setIsOnboardingOpen(true), []);
  const closeOnboarding = useCallback(() => setIsOnboardingOpen(false), []);

  /** Sélection initiale depuis l'onboarding ou une redirection directe. */
  const selectCategory = useCallback(
    (category: CategorieListItem, targetPath?: string) => {
      setSelectedCategory(category);
      writeToStorage(category.id);
      setIsOnboardingOpen(false);
      const slug = toSlug(category.nom);
      router.push(targetPath ?? `/${slug}`);
    },
    [router],
  );

  /**
   * Changement de catégorie depuis l'en-tête, en préservant l'intent.
   *
   * Exemple :
   *   URL courante : /dentaire/promotions
   *   Nouvelle catégorie : chirurgie
   *   → navigation vers : /chirurgie/promotions
   */
  const switchCategory = useCallback(
    (category: CategorieListItem) => {
      setSelectedCategory(category);
      writeToStorage(category.id);
      setIsOnboardingOpen(false);

      const slug = toSlug(category.nom);
      const segments = pathname.split("/").filter(Boolean);
      // Cherche si un segment de section est présent (2e, 3e segment)
      const sectionIdx = segments.findIndex((s, i) => i > 0 && PRESERVED_SECTIONS.includes(s));
      if (sectionIdx !== -1) {
        const preserved = segments.slice(sectionIdx).join("/");
        router.push(`/${slug}/${preserved}`);
      } else {
        router.push(`/${slug}`);
      }
    },
    [router, pathname],
  );

  const needsOnboarding = initialized && selectedCategory === null;

  const value = useMemo<CategoryContextValue>(
    () => ({
      selectedCategory,
      categories,
      needsOnboarding,
      isOnboardingOpen,
      openOnboarding,
      closeOnboarding,
      selectCategory,
      switchCategory,
      categorySlug,
    }),
    [
      selectedCategory,
      categories,
      needsOnboarding,
      isOnboardingOpen,
      openOnboarding,
      closeOnboarding,
      selectCategory,
      switchCategory,
      categorySlug,
    ],
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useCategory(): CategoryContextValue {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategory must be used within CategoryProvider");
  return ctx;
}
