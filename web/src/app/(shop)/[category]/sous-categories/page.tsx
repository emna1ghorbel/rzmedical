import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVisibleCategories } from "@/lib/api";
import { findCategoryBySlug } from "@/lib/slug";
import { CategorySubcategoriesBoard } from "@/components/category/CategorySubcategoriesBoard";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: catSlug } = await params;
  const categories = await getVisibleCategories();
  const cat = findCategoryBySlug(categories, catSlug);

  if (!cat) return {};

  return {
    title: `Rayons ${cat.nom}`,
    description: `Explorez tous les rayons et sous-catégories de la section ${cat.nom}.`,
  };
}

export default async function CategorySubcategoriesPage({ params }: Props) {
  const { category: catSlug } = await params;
  const categories = await getVisibleCategories();
  const category = findCategoryBySlug(categories, catSlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <CategorySubcategoriesBoard category={category} />
    </div>
  );
}
