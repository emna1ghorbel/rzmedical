"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Produit } from "@/lib/types";
import { imageUrl } from "@/lib/api";
import { hasDiscount, isRecent } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { PackageIcon } from "@/components/ui/icons";
import { AddToCartButton } from "./AddToCartButton";
import { useAuth } from "@/providers/AuthProvider";
import { useCategory } from "@/providers/CategoryProvider";
import { cn } from "@/lib/cn";

const IMAGE_SIZES =
  "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw";

export function ProductCard({
  product,
  className,
  priority = false,
}: {
  product: Produit;
  className?: string;
  priority?: boolean;
}) {
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by only applying the client discount after the component has mounted on the client
  const remiseClient = mounted && isAuthenticated ? user?.remise ?? 0 : 0;
  
  const { categorySlug } = useCategory();
  
  const href = mounted && categorySlug 
    ? `/${categorySlug}/produits/${encodeURIComponent(product.reference)}`
    : `/produit/${encodeURIComponent(product.reference)}`;
    
  const image = product.images?.[0];
  const outOfStock = !product.disponible || product.stock <= 0;
  const promo = hasDiscount(product.remise);
  const isNew = !promo && isRecent(product.creeLe);
  const lowStock = !outOfStock && product.stock > 0 && product.stock <= 5;


  return (
    <article
      className={cn(
        "card-3d-light group relative flex flex-col overflow-hidden rounded-2xl",
        className,
      )}
    >
      {/* Bottom azure glow edge on hover */}
      <span className="absolute bottom-0 left-0 z-20 h-[2px] w-full bg-gradient-to-r from-azure-400 via-azure-500 to-electric-500 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 pointer-events-none" />

      {/* Top gloss */}
      <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80 pointer-events-none" />

      {/* Image area */}
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-slate-50/80"
        aria-label={product.nom}
      >
        {/* Radial glow behind image on hover */}
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.06)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

        {image ? (
          <Image
            src={imageUrl(image)}
            alt={product.nom}
            fill
            sizes={IMAGE_SIZES}
            preload={priority}
            className={cn(
              "object-contain p-6 transition-transform duration-700 ease-out-cubic group-hover:scale-[1.07] group-hover:rotate-[0.8deg]",
              outOfStock && "opacity-40 grayscale",
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-200">
            <PackageIcon size={52} strokeWidth={1} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5 z-20">
          {promo && (
            <Badge variant="promo" size="sm">Promo</Badge>
          )}
          {isNew && (
            <Badge variant="new" size="sm">Nouveau</Badge>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-navy-950/90 backdrop-blur-md py-2 text-center text-[11px] font-bold text-white/90 tracking-wide uppercase z-20">
            Rupture de stock
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {product.marque?.nom && (
          <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            {product.marque.nom}
          </p>
        )}
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-navy-900 group-hover:text-azure-600 transition-colors duration-250">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.nom}
          </Link>
        </h3>

        <div className="mt-4 flex items-end justify-between gap-2">
          <Price prix={product.prix} remise={product.remise} remiseClient={remiseClient} size="lg" className="whitespace-nowrap" />
          {lowStock && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <PackageIcon size={11} />
              {product.stock} restant{product.stock > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="relative z-10 mt-5">
          <AddToCartButton
            product={product}
            size="md"
            fullWidth
            variant="primary"
            className="transition-all duration-250"
          />
        </div>
      </div>
    </article>
  );
}
