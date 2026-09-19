"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl } from "@/utils/api";

const API_URL = getApiUrl();

type Produit = { id: number; nom: string; reference: string; cump: number };
type LigneInventaire = {
  id: number;
  produitId: number;
  produit: Produit;
  quantiteSortie: number;
  quantiteVendue: number;
  quantiteRestante: number;
  quantiteVoiture: number;
  ecart: number;
  valeurEcart: string | number;
};

type Inventaire = {
  id: number;
  code: string;
  statut: "BROUILLON" | "VALIDE";
  totalEcartQte: number;
  totalValeurEcart: string | number;
  lignes: LigneInventaire[];
  commercial: { prenom: string; nom: string };
};

export default function InventairePage() {
  const { id } = useParams();
  const router = useRouter();
  const [inventaire, setInventaire] = useState<Inventaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editLigneId, setEditLigneId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("rzm_token");
      const headers = { "Authorization": `Bearer ${token}` };
      // Create it if it doesn't exist
      await fetch(`${API_URL}/stock-commercial/bons-sortie/${id}/inventaire`, { method: "POST", headers });
      const response = await fetch(`${API_URL}/stock-commercial/bons-sortie/${id}/inventaire`, { headers });
      if (response.ok) setInventaire(await response.json());
      else setError("Impossible de charger l'inventaire");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const saveLigne = async (ligneId: number) => {
    try {
      const token = localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/stock-commercial/inventaires/lignes/${ligneId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantiteVoiture: editVal }),
      });
      if (response.ok) {
        setEditLigneId(null);
        load(); // Recharger pour avoir les écarts mis à jour
      } else {
        alert("Erreur lors de la sauvegarde de la ligne");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const valider = async () => {
    if (!inventaire) return;
    if (!confirm(`Confirmez-vous la validation de l'inventaire ?\nTotal des écarts : ${inventaire.totalEcartQte} produit(s)\nValeur totale des écarts : ${Number(inventaire.totalValeurEcart).toFixed(3)} TND`)) return;
    
    try {
      const token = localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/stock-commercial/inventaires/${inventaire.id}/valider`, { 
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Inventaire validé avec succès");
        router.push("/bons-sortie");
      } else {
        const d = await response.json();
        alert(d.error || "Erreur lors de la validation");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Inventaire du Bon de Sortie" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? <div className="py-10 text-center">Chargement...</div> : error ? <div className="py-10 text-center text-red-500">{error}</div> : !inventaire ? <div className="py-10 text-center">Aucun inventaire trouvé</div> : (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Inventaire {inventaire.code}
                </h1>
                <p className="text-sm text-gray-500">
                  Commercial : {inventaire.commercial.prenom} {inventaire.commercial.nom} | Statut : {" "}
                  <span className={`font-semibold ${inventaire.statut === "VALIDE" ? "text-green-600" : "text-brand-600"}`}>
                    {inventaire.statut}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push("/bons-sortie")} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  Retour
                </button>
                {inventaire.statut === "BROUILLON" && (
                  <button onClick={valider} className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
                    Valider l'Inventaire
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Produit</th>
                    <th className="px-4 py-3 text-center">Qte Sortie</th>
                    <th className="px-4 py-3 text-center">Qte Vendue</th>
                    <th className="px-4 py-3 text-center">Qte Restante</th>
                    <th className="px-4 py-3 text-center bg-brand-50/50 dark:bg-brand-900/10">Qte Voiture</th>
                    <th className="px-4 py-3 text-center">Écart Qte</th>
                    <th className="px-4 py-3 text-right">Valeur Écart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {inventaire.lignes.map((ligne) => (
                    <tr key={ligne.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {ligne.produit.nom}
                        <div className="text-xs text-gray-500">{ligne.produit.reference}</div>
                      </td>
                      <td className="px-4 py-3 text-center">{ligne.quantiteSortie}</td>
                      <td className="px-4 py-3 text-center">{ligne.quantiteVendue}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">{ligne.quantiteRestante}</td>
                      <td className="px-4 py-3 text-center bg-brand-50/50 dark:bg-brand-900/10">
                        {inventaire.statut === "BROUILLON" ? (
                          editLigneId === ligne.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={editVal} 
                                onChange={(e) => setEditVal(Number(e.target.value))}
                                className="w-16 rounded border px-2 py-1 text-center text-sm dark:bg-gray-700 dark:border-gray-600"
                                autoFocus
                              />
                              <button onClick={() => saveLigne(ligne.id)} className="text-green-600 hover:text-green-700">✓</button>
                              <button onClick={() => setEditLigneId(null)} className="text-red-500 hover:text-red-600">✕</button>
                            </div>
                          ) : (
                            <div className="cursor-pointer font-bold text-brand-600 hover:underline" onClick={() => { setEditLigneId(ligne.id); setEditVal(ligne.quantiteVoiture); }}>
                              {ligne.quantiteVoiture} ✎
                            </div>
                          )
                        ) : (
                          <div className="font-bold">{ligne.quantiteVoiture}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${ligne.ecart < 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ligne.ecart > 0 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "text-gray-500"}`}>
                          {ligne.ecart > 0 ? "+" : ""}{ligne.ecart}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={ligne.ecart < 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                          {Number(ligne.valeurEcart).toFixed(3)} TND
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold text-gray-900 dark:bg-gray-800/50 dark:text-white">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right uppercase">Total :</td>
                    <td className="px-4 py-3 text-center">
                      <span className={inventaire.totalEcartQte < 0 ? "text-red-600" : ""}>{inventaire.totalEcartQte > 0 ? "+" : ""}{inventaire.totalEcartQte}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={Number(inventaire.totalValeurEcart) < 0 ? "text-red-600" : ""}>{Number(inventaire.totalValeurEcart).toFixed(3)} TND</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
