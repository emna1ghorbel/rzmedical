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
}

interface Product {
  id: number;
  nom: string;
  reference: string;
  prixAchat?: number | null;
  tva?: number | null;
}

interface BRLine {
  id?: number;
  produitId?: number;
  designation: string;
  quantiteCmd: number;
  quantiteRecue: number;
  prixUnitaireHT: number;
  tauxTVA: number;
}

export default function EditBonReceptionPage({
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

  const [dateReception, setDateReception] = useState("");
  const [statut, setStatut] = useState("BROUILLON");
  const [commentaire, setCommentaire] = useState("");
  const [lignes, setLignes] = useState<BRLine[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const [fRes, pRes, brRes] = await Promise.all([
        fetch(`${API_URL}/fournisseurs?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/products?limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/achats/bons-reception/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (fRes.ok) {
        const d = await fRes.json();
        setFournisseurs(d.items ?? d);
      }
      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.items ?? d.produits ?? d);
      }

      if (!brRes.ok) throw new Error("Bon de réception introuvable");
      const br = await brRes.json();

      setCode(br.code);
      setDateReception(br.dateReception ? br.dateReception.split("T")[0] : "");
      setStatut(br.statut);
      setCommentaire(br.commentaire || "");

      if (br.fournisseurId) {
        setFournisseurId(br.fournisseurId);
        setFournisseurSearch(br.fournisseurNom || "");
      }

      if (br.lignes && br.lignes.length > 0) {
        setLignes(
          br.lignes.map((l: any) => ({
            id: l.id,
            produitId: l.produitId,
            designation: l.designation,
            quantiteCmd: Number(l.quantiteCmd),
            quantiteRecue: Number(l.quantiteRecue),
            prixUnitaireHT: Number(l.prixUnitaireHT),
            tauxTVA: Number(l.tauxTVA || 19),
          }))
        );
      } else {
        setLignes([
          { designation: "", quantiteCmd: 1, quantiteRecue: 1, prixUnitaireHT: 0, tauxTVA: 19 },
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

  const updateLine = (i: number, partial: Partial<BRLine>) => {
    setLignes((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...partial };
      return next;
    });
  };

  const addLine = () =>
    setLignes((prev) => [
      ...prev,
      { designation: "", quantiteCmd: 1, quantiteRecue: 1, prixUnitaireHT: 0, tauxTVA: 19 },
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
      const res = await fetch(`${API_URL}/achats/bons-reception/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fournisseurId: fournisseurId || null,
          dateReception,
          statut,
          commentaire: commentaire || null,
          lignes: lignes.filter((l) => l.designation),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur modification");
      }
      router.push(`/bons-reception/${id}`);
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
      <PageBreadcrumb pageTitle={`Modifier Bon de Réception ${code}`} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Modifier le Bon de Réception {code}
        </h1>
        <Link
          href={`/bons-reception/${id}`}
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
            Informations de Réception
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
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
              {showFourDropdown && (
                <div className="absolute z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {fournisseurs
                    .filter((f) => !fournisseurSearch || f.nom.toLowerCase().includes(fournisseurSearch.toLowerCase()))
                    .map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onMouseDown={() => {
                          setFournisseurId(f.id);
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

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date de réception</label>
              <input
                type="date"
                value={dateReception}
                onChange={(e) => setDateReception(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="CONTROLE">Contrôlé</option>
                <option value="VALIDE">Validé</option>
                <option value="FACTURE">Facturé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lignes Articles */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Articles Réceptionnés
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
                  <th className="px-3 py-2 text-right w-24">Qté Commandée</th>
                  <th className="px-3 py-2 text-right w-24">Qté Reçue</th>
                  <th className="px-3 py-2 text-right w-24">P.U. HT</th>
                  <th className="px-3 py-2 text-right w-20">TVA %</th>
                  <th className="px-3 py-2 text-right w-28">Total HT Reçu</th>
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
                        min="0"
                        step="any"
                        value={l.quantiteCmd}
                        onChange={(e) => updateLine(i, { quantiteCmd: Number(e.target.value) })}
                        className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={l.quantiteRecue}
                        onChange={(e) => updateLine(i, { quantiteRecue: Number(e.target.value) })}
                        className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold text-emerald-600"
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
                      {round3(l.quantiteRecue * l.prixUnitaireHT).toFixed(3)}
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

        <div className="flex justify-end gap-3">
          <Link
            href={`/bons-reception/${id}`}
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
