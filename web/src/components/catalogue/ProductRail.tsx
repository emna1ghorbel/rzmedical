import type { Produit } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ProductCard } from "./ProductCard";

/** Rangée de produits défilable premium avec effets de défilement améliorés. */
export function ProductRail({ products, className }: { products: Produit[]; className?: string }) {
  return (
    <div
      role="region"
      aria-label="Produits défilables"
      tabIndex={0}
      className={cn(
        "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 pr-4 scroll-smooth [scrollbar-width:thin] [scrollbar-color:theme(colors.azure.500)_transparent] [scrollbar-height:1px] [&::-webkit-scrollbar]:h-[1px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-azure-500/50 [&::-webkit-scrollbar-thumb:hover]:bg-azure-500/70 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-azure-500/80 sm:gap-5",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          className="w-[78vw] max-w-[290px] shrink-0 snap-start sm:w-[280px] lg:w-[292px] [&:hover]:translate-y-[-2px] [&:hover]:shadow-xl transition-all duration-500"
        />
      ))}
    </div>
  );
}
