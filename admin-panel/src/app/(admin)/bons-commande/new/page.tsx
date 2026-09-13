"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();
const round3 = (x: number) => Math.round(x * 1000) / 1000;

interface Fournisseur {
  id: number;
  nom: string;
  matriculeFiscale?: string | null;
}

interface Product {
  id: number;
  nom: string;
  reference: string;
  prix?: number | null;
  prixAchat?: number | null;
  tva?: number | null;
}

interface BCLine {
  produitId?: number;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  remise: number;
  tauxTVA: number;
  totalHT: number;
}

const initialLine = (): BCLine => ({
  designation: "",
  quantite: 1,
  prixUnitaireHT: 0,
  remise: 0,
  tauxTVA: 19,
  totalHT: 0,
});

function calcLine(l: BCLine): BCLine {
  const puBrut = round3(l.quantite * l.prixUnitaireHT);
  const remiseMontant = round3(puBrut * l.remise / 100);
  const ht = round3(puBrut - remiseMontant);
  return { ...l, totalHT: ht };
}

export default function NewBonCommandePage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fournisseurSearch, setFournisseurSearch] = useState("");
  const [showFourDropdown, setShowFourDropdown] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);

  const [dateCommande, setDateCommande] = useState(new Date().toISOString().split("T")[0]);
  const [dateLivraison, setDateLivraison] = useState("");
  const [statut, setStatut] = useState("BROUILLON");
  const [devise, setDevise] = useState("TND");
  const [timbreFiscal, setTimbreFiscal] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [lignes, setLignes] = useState<BCLine[]>([initialLine()]);

  const montantHT = round3(lignes.reduce((s, l) => s + l.totalHT, 0));
  const montantTVA = round3(lignes.reduce((s, l) => s + round3(l.totalHT * l.tauxTVA / 100), 0));
  const montantTTC = round3(montantHT + montantTVA + Number(timbreFiscal));

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      const [fRes, pRes] = await Promise.all([
        fetch(`${API_URL}/fournisseurs?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/products?limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (fRes.ok) { const d = await fRes.json(); setFournisseurs(d.items ?? d); }
      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.items ?? d.products ?? d.produits ?? d);
      }
    };
    fetchData();
  }, [getToken]);

  const filteredFournisseurs = fournisseurs.filter(
    (f) => !fournisseurSearch || f.nom.toLowerCase().includes(fournisseurSearch.toLowerCase()),
  );

  const updateLine = (i: number, partial: Partial<BCLine>) => {
    setLignes((prev) => {
      const next = [...prev];
      next[i] = calcLine({ ...next[i], ...partial });
      return next;
    });
  };

  const handleProductSelect = (i: number, productId: number) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateLine(i, {
      produitId: p.id,
      designation: p.nom,
      prixUnitaireHT: Number(p.prixAchat ?? p.prix ?? 0),
      tauxTVA: Number(p.tva ?? 19),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-commande`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fournisseurId: selectedFournisseur?.id ?? null,
          dateCommande,
          dateLivraisonPrevue: dateLivraison || null,
          statut,
          devise,
          timbreFiscal: Number(timbreFiscal),
          commentaire: commentaire || null,
          lignes: lignes.filter((l) => l.designation),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erreur"); }
      router.push("/bons-commande");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageBreadcrumb pageTitle="Nouveau Bon de Commande" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Nouveau Bon de Commande</h1>
        <Link href="/bons-commande" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          ← Retour
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fournisseur */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Fournisseur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label>
              <input
                type="text"
                value={fournisseurSearch}
                onChange={(e) => { setFournisseurSearch(e.target.value); setShowFourDropdown(true); }}
                onFocus={() => setShowFourDropdown(true)}
                onBlur={() => setTimeout(() => setShowFourDropdown(false), 200)}
                placeholder="Rechercher un fournisseur..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
              {showFourDropdown && filteredFournisseurs.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredFournisseurs.slice(0, 10).map((f) => (
                    <button key={f.id} type="button" onMouseDown={() => { setSelectedFournisseur(f); setFournisseurSearch(f.nom); setShowFourDropdown(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-sm">
                      <span className="font-medium text-gray-800 dark:text-white">{f.nom}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedFournisseur && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-800 dark:text-white">{selectedFournisseur.nom}</p>
                {selectedFournisseur.matriculeFiscale && <p>MF: {selectedFournisseur.matriculeFiscale}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Paramètres */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Paramètres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date commande</label>
              <input type="date" value={dateCommande} onChange={(e) => setDateCommande(e.target.value)} required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Livraison prévue</label>
              <input type="date" value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYE">Envoyé</option>
                <option value="CONFIRME">Confirmé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Devise</label>
              <select value={devise} onChange={(e) => setDevise(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Articles commandés</h2>
            <button type="button" onClick={() => setLignes((p) => [...p, initialLine()])}
              className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
              Ajouter une ligne
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Produit</th>
                  <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium min-w-[200px]">Désignation</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Qté</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Prix HT</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Remise %</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Total HT</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">TVA %</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lignes.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-3 py-2">
                      <select value={l.produitId ?? ""} onChange={(e) => e.target.value && handleProductSelect(i, Number(e.target.value))}
                        className="w-36 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                        <option value="">— Choisir —</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom} ({p.reference}) — {Number(p.prixAchat ?? p.prix ?? 0).toFixed(3)} DT
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={l.designation} onChange={(e) => updateLine(i, { designation: e.target.value })}
                        placeholder="Désignation..." required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0.001" step="0.001" value={l.quantite} onChange={(e) => updateLine(i, { quantite: Number(e.target.value) })}
                        className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.001" value={l.prixUnitaireHT} onChange={(e) => updateLine(i, { prixUnitaireHT: Number(e.target.value) })}
                        className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" max="100" step="0.01" value={l.remise} onChange={(e) => updateLine(i, { remise: Number(e.target.value) })}
                        className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-gray-800 dark:text-white">
                      {l.totalHT.toFixed(3)}
                    </td>
                    <td className="px-3 py-2">
                      <select value={l.tauxTVA} onChange={(e) => updateLine(i, { tauxTVA: Number(e.target.value) })}
                        className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                        {[0, 7, 13, 19].map((t) => <option key={t} value={t}>{t}%</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      {lignes.length > 1 && (
                        <button type="button" onClick={() => setLignes((p) => p.filter((_, j) => j !== i))}
                          className="p-1 text-red-400 hover:text-red-600">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totaux + Commentaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Commentaire</h2>
            <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={4} placeholder="Notes..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none" />
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Total HT</span><span className="font-medium">{montantHT.toFixed(3)} {devise}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Total TVA</span><span className="font-medium">{montantTVA.toFixed(3)} {devise}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Timbre Fiscal</span>
                <input type="number" step="0.001" value={timbreFiscal} onChange={(e) => setTimbreFiscal(Number(e.target.value))}
                  className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                <span className="font-bold text-gray-800 dark:text-white">Total TTC</span>
                <span className="font-bold text-lg text-brand-600 dark:text-brand-400">{montantTTC.toFixed(3)} {devise}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Link href="/bons-commande" className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</Link>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement...</> : "Créer le Bon de Commande"}
          </button>
        </div>
      </form>
    </div>
  );
}
