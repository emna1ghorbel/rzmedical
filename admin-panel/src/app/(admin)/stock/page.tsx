"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { getApiUrl } from "@/utils/api";
import StockRepartitionModal from "../products/StockRepartitionModal";

const API_URL = getApiUrl();

type Produit = {
  id: number;
  nom: string;
  reference: string;
  stock: number;
  prix?: number | string | null;
  disponible?: boolean;
  disponibleALaVente?: boolean;
  sousCategorie?: { nom: string; categorie?: { nom: string } } | null;
  marque?: { nom: string } | null;
};

export default function StockPage() {
  const [products, setProducts] = useState<Produit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repartitionProductId, setRepartitionProductId] = useState<number | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error("Impossible de charger le stock");
      setProducts(await response.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible de charger le stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => [
      product.nom,
      product.reference,
      product.sousCategorie?.nom,
      product.sousCategorie?.categorie?.nom,
      product.marque?.nom,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [products, search]);

  const totalStock = filteredProducts.reduce((total, product) => total + Number(product.stock || 0), 0);

  return (
    <div>
      <PageBreadcrumb pageTitle="Stock" />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">État du stock</h1>
          <p className="mt-1 text-sm text-gray-500">Consultation des produits et de leurs quantités — sans modification.</p>
        </div>
        <div className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          {filteredProducts.length} produit(s) · {totalStock} unité(s)
        </div>
      </div>

      <div className="mb-5">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par nom, référence, catégorie ou marque..."
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:max-w-xl"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-red-500"><p>{error}</p><button onClick={loadProducts} className="text-sm underline">Réessayer</button></div>
        ) : filteredProducts.length === 0 ? (
          <p className="py-20 text-center text-sm text-gray-500">Aucun produit trouvé.</p>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-start">Produit</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Référence</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Stock</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Catégorie</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Marque</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Disponibilité</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-end">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProducts.map((product) => {
                  const inStock = Number(product.stock) > 0;
                  const available = product.disponibleALaVente ?? product.disponible ?? true;
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="px-4 py-3 font-medium text-gray-800 dark:text-white">{product.nom}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-500">{product.reference}</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inStock ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}>
                          {product.stock} {inStock ? "en stock" : "rupture"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500">{product.sousCategorie?.categorie?.nom || product.sousCategorie?.nom || "—"}</TableCell>
                      <TableCell className="px-4 py-3 text-gray-500">{product.marque?.nom || "—"}</TableCell>
                      <TableCell className="px-4 py-3"><span className={available ? "text-emerald-600" : "text-gray-400"}>{available ? "Disponible" : "Indisponible"}</span></TableCell>
                      <TableCell className="px-4 py-3 text-end">
                        <button
                          onClick={() => setRepartitionProductId(product.id)}
                          className="text-sm font-medium text-brand-500 hover:underline"
                        >
                          Détails Stock
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      {repartitionProductId && <StockRepartitionModal produitId={repartitionProductId} onClose={() => setRepartitionProductId(null)} />}
    </div>
  );
}
