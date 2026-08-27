import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVisibleCategories } from "@/lib/api";
import { findCategoryBySlug } from "@/lib/slug";
import { CategoryCatalog } from "@/components/category/CategoryCatalog";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug } = await params;
  const categories = await getVisibleCategories();
  const cat = findCategoryBySlug(categories, catSlug);
  if (!cat) return {};
  return {
    title: `Promotions ${cat.nom}`,
    description: `Découvrez les promotions et offres spéciales de la catégorie ${cat.nom}.`,
  };
}

export default async function CategoryPromotionsPage({ params, searchParams }: Props) {
  const [{ category: catSlug }, sp] = await Promise.all([params, searchParams]);
  const categories = await getVisibleCategories();
  const category = findCategoryBySlug(categories, catSlug);

  if (!category) {
    notFound();
  }

  return (
    <CategoryCatalog
      category={category}
      searchParams={sp}
      forcedFilters={{ promo: true }}
      customHeading={`Promotions ${category.nom}`}
    />
  );
}
