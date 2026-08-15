"use client";
import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const BASE_URL = API_URL.replace("/api", "");

interface Produit {
  id: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
  disponible: boolean;
  images: string[];
  creeLe: string;
  sousCategorie: { nom: string; categorie: { nom: string } };
  marque: { nom: string };
}

export default function RecentOrders() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [stockAlerts, setStockAlerts] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recent" | "stock">("recent");

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/stats/products-recent`).then(r => r.json()),
      fetch(`${API_URL}/stats/stock-alert`).then(r => r.json()),
    ])
      .then(([recent, alerts]) => {
        setProduits(recent);
        setStockAlerts(alerts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const data = tab === "recent" ? produits : stockAlerts;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {tab === "recent" ? "Derniers Produits Ajoutés" : "⚠️ Alertes Stock Faible"}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab("recent")}
            className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${tab === "recent" ? "bg-brand-500 text-white border-brand-500" : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-400"}`}
          >
            Récents
          </button>
          <button
            onClick={() => setTab("stock")}
            className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${tab === "stock" ? "bg-red-500 text-white border-red-500" : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-400"}`}
          >
            Stock faible {stockAlerts.length > 0 && <span className="ml-1 bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 text-xs">{stockAlerts.length}</span>}
          </button>
          <Link href="/products" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400">
            Voir tout
          </Link>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Aucun produit</div>
        ) : (
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Produit</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Catégorie</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Prix</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Stock</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[50px] w-[50px] overflow-hidden rounded-md bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {product.images && product.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].startsWith("/") ? BASE_URL + product.images[0] : product.images[0]}
                            className="h-[50px] w-[50px] object-cover"
                            alt={product.nom}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{product.nom}</p>
                        <span className="text-gray-500 text-theme-xs dark:text-gray-400 font-mono">{product.reference}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {product.sousCategorie?.categorie?.nom}<br />
                    <span className="text-xs">{product.sousCategorie?.nom}</span>
                  </TableCell>
                  <TableCell className="py-3 font-semibold text-brand-500">
                    {Number(product.prix).toFixed(2)} TND
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      size="sm"
                      color={product.stock === 0 ? "error" : product.stock <= 5 ? "warning" : "success"}
                    >
                      {product.stock === 0 ? "Rupture" : `${product.stock} unités`}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
