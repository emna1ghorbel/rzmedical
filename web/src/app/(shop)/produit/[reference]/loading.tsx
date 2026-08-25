import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/catalogue/ProductGrid";

export default function ProductLoading() {
  return (
    <Container className="py-6 lg:py-10">
      {/* Fil d'Ariane */}
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-14">
        {/* Galerie */}
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="mt-3 flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-18 w-18 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Infos */}
        <div className="mt-8 flex flex-col gap-4 lg:mt-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-10 w-48" />
          <Skeleton className="h-5 w-36" />
          <div className="mt-2 flex gap-3">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
          <div className="mt-4 grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="mt-12 lg:mt-16">
        <div className="flex gap-4 border-b border-border pb-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3 py-6">
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-2/3 max-w-xl" />
        </div>
      </div>

      {/* Similaires */}
      <div className="mt-14 lg:mt-20">
        <Skeleton className="mb-5 h-7 w-48" />
        <ProductGridSkeleton count={4} />
      </div>
    </Container>
  );
}
