"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, downloadDevisPdf } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import DevisDetailModal from "@/components/devis/DevisDetailModal";
import { useExercice } from "@/context/ExerciceContext";

const API_URL = getApiUrl();

interface DevisItem {
  id: number;
  numero: string;
  dateDevis: string;
  dateValidite?: string | null;
  statut: string;
  etat: string;
  typeDevis: string;
  devise: string;
  clientNom: string;
  clientMF?: string | null;
  clientAdresse?: string | null;
  clientTelephone?: string | null;
  clientEmail?: string | null;
  montantHT: number;
  montantRemise: number;
  montantTVA: number;
  timbreFiscal: number;
  montantTTC: number;
  commentaire?: string | null;
  lignes?: any[];
  factures?: { id: number; numero: string; statut: string; montantTTC: number }[];
  bonsLivraison?: { id: number; code: string; statut: string }[];
}

const statusBadge: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  EN_ATTENTE: { label: "En attente", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  ACCEPTE: { label: "Accepté", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  REFUSE: { label: "Refusé", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  EXPIRE: { label: "Expiré", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FACTURE: { label: "Facturé", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  CONVERTI_BL: { label: "Converti en BL", cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" },
};

const etatBadge: Record<string, { label: string; cls: string }> = {
  NORMAL: { label: "Normal", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  URGENT: { label: "Urgent", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  ESTIMATION: { label: "Estimation", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
};

export default function DevisPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { activeExercice, isAllSelected } = useExercice();
  const [devisList, setDevisList] = useState<DevisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedDevisForView, setSelectedDevisForView] = useState<DevisItem | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [typeFilter, setTypeFilter] = useState("TOUS");

  const fetchDevis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");
      const url =
        !isAllSelected && activeExercice
          ? `${API_URL}/devis?exerciceAnnee=${activeExercice.annee}`
          : `${API_URL}/devis`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur chargement des devis");
      const data = await res.json();
      setDevisList(data);
    } catch (err: any) {
      setError(err.message || "Erreur connexion");
    } finally {
      setLoading(false);
    }
  }, [getToken, activeExercice, isAllSelected]);

  useEffect(() => {
    fetchDevis();
  }, [fetchDevis]);

  // Actions
  const handleFacturer = async (devis: DevisItem) => {
    if (!confirm(`Confirmez-vous la création automatique d'une facture à partir du devis ${devis.numero} ?`)) {
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/devis/${devis.id}/facturer`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur facturation");

      alert(`✓ Facture ${data.facture.numero} créée avec succès !`);
      setSelectedDevisForView(null);
      fetchDevis();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la facturation");
    }
  };

  const handleConvertirBL = async (devis: DevisItem) => {
    if (!confirm(`Confirmez-vous la conversion du devis ${devis.numero} en Bon de Livraison ?`)) {
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/devis/${devis.id}/convertir-bl`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur conversion BL");

      alert(`✓ Bon de Livraison ${data.bonLivraison.code} créé avec succès !`);
      setSelectedDevisForView(null);
      fetchDevis();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la conversion");
    }
  };

  const handleDelete = async (id: number, numero: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le devis ${numero} ?`)) {
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/devis/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur suppression");
      }
      setDevisList((prev) => prev.filter((item) => item.id !== id));
      if (selectedDevisForView?.id === id) setSelectedDevisForView(null);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const handleCopy = (devis: DevisItem) => {
    router.push(`/devis/new?copyFrom=${devis.id}`);
  };

  const handleSend = (devis: DevisItem) => {
    if (devis.clientEmail) {
      const subject = encodeURIComponent(`Devis ${devis.numero} - RZMedical`);
      const body = encodeURIComponent(
        `Bonjour ${devis.clientNom},\n\nVeuillez trouver ci-joint les détails de votre devis N° ${devis.numero} d'un montant de ${Number(devis.montantTTC).toFixed(3)} TND.\n\nCordialement,\nRZMedical`
      );
      window.open(`mailto:${devis.clientEmail}?subject=${subject}&body=${body}`, "_blank");
    } else {
      alert(`Le client ${devis.clientNom} n'a pas d'adresse email renseignée.`);
    }
  };

  // Filtered devis
  const filteredDevis = useMemo(() => {
    return devisList.filter((item) => {
      if (statusFilter !== "TOUS" && item.statut !== statusFilter) return false;
      if (typeFilter !== "TOUS" && item.typeDevis !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = item.numero.toLowerCase().includes(q);
        const matchClient = item.clientNom.toLowerCase().includes(q);
        const matchFac = (item.factures || []).some((f) => f.numero.toLowerCase().includes(q));
        const matchBl = (item.bonsLivraison || []).some((b) => b.code.toLowerCase().includes(q));
        if (!matchNum && !matchClient && !matchFac && !matchBl) return false;
      }
      return true;
    });
  }, [devisList, statusFilter, typeFilter, search]);

  const fmt = (n: number) =>
    Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  // Counts
  const counts = useMemo(() => {
    return {
      tous: devisList.length,
      brouillon: devisList.filter((d) => d.statut === "BROUILLON").length,
      enAttente: devisList.filter((d) => d.statut === "EN_ATTENTE").length,
      accepte: devisList.filter((d) => d.statut === "ACCEPTE").length,
      facture: devisList.filter((d) => d.statut === "FACTURE").length,
    };
  }, [devisList]);

  return (
    <div className="box-border flex h-[calc(100dvh-8rem)] w-full min-w-0 max-w-full min-h-0 flex-col gap-6 overflow-hidden p-6">
      {/* Breadcrumb + Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <PageBreadcrumb pageTitle="Devis Clients" />
            {!isAllSelected && activeExercice ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Exercice {activeExercice.annee}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                🌐 Tous les exercices
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gestion des devis commerciaux, chiffrages, conversion en Facture ou Bon de Livraison
          </p>
        </div>
        <button
          onClick={() => router.push("/devis/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all shrink-0"
        >
          <span>➕</span>
          <span>Ajouter un devis</span>
        </button>
      </div>

      {/* Stats Quick Badges */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter("TOUS")}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === "TOUS"
              ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
          }`}
        >
          <span className="text-[11px] text-gray-500 block">Tous les devis</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{counts.tous}</span>
        </div>
        <div
          onClick={() => setStatusFilter("BROUILLON")}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === "BROUILLON"
              ? "border-gray-500 bg-gray-50 dark:bg-gray-800"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
          }`}
        >
          <span className="text-[11px] text-gray-500 block">Brouillons</span>
          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{counts.brouillon}</span>
        </div>
        <div
          onClick={() => setStatusFilter("EN_ATTENTE")}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === "EN_ATTENTE"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
          }`}
        >
          <span className="text-[11px] text-blue-600 block">En attente</span>
          <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{counts.enAttente}</span>
        </div>
        <div
          onClick={() => setStatusFilter("ACCEPTE")}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === "ACCEPTE"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
          }`}
        >
          <span className="text-[11px] text-emerald-600 block">Acceptés</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{counts.accepte}</span>
        </div>
        <div
          onClick={() => setStatusFilter("FACTURE")}
          className={`p-3 rounded-xl border cursor-pointer transition ${
            statusFilter === "FACTURE"
              ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
          }`}
        >
          <span className="text-[11px] text-purple-600 block">Facturés</span>
          <span className="text-lg font-bold text-purple-700 dark:text-purple-400">{counts.facture}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="shrink-0 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par N°, client, N° facture..."
            className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="TOUS">Tous</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACCEPTE">Accepté</option>
              <option value="REFUSE">Refusé</option>
              <option value="EXPIRE">Expiré</option>
              <option value="FACTURE">Facturé</option>
              <option value="CONVERTI_BL">Converti en BL</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Type :</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="TOUS">Tous</option>
              <option value="PRODUITS">Produit</option>
              <option value="SERVICE">Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="min-h-0 w-full min-w-0 flex-1 basis-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Chargement des devis clients...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">
            ⚠️ {error}
            <button
              onClick={fetchDevis}
              className="ml-3 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs"
            >
              Réessayer
            </button>
          </div>
        ) : filteredDevis.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Aucun devis trouvé correspondant aux critères.
          </div>
        ) : (
          <div className="h-full w-full min-w-0 overflow-auto overscroll-contain">
            <table className="min-w-[1700px] w-full table-fixed text-xs text-left">
              <thead className="sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="p-3.5 font-semibold">Numéro</th>
                  <th className="p-3.5 font-semibold">Client</th>
                  <th className="p-3.5 font-semibold">Date</th>
                  <th className="p-3.5 font-semibold">Type Devis</th>
                  <th className="p-3.5 font-semibold">Statut</th>
                  <th className="p-3.5 font-semibold">État Devis</th>
                  <th className="p-3.5 font-semibold">N° Facture</th>
                  <th className="p-3.5 font-semibold text-right">Total TTC</th>
                  <th className="p-3.5 font-semibold text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredDevis.map((devis) => {
                  const sBadge = statusBadge[devis.statut] || {
                    label: devis.statut,
                    cls: "bg-gray-100 text-gray-700",
                  };
                  const eBadge = etatBadge[devis.etat] || {
                    label: devis.etat,
                    cls: "bg-gray-100 text-gray-700",
                  };
                  const dateFormatted = devis.dateDevis
                    ? new Date(devis.dateDevis).toLocaleDateString("fr-FR")
                    : "—";

                  const linkedInvoice =
                    devis.factures && devis.factures.length > 0 ? devis.factures[0] : null;

                  return (
                    <tr
                      key={devis.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Numéro */}
                      <td className="p-3.5 font-bold text-teal-700 dark:text-teal-400">
                        {devis.numero}
                      </td>

                      {/* Client */}
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {devis.clientNom}
                        </div>
                        {devis.clientTelephone && (
                          <div className="text-[11px] text-gray-400">{devis.clientTelephone}</div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-gray-600 dark:text-gray-400">{dateFormatted}</td>

                      {/* Type Devis */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {devis.typeDevis === "SERVICE" ? "Service" : "Produit"}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${sBadge.cls}`}
                        >
                          {sBadge.label}
                        </span>
                      </td>

                      {/* État Devis */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${eBadge.cls}`}
                        >
                          {eBadge.label}
                        </span>
                      </td>

                      {/* Numéro Facture */}
                      <td className="p-3.5">
                        {linkedInvoice ? (
                          <span className="inline-flex items-center gap-1 font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
                            <span>🧾</span>
                            <span>{linkedInvoice.numero}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>

                      {/* Total TTC */}
                      <td className="p-3.5 text-right font-bold text-gray-900 dark:text-white">
                        {fmt(devis.montantTTC)} {devis.devise || "TND"}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <DevisActionMenu
                          devis={devis}
                          onView={() => setSelectedDevisForView(devis)}
                          onEdit={() => router.push(`/devis/new?editId=${devis.id}`)}
                          onCopy={() => router.push(`/devis/new?copyFrom=${devis.id}`)}
                          onFacturer={() => handleFacturer(devis)}
                          onSend={() => handleSend(devis)}
                          onDownloadPdf={() => downloadDevisPdf(devis.id, devis.numero)}
                          onConvertirBL={() => handleConvertirBL(devis)}
                          onDelete={() => handleDelete(devis.id, devis.numero)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedDevisForView && (
        <DevisDetailModal
          devis={selectedDevisForView}
          onClose={() => setSelectedDevisForView(null)}
          onEdit={(d) => {
            setSelectedDevisForView(null);
            router.push(`/devis/new?editId=${d.id}`);
          }}
          onFacturer={handleFacturer}
          onConvertirBL={handleConvertirBL}
        />
      )}
    </div>
  );
}

// ─── Dropdown Menu Component ─────────────────────────────────────────────────

function DevisActionMenu({
  devis,
  onView,
  onEdit,
  onCopy,
  onFacturer,
  onSend,
  onDownloadPdf,
  onConvertirBL,
  onDelete,
}: {
  devis: DevisItem;
  onView: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onFacturer: () => void;
  onSend: () => void;
  onDownloadPdf: () => void;
  onConvertirBL: () => void;
  onDelete: () => void;
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

  const isFacture = devis.statut === "FACTURE";
  const isConvertiBL = devis.statut === "CONVERTI_BL";

  return (
    <div className={`relative inline-block text-left ${open ? "z-50" : "z-10"}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
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
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Consulter */}
          <MenuItem
            icon="🔍"
            label="Consulter"
            onClick={() => { setOpen(false); onView(); }}
          />

          {/* Modifier */}
          <MenuItem
            icon="✏️"
            label="Modifier"
            onClick={() => { setOpen(false); onEdit(); }}
          />

          {/* Copier */}
          <MenuItem
            icon="📋"
            label="Dupliquer / Copier"
            onClick={() => { setOpen(false); onCopy(); }}
          />

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          {/* Facturer */}
          <MenuItem
            icon="🧾"
            label="Facturer"
            disabled={isFacture}
            onClick={() => { setOpen(false); onFacturer(); }}
          />

          {/* Convertir en BL */}
          <MenuItem
            icon="🚚"
            label="Convertir en Bon de Livraison"
            disabled={isConvertiBL}
            onClick={() => { setOpen(false); onConvertirBL(); }}
          />

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          {/* Envoyer */}
          <MenuItem
            icon="✉️"
            label="Envoyer au client"
            onClick={() => { setOpen(false); onSend(); }}
          />

          {/* Télécharger PDF */}
          <MenuItem
            icon="📄"
            label="Télécharger PDF"
            onClick={() => { setOpen(false); onDownloadPdf(); }}
          />

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          {/* Supprimer */}
          <MenuItem
            icon="🗑️"
            label="Supprimer"
            danger
            onClick={() => { setOpen(false); onDelete(); }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors font-medium ${
        disabled
          ? "opacity-40 cursor-not-allowed text-gray-400"
          : danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
