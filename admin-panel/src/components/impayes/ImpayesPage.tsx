"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getApiUrl, parseJsonSafe } from "@/utils/api";
import { useExercice } from "@/context/ExerciceContext";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useAuth } from "@/hooks/useAuth";
import PaymentModal from "@/components/invoices/PaymentModal";

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

function fmt(n: number | string | undefined | null, devise = "TND") {
  return `${Number(n ?? 0).toFixed(3)} ${devise}`;
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
  const [searchQuery, setSearchQuery] = useState("");

  // Expanded groups
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedFournisseurs, setExpandedFournisseurs] = useState<Set<string>>(new Set());

  // Payment states
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<UnpaidClient | null>(null);
  
  // Supplier inline payment modal state
  const [payingFF, setPayingFF] = useState<UnpaidSupplier | null>(null);
  const [payMontant, setPayMontant] = useState("");
  const [payMode, setPayMode] = useState("ESPECES");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payRef, setPayRef] = useState("");

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

  // Grouping logic
  const groupedClients = clients.reduce((acc, item) => {
    const key = item.clientNom || "Client inconnu";
    if (searchQuery && !key.toLowerCase().includes(searchQuery.toLowerCase())) return acc;
    if (!acc[key]) acc[key] = { items: [], totalSolde: 0 };
    acc[key].items.push(item);
    acc[key].totalSolde += item.solde;
    return acc;
  }, {} as Record<string, { items: UnpaidClient[]; totalSolde: number }>);

  const groupedFournisseurs = fournisseurs.reduce((acc, item) => {
    const key = item.fournisseurNom || "Fournisseur inconnu";
    if (searchQuery && !key.toLowerCase().includes(searchQuery.toLowerCase())) return acc;
    if (!acc[key]) acc[key] = { items: [], totalSolde: 0 };
    acc[key].items.push(item);
    acc[key].totalSolde += item.solde;
    return acc;
  }, {} as Record<string, { items: UnpaidSupplier[]; totalSolde: number }>);

  const totalClients = clients.reduce((sum, item) => sum + item.solde, 0);
  const totalFournisseurs = fournisseurs.reduce((sum, item) => sum + item.solde, 0);

  const toggleClient = (name: string) => {
    const newSet = new Set(expandedClients);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedClients(newSet);
  };

  const toggleFournisseur = (name: string) => {
    const newSet = new Set(expandedFournisseurs);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedFournisseurs(newSet);
  };

  const submitSupplierPayment = async () => {
    if (!payingFF) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/factures/${payingFF.id}/paiements`, {
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
      setPayingFF(null);
      setPayMontant("");
      fetchImpayes();
    } catch (err: any) {
      alert(err.message);
    }
  };

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
        
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <input
            type="text"
            placeholder={`Rechercher un ${activeTab === 'clients' ? 'client' : 'fournisseur'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full max-w-sm px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${activeTab === 'clients' ? 'border-rose-200 focus:border-rose-400 focus:ring-rose-400 dark:border-rose-800' : 'border-amber-200 focus:border-amber-400 focus:ring-amber-400 dark:border-amber-800'} bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors`}
          />
        </div>

        <div className="flex-1 overflow-auto p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "clients" ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.keys(groupedClients).length === 0 ? (
                <div className="py-12 text-center text-gray-500 italic">Aucun impayé client sur la période.</div>
              ) : (
                Object.entries(groupedClients).map(([clientName, group]) => {
                  const isExpanded = expandedClients.has(clientName);
                  return (
                    <div key={clientName} className="flex flex-col">
                      <div 
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        onClick={() => toggleClient(clientName)}
                      >
                        <div className="flex items-center gap-3">
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{clientName}</p>
                            <p className="text-xs text-gray-500">{group.items.length} facture(s) impayée(s)</p>
                          </div>
                        </div>
                        <div className="font-bold text-rose-600 text-lg">
                          {fmt(group.totalSolde)}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="bg-gray-50/50 dark:bg-gray-800/20 px-10 py-3 border-t border-gray-100 dark:border-gray-800">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Facture</th>
                                <th className="px-3 py-2 font-semibold">Date</th>
                                <th className="px-3 py-2 font-semibold">Total</th>
                                <th className="px-3 py-2 font-semibold">Solde</th>
                                <th className="px-3 py-2 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {group.items.map((item) => (
                                <tr key={item.id} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                  <td className="px-3 py-3">
                                    <span className="font-semibold text-brand-600 dark:text-brand-400">{item.numero}</span>
                                  </td>
                                  <td className="px-3 py-3 text-gray-500">
                                    {new Date(item.dateEmission).toLocaleDateString("fr-FR")}
                                  </td>
                                  <td className="px-3 py-3 font-medium">{item.montantTTC.toFixed(3)} {item.devise}</td>
                                  <td className="px-3 py-3 font-bold text-rose-600">{item.solde.toFixed(3)} {item.devise}</td>
                                  <td className="px-3 py-3 text-right">
                                    <button 
                                      onClick={() => setSelectedInvoiceForPayment(item)}
                                      className="text-xs font-semibold text-brand-600 hover:underline px-3 py-1.5 bg-brand-50 rounded-lg dark:bg-brand-900/20"
                                    >
                                      Régler →
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.keys(groupedFournisseurs).length === 0 ? (
                <div className="py-12 text-center text-gray-500 italic">Aucun achat fournisseur non soldé sur la période.</div>
              ) : (
                Object.entries(groupedFournisseurs).map(([fournisseurName, group]) => {
                  const isExpanded = expandedFournisseurs.has(fournisseurName);
                  return (
                    <div key={fournisseurName} className="flex flex-col">
                      <div 
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        onClick={() => toggleFournisseur(fournisseurName)}
                      >
                        <div className="flex items-center gap-3">
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{fournisseurName}</p>
                            <p className="text-xs text-gray-500">{group.items.length} facture(s) impayée(s)</p>
                          </div>
                        </div>
                        <div className="font-bold text-amber-600 text-lg">
                          {fmt(group.totalSolde)}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="bg-gray-50/50 dark:bg-gray-800/20 px-10 py-3 border-t border-gray-100 dark:border-gray-800">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Facture</th>
                                <th className="px-3 py-2 font-semibold">Date</th>
                                <th className="px-3 py-2 font-semibold">Total</th>
                                <th className="px-3 py-2 font-semibold">Solde</th>
                                <th className="px-3 py-2 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {group.items.map((item) => (
                                <tr key={item.id} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                  <td className="px-3 py-3">
                                    <span className="font-semibold text-brand-600 dark:text-brand-400">{item.numero}</span>
                                  </td>
                                  <td className="px-3 py-3 text-gray-500">
                                    {new Date(item.dateFacture).toLocaleDateString("fr-FR")}
                                  </td>
                                  <td className="px-3 py-3 font-medium">{item.montantTTC.toFixed(3)} {item.devise}</td>
                                  <td className="px-3 py-3 font-bold text-amber-600">{item.solde.toFixed(3)} {item.devise}</td>
                                  <td className="px-3 py-3 text-right">
                                    <button 
                                      onClick={() => setPayingFF(item)}
                                      className="text-xs font-semibold text-brand-600 hover:underline px-3 py-1.5 bg-brand-50 rounded-lg dark:bg-brand-900/20"
                                    >
                                      Régler →
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal for Clients */}
      {selectedInvoiceForPayment && (
        <PaymentModal
          invoice={selectedInvoiceForPayment as any}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => {
            fetchImpayes();
            setSelectedInvoiceForPayment(null);
          }}
        />
      )}

      {/* Payment Modal for Suppliers */}
      {payingFF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Enregistrer un paiement
              </h3>
              <button onClick={() => setPayingFF(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Facture : <span className="font-semibold text-gray-800 dark:text-white">{payingFF.numero}</span></p>
                <p className="text-sm text-gray-500">Solde restant : <span className="font-bold text-red-500">{fmt(payingFF.solde, payingFF.devise)}</span></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant à régler ({payingFF.devise})</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={payingFF.solde}
                  value={payMontant}
                  onChange={(e) => setPayMontant(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                  >
                    <option value="ESPECES">Espèces</option>
                    <option value="VIREMENT">Virement</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="TRAITE">Traite</option>
                    <option value="CARTE">Carte bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Référence (Optionnel)</label>
                <input
                  type="text"
                  placeholder="N° chèque, transaction..."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setPayingFF(null)}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={submitSupplierPayment}
                disabled={!payMontant || Number(payMontant) <= 0 || Number(payMontant) > payingFF.solde}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
