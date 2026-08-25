import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/catalogue/ProductCard";

/** Produits liés : même sous-catégorie, produit courant exclu. */
export async function RelatedProducts({
  sousCategorieId,
  excludeId,
  limit = 4,
}: {
  sousCategorieId: number;
  excludeId: number;
  limit?: number;
}) {
  let products;
  try {
    products = await getProducts({ sousCategorieId, sort: "recent" });
  } catch {
    return null; // section non essentielle : on l'omet en cas d'échec
  }

  const related = products.filter((p) => p.id !== excludeId).slice(0, limit);
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-title">
      <h2
        id="related-title"
        className="mb-5 text-xl font-bold text-navy-900 sm:text-2xl"
      >
        Produits similaires
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
