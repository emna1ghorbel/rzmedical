"use client";

import React, { useState } from "react";
import { API_URL } from "@/utils/api";

interface SendModalProps {
  facture: any;
  onClose: () => void;
}

export default function FactureFournisseurSendModal({ facture, onClose }: SendModalProps) {
  const [email, setEmail] = useState(facture.fournisseurEmail || facture.fournisseur?.email || "");
  const [objet, setObjet] = useState(
    `Facture Fournisseur N° ${facture.numero} - R and Z Medical`
  );
  const [message, setMessage] = useState(
    `Bonjour ${facture.fournisseurNom || ""},\n\nVeuillez trouver ci-joint les détails de la facture fournisseur N° ${facture.numero} pour un montant total de ${Number(facture.montantTTC).toFixed(3)} ${facture.devise || "TND"}.\n\nCordialement,\nService Comptabilité - R and Z Medical`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Veuillez saisir une adresse email");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/achats/factures/${facture.id}/envoyer-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, objet, message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Erreur lors de l'envoi de l'email");
      setSent(true);
      window.setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✉️</span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Envoyer la Facture par Email
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <p className="font-bold text-gray-900 dark:text-white">Email envoyé avec succès !</p>
            <p className="text-xs text-gray-500">Un accusé de transmission a été enregistré.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Destinataire (Email Fournisseur)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@fournisseur.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Objet du message
              </label>
              <input
                type="text"
                required
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Corps du message
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <span>Pièce jointe automatique :</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                facture-{facture.numero}.pdf
              </span>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {sending ? "Envoi en cours..." : "✉️ Confirmer et envoyer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
