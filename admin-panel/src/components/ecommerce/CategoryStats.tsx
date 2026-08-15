"use client";
import React, { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface CatStat {
  id: number;
  nom: string;
  nbProduits: number;
  nbSousCategories: number;
  nbMarques: number;
}

export default function CategoryStats() {
  const [data, setData] = useState<CatStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/stats/by-category`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const total = (Array.isArray(data) ? data.reduce((s, c) => s + c.nbProduits, 0) : 0) || 1;

  const colors = [
    "bg-brand-500", "bg-blue-500", "bg-emerald-500",
    "bg-violet-500", "bg-orange-500", "bg-pink-500",
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">
        Produits par Catégorie
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">Aucune catégorie</p>
      ) : (
        <div className="space-y-4">
          {data.map((cat, i) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.nom}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {cat.nbProduits} produits
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full dark:bg-gray-800">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                  style={{ width: `${Math.max((cat.nbProduits / total) * 100, 2)}%` }}
                />
              </div>
              <div className="flex gap-4 mt-1 text-xs text-gray-400">
                <span>{cat.nbSousCategories} sous-catégories</span>
                <span>{cat.nbMarques} marques</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
