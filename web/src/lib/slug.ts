/**
 * Utilitaires de normalisation de slugs pour le routing catégorie-centrique.
 *
 * Convention :
 *  • Les slugs sont en minuscules, accents retirés, espaces → tirets.
 *  • Le slug est dérivé du `nom` de la catégorie/sous-catégorie/marque.
 *  • Les IDs sont préférés pour l'API ; les slugs servent au routing URL.
 */

/** Convertit une chaîne en slug URL-friendly. */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques
    .replace(/[^a-z0-9\s-]/g, "")   // retire les caractères spéciaux
    .trim()
    .replace(/[\s_]+/g, "-")         // espaces & underscores → tirets
    .replace(/-+/g, "-");            // tirets consécutifs → un seul
}

/** Compare un nom avec un slug (insensible à la casse et aux accents). */
export function matchesSlug(nom: string | undefined, slug: string | undefined): boolean {
  if (!nom || !slug) return false;
  return toSlug(nom) === slug.toLowerCase();
}

/** Retrouve une catégorie depuis un slug. */
export function findCategoryBySlug<T extends { nom: string }>(
  categories: T[],
  slug: string,
): T | undefined {
  return categories.find((c) => matchesSlug(c.nom, slug));
}

/** Retrouve une sous-catégorie depuis un slug. */
export function findSubcategoryBySlug<T extends { nom: string }>(
  subcategories: T[],
  slug: string,
): T | undefined {
  return subcategories.find((s) => matchesSlug(s.nom, slug));
}

/** Retrouve une marque depuis un slug. */
export function findBrandBySlug<T extends { nom: string }>(
  brands: T[],
  slug: string,
): T | undefined {
  return brands.find((b) => matchesSlug(b.nom, slug));
}
