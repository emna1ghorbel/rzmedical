import Link from "next/link";
import { getPagedProducts } from "@/lib/api";
import type { CategorieListItem, Produit } from "@/lib/types";
import { toSlug } from "@/lib/slug";
import { Container } from "@/components/ui/Container";
import { ProductRail } from "@/components/catalogue/ProductRail";
import { SectionHeading } from "@/components/home/SectionHeading";
import { cn } from "@/lib/cn";

async function SubcategoryRail({
  subcategory,
  categorySlug,
  isDark = false,
}: {
  subcategory: { id: number; nom: string };
  categorySlug: string;
  isDark?: boolean;
}) {
  let products: Produit[] = [];
  try {
    const result = await getPagedProducts({
      sousCategorieId: subcategory.id,
      page: 1,
      limit: 12,
      sort: "recent",
    });
    products = result.products;
  } catch {
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        isDark
          ? "bg-gradient-to-b from-navy-900 to-navy-950"
          : "bg-slate-50/70 border-y border-slate-200/60"
      )}
    >
      {/* Dark: grid pattern overlay */}
      {isDark && (
        <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      )}
      {/* Dark: azure aura */}
      {isDark && (
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-azure-500/5 blur-[120px] pointer-events-none" />
      )}

      <Container className="relative py-12 lg:py-20 z-10">
        <SectionHeading
          title={subcategory.nom}
          description={`Découvrez notre sélection pour le rayon ${subcategory.nom.toLowerCase()}.`}
          href={`/${categorySlug}/sous-categories?rayon=${subcategory.id}`}
          linkLabel="Voir tout le rayon"
          dark={isDark}
          extraAction={
            <Link
              href={`/${categorySlug}/sous-categories/${toSlug(subcategory.nom)}`}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-all duration-200",
                isDark
                  ? "border-white/10 text-white/70 hover:border-white/20 hover:text-white hover:bg-white/5"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              Voir la sous-catégorie
            </Link>
          }
        />
        <ProductRail
          products={products}
          className="[scrollbar-color:theme(colors.azure.500)_transparent]"
        />
      </Container>
    </section>
  );
}

/**
 * Affiche un rail de produits pour chaque sous-catégorie d'une catégorie.
 * Alterne entre thème sombre et thème clair.
 */
export async function CategorySubcategoryRails({
  category,
}: {
  category: CategorieListItem;
}) {
  const subs = category.sousCategories || [];
  
  if (subs.length === 0) return null;

  const slug = toSlug(category.nom);

  return (
    <div className="flex flex-col my-4">
      {subs.map((sub, index) => (
        <SubcategoryRail
          key={sub.id}
          subcategory={sub}
          categorySlug={slug}
          isDark={index % 2 === 1}
        />
      ))}
    </div>
  );
}
