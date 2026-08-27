import Link from "next/link";
import Image from "next/image";
import type { CategorieListItem } from "@/lib/types";
import { imageUrl } from "@/lib/api";
import {
  ArrowRightIcon,
  BuildingIcon,
  PackageIcon,
  ShieldCheckIcon,
  SlidersIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

// Map static icons directly to avoid repeated string checks inside helper functions
const CATEGORY_ICONS = [
  { keyword: "dentaire", icon: SparklesIcon },
  { keyword: "instrument", icon: SlidersIcon },
  { keyword: "equipement", icon: BuildingIcon },
  { keyword: "équipement", icon: BuildingIcon },
  { keyword: "consommable", icon: PackageIcon },
] as const;

function getCategoryIcon(name: string) {
  const normalizedName = name.toLowerCase();
  const match = CATEGORY_ICONS.find(({ keyword }) =>
    normalizedName.includes(keyword)
  );
  return match ? match.icon : ShieldCheckIcon;
}

interface CategoryCardProps {
  category: CategorieListItem;
  index?: number;
  image?: string | null;
}

export function CategoryCard({
  category,
  index = 0,
  image,
}: CategoryCardProps) {
  const count =
    category._count?.sousCategories ?? category.sousCategories?.length ?? 0;
  const Icon = getCategoryIcon(category.nom);
  const refNumber = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={`/catalogue?categorieId=${category.id}`}
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4",
        "transition-colors duration-200 hover:border-azure-400/30 hover:bg-white/[0.045]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-azure-400/50"
      )}
    >
      {/* Index de référence */}
      <span
        aria-hidden="true"
        className="hidden shrink-0 select-none font-mono text-[11px] tabular-nums tracking-wider text-white/25 transition-colors duration-200 group-hover:text-azure-400/70 sm:block"
      >
        {refNumber}
      </span>

      {/* Icône / Image */}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-azure-400/80 transition-colors duration-200 group-hover:border-azure-400/25 group-hover:text-azure-400">
        {image ? (
          <span className="relative block h-6 w-6">
            <Image
              src={imageUrl(image)}
              alt={category.nom}
              fill
              sizes="24px"
              className="object-contain"
            />
          </span>
        ) : (
          <Icon size={18} aria-hidden="true" />
        )}
      </span>

      {/* Libellés */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-white/90">
          {category.nom}
        </span>
        <span className="mt-0.5 block text-[12px] text-white/40">
          {count > 0
            ? `${count} sous-catégorie${count > 1 ? "s" : ""}`
            : "Voir la sélection"}
        </span>
      </span>

      {/* Flèche de navigation */}
      <ArrowRightIcon
        size={16}
        aria-hidden="true"
        className="shrink-0 text-white/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-azure-400"
      />
    </Link>
  );
}