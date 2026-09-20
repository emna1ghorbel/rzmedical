"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl } from "@/utils/api";

const API_URL = getApiUrl();

type Bon = {
  id: number;
  code: string;
  statut: "BROUILLON" | "VALIDE" | "ANNULE";
  creeLe: string;
  commercial: { id: number; nom: string; prenom: string };
  lignes: { produit: { nom: string }; quantite: number }[];
};

type Commercial = { id: number; prenom: string; nom: string };
type Produit = { id: number; nom: string; stock: number };

export default function BonsSortiePage() {
  const [bons, setBons] = useState<Bon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal d'ajout
  const [showAddModal, setShowAddModal] = useState(false);
  const [commerciaux, setCommerciaux] = useState<Commercial[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [formCommercialId, setFormCommercialId] = useState("");
  const [formLignes, setFormLignes] = useState<{ produitId: string; quantite: string }[]>([
    { produitId: "", quantite: "1" }
  ]);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/stock-commercial/bons-sortie`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) setBons(await response.json());
    } catch (e) {}
    setLoading(false);
  };

  const loadDataForModal = async () => {
    try {
      const token = localStorage.getItem("rzm_token");
      const headers = { "Authorization": `Bearer ${token}` };
      const [comRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/clients/commerciaux`, { headers }),
        fetch(`${API_URL}/products?limit=1000`, { headers })
      ]);
      if (comRes.ok) {
        const data = await comRes.json();
        setCommerciaux(data);
      }
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProduits(data.items || data || []);
      }
    } catch (err) {}
  };

  useEffect(() => { load(); }, []);

  const openAddModal = () => {
    setShowAddModal(true);
    setFormError(null);
    setFormCommercialId("");
    setFormLignes([{ produitId: "", quantite: "1" }]);
    if (commerciaux.length === 0 || produits.length === 0) {
      loadDataForModal();
    }
  };

  const handleAddSubmit = async () => {
    setFormError(null);
    if (!formCommercialId) return setFormError("Veuillez sélectionner un commercial");
    const lignes = formLignes.filter(l => l.produitId && Number(l.quantite) > 0);
    if (lignes.length === 0) return setFormError("Veuillez ajouter au moins un produit");

    setAdding(true);
    try {
      const token = localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/stock-commercial/bons-sortie`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          commercialId: Number(formCommercialId),
          lignes: lignes.map(l => ({ produitId: Number(l.produitId), quantite: Number(l.quantite) }))
        })
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erreur de création");
      setShowAddModal(false);
      load();
    } catch (err: any) {
      setFormError(err.message);
    }
    setAdding(false);
  };

  const valider = async (id: number) => {
    if (!confirm("Voulez-vous vraiment valider ce bon de sortie ? Le stock du dépôt sera diminué et celui du commercial sera augmenté.")) return;
    try {
      const token = localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/stock-commercial/bons-sortie/${id}/valider`, { 
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || "Erreur de validation");
      }
      alert("Bon validé avec succès");
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Bons de Sortie (Dépôt → Commercial)" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Liste des Bons de Sortie</h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Rechercher code, commercial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button onClick={load} className="text-sm font-medium text-brand-500 hover:text-brand-600">Rafraîchir</button>
            <button onClick={openAddModal} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 ml-2">
              + Nouveau Bon
            </button>
          </div>
        </div>
        
        {loading ? <div className="py-10 text-center">Chargement...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Commercial</th>
                  <th className="px-4 py-3">Contenu</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {bons.filter(bon => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return bon.code.toLowerCase().includes(q) ||
                    `${bon.commercial.prenom} ${bon.commercial.nom}`.toLowerCase().includes(q);
                }).map((bon) => (
                  <tr key={bon.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{bon.code}</td>
                    <td className="px-4 py-3">{new Date(bon.creeLe).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{bon.commercial.prenom} {bon.commercial.nom}</td>
                    <td className="px-4 py-3">
                      {bon.lignes.map((l, i) => (
                        <div key={i} className="text-xs">{l.quantite}x {l.produit.nom}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        bon.statut === "VALIDE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {bon.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/bons-sortie/${bon.id}`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                        Détails
                      </Link>
                      {bon.statut === "BROUILLON" && (
                        <Link href={`/bons-sortie/${bon.id}/edit`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                          Modifier
                        </Link>
                      )}
                      {bon.statut === "BROUILLON" && (
                        <button onClick={() => valider(bon.id)} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
                          Valider
                        </button>
                      )}
                      {bon.statut === "VALIDE" && (
                        <Link href={`/bons-sortie/${bon.id}/inventaire`} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                          Inventaire
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {bons.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun bon de sortie. Cliquez sur "+ Nouveau Bon" pour en créer un.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Créer un Bon de Sortie</h3>
            
            <div className="mb-4">
              <label htmlFor="bon-sortie-commercial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commercial *</label>
              <select 
                id="bon-sortie-commercial"
                value={formCommercialId} 
                onChange={(e) => setFormCommercialId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">-- Sélectionner un commercial --</option>
                {commerciaux.map(c => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Produits *</label>
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                />
                <button 
                  onClick={() => setFormLignes([...formLignes, { produitId: "", quantite: "1" }])}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  + Ajouter une ligne
                </button>
              </div>
              
              <div className="space-y-2">
                {formLignes.map((ligne, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <select 
                        value={ligne.produitId}
                        onChange={(e) => {
                          const newLignes = [...formLignes];
                          newLignes[index].produitId = e.target.value;
                          setFormLignes(newLignes);
                        }}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      >
                        <option value="">-- Produit --</option>
                        {produits
                          .filter(p => !productSearch || p.nom.toLowerCase().includes(productSearch.toLowerCase()))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.nom} (Stock: {p.stock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        min="1" 
                        value={ligne.quantite}
                        onChange={(e) => {
                          const newLignes = [...formLignes];
                          newLignes[index].quantite = e.target.value;
                          setFormLignes(newLignes);
                        }}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-center dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    {formLignes.length > 1 && (
                      <button 
                        onClick={() => setFormLignes(formLignes.filter((_, i) => i !== index))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddSubmit}
                disabled={adding}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {adding ? "Création..." : "Créer le bon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
