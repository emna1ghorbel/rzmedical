import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/catalogue/ProductGrid";

export default function CatalogueLoading() {
  return (
    <Container className="py-6 lg:py-10">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-6 h-4 w-28" />

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="rounded-xl border border-border bg-surface p-5">
            <Skeleton className="mb-4 h-4 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
            <Skeleton className="h-10 w-24 lg:hidden" />
            <Skeleton className="ml-auto h-10 w-40" />
          </div>
          <ProductGridSkeleton count={12} />
        </div>
      </div>
    </Container>
  );
}
