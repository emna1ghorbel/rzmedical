import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVisibleCategories, getSubcategories } from "@/lib/api";
import { findCategoryBySlug, findSubcategoryBySlug } from "@/lib/slug";
import { CategoryCatalog } from "@/components/category/CategoryCatalog";

type Props = {
  params: Promise<{ category: string; subcategory: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug, subcategory: subcatSlug } = await params;
  const categories = await getVisibleCategories();
  const subcategories = await getSubcategories();
  
  const cat = findCategoryBySlug(categories, catSlug);
  const sub = findSubcategoryBySlug(subcategories, subcatSlug);
  
  if (!cat || !sub) return {};
  
  return {
    title: `${sub.nom} | ${cat.nom}`,
    description: `Découvrez nos produits de la gamme ${sub.nom} dans la catégorie ${cat.nom}.`,
  };
}

export default async function CategorySubcategoryPage({ params, searchParams }: Props) {
  const [{ category: catSlug, subcategory: subcatSlug }, sp] = await Promise.all([params, searchParams]);
  const categories = await getVisibleCategories();
  const subcategories = await getSubcategories();
  
  const category = findCategoryBySlug(categories, catSlug);
  const subcategory = findSubcategoryBySlug(subcategories, subcatSlug);

  if (!category || !subcategory || subcategory.categorieId !== category.id) {
    notFound();
  }

  // Inject the subcategory ID into the search params for CategoryCatalog to use
  const modifiedSearchParams = {
    ...sp,
    sousCategorieId: String(subcategory.id),
  };

  return (
    <CategoryCatalog
      category={category}
      searchParams={modifiedSearchParams}
    />
  );
}
