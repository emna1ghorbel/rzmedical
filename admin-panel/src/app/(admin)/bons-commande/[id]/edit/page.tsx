"use client";

import React, { useState, useEffect, useCallback, use } from "react";
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
  prixAchat?: number | null;
  tva?: number | null;
}

interface BCLine {
  id?: number;
  produitId?: number;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  remise: number;
  tauxTVA: number;
  totalHT: number;
}

function calcLine(l: BCLine): BCLine {
  const puBrut = round3(l.quantite * l.prixUnitaireHT);
  const remiseMontant = round3((puBrut * l.remise) / 100);
  const ht = round3(puBrut - remiseMontant);
  return { ...l, totalHT: ht };
}

export default function EditBonCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getToken } = useAuth();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [fournisseurId, setFournisseurId] = useState<number | "">("");
  const [fournisseurSearch, setFournisseurSearch] = useState("");
  const [showFourDropdown, setShowFourDropdown] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);

  const [dateCommande, setDateCommande] = useState("");
  const [dateLivraison, setDateLivraison] = useState("");
  const [statut, setStatut] = useState("BROUILLON");
  const [devise, setDevise] = useState("TND");
  const [timbreFiscal, setTimbreFiscal] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [lignes, setLignes] = useState<BCLine[]>([]);

  const montantHT = round3(lignes.reduce((s, l) => s + l.totalHT, 0));
  const montantTVA = round3(lignes.reduce((s, l) => s + round3((l.totalHT * l.tauxTVA) / 100), 0));
  const montantTTC = round3(montantHT + montantTVA + Number(timbreFiscal));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const [fRes, pRes, bonRes] = await Promise.all([
        fetch(`${API_URL}/fournisseurs?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/products?limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/achats/bons-commande/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (fRes.ok) {
        const d = await fRes.json();
        setFournisseurs(d.items ?? d);
      }
      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.items ?? d.produits ?? d);
      }

      if (!bonRes.ok) throw new Error("Bon de commande introuvable");
      const bon = await bonRes.json();

      setCode(bon.code);
      setDateCommande(bon.dateCommande ? bon.dateCommande.split("T")[0] : "");
      setDateLivraison(bon.dateLivraisonPrevue ? bon.dateLivraisonPrevue.split("T")[0] : "");
      setStatut(bon.statut);
      setDevise(bon.devise || "TND");
      setTimbreFiscal(Number(bon.timbreFiscal || 0));
      setCommentaire(bon.commentaire || "");

      if (bon.fournisseurId) {
        setFournisseurId(bon.fournisseurId);
        setFournisseurSearch(bon.fournisseurNom || "");
        setSelectedFournisseur({
          id: bon.fournisseurId,
          nom: bon.fournisseurNom,
          matriculeFiscale: bon.fournisseurMF,
        });
      }

      if (bon.lignes && bon.lignes.length > 0) {
        setLignes(
          bon.lignes.map((l: any) => ({
            id: l.id,
            produitId: l.produitId,
            designation: l.designation,
            quantite: Number(l.quantite),
            prixUnitaireHT: Number(l.prixUnitaireHT),
            remise: Number(l.remise || 0),
            tauxTVA: Number(l.tauxTVA || 19),
            totalHT: Number(l.totalHT),
          }))
        );
      } else {
        setLignes([
          { designation: "", quantite: 1, prixUnitaireHT: 0, remise: 0, tauxTVA: 19, totalHT: 0 },
        ]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredFournisseurs = fournisseurs.filter(
    (f) => !fournisseurSearch || f.nom.toLowerCase().includes(fournisseurSearch.toLowerCase())
  );

  const updateLine = (i: number, partial: Partial<BCLine>) => {
    setLignes((prev) => {
      const next = [...prev];
      next[i] = calcLine({ ...next[i], ...partial });
      return next;
    });
  };

  const addLine = () =>
    setLignes((prev) => [
      ...prev,
      { designation: "", quantite: 1, prixUnitaireHT: 0, remise: 0, tauxTVA: 19, totalHT: 0 },
    ]);

  const removeLine = (i: number) => setLignes((prev) => prev.filter((_, j) => j !== i));

  const handleProductSelect = (lineIndex: number, productId: number) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateLine(lineIndex, {
      produitId: p.id,
      designation: p.nom,
      prixUnitaireHT: Number(p.prixAchat ?? 0),
      tauxTVA: Number(p.tva ?? 19),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lignes.length || lignes.every((l) => !l.designation)) {
      setError("Veuillez ajouter au moins une ligne");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-commande/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fournisseurId: fournisseurId || null,
          dateCommande,
          dateLivraisonPrevue: dateLivraison || null,
          statut,
          devise,
          timbreFiscal: Number(timbreFiscal),
          commentaire: commentaire || null,
          lignes: lignes.filter((l) => l.designation),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur modification");
      }
      router.push(`/bons-commande/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageBreadcrumb pageTitle={`Modifier Bon de Commande ${code}`} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Modifier le Bon de Commande {code}
        </h1>
        <Link
          href={`/bons-commande/${id}`}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ← Annuler
        </Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Fournisseur & Dates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label>
              <input
                type="text"
                value={fournisseurSearch}
                onChange={(e) => {
                  setFournisseurSearch(e.target.value);
                  setShowFourDropdown(true);
                }}
                onFocus={() => setShowFourDropdown(true)}
                placeholder="Rechercher un fournisseur..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
              {showFourDropdown && filteredFournisseurs.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredFournisseurs.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onMouseDown={() => {
                        setFournisseurId(f.id);
                        setSelectedFournisseur(f);
                        setFournisseurSearch(f.nom);
                        setShowFourDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    >
                      {f.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date commande</label>
                <input
                  type="date"
                  value={dateCommande}
                  onChange={(e) => setDateCommande(e.target.value)}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Livraison prévue</label>
                <input
                  type="date"
                  value={dateLivraison}
                  onChange={(e) => setDateLivraison(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="ENVOYE">Envoyé</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="RECEPTIONNE_PARTIEL">Réc. Partiel</option>
                <option value="RECEPTIONNE">Réceptionné</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Devise</label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="TND">TND</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lignes Articles */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Lignes de commande
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 border border-brand-300 px-3 py-1.5 rounded-lg"
            >
              + Ajouter une ligne
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
                  <th className="px-3 py-2 text-left min-w-[200px]">Désignation</th>
                  <th className="px-3 py-2 text-right w-20">Qté</th>
                  <th className="px-3 py-2 text-right w-24">Prix HT</th>
                  <th className="px-3 py-2 text-right w-20">Remise %</th>
                  <th className="px-3 py-2 text-right w-20">TVA %</th>
                  <th className="px-3 py-2 text-right w-28">Total HT</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lignes.map((l, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={l.designation}
                        onChange={(e) => updateLine(i, { designation: e.target.value })}
                        required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0.001"
                        step="any"
                        value={l.quantite}
                        onChange={(e) => updateLine(i, { quantite: Number(e.target.value) })}
                        className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={l.prixUnitaireHT}
                        onChange={(e) => updateLine(i, { prixUnitaireHT: Number(e.target.value) })}
                        className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={l.remise}
                        onChange={(e) => updateLine(i, { remise: Number(e.target.value) })}
                        className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={l.tauxTVA}
                        onChange={(e) => updateLine(i, { tauxTVA: Number(e.target.value) })}
                        className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      >
                        <option value="0">0%</option>
                        <option value="7">7%</option>
                        <option value="13">13%</option>
                        <option value="19">19%</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-xs">
                      {round3(l.totalHT).toFixed(3)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {lignes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totaux */}
        <div className="flex justify-end">
          <div className="w-full sm:w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Total HT :</span>
              <span className="font-semibold">{montantHT.toFixed(3)} {devise}</span>
            </div>
            <div className="flex justify-between">
              <span>Total TVA :</span>
              <span>{montantTVA.toFixed(3)} {devise}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-sm">
              <span>Total TTC :</span>
              <span>{montantTTC.toFixed(3)} {devise}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/bons-commande/${id}`}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold shadow-xs disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}
