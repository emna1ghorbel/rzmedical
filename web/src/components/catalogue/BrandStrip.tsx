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
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {list.map((brand) => (
        <li key={brand.id}>
          <Link
            href={`/catalogue?marqueId=${brand.id}`}
            className="group relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-500 hover:-translate-y-1 hover:border-azure-300/50 hover:shadow-[0_12px_30px_-10px_rgba(14,165,233,0.15)]"
            title={brand.nom}
          >
            {/* Hover ambient glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08)_0%,transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
            
            {brand.logo ? (
              <span className="relative h-full w-full">
                <Image
                  src={imageUrl(brand.logo)}
                  alt={brand.nom}
                  fill
                  sizes="180px"
                  className="object-contain opacity-70 grayscale transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </span>
            ) : (
              <span className="text-center text-sm font-bold tracking-wide text-slate-400 transition-colors duration-300 group-hover:text-azure-600">
                {brand.nom}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
