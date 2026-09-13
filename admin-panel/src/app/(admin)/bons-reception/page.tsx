"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, downloadBonReceptionPdf, exportToCsv } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import BonReceptionDetailModal from "@/components/achats/BonReceptionDetailModal";

const API_URL = getApiUrl();

interface BonReception {
  id: number;
  code: string;
  dateReception: string;
  statut: "BROUILLON" | "CONTROLE" | "VALIDE" | "FACTURE" | "ANNULE";
  fournisseurNom?: string | null;
  bonCommande?: { id: number; code: string } | null;
  stockMisAJour: boolean;
  [key: string]: any;
}

const statutConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  CONTROLE: { label: "Contrôlé", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  VALIDE: { label: "Validé ✓", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  FACTURE: { label: "Facturé", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  ANNULE: { label: "Annulé", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function BonsReceptionPage() {
  const { getToken } = useAuth();
  const [bons, setBons] = useState<BonReception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionId, setActionId] = useState<number | null>(null);
  const [selectedBonForView, setSelectedBonForView] = useState<BonReception | null>(null);
  const limit = 20;

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
      });
      const res = await fetch(`${API_URL}/achats/bons-reception?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setBons(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search, filterStatut]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleValider = async (id: number) => {
    if (!confirm("Valider ce bon de réception ? Le stock des produits sera mis à jour automatiquement.")) return;
    setActionId(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-reception/${id}/valider`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erreur validation"); }
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleTransformerFF = async (id: number) => {
    if (!confirm("Transformer ce bon de réception en Facture Fournisseur ?")) return;
    setActionId(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-reception/${id}/transformer-facture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Erreur transformation"); }
      const ff = await res.json();
      alert(`Facture Fournisseur créée : ${ff.numero}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce bon de réception ?")) return;
    try {
      const token = getToken();
      await fetch(`${API_URL}/achats/bons-reception/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      "Code",
      "Statut",
      "Date Réception",
      "Bon de Commande Lié",
      "Fournisseur",
      "Stock Mis à Jour",
    ];
    const rows = bons.map((br) => [
      br.code,
      br.statut,
      new Date(br.dateReception).toLocaleDateString("fr-FR"),
      br.bonCommande?.code || "",
      br.fournisseurNom || "",
      br.stockMisAJour ? "Oui" : "Non",
    ]);
    exportToCsv(`bons-reception-${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  const totalPages = Math.ceil(total / limit);

  // Stats calculations (on current view)
  const facturesCount = bons.filter(b => b.statut === "FACTURE").length;
  const stockMajCount = bons.filter(b => b.stockMisAJour).length;

  return (
    <div className="box-border flex h-[calc(100dvh-8rem)] w-full min-w-0 min-h-0 max-w-full flex-col overflow-hidden p-4 md:p-6">
      <div className="mb-2">
        <PageBreadcrumb pageTitle="Bons de Réception" />
      </div>

      {/* Stats Cards */}
      <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {[
          { label: "Total BR (Liste actuelle)", value: bons.length },
          { label: "BR Facturés (Liste)", value: facturesCount, cls: "text-indigo-600" },
          { label: "Stock Mis à Jour", value: stockMajCount, cls: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.cls ?? "text-gray-800 dark:text-white"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Bons de Réception Fournisseurs
            <span className="ml-2 text-sm font-normal text-gray-500">({total} total)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Contrôle des livraisons, incrémentation automatique des stocks et facturation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition"
          >
            📊 Télécharger Excel
          </button>
          <Link
            href="/bons-reception/new"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
            + NOUVEAU BON DE RÉCEPTION
          </Link>
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher (code, fournisseur...)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        />
        <select
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setPage(1); }}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statutConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="relative h-0 min-h-0 w-full min-w-0 flex-1 basis-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : bons.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.1 15.9 0 13.33 0c-1.49 0-2.81.73-3.63 1.84L12 6h8zm-6.92-4.83c.63-.95 1.66-1.17 2.25-1.17 1.49 0 2.67 1.19 2.67 2.67 0 .45-.11.88-.26 1.33h-4.4l-.26-2.83zM4 10v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10H4zm8 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Aucun bon de réception trouvé</p>
            <Link href="/bons-reception/new" className="mt-2 inline-block text-brand-500 text-sm hover:underline">
              + Créer le premier bon de réception
            </Link>
          </div>
        ) : (
          <table className="min-w-[1500px] w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {["Code", "Statut", "Date réception", "Bon de Commande", "Fournisseur", "Stock MàJ", "Actions"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {bons.map((br) => (
                <tr key={br.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">
                    <button
                      onClick={() => setSelectedBonForView(br)}
                      className="font-bold hover:underline text-left block"
                      title="Consulter"
                    >
                      {br.code}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(statutConfig[br.statut] ?? statutConfig.BROUILLON).cls}`}>
                      {(statutConfig[br.statut] ?? { label: br.statut }).label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {new Date(br.dateReception).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {br.bonCommande ? (
                      <Link href={`/bons-commande/${br.bonCommande.id}`} className="text-brand-500 hover:underline">
                        {br.bonCommande.code}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-800 dark:text-white">
                    {br.fournisseurNom ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {br.stockMisAJour ? (
                      <span className="text-emerald-500 text-xs font-medium">✓ Mis à jour</span>
                    ) : (
                      <span className="text-gray-400 text-xs">En attente</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {/* Consulter */}
                      <button
                        onClick={() => setSelectedBonForView(br)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Consulter"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                      </button>

                      {/* Modifier */}
                      <Link
                        href={`/bons-reception/${br.id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="Modifier"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                      </Link>

                      {/* Télécharger PDF */}
                      <button
                        onClick={async () => {
                          try {
                            await downloadBonReceptionPdf(br.id, br.code);
                          } catch (e: any) {
                            alert(e.message || "Erreur téléchargement PDF");
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                        title="Télécharger PDF"
                      >
                        📄
                      </button>

                      {/* Valider stock */}
                      {(br.statut === "BROUILLON" || br.statut === "CONTROLE") && (
                        <button
                          onClick={() => handleValider(br.id)}
                          disabled={actionId === br.id}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors disabled:opacity-50"
                          title="Valider (met à jour le stock)"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                        </button>
                      )}

                      {/* Transformer en Facture Fournisseur */}
                      {br.statut === "VALIDE" && (
                        <button
                          onClick={() => handleTransformerFF(br.id)}
                          disabled={actionId === br.id}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 transition-colors disabled:opacity-50"
                          title="Transformer en Facture Fournisseur"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                        </button>
                      )}

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDelete(br.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">Précédent</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">Suivant</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBonForView && (
        <BonReceptionDetailModal
          bon={selectedBonForView}
          onClose={() => setSelectedBonForView(null)}
          onEdit={(b) => {
            setSelectedBonForView(null);
            window.location.href = `/bons-reception/${b.id}/edit`;
          }}
          onValider={(bonId) => {
            setSelectedBonForView(null);
            handleValider(bonId);
          }}
          onTransformerFF={(bonId) => {
            setSelectedBonForView(null);
            handleTransformerFF(bonId);
          }}
        />
      )}
    </div>
  );
}
