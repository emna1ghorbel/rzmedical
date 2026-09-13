"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

interface Fournisseur { id: number; nom: string; }
interface Product { id: number; nom: string; reference: string; prix?: number | null; prixAchat?: number | null; tva?: number | null; }
interface BonCommande {
  id: number;
  code: string;
  statut: string;
  fournisseurId?: number | null;
  fournisseurNom?: string | null;
  fournisseur?: { id: number; nom: string } | null;
  lignes: any[];
  _count?: { bonsReception: number };
}

interface BRLine {
  produitId?: number;
  designation: string;
  quantiteCmd: number;
  quantiteRecue: number;
  prixUnitaireHT: number;
  tauxTVA: number;
}

const initialLine = (): BRLine => ({
  designation: "",
  quantiteCmd: 0,
  quantiteRecue: 1,
  prixUnitaireHT: 0,
  tauxTVA: 19,
});

export default function NewBonReceptionPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bonsCommande, setBonsCommande] = useState<BonCommande[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fournisseurSearch, setFournisseurSearch] = useState("");
  const [showFourDropdown, setShowFourDropdown] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [selectedBC, setSelectedBC] = useState<BonCommande | null>(null);

  const [dateReception, setDateReception] = useState(new Date().toISOString().split("T")[0]);
  const [statut, setStatut] = useState("BROUILLON");
  const [commentaire, setCommentaire] = useState("");
  const [lignes, setLignes] = useState<BRLine[]>([initialLine()]);

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      const [fRes, bcRes, pRes] = await Promise.all([
        fetch(`${API_URL}/fournisseurs?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/achats/bons-commande?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/products?limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (fRes.ok) { const d = await fRes.json(); setFournisseurs(d.items ?? d); }
      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.items ?? d.products ?? d.produits ?? d);
      }
      if (bcRes.ok) {
        const d = await bcRes.json();
        setBonsCommande((d.items ?? []).filter((bc: BonCommande) =>
          bc.statut !== "ANNULE" && (bc._count?.bonsReception ?? 0) === 0,
        ));
      }
    };
    fetchData();
  }, [getToken]);

  const filteredFournisseurs = fournisseurs.filter(
    (f) => !fournisseurSearch || f.nom.toLowerCase().includes(fournisseurSearch.toLowerCase()),
  );

  const handleSelectBC = async (bc: BonCommande) => {
    const token = getToken();
    let completeBC = bc;
    try {
      const response = await fetch(`${API_URL}/achats/bons-commande/${bc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) completeBC = await response.json();
    } catch {
      // Keep the list data as a fallback when the detail request fails.
    }

    setSelectedBC(completeBC);
    const fournisseurId = completeBC.fournisseurId ?? completeBC.fournisseur?.id;
    const fournisseur = fournisseurs.find((item) => item.id === Number(fournisseurId));
    if (fournisseur) {
      setSelectedFournisseur(fournisseur);
      setFournisseurSearch(fournisseur.nom);
    }

    if (completeBC.lignes?.length > 0) {
      setLignes(completeBC.lignes.map((l: any) => ({
        produitId: l.produitId ?? undefined,
        designation: l.designation ?? "",
        quantiteCmd: Number(l.quantite ?? 0),
        quantiteRecue: Number(l.quantite ?? 0),
        prixUnitaireHT: Number(l.prixUnitaireHT ?? 0),
        tauxTVA: Number(l.tauxTVA ?? 19),
      })));
    } else {
      setError("Ce bon de commande ne contient aucun article");
      setLignes([initialLine()]);
    }
  };

  const updateLine = (i: number, partial: Partial<BRLine>) => {
    setLignes((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...partial };
      return next;
    });
  };

  const handleProductSelect = (lineIndex: number, productId: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    updateLine(lineIndex, {
      produitId: product.id,
      designation: product.nom,
      prixUnitaireHT: Number(product.prixAchat ?? product.prix ?? 0),
      tauxTVA: Number(product.tva ?? 19),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-reception`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fournisseurId: selectedFournisseur?.id ?? null,
          bonCommandeId: selectedBC?.id ?? null,
          dateReception,
          statut,
          commentaire: commentaire || null,
          lignes: lignes.filter((l) => l.designation),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erreur"); }
      router.push("/bons-reception");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageBreadcrumb pageTitle="Nouveau Bon de Réception" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Nouveau Bon de Réception</h1>
        <Link href="/bons-reception" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          ← Retour
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fournisseur + BC */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Fournisseur & Bon de Commande</h2>
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
                      className="w-full text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-sm text-gray-800 dark:text-white">
                      {f.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bon de Commande lié (optionnel)</label>
              <select
                value={selectedBC?.id ?? ""}
                onChange={(e) => {
                  const bc = bonsCommande.find((b) => b.id === Number(e.target.value));
                  if (bc) handleSelectBC(bc);
                  else setSelectedBC(null);
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="">— Aucun —</option>
                {bonsCommande.map((bc) => (
                  <option key={bc.id} value={bc.id}>{bc.code} {bc.fournisseurNom ? `— ${bc.fournisseurNom}` : ""}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Paramètres */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Paramètres</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date de réception</label>
              <input type="date" value={dateReception} onChange={(e) => setDateReception(e.target.value)} required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                <option value="BROUILLON">Brouillon</option>
                <option value="CONTROLE">Contrôlé</option>
                <option value="VALIDE">Validé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Articles reçus</h2>
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
                  <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium min-w-[200px]">Désignation</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Qté commandée</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Qté reçue</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Prix HT</th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">TVA %</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lignes.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-3 py-2">
                      <select
                        value={l.produitId ?? ""}
                        onChange={(e) => e.target.value && handleProductSelect(i, Number(e.target.value))}
                        className="w-full mb-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      >
                        <option value="">— Choisir un produit —</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.nom} ({product.reference})
                          </option>
                        ))}
                      </select>
                      <input type="text" value={l.designation} onChange={(e) => updateLine(i, { designation: e.target.value })}
                        placeholder="Désignation manuelle..." required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.001" value={l.quantiteCmd} onChange={(e) => updateLine(i, { quantiteCmd: Number(e.target.value) })}
                        className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.001" value={l.quantiteRecue} onChange={(e) => updateLine(i, { quantiteRecue: Number(e.target.value) })}
                        className={`w-24 border rounded px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white ${
                          l.quantiteRecue < l.quantiteCmd ? "border-orange-400" : "border-gray-300 dark:border-gray-600"
                        }`} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.001" value={l.prixUnitaireHT} onChange={(e) => updateLine(i, { prixUnitaireHT: Number(e.target.value) })}
                        className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs text-right bg-white dark:bg-gray-800 text-gray-800 dark:text-white" />
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

        {/* Commentaire */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Commentaire</h2>
          <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} placeholder="Notes sur la réception..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none" />
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Link href="/bons-reception" className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</Link>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement...</> : "Créer le Bon de Réception"}
          </button>
        </div>
      </form>
    </div>
  );
}
