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

// Gradient tints + glow colors per category
const TINTS = [
  {
    bg: "from-azure-500/20 to-azure-500/5",
    border: "border-azure-400/20",
    glow: "rgba(14,165,233,0.3)",
    icon: "text-azure-400",
    ring: "rgba(14,165,233,0.15)",
  },
  {
    bg: "from-navy-400/25 to-navy-500/5",
    border: "border-navy-400/20",
    glow: "rgba(53,98,172,0.3)",
    icon: "text-navy-300",
    ring: "rgba(53,98,172,0.15)",
  },
  {
    bg: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-400/20",
    glow: "rgba(18,183,106,0.3)",
    icon: "text-emerald-400",
    ring: "rgba(18,183,106,0.15)",
  },
  {
    bg: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-400/20",
    glow: "rgba(245,158,11,0.3)",
    icon: "text-amber-400",
    ring: "rgba(245,158,11,0.15)",
  },
];

function getCategoryIcon(name: string, colorClass: string) {
  const n = name.toLowerCase();
  if (n.includes("dentaire")) return <SparklesIcon size={22} className={colorClass} />;
  if (n.includes("instrument")) return <SlidersIcon size={22} className={colorClass} />;
  if (n.includes("equipement") || n.includes("équipement")) return <BuildingIcon size={22} className={colorClass} />;
  if (n.includes("consommable")) return <PackageIcon size={22} className={colorClass} />;
  return <ShieldCheckIcon size={22} className={colorClass} />;
}

export function CategoryCard({
  category,
  index = 0,
  image,
}: {
  category: CategorieListItem;
  index?: number;
  image?: string | null;
}) {
  const count = category._count?.sousCategories ?? category.sousCategories?.length ?? 0;
  const tint = TINTS[index % TINTS.length];

  return (
    <Link
      href={`/catalogue?categorieId=${category.id}`}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-350 hover:-translate-y-[3px] hover:border-white/15 hover:bg-white/[0.06]"
      style={{
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Top gloss line */}
      <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Hover glow */}
      <span
        className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: tint.glow }}
      />

      {/* Animated bottom border on hover */}
      <span
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 transition-transform duration-400 group-hover:scale-x-100 pointer-events-none"
        style={{ background: `linear-gradient(90deg, ${tint.glow}, transparent)` }}
      />

      {/* Icon orb */}
      <span
        className={cn(
          "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br border transition-all duration-300 group-hover:scale-[1.06]",
          tint.bg,
          tint.border,
        )}
        style={{ boxShadow: `0 0 16px ${tint.ring}, inset 0 1px 0 rgba(255,255,255,0.08)` }}
      >
        {image ? (
          <Image
            src={imageUrl(image)}
            alt=""
            fill
            sizes="56px"
            className="object-contain p-2"
          />
        ) : (
          getCategoryIcon(category.nom, tint.icon)
        )}
      </span>

      {/* Text */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold text-white/85 group-hover:text-white transition-colors duration-200">
          {category.nom}
        </span>
        <span className="mt-1 block text-[12px] font-medium text-navy-300/70 group-hover:text-navy-200 transition-colors duration-200">
          {count > 0
            ? `${count} sous-catégorie${count > 1 ? "s" : ""}`
            : "Découvrir la sélection"}
        </span>
      </span>

      {/* Arrow */}
      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-navy-300 transition-all duration-300 group-hover:bg-azure-500/20 group-hover:border-azure-400/30 group-hover:text-azure-400">
        <ArrowRightIcon
          size={14}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
