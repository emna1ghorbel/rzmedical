"use client";

import React, { useState } from "react";
import { downloadDevisPdf } from "@/utils/api";

export interface DevisDetailProps {
  devis: any;
  onClose: () => void;
  onEdit?: (devis: any) => void;
  onFacturer?: (devis: any) => void;
  onConvertirBL?: (devis: any) => void;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  EN_ATTENTE: { label: "En attente", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  ACCEPTE: { label: "Accepté", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  REFUSE: { label: "Refusé", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  EXPIRE: { label: "Expiré", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FACTURE: { label: "Facturé", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  CONVERTI_BL: { label: "Converti en BL", cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
};

export default function DevisDetailModal({
  devis,
  onClose,
  onEdit,
  onFacturer,
  onConvertirBL,
}: DevisDetailProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const sCfg = statusConfig[devis.statut] || { label: devis.statut, cls: "bg-gray-100 text-gray-700" };

  const dateDevisStr = devis.dateDevis ? new Date(devis.dateDevis).toLocaleDateString("fr-FR") : "—";
  const dateValiditeStr = devis.dateValidite ? new Date(devis.dateValidite).toLocaleDateString("fr-FR") : null;

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
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
              📄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Devis {devis.numero}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sCfg.cls}`}>
                  {sCfg.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {devis.typeDevis === "SERVICE" ? "Service" : "Produit"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Créé le {dateDevisStr}
                {dateValiditeStr && ` • Valide jusqu'au ${dateValiditeStr}`}
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          {/* Facture liée si déjà facturé */}
          {devis.factures && devis.factures.length > 0 && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-medium">
                <span>🧾 Facture liée :</span>
                <span className="font-bold">{devis.factures[0].numero}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  {devis.factures[0].statut}
                </span>
              </div>
              <span className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                {fmt(devis.factures[0].montantTTC)} TND
              </span>
            </div>
          )}

          {/* Client & Infos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Client / Tier
              </span>
              <p className="font-semibold text-gray-900 dark:text-white text-base">
                {devis.clientNom}
              </p>
              {devis.clientMF && (
                <p className="text-xs text-gray-500 mt-1">MF : {devis.clientMF}</p>
              )}
              {devis.clientAdresse && (
                <p className="text-xs text-gray-500 mt-0.5">Adresse : {devis.clientAdresse}</p>
              )}
              {devis.clientTelephone && (
                <p className="text-xs text-gray-500 mt-0.5">Tél : {devis.clientTelephone}</p>
              )}
              {devis.clientEmail && (
                <p className="text-xs text-gray-500 mt-0.5">Email : {devis.clientEmail}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Détails du Devis
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Numéro :</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{devis.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date d'émission :</span>
                  <span className="text-gray-800 dark:text-gray-200">{dateDevisStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date de validité :</span>
                  <span className="text-gray-800 dark:text-gray-200">{dateValiditeStr || "Non spécifiée"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Devise :</span>
                  <span className="text-gray-800 dark:text-gray-200">{devis.devise || "TND"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lignes articles */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Articles / Lignes du Devis
            </h4>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500">
                  <tr>
                    <th className="p-2.5 text-left">Désignation</th>
                    <th className="p-2.5 text-right w-16">Qté</th>
                    <th className="p-2.5 text-right w-24">P.U HT</th>
                    <th className="p-2.5 text-right w-16">Remise</th>
                    <th className="p-2.5 text-right w-16">TVA</th>
                    <th className="p-2.5 text-right w-24">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {devis.lignes && devis.lignes.length > 0 ? (
                    devis.lignes.map((l: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                          {l.designation || l.produit?.nom}
                          {l.produit?.reference && (
                            <span className="text-gray-400 ml-1 text-[11px]">({l.produit.reference})</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">{l.quantite}</td>
                        <td className="p-2.5 text-right">{fmt(l.prixUnitaireHT)}</td>
                        <td className="p-2.5 text-right">{Number(l.remise || 0)}%</td>
                        <td className="p-2.5 text-right">{Number(l.tauxTVA || 0)}%</td>
                        <td className="p-2.5 text-right font-semibold text-gray-900 dark:text-white">
                          {fmt(l.totalHT)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                        Aucune ligne
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux & Commentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              {devis.commentaire && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Commentaire / Notes
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {devis.commentaire}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Total HT Brut</span>
                <span className="font-semibold text-gray-900 dark:text-white">{fmt(devis.montantHT)} TND</span>
              </div>
              {Number(devis.montantRemise || 0) > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Total Remise</span>
                  <span className="font-semibold text-red-600">-{fmt(devis.montantRemise)} TND</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Total TVA</span>
                <span className="font-semibold text-gray-900 dark:text-white">{fmt(devis.montantTVA)} TND</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Timbre Fiscal</span>
                <span className="font-semibold text-gray-900 dark:text-white">{fmt(devis.timbreFiscal)} TND</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                <span>Total TTC</span>
                <span className="text-teal-700 dark:text-teal-400 text-base">{fmt(devis.montantTTC)} TND</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setIsDownloading(true);
                try {
                  await downloadDevisPdf(devis.id, devis.numero);
                } catch (e: any) {
                  alert(e.message || "Erreur PDF");
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 text-gray-700 dark:text-gray-200 font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              📥 {isDownloading ? "Téléchargement..." : "Télécharger PDF"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onConvertirBL && (
              <button
                onClick={() => onConvertirBL(devis)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5"
              >
                🚚 Convertir en BL
              </button>
            )}
            {onFacturer && (
              <button
                onClick={() => onFacturer(devis)}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5"
              >
                🧾 Facturer
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(devis)}
                className="px-3.5 py-2 bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 text-white font-semibold rounded-lg text-xs transition shadow-xs"
              >
                ✏️ Modifier
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-100 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
