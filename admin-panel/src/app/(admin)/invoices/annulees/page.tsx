"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, downloadInvoicePdf } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

interface InvoiceLine {
  id: number;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  totalHT: number;
}

interface Invoice {
  id: number;
  numero: string;
  dateEmission: string;
  misAJourLe?: string;
  clientNom: string;
  clientMF?: string;
  clientEmail?: string;
  clientTelephone?: string;
  clientAdresse?: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  timbreFiscal: number;
  retenueSurce: number;
  statut: string;
  statutPaiement: string;
  typeFacture: string;
  etat?: string;
  fichierPdf: string | null;
  commentaire?: string;
  lignes: InvoiceLine[];
  bonsLivraison?: any[];
}

export default function FacturesAnnuleesPage() {
  const { getToken } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");
      const res = await fetch(`${API_URL}/invoices/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des factures");
      const data: Invoice[] = await res.json();
      // Filtrer uniquement les factures annulées
      setInvoices(data.filter(inv => inv.statut === "ANNULEE"));
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);



  const handleRestore = async (id: number, numero: string) => {
    setOpenMenuId(null);
    if (!confirm(`Rétablir la facture ${numero} en statut Brouillon ? Elle réapparaîtra dans la liste des factures actives.`)) return;

    setRestoringId(id);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/invoices/admin/${id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: "BROUILLON" }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Erreur lors du rétablissement");
        return;
      }
      fetchInvoices();
    } catch {
      alert("Erreur lors du rétablissement");
    } finally {
      setRestoringId(null);
    }
  };

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (
      inv.numero.toLowerCase().includes(q) ||
      (inv.clientNom && inv.clientNom.toLowerCase().includes(q)) ||
      (inv.clientEmail && inv.clientEmail.toLowerCase().includes(q))
    );
  });

  const totalMontantTTC = invoices.reduce((s, inv) => s + Number(inv.montantTTC || 0), 0);
  const totalMontantHT = invoices.reduce((s, inv) => s + Number(inv.montantHT || 0), 0);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Factures Annulées" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Factures Annulées (Archive)</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ces factures restent enregistrées en base de données à des fins d'historique et de conformité comptable.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm self-start sm:self-auto"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux factures actives
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Nombre de factures annulées</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-300 mt-2">{invoices.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total HT annulé</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">{fmt(totalMontantHT)} <span className="text-sm font-normal text-gray-500">TND</span></p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total TTC annulé</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2">{fmt(totalMontantTTC)} <span className="text-sm font-normal text-gray-500">TND</span></p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Rechercher par N° facture ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
        </div>
        <div className="text-xs text-gray-500">
          Affichage de {filteredInvoices.length} sur {invoices.length} facture(s) annulée(s)
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button onClick={fetchInvoices} className="ml-3 underline font-medium">Réessayer</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
              <tr>
                {[
                  "N° Facture", "Date Émission", "Date Annulation", "Client", "Type",
                  "Total HT", "Total TTC", "Statut", "BL Associé(s)", "Actions"
                ].map(h => (
                  <th key={h} className="px-3.5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && invoices.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400 italic">Chargement des factures annulées...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    <span className="text-3xl block mb-2">📋</span>
                    {search ? "Aucune facture annulée correspondant à votre recherche." : "Aucune facture annulée dans la base de données."}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const dateEmis = inv.dateEmission ? new Date(inv.dateEmission).toLocaleDateString("fr-FR") : "—";
                  const dateMaj = inv.misAJourLe ? new Date(inv.misAJourLe).toLocaleDateString("fr-FR") : "—";

                  return (
                    <tr key={inv.id} className="hover:bg-red-50/20 dark:hover:bg-red-950/10 transition-colors">
                      {/* Numéro */}
                      <td className="px-3.5 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        <span className="line-through text-gray-400 mr-1.5">{inv.numero}</span>
                      </td>

                      {/* Date Emission */}
                      <td className="px-3.5 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {dateEmis}
                      </td>

                      {/* Date Annulation (mis à jour) */}
                      <td className="px-3.5 py-3 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap">
                        {dateMaj}
                      </td>

                      {/* Client */}
                      <td className="px-3.5 py-3 text-gray-900 dark:text-white font-medium">
                        {inv.clientNom || "—"}
                      </td>

                      {/* Type */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                          {inv.typeFacture === "PRODUITS" ? "Produit" : inv.typeFacture === "SERVICE" ? "Service" : inv.typeFacture === "FACTURE" ? "Facture" : "Bon Livraison"}
                        </span>
                      </td>

                      {/* Total HT */}
                      <td className="px-3.5 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {fmt(Number(inv.montantHT))} TND
                      </td>

                      {/* Total TTC */}
                      <td className="px-3.5 py-3 text-right tabular-nums font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {fmt(Number(inv.montantTTC))} TND
                      </td>

                      {/* Statut */}
                      <td className="px-3.5 py-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Annulée
                        </span>
                      </td>

                      {/* BL Associé(s) */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {inv.bonsLivraison && inv.bonsLivraison.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {inv.bonsLivraison.map((b: any, idx: number) => {
                              const code = b?.code || b?.bonLivraison?.code;
                              const id = b?.id || b?.bonLivraison?.id || idx;
                              if (!code) return null;
                              return (
                                <span key={id} className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">
                                  {code}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3">
                        <CancelledInvoiceActionMenu
                          invoice={inv}
                          onView={(target) => setSelectedInvoice(target)}
                          onRestore={handleRestore}
                          isRestoring={restoringId === inv.id}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détails Facture Annulée */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-red-50/40 dark:bg-red-950/20">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">Facture {selectedInvoice.numero}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">ANNULÉE</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Émise le {new Date(selectedInvoice.dateEmission).toLocaleDateString("fr-FR")}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs">
                <div>
                  <span className="text-gray-500 block">Client</span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{selectedInvoice.clientNom}</span>
                  {selectedInvoice.clientMF && <span className="block text-gray-500">MF: {selectedInvoice.clientMF}</span>}
                </div>
                <div>
                  <span className="text-gray-500 block">Coordonnées</span>
                  <span className="text-gray-800 dark:text-gray-200 block">{selectedInvoice.clientEmail || "—"}</span>
                  <span className="text-gray-800 dark:text-gray-200 block">{selectedInvoice.clientTelephone || "—"}</span>
                </div>
              </div>

              {/* Lignes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Lignes de la facture</h4>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                      <tr>
                        <th className="p-2 text-left">Désignation</th>
                        <th className="p-2 text-center">Qté</th>
                        <th className="p-2 text-right">P.U HT</th>
                        <th className="p-2 text-center">TVA</th>
                        <th className="p-2 text-right">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedInvoice.lignes && selectedInvoice.lignes.length > 0 ? (
                        selectedInvoice.lignes.map((l, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium">{l.designation}</td>
                            <td className="p-2 text-center">{l.quantite}</td>
                            <td className="p-2 text-right">{fmt(Number(l.prixUnitaireHT))}</td>
                            <td className="p-2 text-center">{Number(l.tauxTVA)}%</td>
                            <td className="p-2 text-right font-medium">{fmt(Number(l.totalHT))}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-400 italic">Aucune ligne</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Total HT</span><span>{fmt(selectedInvoice.montantHT)} TND</span></div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Total TVA</span><span>{fmt(selectedInvoice.montantTVA)} TND</span></div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Timbre Fiscal</span><span>{fmt(selectedInvoice.timbreFiscal)} TND</span></div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1 mt-1 text-base">
                  <span>Total TTC</span><span>{fmt(selectedInvoice.montantTTC)} TND</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-3 bg-gray-50 dark:bg-gray-800/40">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-100 transition"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const inv = selectedInvoice;
                  setSelectedInvoice(null);
                  handleRestore(inv.id, inv.numero);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center gap-2"
              >
                <span>🔄</span> Rétablir en Brouillon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CancelledInvoiceActionMenu({
  invoice,
  onView,
  onRestore,
  isRestoring,
}: {
  invoice: Invoice;
  onView: (inv: Invoice) => void;
  onRestore: (id: number, numero: string) => void;
  isRestoring: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`relative inline-block text-left ${open ? "z-50" : "z-10"}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-xs cursor-pointer"
      >
        <span>Edition</span>
        <svg
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onView(invoice);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition font-medium cursor-pointer"
          >
            <span>🔍</span> Consulter détails
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRestore(invoice.id, invoice.numero);
            }}
            disabled={isRestoring}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition font-semibold disabled:opacity-50 cursor-pointer"
          >
            <span>🔄</span> {isRestoring ? "Rétablissement..." : "Rétablir en Brouillon"}
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              try {
                await downloadInvoicePdf(invoice.id, invoice.numero);
              } catch (err) {
                console.error(err);
                alert("Erreur lors du téléchargement du PDF");
              }
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors text-left"
          >
            <span>📄</span> Télécharger PDF
          </button>
        </div>
      )}
    </div>
  );
}

