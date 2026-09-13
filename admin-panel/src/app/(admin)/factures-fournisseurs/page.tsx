"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, downloadFactureFournisseurPdf, exportToCsv } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import FactureFournisseurDetailModal from "@/components/achats/FactureFournisseurDetailModal";
import FactureFournisseurSendModal from "@/components/achats/FactureFournisseurSendModal";

const API_URL = getApiUrl();

interface FactureFournisseur {
  id: number;
  numero: string;
  numeroFactureFournisseur?: string | null;
  statut: "BROUILLON" | "VALIDEE" | "ANNULEE";
  statutPaiement: "NON_PAYEE" | "PARTIELLEMENT_PAYEE" | "PAYEE";
  typeFacture: "PRODUIT" | "SERVICE";
  etat: "NORMALE" | "AVOIR" | "PROFORMA";
  dateFacture: string;
  fournisseurNom?: string | null;
  montantHT: number;
  montantTTC: number;
  montantPaye: number;
  solde: number;
  devise: string;
  bonCommande?: { id: number; code: string } | null;
  bonReception?: { id: number; code: string } | null;
  lignes?: any[];
  paiements?: any[];
  [key: string]: any;
}

interface AchatsStats {
  totalFF: number;
  montantTotalHT: number;
  montantTotalTTC: number;
  montantPaye: number;
  montantImpaye: number;
}

export type FactureFournisseurCategorie = "FOURNISSEUR" | "CHARGES" | "CNSS" | "NEUF_BA4A";

export const factureCategorieMeta: Record<FactureFournisseurCategorie, { title: string; plural: string; description: string; path: string }> = {
  FOURNISSEUR: { title: "Factures Fournisseurs", plural: "Factures Fournisseurs", description: "Gestion complète des achats, factures fournisseurs et échéances", path: "/factures-fournisseurs" },
  CHARGES: { title: "Charges", plural: "Factures de charges", description: "Gestion des factures de charges et échéances", path: "/charges" },
  CNSS: { title: "CNSS", plural: "Factures CNSS", description: "Gestion des déclarations et factures CNSS", path: "/charges/cnss" },
  NEUF_BA4A: { title: "9ba4a", plural: "Factures 9ba4a", description: "Gestion des factures 9ba4a et échéances", path: "/charges/9ba4a" },
};

const statutConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  VALIDEE: { label: "Validée", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  ANNULEE: { label: "Annulée", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const paiementConfig: Record<string, { label: string; cls: string }> = {
  NON_PAYEE: { label: "Non payée", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  PARTIELLEMENT_PAYEE: { label: "Partiel", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PAYEE: { label: "Payée", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

function fmt(n: number, devise = "TND") {
  return `${Number(n).toFixed(3)} ${devise}`;
}

export default function FacturesFournisseursPage({ categorie = "FOURNISSEUR" }: { categorie?: FactureFournisseurCategorie }) {
  const { getToken } = useAuth();
  const categoryMeta = factureCategorieMeta[categorie];
  const createLabel = categorie === "FOURNISSEUR" ? "AJOUTER UNE FACTURE" : "AJOUTER UNE CHARGE";
  const [factures, setFactures] = useState<FactureFournisseur[]>([]);
  const [stats, setStats] = useState<AchatsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPaiement, setFilterPaiement] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modals state
  const [selectedFFForView, setSelectedFFForView] = useState<FactureFournisseur | null>(null);
  const [selectedFFForSend, setSelectedFFForSend] = useState<FactureFournisseur | null>(null);

  // Payment modal state
  const [payingFF, setPayingFF] = useState<FactureFournisseur | null>(null);
  const [payMontant, setPayMontant] = useState("");
  const [payMode, setPayMode] = useState("Virement");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payRef, setPayRef] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(filterStatut && { statut: filterStatut }),
        ...(filterPaiement && { statutPaiement: filterPaiement }),
        categorie,
      });

      const [ffRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/achats/factures?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/achats/stats?categorie=${categorie}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!ffRes.ok) throw new Error("Erreur chargement factures");
      const ffData = await ffRes.json();
      setFactures(ffData.items);
      setTotal(ffData.total);

      if (statsRes.ok) {
        const sd = await statsRes.json();
        setStats(sd);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search, filterStatut, filterPaiement, categorie]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleView = async (facture: FactureFournisseur) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/factures/${facture.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Impossible de charger le détail de la facture");
      setSelectedFFForView(await res.json());
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du détail de la facture");
    }
  };

  const handleSend = async (facture: FactureFournisseur) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/factures/${facture.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Impossible de charger les coordonnées du fournisseur");
      setSelectedFFForSend(await res.json());
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement de l'adresse email du fournisseur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette facture fournisseur ?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/factures/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur suppression");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePay = async () => {
    if (!payingFF || !payMontant) return;
    setPayLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/factures/${payingFF.id}/paiements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          montant: Number(payMontant),
          modePaiement: payMode,
          datePaiement: payDate,
          reference: payRef || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur paiement");
      setPayingFF(null);
      setPayMontant("");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "Numéro",
      "Réf Papier Fournisseur",
      "Statut",
      "État",
      "Date Facture",
      "N° Bon Commande",
      "N° Bon Réception",
      "Type",
      "Fournisseur",
      "Total HT",
      "Total TTC",
      "Payé",
      "Solde",
      "Devise",
    ];
    const rows = factures.map((ff) => [
      ff.numero,
      ff.numeroFactureFournisseur || "",
      ff.statut,
      ff.etat,
      new Date(ff.dateFacture).toLocaleDateString("fr-FR"),
      ff.bonCommande?.code || "",
      ff.bonReception?.code || "",
      ff.typeFacture === "PRODUIT" ? "Produit" : "Service",
      ff.fournisseurNom || "",
      Number(ff.montantHT).toFixed(3),
      Number(ff.montantTTC).toFixed(3),
      Number(ff.montantPaye).toFixed(3),
      Number(ff.solde).toFixed(3),
      ff.devise,
    ]);
    exportToCsv(`factures-fournisseurs-${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="box-border flex h-[calc(100dvh-8rem)] w-full min-w-0 max-w-full min-h-0 flex-col overflow-hidden overscroll-none p-2 md:p-3">
      <div className="shrink-0">
        <PageBreadcrumb pageTitle={categoryMeta.title} />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-1 mb-1">
          {[
            { label: "Total Factures", value: stats.totalFF, isCurrency: false },
            { label: "Montant TTC Total", value: fmt(stats.montantTotalTTC), isCurrency: true },
            { label: "Payé", value: fmt(stats.montantPaye), isCurrency: true, cls: "text-emerald-600" },
            { label: "Solde Impayé", value: fmt(stats.montantImpaye), isCurrency: true, cls: "text-red-500", link: "/impayes" },
          ].map((s) => (
            s.link ? (
              <Link href={s.link} key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5 shadow-sm hover:border-red-300 dark:hover:border-red-800 transition-colors cursor-pointer group block">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 flex justify-between items-center">
                  {s.label}
                  <span className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
                </p>
                <p className={`text-base font-bold ${s.cls ?? "text-gray-800 dark:text-white"}`}>
                  {s.value}
                </p>
              </Link>
            ) : (
              <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
                <p className={`text-base font-bold ${s.cls ?? "text-gray-800 dark:text-white"}`}>
                  {s.value}
                </p>
              </div>
            )
          ))}
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
        <div className="min-w-0">
          <h2 className="text-base leading-tight font-bold text-gray-800 dark:text-white">
            Liste des {categoryMeta.plural}
            <span className="ml-2 text-sm font-normal text-gray-500">({total} total)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {categoryMeta.description}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-1 md:w-auto md:justify-end">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition"
          >
            📊 Télécharger Excel
          </button>
          <Link
            href={`${categoryMeta.path}/new`}
            className="inline-flex items-center gap-1 whitespace-nowrap bg-brand-500 hover:bg-brand-600 text-white px-2 py-1 rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
            + {createLabel}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_9rem_9.5rem] gap-1 mb-1">
        <input
          type="text"
          placeholder="Rechercher (numéro, fournisseur...)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="min-w-0 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        />
        <select
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Tous statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="VALIDEE">Validée</option>
          <option value="ANNULEE">Annulée</option>
        </select>
        <select
          value={filterPaiement}
          onChange={(e) => { setFilterPaiement(e.target.value); setPage(1); }}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Tout état paiement</option>
          <option value="NON_PAYEE">Non payée</option>
          <option value="PARTIELLEMENT_PAYEE">Partiellement payée</option>
          <option value="PAYEE">Payée</option>
        </select>
      </div>

      {/* Table */}
      <div className="relative h-0 min-h-0 w-full min-w-0 flex-1 basis-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : factures.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Aucune facture trouvée</p>
            <Link href={`${categoryMeta.path}/new`} className="mt-2 inline-block text-brand-500 text-sm hover:underline">
              + Créer la première {categorie === "FOURNISSEUR" ? "facture" : "charge"}
            </Link>
          </div>
        ) : (
          <table className="min-w-[2200px] w-full table-fixed border-separate border-spacing-0 text-xs">
            <colgroup>
              {["160px", "140px", "110px", "130px", "210px", "210px", "110px", "280px", "160px", "160px", "160px", "160px", "140px"].map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {[
                  "Numéro",
                  "Statut",
                  "État",
                  "Date",
                  "N° Bon de Commande",
                  "N° Bon de Réception",
                  "Type",
                  "Fournisseur",
                  "Total HT",
                  "Total TTC",
                  "Paiement",
                  "Solde",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="sticky top-0 z-10 overflow-hidden bg-gray-50 dark:bg-gray-800 text-left px-2 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap text-ellipsis shadow-[0_1px_0_rgba(229,231,235,1)] dark:shadow-[0_1px_0_rgba(55,65,81,1)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 [&>tr>td]:overflow-hidden [&>tr>td]:px-3 [&>tr>td]:py-2 [&>tr>td]:text-ellipsis [&>tr>td]:whitespace-nowrap">
              {factures.map((ff) => (
                <tr key={ff.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Numéro */}
                  <td className="px-3 py-3 font-mono text-xs text-brand-600 dark:text-brand-400 whitespace-nowrap">
                    <button
                      onClick={() => handleView(ff)}
                      className="font-bold hover:underline text-left block"
                      title="Consulter"
                    >
                      {ff.numero}
                    </button>
                    {ff.numeroFactureFournisseur && (
                      <span className="block text-gray-400 text-[10px]">Réf : {ff.numeroFactureFournisseur}</span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(statutConfig[ff.statut] ?? statutConfig.BROUILLON).cls}`}>
                      {(statutConfig[ff.statut] ?? { label: ff.statut }).label}
                    </span>
                  </td>

                  {/* État */}
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium text-[11px]">
                      {ff.etat}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">
                    {new Date(ff.dateFacture).toLocaleDateString("fr-FR")}
                  </td>

                  {/* N° BC */}
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {ff.bonCommande ? (
                      <Link href={`/bons-commande`} className="text-brand-500 hover:underline">
                        {ff.bonCommande.code}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* N° BR */}
                  <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {ff.bonReception ? (
                      <Link href={`/bons-reception`} className="text-brand-500 hover:underline">
                        {ff.bonReception.code}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {ff.typeFacture === "PRODUIT" ? "Produit" : "Service"}
                  </td>

                  {/* Fournisseur */}
                  <td className="px-3 py-3 text-gray-800 dark:text-white font-medium text-xs whitespace-nowrap">
                    {ff.fournisseurNom ?? "—"}
                  </td>

                  {/* Total HT */}
                  <td className="px-3 py-3 text-right text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {fmt(ff.montantHT, ff.devise)}
                  </td>

                  {/* Total TTC */}
                  <td className="px-3 py-3 text-right text-xs font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                    {fmt(ff.montantTTC, ff.devise)}
                  </td>

                  {/* Paiement */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(paiementConfig[ff.statutPaiement] ?? paiementConfig.NON_PAYEE).cls}`}>
                      {(paiementConfig[ff.statutPaiement] ?? { label: ff.statutPaiement }).label}
                    </span>
                  </td>

                  {/* Solde */}
                  <td className="px-3 py-3 text-right text-xs font-semibold text-red-500 whitespace-nowrap">
                    {fmt(ff.solde, ff.devise)}
                  </td>

                  {/* Actions Dropdown / Menu */}
                  <td className="px-3 py-3 whitespace-nowrap !overflow-visible">
                    <FFActionMenu
                      ff={ff}
                      onView={() => handleView(ff)}
                      onEdit={() => {}}
                      onPay={() => { setPayingFF(ff); setPayMontant(String(ff.solde)); }}
                      onSend={() => handleSend(ff)}
                      onDownloadPdf={() => downloadFactureFournisseurPdf(ff.id, ff.numero)}
                      onDelete={() => handleDelete(ff.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {totalPages} ({total} résultats)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingFF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Enregistrer un paiement
              </h3>
              <button onClick={() => setPayingFF(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Facture : <span className="font-semibold text-gray-800 dark:text-white">{payingFF.numero}</span></p>
                <p className="text-sm text-gray-500">Solde restant : <span className="font-bold text-red-500">{fmt(payingFF.solde, payingFF.devise)}</span></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant à régler ({payingFF.devise})</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={payingFF.solde}
                  value={payMontant}
                  onChange={(e) => setPayMontant(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mode de règlement</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                >
                  <option value="Virement">Virement bancaire</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Traite">Traite</option>
                  <option value="Carte Bancaire">Carte Bancaire</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Date de règlement</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Référence / N° Chèque</label>
                <input
                  type="text"
                  placeholder="Ex : CHQ-998822"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPayingFF(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handlePay}
                disabled={payLoading || !payMontant || Number(payMontant) <= 0}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                {payLoading ? "Enregistrement..." : "Valider le règlement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFFForView && (
        <FactureFournisseurDetailModal
          facture={selectedFFForView}
          onClose={() => setSelectedFFForView(null)}
          onEdit={(f) => {
            setSelectedFFForView(null);
            window.location.href = `/factures-fournisseurs/${f.id}/edit`;
          }}
          onPay={(f) => {
            setSelectedFFForView(null);
            setPayingFF(f);
            setPayMontant(String(f.solde));
          }}
          onSend={(f) => {
            setSelectedFFForView(null);
            setSelectedFFForSend(f);
          }}
        />
      )}

      {/* Send Modal */}
      {selectedFFForSend && (
        <FactureFournisseurSendModal
          facture={selectedFFForSend}
          onClose={() => setSelectedFFForSend(null)}
        />
      )}
    </div>
  );
}

// ─── Actions Dropdown ────────────────────────────────────────────────────────

function FFActionMenu({
  ff,
  onView,
  onEdit,
  onPay,
  onSend,
  onDownloadPdf,
  onDelete,
}: {
  ff: FactureFournisseur;
  onView: () => void;
  onEdit: () => void;
  onPay: () => void;
  onSend: () => void;
  onDownloadPdf: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAnnulee = ff.statut === "ANNULEE";
  const isPayee = ff.statutPaiement === "PAYEE";

  return (
    <div className={`relative inline-block text-left ${open ? "z-50" : "z-10"}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
      >
        <span>Actions</span>
        <svg
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Consulter */}
          <button
            onClick={() => { setOpen(false); onView(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
          >
            <span>🔍</span> Consulter
          </button>

          {/* Modifier */}
          {!isAnnulee && (
            <Link
              href={`/factures-fournisseurs/${ff.id}/edit`}
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
            >
              <span>✏️</span> Modifier
            </Link>
          )}

          {/* Payer */}
          {!isAnnulee && !isPayee && (
            <button
              onClick={() => { setOpen(false); onPay(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left font-medium"
            >
              <span>💰</span> Payer
            </button>
          )}

          {/* Envoyer */}
          <button
            onClick={() => { setOpen(false); onSend(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left font-medium"
          >
            <span>✉️</span> Envoyer
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          {/* Télécharger PDF */}
          <button
            onClick={async () => {
              setOpen(false);
              try {
                await onDownloadPdf();
              } catch (e: any) {
                alert(e.message || "Erreur téléchargement PDF");
              }
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
          >
            <span>📄</span> Télécharger PDF
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          {/* Supprimer */}
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left font-medium"
          >
            <span>🗑️</span> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
