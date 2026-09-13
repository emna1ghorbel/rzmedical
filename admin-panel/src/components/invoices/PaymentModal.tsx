"use client";

import React, { useState, useEffect } from "react";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/ui/badge/Badge";

const API_URL = getApiUrl();

interface Invoice {
  id: number;
  numero: string;
  montantTTC: number;
  retenueSurce?: number;
  statutPaiement: string;
}

interface Paiement {
  id: number;
  montant: number;
  modePaiement: string;
  reference?: string;
  referenceTransaction?: string;
  datePaiement: string;
}

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ invoice, onClose, onSuccess }: PaymentModalProps) {
  const { getToken } = useAuth();
  
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("ESPECES");
  const [datePaiement, setDatePaiement] = useState(() => new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPaiements = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/invoices/admin/${invoice.id}/paiements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPaiements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaiements();
  }, []);

  const netAPayer = Number(invoice.montantTTC) - Number((invoice as any).retenueSurce || 0);
  const totalPaye = paiements.reduce((acc, p) => acc + Number(p.montant), 0);
  const resteAPayer = Math.max(0, netAPayer - totalPaye);

  useEffect(() => {
    if (resteAPayer > 0) {
      setMontant(resteAPayer.toFixed(3));
    }
  }, [resteAPayer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) {
      setError("Le montant doit être supérieur à 0");
      return;
    }
    
    setSaving(true);
    setError("");

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/invoices/admin/${invoice.id}/paiements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          montant: Number(montant),
          modePaiement,
          datePaiement,
          reference,
          referenceTransaction: reference,
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de l'enregistrement");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur réseau");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paiement</h2>
            <p className="text-sm text-gray-500">Facture {invoice.numero}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 mb-1">Total TTC</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{invoice.montantTTC.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800/50 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">Déjà Payé</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">{totalPaye.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl border border-brand-200 dark:border-brand-800/50 text-center">
              <p className="text-sm text-brand-600 dark:text-brand-400 mb-1">Reste à payer</p>
              <p className="text-lg font-bold text-brand-700 dark:text-brand-300">{resteAPayer.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
            </div>
          </div>

          {/* Liste des paiements */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-3 tracking-wider">Historique des paiements</h3>
            {loading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : paiements.length === 0 ? (
              <p className="text-sm text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">Aucun paiement enregistré.</p>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Mode</th>
                      <th className="px-4 py-2 font-medium">Référence</th>
                      <th className="px-4 py-2 font-medium text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paiements.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">{new Date(p.datePaiement).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3"><Badge color="light">{p.modePaiement}</Badge></td>
                        <td className="px-4 py-3 text-gray-500">{p.reference || p.referenceTransaction || "-"}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                          {Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formulaire nouveau paiement */}
          {resteAPayer > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase text-gray-500 mb-3 tracking-wider">Ajouter un paiement</h3>
              
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <form id="payment-form" onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-800/30 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Montant (DT) *</label>
                    <input 
                      type="number" required min="0.001" step="0.001" max={resteAPayer + 0.01}
                      value={montant}
                      onChange={e => setMontant(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Mode de paiement *</label>
                    <select 
                      value={modePaiement}
                      onChange={e => setModePaiement(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    >
                      <option value="ESPECES">Espèces</option>
                      <option value="CHEQUE">Chèque</option>
                      <option value="VIREMENT">Virement</option>
                      <option value="CARTE">Carte Bancaire</option>
                      <option value="TRAITE">Traite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Date du paiement *</label>
                    <input 
                      type="date" required
                      value={datePaiement}
                      onChange={e => setDatePaiement(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Référence (N° Chèque, Transaction...) <span className="text-gray-400 font-normal">(optionnel)</span></label>
                    <input 
                      type="text"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                      placeholder="Ex: CHQ 123456"
                      className="w-full border border-gray-300 rounded-lg p-2.5 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </form>
            </div>
          )}
          {resteAPayer <= 0 && !loading && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 text-center text-green-700 dark:text-green-400 font-medium flex items-center justify-center gap-2">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Cette facture est totalement payée.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-end gap-3 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
          {resteAPayer > 0 && (
            <button
              type="submit"
              form="payment-form"
              disabled={saving}
              className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? "Enregistrement..." : "Enregistrer le paiement"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
