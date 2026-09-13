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
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
}

interface Product {
  id: number;
  nom: string;
  reference: string;
  prix?: number | null;
  prixAchat?: number | null;
  tva?: number | null;
}

interface FFLine {
  id?: number;
  produitId?: number;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  remise: number;
  tauxTVA: number;
  totalHT: number;
  totalTTC: number;
}

function calcLine(l: FFLine): FFLine {
  const puBrut = round3(l.quantite * l.prixUnitaireHT);
  const remiseMontant = round3((puBrut * l.remise) / 100);
  const ht = round3(puBrut - remiseMontant);
  const ttc = round3(ht * (1 + l.tauxTVA / 100));
  return { ...l, totalHT: ht, totalTTC: ttc };
}

export default function EditFactureFournisseurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { getToken } = useAuth();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companyTvaRates, setCompanyTvaRates] = useState<number[]>([]);
  const [companyTimbreRates, setCompanyTimbreRates] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [numero, setNumero] = useState("");
  const [fournisseurId, setFournisseurId] = useState<number | "">("");
  const [fournisseurSearch, setFournisseurSearch] = useState("");
  const [showFournisseurDropdown, setShowFournisseurDropdown] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [fournisseurMF, setFournisseurMF] = useState("");

  const [numeroFF, setNumeroFF] = useState("");
  const [dateFacture, setDateFacture] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [statut, setStatut] = useState<"BROUILLON" | "VALIDEE" | "ANNULEE">("BROUILLON");
  const [typeFacture, setTypeFacture] = useState<"PRODUIT" | "SERVICE">("PRODUIT");
  const [etat, setEtat] = useState<"NORMALE" | "AVOIR" | "PROFORMA">("NORMALE");
  const [devise, setDevise] = useState("TND");
  const [timbreFiscal, setTimbreFiscal] = useState(1);
  const [equilibre, setEquilibre] = useState(0);
  const [calculManuel, setCalculManuel] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [documentJointUrl, setDocumentJointUrl] = useState("");

  const [lignes, setLignes] = useState<FFLine[]>([]);

  // Computed totals
  const montantHT = round3(lignes.reduce((s, l) => s + l.totalHT, 0));
  const montantTVA = round3(lignes.reduce((s, l) => s + round3((l.totalHT * l.tauxTVA) / 100), 0));
  const montantRemise = round3(
    lignes.reduce((s, l) => s + round3(((l.quantite * l.prixUnitaireHT * l.remise) / 100)), 0)
  );
  const montantTTC = round3(montantHT + montantTVA + timbreFiscal + equilibre);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const [fRes, pRes, factRes, configRes] = await Promise.all([
        fetch(`${API_URL}/fournisseurs?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/products?limit=500`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/achats/factures/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/company-info`),
      ]);

      if (fRes.ok) {
        const fd = await fRes.json();
        setFournisseurs(fd.items ?? fd);
      }
      if (pRes.ok) {
        const pd = await pRes.json();
        setProducts(pd.items ?? pd.products ?? pd.produits ?? pd);
      }
      let configuredTvaRates: number[] = [];
      let configuredTimbres: number[] = [];
      if (configRes.ok) {
        const config = await configRes.json();
        if (Array.isArray(config.valeursTva) && config.valeursTva.length > 0) {
          configuredTvaRates = config.valeursTva.map(Number).filter(Number.isFinite).sort((a: number, b: number) => a - b);
          setCompanyTvaRates(configuredTvaRates);
        }
        if (Array.isArray(config.valeursTimbre) && config.valeursTimbre.length > 0) {
          configuredTimbres = config.valeursTimbre.map(Number).filter(Number.isFinite).sort((a: number, b: number) => a - b);
          setCompanyTimbreRates(configuredTimbres);
        }
      }

      if (!factRes.ok) throw new Error("Facture introuvable");
      const fact = await factRes.json();

      setNumero(fact.numero);
      setNumeroFF(fact.numeroFactureFournisseur || "");
      setDateFacture(fact.dateFacture ? fact.dateFacture.split("T")[0] : "");
      setDateEcheance(fact.dateEcheance ? fact.dateEcheance.split("T")[0] : "");
      setStatut(fact.statut);
      setTypeFacture(fact.typeFacture);
      setEtat(fact.etat);
      setDevise(fact.devise || "TND");
      setTimbreFiscal(configuredTimbres.includes(Number(fact.timbreFiscal)) ? Number(fact.timbreFiscal) : configuredTimbres[0] ?? Number(fact.timbreFiscal || 0));
      setEquilibre(Number(fact.equilibre || 0));
      setCalculManuel(fact.calculManuel || false);
      setCommentaire(fact.commentaire || "");
      setDocumentJointUrl(fact.documentJointUrl || "");

      if (fact.fournisseurId) {
        setFournisseurId(fact.fournisseurId);
      setFournisseurSearch(fact.fournisseurNom || "");
      setFournisseurMF(fact.fournisseurMF || "");
        setSelectedFournisseur({
          id: fact.fournisseurId,
          nom: fact.fournisseurNom,
          matriculeFiscale: fact.fournisseurMF,
          adresse: fact.fournisseurAdresse,
          telephone: fact.fournisseurTel,
          email: fact.fournisseurEmail,
        });
      }

      if (fact.lignes && fact.lignes.length > 0) {
        setLignes(
          fact.lignes.map((l: any) => ({
            id: l.id,
            produitId: l.produitId,
            designation: l.designation,
            quantite: Number(l.quantite),
            prixUnitaireHT: Number(l.prixUnitaireHT),
            remise: Number(l.remise || 0),
            tauxTVA: configuredTvaRates.includes(Number(l.tauxTVA)) ? Number(l.tauxTVA) : configuredTvaRates[0] ?? 0,
            totalHT: Number(l.totalHT),
            totalTTC: Number(l.totalTTC),
          }))
        );
      } else {
        setLignes([
          { designation: "", quantite: 1, prixUnitaireHT: 0, remise: 0, tauxTVA: configuredTvaRates[0] ?? 0, totalHT: 0, totalTTC: 0 },
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
    (f) =>
      fournisseurSearch === "" ||
      f.nom.toLowerCase().includes(fournisseurSearch.toLowerCase()) ||
      (f.matriculeFiscale ?? "").toLowerCase().includes(fournisseurSearch.toLowerCase())
  );

  const selectFournisseur = (f: Fournisseur) => {
    setFournisseurId(f.id);
    setSelectedFournisseur(f);
    setFournisseurSearch(f.nom);
    setFournisseurMF(f.matriculeFiscale ?? "");
    setShowFournisseurDropdown(false);
  };

  const updateLine = (i: number, partial: Partial<FFLine>) => {
    setLignes((prev) => {
      const next = [...prev];
      next[i] = calcLine({ ...next[i], ...partial });
      return next;
    });
  };

  const addLine = () =>
    setLignes((prev) => [
      ...prev,
      { designation: "", quantite: 1, prixUnitaireHT: 0, remise: 0, tauxTVA: 19, totalHT: 0, totalTTC: 0 },
    ]);

  const removeLine = (i: number) => setLignes((prev) => prev.filter((_, j) => j !== i));

  const handleProductSelect = (lineIndex: number, productId: number) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateLine(lineIndex, {
      produitId: p.id,
      designation: p.nom,
      prixUnitaireHT: Number(p.prixAchat ?? p.prix ?? 0),
      tauxTVA: companyTvaRates.includes(Number(p.tva)) ? Number(p.tva) : companyTvaRates[0] ?? 0,
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
      const res = await fetch(`${API_URL}/achats/factures/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fournisseurId: fournisseurId || null,
          fournisseurMF,
          numeroFactureFournisseur: numeroFF || null,
          dateFacture,
          dateEcheance: dateEcheance || null,
          statut,
          typeFacture,
          etat,
          devise,
          timbreFiscal: Number(timbreFiscal),
          equilibre: Number(equilibre),
          calculManuel,
          commentaire: commentaire || null,
          documentJointUrl: documentJointUrl || null,
          lignes: lignes.filter((l) => l.designation),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur lors de la modification");
      }
      router.push(`/factures-fournisseurs/${id}`);
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
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageBreadcrumb pageTitle={`Modifier Facture Fournisseur ${numero}`} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Modifier la Facture Fournisseur {numero}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mise à jour des données et lignes de la facture
          </p>
        </div>
        <Link
          href={`/factures-fournisseurs/${id}`}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          ← Annuler
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Fournisseur */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
            Fournisseur & Références
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Fournisseur
              </label>
              <input
                type="text"
                value={fournisseurSearch}
                onChange={(e) => {
                  setFournisseurSearch(e.target.value);
                  setShowFournisseurDropdown(true);
                }}
                onFocus={() => setShowFournisseurDropdown(true)}
                onBlur={() => setTimeout(() => setShowFournisseurDropdown(false), 200)}
                placeholder="Rechercher un fournisseur..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
              {showFournisseurDropdown && filteredFournisseurs.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredFournisseurs.slice(0, 10).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onMouseDown={() => selectFournisseur(f)}
                      className="w-full text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-sm"
                    >
                      <span className="font-medium text-gray-800 dark:text-white">{f.nom}</span>
                      {f.matriculeFiscale && (
                        <span className="ml-2 text-xs text-gray-500">MF: {f.matriculeFiscale}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                N° Facture Fournisseur (papier)
              </label>
              <input
                type="text"
                value={numeroFF}
                onChange={(e) => setNumeroFF(e.target.value)}
                placeholder="N° imprimé sur la facture"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Matricule fiscal
              </label>
              <input
                type="text"
                value={fournisseurMF}
                onChange={(e) => setFournisseurMF(e.target.value)}
                placeholder="Ex : 1234567/A/M/000"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section: Dates & Statuts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
            Paramètres & Dates
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date facture</label>
              <input
                type="date"
                value={dateFacture}
                onChange={(e) => setDateFacture(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date échéance</label>
              <input
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as any)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="BROUILLON">Brouillon</option>
                <option value="VALIDEE">Validée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
              <select
                value={typeFacture}
                onChange={(e) => setTypeFacture(e.target.value as any)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="PRODUIT">Produit</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">État</label>
              <select
                value={etat}
                onChange={(e) => setEtat(e.target.value as any)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="NORMALE">Normale</option>
                <option value="AVOIR">Avoir</option>
                <option value="PROFORMA">Proforma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Devise</label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              >
                <option value="TND">TND (Dinar Tunisien)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Lignes Articles */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Produits / Services
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 border border-brand-300 dark:border-brand-700 px-3 py-1.5 rounded-lg"
            >
              + Ajouter une ligne
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                  <th className="px-2 py-2 text-left min-w-[200px]">Produit / Désignation</th>
                  <th className="px-2 py-2 text-right w-20">Quantité</th>
                  <th className="px-2 py-2 text-right w-28">P.U. HT</th>
                  <th className="px-2 py-2 text-right w-20">Remise %</th>
                  <th className="px-2 py-2 text-right w-20">TVA %</th>
                  <th className="px-2 py-2 text-right w-28">Total HT</th>
                  <th className="px-2 py-2 text-right w-28">Total TTC</th>
                  <th className="px-2 py-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lignes.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-2 py-2">
                      <select
                        value={l.produitId ?? ""}
                        onChange={(e) => handleProductSelect(i, Number(e.target.value))}
                        className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 mb-1 bg-white dark:bg-gray-800"
                      >
                        <option value="">Sélectionner un produit catalogue (optionnel)...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.reference} — {p.nom} — {Number(p.prixAchat ?? p.prix ?? 0).toFixed(3)} DT
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={l.designation}
                        onChange={(e) => updateLine(i, { designation: e.target.value })}
                        placeholder="Désignation de la ligne"
                        required
                        className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={l.quantite}
                        onChange={(e) => updateLine(i, { quantite: Math.max(1, Math.trunc(Number(e.target.value) || 1)) })}
                        className="w-full text-xs text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={l.prixUnitaireHT}
                        onChange={(e) => updateLine(i, { prixUnitaireHT: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={l.remise}
                        onChange={(e) => updateLine(i, { remise: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={l.tauxTVA}
                        onChange={(e) => updateLine(i, { tauxTVA: parseFloat(e.target.value) || 0 })}
                        aria-label="Sélectionner le taux de TVA"
                        className="w-full cursor-pointer text-xs text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {companyTvaRates.length === 0 ? <option>Chargement…</option> : companyTvaRates.map((rate) => <option key={rate} value={rate}>TVA : {rate}%</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                      {round3(l.totalHT).toFixed(3)}
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      {round3(l.totalTTC).toFixed(3)}
                    </td>
                    <td className="px-2 py-2 text-center">
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

        {/* Section: Totaux & Ajustements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Ajustements & Notes
            </h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Timbre fiscal configuré ({devise})
              </label>
              <select
                value={timbreFiscal}
                onChange={(e) => setTimbreFiscal(Number(e.target.value))}
                aria-label="Sélectionner le timbre fiscal"
                className="w-full cursor-pointer border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {companyTimbreRates.length === 0 ? <option>Chargement des valeurs…</option> : companyTimbreRates.map((rate) => <option key={rate} value={rate}>Timbre : {rate.toFixed(3)} {devise}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Équilibrage / Ajustement centimes ({devise})
              </label>
              <input
                type="number"
                step="0.001"
                value={equilibre}
                onChange={(e) => setEquilibre(parseFloat(e.target.value) || 0)}
                placeholder="0.000"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Lien facture scannée / Pièce jointe
              </label>
              <input
                type="text"
                value={documentJointUrl}
                onChange={(e) => setDocumentJointUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Commentaire</label>
              <textarea
                rows={3}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Notes internes..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                Récapitulatif Financier
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Total HT Brut</span>
                  <span>{round3(montantHT + montantRemise).toFixed(3)} {devise}</span>
                </div>
                {montantRemise > 0 && (
                  <div className="flex justify-between text-orange-500">
                    <span>Remise</span>
                    <span>- {montantRemise.toFixed(3)} {devise}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-gray-800 dark:text-white">
                  <span>HT Net</span>
                  <span>{montantHT.toFixed(3)} {devise}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>TVA</span>
                  <span>{montantTVA.toFixed(3)} {devise}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Timbre fiscal</span>
                  <span>{timbreFiscal.toFixed(3)} {devise}</span>
                </div>
                {equilibre !== 0 && (
                  <div className="flex justify-between text-indigo-500">
                    <span>Équilibrage</span>
                    <span>{equilibre.toFixed(3)} {devise}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-base text-gray-900 dark:text-white">
                  <span>TOTAL TTC</span>
                  <span>{montantTTC.toFixed(3)} {devise}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Link
                href={`/factures-fournisseurs/${id}`}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
          </div>
        </div>
      </form>
    </div>
  );
}
