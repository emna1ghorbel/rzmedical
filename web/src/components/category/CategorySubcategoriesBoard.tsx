import Link from "next/link";
import Image from "next/image";
import type { CategorieListItem, SousCategorieListItem } from "@/lib/types";
import { getSubcategoriesByCategory } from "@/lib/api";
import { imageUrl } from "@/lib/api";
import { toSlug } from "@/lib/slug";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/home/SectionHeading";
import { cn } from "@/lib/cn";
import { ArrowRightIcon, PackageIcon } from "@/components/ui/icons";

/**
 * Grille de sous-catégories visuelles pour la homepage catégorie.
 */
export async function CategorySubcategoriesBoard({
  category,
}: {
  category: CategorieListItem;
}) {
  let subcategories: SousCategorieListItem[] = [];
  try {
    subcategories = await getSubcategoriesByCategory(category.id);
  } catch {
    return null;
  }

  if (subcategories.length === 0) return null;

  const catSlug = toSlug(category.nom);

  return (
    <section className="bg-slate-50 border-t border-slate-200/60">
      <Container className="py-14 lg:py-20">
        <SectionHeading
          eyebrow="Rayons"
          title={`Explorer les rayons ${category.nom}`}
          description={`Parcourez les sous-catégories ${category.nom.toLowerCase()} pour trouver ce dont vous avez besoin.`}
          href={`/${catSlug}/sous-categories`}
          linkLabel="Tous les rayons"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {subcategories.slice(0, 10).map((sub) => {
            const subSlug = toSlug(sub.nom);
            const count = sub._count?.produits ?? 0;

            return (
              <Link
                key={sub.id}
                href={`/${catSlug}/sous-categories/${subSlug}`}
                className={cn(
                  "group relative flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-center",
                  "transition-all duration-200",
                  "hover:border-azure-300 hover:bg-azure-50/30 hover:shadow-md hover:-translate-y-[2px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure-500 focus-visible:ring-offset-2",
                )}
              >
                {/* Image or icon */}
                <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 overflow-hidden transition-all duration-200 group-hover:border-azure-200 group-hover:bg-azure-50">
                  {sub.image ? (
                    <Image
                      src={imageUrl(sub.image)}
                      alt={sub.nom}
                      fill
                      sizes="64px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <PackageIcon size={28} className="text-slate-400 group-hover:text-azure-500 transition-colors duration-200" />
                  )}
                </div>

                {/* Name */}
                <div>
                  <div className="text-[13px] font-bold text-navy-900 group-hover:text-azure-700 transition-colors duration-200 leading-tight">
                    {sub.nom}
                  </div>
                  {count > 0 && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      {count} produit{count > 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Arrow on hover */}
                <ArrowRightIcon
                  size={14}
                  className="absolute bottom-3 right-3 text-azure-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
