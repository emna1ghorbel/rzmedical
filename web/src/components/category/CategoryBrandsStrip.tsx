import Image from "next/image";
import Link from "next/link";
import type { CategorieListItem, MarqueListItem } from "@/lib/types";
import { getBrandsByCategory } from "@/lib/api";
import { imageUrl } from "@/lib/api";
import { toSlug } from "@/lib/slug";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ArrowRightIcon } from "@/components/ui/icons";

/** Bandeau des marques associées à une catégorie donnée. */
export async function CategoryBrandsStrip({
  category,
}: {
  category: CategorieListItem;
}) {
  let brands: MarqueListItem[] = [];
  try {
    brands = await getBrandsByCategory(category.id);
  } catch {
    return null;
  }

  if (brands.length === 0) return null;

  const slug = toSlug(category.nom);
  const withLogo = brands.filter((b) => Boolean(b.logo));
  const list = withLogo.length >= 3 ? withLogo : brands;

  return (
    <section className="bg-white border-t border-slate-100">
      <Container className="py-12 lg:py-16">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading
            eyebrow="Partenaires"
            title={`Marques ${category.nom}`}
            description="Les meilleures références sélectionnées pour leur qualité professionnelle."
          />
          <Link
            href={`/${slug}/marques`}
            className="hidden sm:inline-flex items-center gap-2 text-[13px] font-semibold text-azure-600 hover:text-azure-700 transition-colors shrink-0 mb-2"
          >
            Toutes les marques
            <ArrowRightIcon size={14} />
          </Link>
        </div>

        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {list.map((brand) => (
            <li key={brand.id}>
              <Link
                href={`/${slug}/marques?marqueId=${brand.id}`}
                className="group relative flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all duration-200 hover:border-azure-200 hover:bg-white hover:shadow-md hover:-translate-y-[2px]"
                title={brand.nom}
              >
                <div className="relative h-12 w-full flex items-center justify-center">
                  {brand.logo ? (
                    <div className="relative h-10 w-full">
                      <Image
                        src={imageUrl(brand.logo)}
                        alt={brand.nom}
                        fill
                        sizes="(max-width: 640px) 33vw, 12vw"
                        unoptimized
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold uppercase text-slate-400">
                      {brand.nom.slice(0, 3)}
                    </span>
                  )}
                </div>
                <span className="w-full truncate text-center text-[10px] font-bold uppercase tracking-tight text-slate-600 group-hover:text-azure-700 transition-colors">
                  {brand.nom}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
