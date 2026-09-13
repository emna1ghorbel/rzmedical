"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl, parseJsonSafe } from "@/utils/api";
import { useExercice } from "@/context/ExerciceContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useAuth } from "@/hooks/useAuth";

interface UnpaidClient {
  id: number; numero: string; clientNom: string; clientEmail?: string | null;
  dateEmission: string; dateEcheance?: string | null; montantTTC: number;
  montantPaye: number; solde: number; statutPaiement: string; devise: string;
  commande?: { id: number; statut: string } | null;
  bonLivraison?: { id: number; code: string } | null;
}

interface UnpaidSupplier {
  id: number; numero: string; fournisseurNom?: string | null;
  dateFacture: string; dateEcheance?: string | null; montantTTC: number;
  montantPaye: number; solde: number; statutPaiement: string; devise: string;
  bonCommande?: { id: number; code: string; statut: string } | null;
  bonReception?: { id: number; code: string } | null;
}

export default function ImpayesPage() {
  const { activeExercice } = useExercice();
  const { getToken } = useAuth();
  const API_URL = getApiUrl();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<UnpaidClient[]>([]);
  const [fournisseurs, setFournisseurs] = useState<UnpaidSupplier[]>([]);
  const [activeTab, setActiveTab] = useState<"clients" | "fournisseurs">("clients");

  const fetchImpayes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeExercice?.annee) {
        params.set("exerciceAnnee", String(activeExercice.annee));
      } else {
        params.set("periode", "annee");
      }

      const token = getToken();
      const res = await fetch(`${API_URL}/stats/impayes?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await parseJsonSafe<any>(res);
      if (!res.ok || !json || typeof json !== "object") {
        throw new Error(json?.error || `Erreur serveur (${res.status})`);
      }
      
      setClients(Array.isArray(json.recouvrement?.clients) ? json.recouvrement.clients : []);
      setFournisseurs(Array.isArray(json.recouvrement?.fournisseurs) ? json.recouvrement.fournisseurs : []);
    } catch (err: any) {
      console.error("Fetch impayes error:", err);
      setError(err instanceof Error ? err.message : "Impossible de charger les données d'impayés.");
    } finally {
      setLoading(false);
    }
  }, [API_URL, activeExercice, getToken]);

  useEffect(() => {
    fetchImpayes();
  }, [fetchImpayes]);

  const totalClients = clients.reduce((sum, item) => sum + item.solde, 0);
  const totalFournisseurs = fournisseurs.reduce((sum, item) => sum + item.solde, 0);

  return (
    <div className="flex flex-col gap-5 p-4 min-h-[calc(100vh-80px)]">
      <PageBreadcrumb pageTitle="Impayés & Recouvrement" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Gestion des Impayés
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Suivi centralisé des factures clients non soldées et achats fournisseurs à payer.
          </p>
        </div>
        <button
          onClick={() => fetchImpayes()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors shadow-sm"
        >
          <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${activeTab === 'clients' ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400 dark:bg-rose-950/20' : 'border-rose-200 hover:border-rose-300 dark:border-rose-900/50 dark:bg-white/[0.03]'} cursor-pointer`} onClick={() => setActiveTab('clients')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Ventes à recouvrer (Clients)</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">{totalClients.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND</p>
          <p className="mt-1 text-sm text-gray-500">{clients.length} facture(s) en attente de paiement.</p>
        </div>
        <div className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${activeTab === 'fournisseurs' ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400 dark:bg-amber-950/20' : 'border-amber-200 hover:border-amber-300 dark:border-amber-900/50 dark:bg-white/[0.03]'} cursor-pointer`} onClick={() => setActiveTab('fournisseurs')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Achats à payer (Fournisseurs)</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{totalFournisseurs.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND</p>
          <p className="mt-1 text-sm text-gray-500">{fournisseurs.length} facture(s) fournisseur non soldée(s).</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm flex flex-col min-h-0 flex-1">
        <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center gap-4">
          <button 
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'clients' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            onClick={() => setActiveTab('clients')}
          >
            Impayés Clients
          </button>
          <button 
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'fournisseurs' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            onClick={() => setActiveTab('fournisseurs')}
          >
            Impayés Fournisseurs
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "clients" ? (
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:border-gray-700">
                <tr>
                  {["Client", "Facture", "Commande / BL", "Total", "Payé", "Reste à payer", "Action"].map((heading) => (
                    <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {clients.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{item.clientNom}</p>
                      <p className="text-xs text-gray-500">{item.clientEmail ?? ""}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-brand-600 dark:text-brand-400">{item.numero}</span>
                      <p className="text-xs text-gray-500">{new Date(item.dateEmission).toLocaleDateString("fr-FR")}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                      {item.commande ? `Cmd #${item.commande.id}` : "-"}
                      <br/>
                      {item.bonLivraison ? <span className="text-xs">{item.bonLivraison.code}</span> : ""}
                    </td>
                    <td className="px-5 py-3 font-medium">{item.montantTTC.toFixed(3)} {item.devise}</td>
                    <td className="px-5 py-3 font-medium text-emerald-600">{item.montantPaye.toFixed(3)} {item.devise}</td>
                    <td className="px-5 py-3 font-bold text-rose-600 text-base">{item.solde.toFixed(3)} {item.devise}</td>
                    <td className="px-5 py-3">
                      <Link href="/invoices" className="text-xs font-semibold text-brand-600 hover:underline px-3 py-1.5 bg-brand-50 rounded-lg dark:bg-brand-900/20">
                        Régler →
                      </Link>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 italic">Aucun impayé client sur la période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:border-gray-700">
                <tr>
                  {["Fournisseur", "Facture", "Bon commande / réception", "Total", "Payé", "Reste à payer", "Action"].map((heading) => (
                    <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {fournisseurs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                      {item.fournisseurNom ?? "Fournisseur non renseigné"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-brand-600 dark:text-brand-400">{item.numero}</span>
                      <p className="text-xs text-gray-500">{new Date(item.dateFacture).toLocaleDateString("fr-FR")}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                      {item.bonCommande?.code ?? "-"}
                      <br/>
                      {item.bonReception ? <span className="text-xs">{item.bonReception.code}</span> : ""}
                    </td>
                    <td className="px-5 py-3 font-medium">{item.montantTTC.toFixed(3)} {item.devise}</td>
                    <td className="px-5 py-3 font-medium text-emerald-600">{item.montantPaye.toFixed(3)} {item.devise}</td>
                    <td className="px-5 py-3 font-bold text-amber-600 text-base">{item.solde.toFixed(3)} {item.devise}</td>
                    <td className="px-5 py-3">
                      <Link href="/factures-fournisseurs" className="text-xs font-semibold text-brand-600 hover:underline px-3 py-1.5 bg-brand-50 rounded-lg dark:bg-brand-900/20">
                        Régler →
                      </Link>
                    </td>
                  </tr>
                ))}
                {fournisseurs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 italic">Aucun achat fournisseur non soldé sur la période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
