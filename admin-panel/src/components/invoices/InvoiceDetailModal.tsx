"use client";

import React, { useState } from "react";
import { getApiUrl, downloadInvoicePdf } from "@/utils/api";

const API_URL = getApiUrl();

export interface InvoiceDetailProps {
  invoice: any;
  onClose: () => void;
  onEdit?: (invoice: any) => void;
  onPay?: (invoice: any) => void;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  EMISE: { label: "Emise", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  VALIDEE: { label: "Validée", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  ENVOYEE: { label: "Envoyée", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  ANNULEE: { label: "Annulée", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const paiementConfig: Record<string, { label: string; cls: string }> = {
  NON_PAYEE: { label: "Non payée", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  PARTIELLEMENT_PAYEE: { label: "Partiellement payée", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PAYEE: { label: "Payée", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

export default function InvoiceDetailModal({
  invoice,
  onClose,
  onEdit,
  onPay,
}: InvoiceDetailProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const sCfg = statusConfig[invoice.statut] || { label: invoice.statut, cls: "bg-gray-100 text-gray-700" };
  const pCfg = paiementConfig[invoice.statutPaiement] || { label: invoice.statutPaiement, cls: "bg-gray-100 text-gray-700" };

  const totalPaye = (invoice.paiements || []).reduce((s: number, p: any) => s + Number(p.montant), 0);
  const netAPayer = Number(invoice.montantTTC) - Number(invoice.retenueSurce || 0);
  const solde = Math.max(0, netAPayer - totalPaye);
  const devise = invoice.devise || "TND";
  const lineTotalHT = (line: any) =>
    Number(line.totalHT ?? Number(line.quantite || 0) * Number(line.prixUnitaireHT || 0));
  const lineTotalTTC = (line: any) =>
    lineTotalHT(line) * (1 + Number(line.tauxTVA || 0) / 100);

  const dateEmissionStr = invoice.dateEmission ? new Date(invoice.dateEmission).toLocaleDateString("fr-FR") : "—";
  const dateEcheanceStr = invoice.dateEcheance ? new Date(invoice.dateEcheance).toLocaleDateString("fr-FR") : null;

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
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-bold">
              📄
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Facture {invoice.numero}
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sCfg.cls}`}>
                  {sCfg.label}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${pCfg.cls}`}>
                  {pCfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Émise le {dateEmissionStr} {dateEcheanceStr && `• Échéance le ${dateEcheanceStr}`}
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
          {/* Client & Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-gray-400 block mb-1">
                Destinataire (Client)
              </span>
              <p className="font-bold text-gray-900 dark:text-white text-base">
                {invoice.clientNom || "Client non spécifié"}
              </p>
              {invoice.clientMF && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  <span className="font-medium">M.F :</span> {invoice.clientMF}
                </p>
              )}
              {invoice.clientAdresse && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-line">
                  <span className="font-medium">Adresse :</span> {invoice.clientAdresse}
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <span className="uppercase font-semibold tracking-wider text-gray-400 block mb-1">
                Coordonnées & Origine
              </span>
              {invoice.clientTelephone && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-500">Tél :</span> {invoice.clientTelephone}
                </p>
              )}
              {invoice.clientEmail && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-500">Email :</span> {invoice.clientEmail}
                </p>
              )}
              {invoice.typeFacture && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-500">Type :</span> {invoice.typeFacture}
                </p>
              )}
              {invoice.bonLivraison && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-500">BL lié :</span> {invoice.bonLivraison?.code || "—"}
                </p>
              )}
              {invoice.bonsLivraison && invoice.bonsLivraison.length > 0 && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-500">BLs :</span>{" "}
                  {invoice.bonsLivraison.map((b: any) => b?.code || b?.bonLivraison?.code).filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Line items table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
              <span>Articles & Lignes de facture</span>
              <span className="text-gray-400 normal-case font-normal">
                {invoice.lignes?.length || 0} ligne(s)
              </span>
            </h4>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="p-2.5">Désignation</th>
                    <th className="p-2.5 text-center">Qté</th>
                    <th className="p-2.5 text-right">P.U HT</th>
                    <th className="p-2.5 text-right">TVA</th>
                    <th className="p-2.5 text-right">Total HT</th>
                    <th className="p-2.5 text-right">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoice.lignes && invoice.lignes.length > 0 ? (
                    invoice.lignes.map((l: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                          {l.designation}
                        </td>
                        <td className="p-2.5 text-center tabular-nums text-gray-700 dark:text-gray-300">
                          {l.quantite}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {fmt(Number(l.prixUnitaireHT))}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-gray-600 dark:text-gray-400">
                          {Number(l.tauxTVA)}%
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                          {fmt(lineTotalHT(l))}
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-gray-900 dark:text-white">
                          {fmt(lineTotalTTC(l))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                        Aucune ligne enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment status and notes */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  État des règlements
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant total TTC</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fmt(invoice.montantTTC)} {devise}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total payé</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(totalPaye)} {devise}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Reste à payer (Solde)</span>
                    <span className={`font-bold ${solde > 0.001 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {fmt(solde)} {devise}
                    </span>
                  </div>
                </div>
              </div>

              {invoice.commentaire && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                  <span className="text-gray-400 block font-medium">Notes / Commentaire :</span>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5 italic">{invoice.commentaire}</p>
                </div>
              )}
            </div>

            {/* Financial calculation */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Détail financier
              </span>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Total HT</span>
                <span className="font-medium text-gray-900 dark:text-white">{fmt(invoice.montantHT)} {devise}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Total TVA</span>
                <span className="font-medium text-gray-900 dark:text-white">{fmt(invoice.montantTVA)} {devise}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Timbre Fiscal</span>
                <span className="font-medium text-gray-900 dark:text-white">{fmt(invoice.timbreFiscal)} {devise}</span>
              </div>
              {Number(invoice.retenueSurce || 0) > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Retenue à la source</span>
                  <span className="font-medium">-{fmt(invoice.retenueSurce)} {devise}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 text-sm">
                <span>Total TTC</span>
                <span>{fmt(invoice.montantTTC)} {devise}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-700 dark:text-amber-400 text-sm">
                <span>Net à payer</span>
                <span>{fmt(netAPayer)} {devise}</span>
              </div>
            </div>
          </div>

          {/* Payment list if any */}
          {invoice.paiements && invoice.paiements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Historique des paiements ({invoice.paiements.length})
              </h4>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Mode</th>
                      <th className="p-2 text-left">Réf</th>
                      <th className="p-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {invoice.paiements.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2 text-gray-600 dark:text-gray-400">
                          {p.datePaiement ? new Date(p.datePaiement).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="p-2 font-medium">{p.modePaiement}</td>
                        <td className="p-2 text-gray-500">{p.reference || "—"}</td>
                        <td className="p-2 text-right font-bold text-emerald-600">{fmt(Number(p.montant))} {devise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isDownloading}
              onClick={async () => {
                try {
                  setIsDownloading(true);
                  await downloadInvoicePdf(invoice.id, invoice.numero);
                } catch (err) {
                  console.error(err);
                  alert("Erreur lors du téléchargement du PDF");
                } finally {
                  setIsDownloading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
            >
              <span>📄</span> {isDownloading ? "Téléchargement..." : "Télécharger PDF"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onPay && solde > 0.001 && invoice.statut !== "ANNULEE" && (
              <button
                onClick={() => {
                  onClose();
                  onPay(invoice);
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <span>💰</span> Enregistrer paiement
              </button>
            )}

            {onEdit && invoice.statut !== "ANNULEE" && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(invoice);
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <span>✏️</span> Modifier la facture
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
