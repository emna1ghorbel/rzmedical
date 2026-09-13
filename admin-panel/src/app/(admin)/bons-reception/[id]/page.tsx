"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, downloadBonReceptionPdf } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

const statutConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  CONTROLE: { label: "Contrôlé", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  VALIDE: { label: "Validé ✓", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  FACTURE: { label: "Facturé", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  ANNULE: { label: "Annulé", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function BonReceptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const [bon, setBon] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBon = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-reception/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Bon de réception introuvable");
      const data = await res.json();
      setBon(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBon();
  }, [id]);

  const handleValider = async () => {
    if (!confirm("Valider ce bon de réception ? Le stock des produits sera incrémenté automatiquement.")) return;
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-reception/${id}/valider`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur validation");
      }
      fetchBon();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransformerFF = async () => {
    if (!confirm("Transformer ce bon de réception en Facture Fournisseur ?")) return;
    setActionLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-reception/${id}/transformer-facture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur transformation");
      }
      const ff = await res.json();
      alert(`Facture Fournisseur créée : ${ff.numero}`);
      window.location.href = `/factures-fournisseurs/${ff.id}`;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !bon) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl">
          {error || "Bon de réception introuvable"}
        </div>
        <Link href="/bons-reception" className="mt-4 inline-block text-brand-500 text-sm hover:underline">
          ← Retour aux bons de réception
        </Link>
      </div>
    );
  }

  const sCfg = statutConfig[bon.statut] || { label: bon.statut, cls: "bg-gray-100 text-gray-700" };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageBreadcrumb pageTitle={`Bon de Réception ${bon.code}`} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Bon de Réception {bon.code}
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sCfg.cls}`}>
              {sCfg.label}
            </span>
            {bon.stockMisAJour ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                ✓ Stock Incrémenté
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300">
                Stock non mis à jour
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Date réception : {new Date(bon.dateReception).toLocaleDateString("fr-FR")}
            {bon.bonCommande && ` • Issu du Bon de Commande : ${bon.bonCommande.code}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              setIsDownloading(true);
              try {
                await downloadBonReceptionPdf(bon.id, bon.code);
              } catch (e: any) {
                alert(e.message || "Erreur téléchargement PDF");
              } finally {
                setIsDownloading(false);
              }
            }}
            disabled={isDownloading}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 shadow-xs transition"
          >
            📄 {isDownloading ? "Téléchargement..." : "Télécharger PDF"}
          </button>

          {(bon.statut === "BROUILLON" || bon.statut === "CONTROLE") && (
            <button
              onClick={handleValider}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              ✓ Valider Réception & Stock
            </button>
          )}

          {bon.statut === "VALIDE" && (
            <button
              onClick={handleTransformerFF}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
            >
              ➔ Transformer en Facture Fournisseur
            </button>
          )}

          <Link
            href={`/bons-reception/${bon.id}/edit`}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            ✏️ Modifier
          </Link>

          <Link
            href="/bons-reception"
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ← Retour
          </Link>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
        {/* Fournisseur & BC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400 mb-2">
              Fournisseur
            </h3>
            <p className="font-bold text-gray-900 dark:text-white text-base">
              {bon.fournisseurNom || bon.fournisseur?.nom || "Fournisseur non spécifié"}
            </p>
          </div>

          <div className="space-y-1 md:text-right">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400 mb-2">
              Pièces Liées
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Bon de Commande :{" "}
              {bon.bonCommande ? (
                <Link href={`/bons-commande/${bon.bonCommande.id}`} className="font-semibold text-brand-500 hover:underline">
                  {bon.bonCommande.code}
                </Link>
              ) : (
                "Aucun"
              )}
            </p>
          </div>
        </div>

        {/* Lignes Table */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-3.5 py-3">Désignation article</th>
                <th className="px-3.5 py-3 text-right">Qté Commandée</th>
                <th className="px-3.5 py-3 text-right">Qté Reçue</th>
                <th className="px-3.5 py-3 text-right">P.U. HT</th>
                <th className="px-3.5 py-3 text-right">TVA</th>
                <th className="px-3.5 py-3 text-right">Total HT Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(bon.lignes || []).map((l: any, idx: number) => (
                <tr key={l.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="px-3.5 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {l.designation}
                  </td>
                  <td className="px-3.5 py-3 text-right text-gray-500">{l.quantiteCmd}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {l.quantiteRecue}
                  </td>
                  <td className="px-3.5 py-3 text-right">{fmt(l.prixUnitaireHT)}</td>
                  <td className="px-3.5 py-3 text-right">{l.tauxTVA}%</td>
                  <td className="px-3.5 py-3 text-right font-bold text-gray-900 dark:text-white">
                    {fmt(Number(l.quantiteRecue) * Number(l.prixUnitaireHT))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bon.commentaire && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Commentaire :</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{bon.commentaire}</p>
          </div>
        )}
      </div>
    </div>
  );
}
