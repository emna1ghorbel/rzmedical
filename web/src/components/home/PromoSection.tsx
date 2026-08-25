import Link from "next/link";
import { getPromoProducts } from "@/lib/api";
import { Container } from "@/components/ui/Container";
import { ProductRail } from "@/components/catalogue/ProductRail";
import { buttonVariants } from "@/components/ui/Button";
import { ArrowRightIcon, PercentIcon } from "@/components/ui/icons";

/** Bandeau « Promotions » premium sur fond navy. Section non bloquante (Suspense). */
export async function PromoSection() {
  let products;
  try {
    products = await getPromoProducts();
  } catch {
    return null;
  }

  if (products.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/30 to-navy-950/50 blur-[8px]" />
      </div>

      <Container className="relative py-12 lg:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-azure-300">
              <PercentIcon size={14} className="ms-1" />
              Offres du moment
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Promotions
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-navy-200">
              Profitez de remises sur une sélection de produits, dans la limite
              des stocks disponibles.
            </p>
          </div>
          <Link
            href="/catalogue?promo=1"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-medium text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
          >
            Toutes les promotions
            <ArrowRightIcon size={16} />
          </Link>
        </div>

        <ProductRail
          products={products.slice(0, 12)}
          className="[scrollbar-color:theme(colors.azure.500)_transparent] [&>*:hover]:translate-y-[-2px]"
        />
      </Container>
    </section>
  );
}
