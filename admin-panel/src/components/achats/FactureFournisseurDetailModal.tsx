"use client";

import React, { useState } from "react";
import { downloadFactureFournisseurPdf } from "@/utils/api";

export interface FFDetailProps {
  facture: any;
  onClose: () => void;
  onEdit?: (facture: any) => void;
  onPay?: (facture: any) => void;
  onSend?: (facture: any) => void;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  VALIDEE: { label: "Validée", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  ANNULEE: { label: "Annulée", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const paiementConfig: Record<string, { label: string; cls: string }> = {
  NON_PAYEE: { label: "Non payée", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  PARTIELLEMENT_PAYEE: { label: "Partiellement payée", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PAYEE: { label: "Payée", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

export default function FactureFournisseurDetailModal({
  facture,
  onClose,
  onEdit,
  onPay,
  onSend,
}: FFDetailProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const sCfg = statusConfig[facture.statut] || { label: facture.statut, cls: "bg-gray-100 text-gray-700" };
  const pCfg = paiementConfig[facture.statutPaiement] || { label: facture.statutPaiement, cls: "bg-gray-100 text-gray-700" };

  const dateFactureStr = facture.dateFacture ? new Date(facture.dateFacture).toLocaleDateString("fr-FR") : "—";
  const dateEcheanceStr = facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString("fr-FR") : null;
  const devise = facture.devise || "TND";

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
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xl font-bold">
              📑
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Facture Fournisseur {facture.numero}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sCfg.cls}`}>
                  {sCfg.label}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${pCfg.cls}`}>
                  {pCfg.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                  {facture.typeFacture === "SERVICE" ? "Service" : "Produit"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Date : {dateFactureStr} {dateEcheanceStr && `• Échéance : ${dateEcheanceStr}`}
                {facture.numeroFactureFournisseur && ` • Réf Papier : ${facture.numeroFactureFournisseur}`}
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
          {/* Fournisseur Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-gray-400 block mb-1">
                Fournisseur
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-base">
                {facture.fournisseurNom || "Fournisseur non spécifié"}
              </p>
              {facture.fournisseurMF && (
                <p className="text-xs text-gray-500 mt-1">MF : {facture.fournisseurMF}</p>
              )}
              {facture.fournisseurTel && (
                <p className="text-xs text-gray-500">Tél : {facture.fournisseurTel}</p>
              )}
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-xs uppercase font-semibold tracking-wider text-gray-400 block mb-1">
                Pièces d&apos;origine liées
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Bon de Commande : <span className="font-semibold">{facture.bonCommande?.code || "—"}</span>
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Bon de Réception : <span className="font-semibold">{facture.bonReception?.code || "—"}</span>
              </p>
              {facture.documentJointUrl && (
                <a
                  href={facture.documentJointUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline mt-2 font-medium"
                >
                  📎 Voir document joint (scanné)
                </a>
              )}
            </div>
          </div>

          {/* Lines Table */}
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
                  <th className="px-3 py-2.5 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(facture.lignes || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-400 italic">
                      Aucune ligne d&apos;article enregistrée
                    </td>
                  </tr>
                ) : (
                  facture.lignes.map((l: any, idx: number) => (
                    <tr key={l.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                        {l.designation}
                      </td>
                      <td className="px-3 py-2.5 text-right">{l.quantite}</td>
                      <td className="px-3 py-2.5 text-right">{fmt(l.prixUnitaireHT)}</td>
                      <td className="px-3 py-2.5 text-right">{Number(l.remise) > 0 ? `${l.remise}%` : "—"}</td>
                      <td className="px-3 py-2.5 text-right">{l.tauxTVA}%</td>
                      <td className="px-3 py-2.5 text-right font-medium">{fmt(l.totalHT)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-gray-900 dark:text-white">
                        {fmt(l.totalTTC)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
            <div className="flex-1 space-y-2">
              {facture.commentaire && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-0.5">Commentaire :</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">{facture.commentaire}</p>
                </div>
              )}

              {/* Payments log */}
              {facture.paiements && facture.paiements.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Historique des règlements :
                  </p>
                  <div className="space-y-1">
                    {facture.paiements.map((p: any) => (
                      <div key={p.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{new Date(p.datePaiement).toLocaleDateString("fr-FR")} ({p.modePaiement})</span>
                        <span className="font-semibold text-emerald-600">{fmt(p.montant)} {devise}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Financial Totals */}
            <div className="w-full sm:w-72 space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Total Brut HT</span>
                <span>{fmt(facture.montantHT)} {devise}</span>
              </div>
              {Number(facture.montantRemise) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Remise globale</span>
                  <span>- {fmt(facture.montantRemise)} {devise}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>TVA</span>
                <span>{fmt(facture.montantTVA)} {devise}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Timbre fiscal</span>
                <span>{fmt(facture.timbreFiscal)} {devise}</span>
              </div>
              {Number(facture.equilibre) !== 0 && (
                <div className="flex justify-between text-indigo-600">
                  <span>Équilibrage / Ajustement</span>
                  <span>{fmt(facture.equilibre)} {devise}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1 pt-1.5 flex justify-between font-bold text-sm text-gray-900 dark:text-white">
                <span>Total TTC</span>
                <span>{fmt(facture.montantTTC)} {devise}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                <span>Payé</span>
                <span>{fmt(facture.montantPaye)} {devise}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold border-t border-dashed border-gray-200 dark:border-gray-700 pt-1">
                <span>Solde dû</span>
                <span>{fmt(facture.solde)} {devise}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setIsDownloading(true);
                try {
                  await downloadFactureFournisseurPdf(facture.id, facture.numero);
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

            {onSend && (
              <button
                onClick={() => onSend(facture)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition shadow-xs"
              >
                ✉️ Envoyer par email
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onPay && facture.statutPaiement !== "PAYEE" && facture.statut !== "ANNULEE" && (
              <button
                onClick={() => onPay(facture)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                💰 Enregistrer un paiement
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(facture)}
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
