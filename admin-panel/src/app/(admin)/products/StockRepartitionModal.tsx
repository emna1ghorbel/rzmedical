import React, { useEffect, useState } from "react";
import { getApiUrl } from "@/utils/api";

const API_URL = getApiUrl();

type RepartitionItem = {
  type: string;
  nom: string;
  quantite: number;
};

type RepartitionData = {
  stockTotal: number;
  repartition: RepartitionItem[];
};

export default function StockRepartitionModal({ produitId, onClose }: { produitId: number; onClose: () => void }) {
  const [data, setData] = useState<RepartitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("rzm_token");
        const response = await fetch(`${API_URL}/products/${produitId}/stock-repartition`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          setData(await response.json());
        } else {
          setError("Impossible de charger la répartition du stock.");
        }
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    };
    load();
  }, [produitId]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6 border border-gray-200 dark:border-gray-800 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-lg font-bold text-gray-800 dark:text-white">Répartition du Stock</h4>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Chargement...</div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-red-500">{error}</div>
        ) : data ? (
          <div>
            <div className="mb-4 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg flex justify-between items-center">
              <span className="font-semibold text-brand-800 dark:text-brand-300">Stock Total</span>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{data.stockTotal}</span>
            </div>
            
            <div className="space-y-3">
              {data.repartition.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-500 font-medium uppercase mb-0.5">{item.type}</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{item.nom}</div>
                  </div>
                  <div className="text-base font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">
                    {item.quantite}
                  </div>
                </div>
              ))}
              
              {data.repartition.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Aucune répartition disponible
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
