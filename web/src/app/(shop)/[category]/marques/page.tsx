import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVisibleCategories, getBrandsByCategory } from "@/lib/api";
import { findCategoryBySlug } from "@/lib/slug";
import { CategoryCatalog } from "@/components/category/CategoryCatalog";
import { BrandStrip } from "@/components/catalogue/BrandStrip";
import { Container } from "@/components/ui/Container";

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
    title: `Marques ${cat.nom}`,
    description: `Découvrez les marques de la catégorie ${cat.nom}.`,
  };
}

export default async function CategoryMarquesPage({ params, searchParams }: Props) {
  const [{ category: catSlug }, sp] = await Promise.all([params, searchParams]);
  const categories = await getVisibleCategories();
  const category = findCategoryBySlug(categories, catSlug);

  if (!category) {
    notFound();
  }

  const marques = await getBrandsByCategory(category.id);

  return (
    <>
      <div className="bg-slate-50 border-b border-slate-200">
        <Container className="py-8">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Nos Marques {category.nom}</h2>
          <BrandStrip brands={marques} />
        </Container>
      </div>

      <CategoryCatalog
        category={category}
        searchParams={sp}
        customHeading={`Produits par marque - ${category.nom}`}
      />
    </>
  );
}
