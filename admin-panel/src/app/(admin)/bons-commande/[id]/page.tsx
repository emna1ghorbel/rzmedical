"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, downloadBonCommandePdf } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

const statutConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  ENVOYE: { label: "Envoyé", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  CONFIRME: { label: "Confirmé", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  RECEPTIONNE_PARTIEL: { label: "Réc. Partiel", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  RECEPTIONNE: { label: "Réceptionné", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  ANNULE: { label: "Annulé", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function BonCommandeDetailPage({
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
  const [transforming, setTransforming] = useState(false);

  const fetchBon = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-commande/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Bon de commande introuvable");
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

  const handleTransformerBR = async () => {
    if (!confirm("Transformer ce bon de commande en Bon de Réception ?")) return;
    setTransforming(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/bons-commande/${id}/transformer-br`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erreur transformation");
      }
      const br = await res.json();
      alert(`Bon de Réception créé : ${br.code}`);
      window.location.href = `/bons-reception/${br.id}`;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransforming(false);
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
          {error || "Bon de commande introuvable"}
        </div>
        <Link href="/bons-commande" className="mt-4 inline-block text-brand-500 text-sm hover:underline">
          ← Retour aux bons de commande
        </Link>
      </div>
    );
  }

  const sCfg = statutConfig[bon.statut] || { label: bon.statut, cls: "bg-gray-100 text-gray-700" };
  const devise = bon.devise || "TND";

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageBreadcrumb pageTitle={`Bon de Commande ${bon.code}`} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Bon de Commande {bon.code}
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sCfg.cls}`}>
              {sCfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Date de commande : {new Date(bon.dateCommande).toLocaleDateString("fr-FR")}
            {bon.dateLivraisonPrevue && ` • Livraison prévue : ${new Date(bon.dateLivraisonPrevue).toLocaleDateString("fr-FR")}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              setIsDownloading(true);
              try {
                await downloadBonCommandePdf(bon.id, bon.code);
              } catch (e: any) {
                alert(e.message || "Erreur lors du téléchargement du PDF");
              } finally {
                setIsDownloading(false);
              }
            }}
            disabled={isDownloading}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 shadow-xs transition"
          >
            📄 {isDownloading ? "Téléchargement..." : "Télécharger PDF"}
          </button>

          {bon.statut !== "ANNULE" && bon.statut !== "RECEPTIONNE" && (
            <button
              onClick={handleTransformerBR}
              disabled={transforming}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
            >
              ➔ Transformer en Bon de Réception
            </button>
          )}

          <Link
            href={`/bons-commande/${bon.id}/edit`}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            ✏️ Modifier
          </Link>

          <Link
            href="/bons-commande"
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ← Retour
          </Link>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
        {/* Info Box Fournisseur */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400 mb-2">
              Fournisseur
            </h3>
            <p className="font-bold text-gray-900 dark:text-white text-base">
              {bon.fournisseurNom || bon.fournisseur?.nom || "Fournisseur non spécifié"}
            </p>
            {bon.fournisseurMF && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">MF : {bon.fournisseurMF}</p>
            )}
            {bon.fournisseurAdresse && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Adresse : {bon.fournisseurAdresse}</p>
            )}
            {bon.fournisseurTel && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Téléphone : {bon.fournisseurTel}</p>
            )}
          </div>

          <div className="space-y-1.5 md:text-right">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400 mb-2">
              Bons de Réception associés
            </h3>
            {bon.bonsReception && bon.bonsReception.length > 0 ? (
              <div className="space-y-1">
                {bon.bonsReception.map((br: any) => (
                  <div key={br.id} className="text-xs">
                    <Link href={`/bons-reception/${br.id}`} className="font-semibold text-brand-500 hover:underline">
                      {br.code}
                    </Link>{" "}
                    ({br.statut})
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Aucun bon de réception pour l&apos;instant</p>
            )}
          </div>
        </div>

        {/* Lignes Table */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-3.5 py-3">Désignation</th>
                <th className="px-3.5 py-3 text-right">Quantité</th>
                <th className="px-3.5 py-3 text-right">Prix Unitaire HT</th>
                <th className="px-3.5 py-3 text-right">Remise %</th>
                <th className="px-3.5 py-3 text-right">TVA</th>
                <th className="px-3.5 py-3 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(bon.lignes || []).map((l: any, idx: number) => (
                <tr key={l.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="px-3.5 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {l.designation}
                  </td>
                  <td className="px-3.5 py-3 text-right font-semibold">{l.quantite}</td>
                  <td className="px-3.5 py-3 text-right">{fmt(l.prixUnitaireHT)}</td>
                  <td className="px-3.5 py-3 text-right">{Number(l.remise) > 0 ? `${l.remise}%` : "—"}</td>
                  <td className="px-3.5 py-3 text-right">{l.tauxTVA}%</td>
                  <td className="px-3.5 py-3 text-right font-bold text-gray-900 dark:text-white">
                    {fmt(l.totalHT)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
          <div className="flex-1">
            {bon.commentaire && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Commentaire :</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{bon.commentaire}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-80 space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Total Brut HT</span>
              <span>{fmt(bon.montantHT)} {devise}</span>
            </div>
            {Number(bon.montantRemise) > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Remise</span>
                <span>- {fmt(bon.montantRemise)} {devise}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Total TVA</span>
              <span>{fmt(bon.montantTVA)} {devise}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1 pt-2 flex justify-between font-bold text-sm text-gray-900 dark:text-white">
              <span>TOTAL TTC</span>
              <span>{fmt(bon.montantTTC)} {devise}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
