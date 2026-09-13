"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, downloadFactureFournisseurPdf } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import FactureFournisseurSendModal from "@/components/achats/FactureFournisseurSendModal";

const API_URL = getApiUrl();

export default function FactureFournisseurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const [facture, setFacture] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Payment state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMontant, setPayMontant] = useState("");
  const [payMode, setPayMode] = useState("Virement");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payRef, setPayRef] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const fetchFacture = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/factures/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Facture introuvable");
      const data = await res.json();
      setFacture(data);
      setPayMontant(String(data.solde || 0));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacture();
  }, [id]);

  const handlePay = async () => {
    if (!payMontant || Number(payMontant) <= 0) return;
    setPayLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/factures/${id}/paiements`, {
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
      setShowPayModal(false);
      fetchFacture();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPayLoading(false);
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

  if (error || !facture) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl">
          {error || "Facture introuvable"}
        </div>
        <Link href="/factures-fournisseurs" className="mt-4 inline-block text-brand-500 text-sm hover:underline">
          ← Retour aux factures fournisseurs
        </Link>
      </div>
    );
  }

  const devise = facture.devise || "TND";

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <PageBreadcrumb pageTitle={`Facture Fournisseur ${facture.numero}`} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Facture Fournisseur {facture.numero}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
              {facture.statut}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              facture.statutPaiement === "PAYEE"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : facture.statutPaiement === "PARTIELLEMENT_PAYEE"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
            }`}>
              {facture.statutPaiement}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Date facture : {new Date(facture.dateFacture).toLocaleDateString("fr-FR")}
            {facture.dateEcheance && ` • Échéance : ${new Date(facture.dateEcheance).toLocaleDateString("fr-FR")}`}
            {facture.numeroFactureFournisseur && ` • Réf papier : ${facture.numeroFactureFournisseur}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
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
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 shadow-xs transition"
          >
            📄 {isDownloading ? "Téléchargement..." : "PDF"}
          </button>

          <button
            onClick={() => setShowSendModal(true)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 shadow-xs transition"
          >
            ✉️ Envoyer
          </button>

          {facture.statutPaiement !== "PAYEE" && facture.statut !== "ANNULEE" && (
            <button
              onClick={() => setShowPayModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              💰 Payer
            </button>
          )}

          <Link
            href={`/factures-fournisseurs/${facture.id}/edit`}
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            ✏️ Modifier
          </Link>

          <Link
            href="/factures-fournisseurs"
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            ← Retour
          </Link>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-6">
        {/* Info Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400 mb-2">
              Informations Fournisseur
            </h3>
            <p className="font-bold text-gray-900 dark:text-white text-base">
              {facture.fournisseurNom || "Fournisseur non spécifié"}
            </p>
            {facture.fournisseurMF && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Matricule Fiscal : {facture.fournisseurMF}</p>
            )}
            {facture.fournisseurAdresse && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Adresse : {facture.fournisseurAdresse}</p>
            )}
            {facture.fournisseurTel && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Téléphone : {facture.fournisseurTel}</p>
            )}
            {facture.fournisseurEmail && (
              <p className="text-xs text-gray-600 dark:text-gray-400">Email : {facture.fournisseurEmail}</p>
            )}
          </div>

          <div className="space-y-1.5 md:text-right">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400 mb-2">
              Détails & Pièces Liées
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Type de facture : <span className="font-semibold">{facture.typeFacture === "SERVICE" ? "Prestation de service" : "Produits / Marchandises"}</span>
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              État : <span className="font-semibold">{facture.etat}</span>
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Bon de Commande : <span className="font-semibold">{facture.bonCommande?.code || "—"}</span>
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Bon de Réception : <span className="font-semibold">{facture.bonReception?.code || "—"}</span>
            </p>
            {facture.documentJointUrl && (
              <div className="pt-2">
                <a
                  href={facture.documentJointUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-500 hover:underline font-semibold"
                >
                  📎 Consulter la facture scannée
                </a>
              </div>
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
                <th className="px-3.5 py-3 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(facture.lignes || []).map((l: any, idx: number) => (
                <tr key={l.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="px-3.5 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {l.designation}
                  </td>
                  <td className="px-3.5 py-3 text-right font-semibold">{l.quantite}</td>
                  <td className="px-3.5 py-3 text-right">{fmt(l.prixUnitaireHT)}</td>
                  <td className="px-3.5 py-3 text-right">{Number(l.remise) > 0 ? `${l.remise}%` : "—"}</td>
                  <td className="px-3.5 py-3 text-right">{l.tauxTVA}%</td>
                  <td className="px-3.5 py-3 text-right font-medium">{fmt(l.totalHT)}</td>
                  <td className="px-3.5 py-3 text-right font-bold text-gray-900 dark:text-white">
                    {fmt(l.totalTTC)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Payments */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
          <div className="flex-1 space-y-4">
            {facture.commentaire && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-0.5">Commentaire :</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">{facture.commentaire}</p>
              </div>
            )}

            {facture.paiements && facture.paiements.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Historique des Règlements :
                </p>
                <div className="space-y-1.5">
                  {facture.paiements.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                      <span>{new Date(p.datePaiement).toLocaleDateString("fr-FR")} • {p.modePaiement} {p.reference ? `(${p.reference})` : ""}</span>
                      <span className="font-bold text-emerald-600">{fmt(p.montant)} {devise}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Totals Box */}
          <div className="w-full sm:w-80 space-y-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs">
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
              <span>Total TVA</span>
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
            <div className="border-t border-gray-200 dark:border-gray-700 my-1 pt-2 flex justify-between font-bold text-sm text-gray-900 dark:text-white">
              <span>Total TTC</span>
              <span>{fmt(facture.montantTTC)} {devise}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold pt-1">
              <span>Total Payé</span>
              <span>{fmt(facture.montantPaye)} {devise}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold border-t border-dashed border-gray-200 dark:border-gray-700 pt-1.5 text-sm">
              <span>Solde restant</span>
              <span>{fmt(facture.solde)} {devise}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Enregistrer un paiement
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Facture : <span className="font-semibold text-gray-800 dark:text-white">{facture.numero}</span></p>
                <p className="text-sm text-gray-500">Solde restant : <span className="font-bold text-red-500">{fmt(facture.solde)} {devise}</span></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant à régler ({devise})</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={facture.solde}
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
                onClick={() => setShowPayModal(false)}
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

      {/* Send Modal */}
      {showSendModal && (
        <FactureFournisseurSendModal
          facture={facture}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </div>
  );
}
