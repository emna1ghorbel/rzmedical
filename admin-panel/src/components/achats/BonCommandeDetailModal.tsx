"use client";

import React, { useState } from "react";
import { downloadBonCommandePdf } from "@/utils/api";

export interface BCDetailProps {
  bon: any;
  onClose: () => void;
  onEdit?: (bon: any) => void;
  onTransformerBR?: (bonId: number) => void;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  ENVOYE: { label: "Envoyé", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  CONFIRME: { label: "Confirmé", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  RECEPTIONNE_PARTIEL: { label: "Réc. Partiel", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  RECEPTIONNE: { label: "Réceptionné", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  ANNULE: { label: "Annulé", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function BonCommandeDetailModal({
  bon,
  onClose,
  onEdit,
  onTransformerBR,
}: BCDetailProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const sCfg = statusConfig[bon.statut] || { label: bon.statut, cls: "bg-gray-100 text-gray-700" };
  const dateCmdStr = bon.dateCommande ? new Date(bon.dateCommande).toLocaleDateString("fr-FR") : "—";
  const dateLivrStr = bon.dateLivraisonPrevue ? new Date(bon.dateLivraisonPrevue).toLocaleDateString("fr-FR") : "—";
  const devise = bon.devise || "TND";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
              📦
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Bon de Commande {bon.code}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sCfg.cls}`}>
                  {sCfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Date : {dateCmdStr} • Livraison prévue : {dateLivrStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Fournisseur */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <span className="text-xs uppercase font-semibold tracking-wider text-gray-400 block mb-1">
              Fournisseur
            </span>
            <p className="font-bold text-gray-900 dark:text-white text-base">
              {bon.fournisseurNom || bon.fournisseur?.nom || "Fournisseur non spécifié"}
            </p>
            {bon.fournisseurMF && (
              <p className="text-xs text-gray-500 mt-1">MF : {bon.fournisseurMF}</p>
            )}
            {bon.fournisseurTel && (
              <p className="text-xs text-gray-500">Tél : {bon.fournisseurTel}</p>
            )}
          </div>

          {/* Lignes Articles */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-3 py-2.5">Désignation</th>
                  <th className="px-3 py-2.5 text-right">Qté</th>
                  <th className="px-3 py-2.5 text-right">P.U. HT</th>
                  <th className="px-3 py-2.5 text-right">Remise</th>
                  <th className="px-3 py-2.5 text-right">TVA</th>
                  <th className="px-3 py-2.5 text-right">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(bon.lignes || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400 italic">
                      Aucune ligne d&apos;article enregistrée
                    </td>
                  </tr>
                ) : (
                  bon.lignes.map((l: any, idx: number) => (
                    <tr key={l.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                        {l.designation}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">{l.quantite}</td>
                      <td className="px-3 py-2.5 text-right">{fmt(l.prixUnitaireHT)}</td>
                      <td className="px-3 py-2.5 text-right">{Number(l.remise) > 0 ? `${l.remise}%` : "—"}</td>
                      <td className="px-3 py-2.5 text-right">{l.tauxTVA}%</td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900 dark:text-white">
                        {fmt(l.totalHT)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
            <div className="flex-1">
              {bon.commentaire && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Commentaire :</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{bon.commentaire}</p>
                </div>
              )}
            </div>
            <div className="w-full sm:w-72 space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs">
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
                <span>TVA</span>
                <span>{fmt(bon.montantTVA)} {devise}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1 pt-1.5 flex justify-between font-bold text-sm text-gray-900 dark:text-white">
                <span>Total TTC</span>
                <span>{fmt(bon.montantTTC)} {devise}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
          >
            📄 {isDownloading ? "Téléchargement..." : "Télécharger PDF"}
          </button>

          <div className="flex items-center gap-2">
            {onTransformerBR && bon.statut !== "ANNULE" && bon.statut !== "RECEPTIONNE" && (
              <button
                onClick={() => onTransformerBR(bon.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
              >
                ➔ Transformer en Bon de Réception
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(bon)}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                ✏️ Modifier
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
