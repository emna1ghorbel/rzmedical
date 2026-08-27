import Link from "next/link";
import Image from "next/image";
import type { MarqueListItem } from "@/lib/types";
import { imageUrl } from "@/lib/api";

/** Bandeau de marques : logos cliquables filtrant le catalogue par marque. */
export function BrandStrip({ brands }: { brands: MarqueListItem[] }) {
  const withLogo = brands.filter((b) => Boolean(b.logo));
  const list = withLogo.length >= 4 ? withLogo : brands;
  if (list.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((brand) => (
        <li key={brand.id}>
          <Link
            href={`/catalogue?marqueId=${brand.id}`}
            className="group relative flex aspect-square w-full flex-col items-center justify-between rounded-sm border border-slate-100 bg-white p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.08)]"
            title={brand.nom}
          >
            {/* Zone du logo (centrée au milieu du carré) */}
            <div className="relative flex w-full flex-1 items-center justify-center p-1">
              {brand.logo ? (
                <div className="relative h-full w-full">
                  <Image
                    src={imageUrl(brand.logo)}
                    alt={brand.nom}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    unoptimized
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <span className="text-center text-[10px] font-bold uppercase text-slate-300">
                  Pas de logo
                </span>
              )}
            </div>

            {/* Nom de la marque au bas du carré */}
            <span className="w-full truncate text-center font-sans text-[11px] font-extrabold uppercase tracking-tight text-slate-900">
              {brand.nom}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}