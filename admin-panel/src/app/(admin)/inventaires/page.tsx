"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl } from "@/utils/api";

const API_URL = getApiUrl();

type Inventaire = {
  id: number;
  code: string;
  statut: "BROUILLON" | "VALIDE" | "ANNULE";
  creeLe: string;
  totalEcartQte: number;
  totalValeurEcart: number;
  commercial: { id: number; nom: string; prenom: string };
  bonSortie: { id: number; code: string };
};

export default function InventairesPage() {
  const [inventaires, setInventaires] = useState<Inventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/stock-commercial/inventaires`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setInventaires(await response.json());
      } else {
        setError("Erreur lors du chargement des inventaires");
      }
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = inventaires.filter(i => {
    const q = searchQuery.toLowerCase();
    const commName = `${i.commercial?.nom || ""} ${i.commercial?.prenom || ""}`.toLowerCase();
    return i.code.toLowerCase().includes(q) || commName.includes(q) || (i.bonSortie && i.bonSortie.code.toLowerCase().includes(q));
  });

  return (
    <div>
      <PageBreadcrumb pageTitle="Inventaires Commerciaux" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Liste des Inventaires Validés</h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Rechercher code, commercial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button onClick={load} className="text-sm font-medium text-brand-500 hover:text-brand-600">Rafraîchir</button>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Commercial</th>
                <th className="px-4 py-3 font-semibold">Bon de Sortie</th>
                <th className="px-4 py-3 font-semibold text-center">Écart Qté</th>
                <th className="px-4 py-3 font-semibold text-right">Valeur Écart</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucun inventaire trouvé</td></tr>
              ) : (
                filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.code}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(inv.creeLe).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{inv.commercial?.prenom} {inv.commercial?.nom}</td>
                    <td className="px-4 py-3 text-brand-500 font-medium">
                      {inv.bonSortie ? (
                        <Link href={`/bons-sortie/${inv.bonSortie.id}`} className="hover:underline">
                          {inv.bonSortie.code}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className={`px-4 py-3 text-center font-bold ${inv.totalEcartQte < 0 ? 'text-red-500' : inv.totalEcartQte > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {inv.totalEcartQte}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {Number(inv.totalValeurEcart || 0).toFixed(3)} TND
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.bonSortie && (
                        <Link href={`/bons-sortie/${inv.bonSortie.id}/inventaire`} className="text-sm font-medium text-brand-500 hover:text-brand-600">
                          Voir Détails
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
