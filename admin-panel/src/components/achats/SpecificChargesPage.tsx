"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, exportToCsv } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import type { ChargeFormCategory } from "./SpecificChargeForm";

const API_URL = getApiUrl();

interface CommercialInfo {
  id: number;
  prenom: string | null;
  nom: string | null;
}

// ─── Meta & config ──────────────────────────────────────────────────────────

const meta: Record<
  ChargeFormCategory,
  { title: string; plural: string; description: string; path: string }
> = {
  CHARGES: {
    title: "Charges générales",
    plural: "Charges générales",
    description: "Loyer, électricité, téléphone et autres charges d'exploitation",
    path: "/charges",
  },
  CNSS: {
    title: "CNSS",
    plural: "Déclarations CNSS",
    description: "Déclarations et cotisations sociales patronales et salariales",
    path: "/charges/cnss",
  },
  NEUF_BA4A: {
    title: "9BA4A",
    plural: "Charges 9BA4A",
    description: "Retenues à la source et charges fiscales diverses",
    path: "/charges/9ba4a",
  },
};

const paiementConfig: Record<string, { label: string; cls: string }> = {
  NON_PAYEE: { label: "Non payée", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  PARTIELLEMENT_PAYEE: { label: "Partiel", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PAYEE: { label: "Payée", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
};

function fmt(n: number | string | undefined | null, devise = "TND") {
  return `${Number(n ?? 0).toFixed(3)} ${devise}`;
}

// ─── Types per category ──────────────────────────────────────────────────────

interface ChargeGenerale {
  id: number;
  numeroCharge: string;
  date: string;
  nature: string;
  description?: string | null;
  periodeConcernee?: string | null;
  beneficiaire: string;
  montantHT: number;
  tauxTVA: number;
  montantTTC: number;
  statutPaiement: string;
  modePaiement?: string | null;
  datePaiement?: string | null;
  referenceFacture?: string | null;
  pieceJustificativeUrl?: string | null;
  notes?: string | null;
  commercial?: CommercialInfo | null;
  creeLe?: string;
}

interface ChargeCnss {
  id: number;
  numeroDeclaration: string;
  periodeDeclaration: string;
  matriculeEmployeur: string;
  nombreSalaries: number;
  masseSalariale: number;
  partPatronale: number;
  partSalariale: number;
  totalCnss: number;
  statutPaiement: string;
  dateLimitePaiement?: string | null;
  datePaiement?: string | null;
  modePaiement?: string | null;
  referencePaiement?: string | null;
  pieceJustificativeUrl?: string | null;
  notes?: string | null;
  commercial?: CommercialInfo | null;
  date?: string;
  creeLe?: string;
}

interface Charge9ba4a {
  id: number;
  numero: string;
  date: string;
  description: string;
  beneficiaire: string;
  montant: number;
  statutPaiement: string;
  modePaiement?: string | null;
  pieceJustificativeUrl?: string | null;
  notes?: string | null;
  commercial?: CommercialInfo | null;
  creeLe?: string;
}

type AnyCharge = ChargeGenerale | ChargeCnss | Charge9ba4a;

interface ChargesStats {
  total: number;
  montantTotal: number;
  montantPaye: number;
  montantImpaye: number;
}

// ─── Helper: extract common fields ──────────────────────────────────────────

function getNumero(item: AnyCharge, cat: ChargeFormCategory): string {
  if (cat === "CHARGES") return (item as ChargeGenerale).numeroCharge;
  if (cat === "CNSS") return (item as ChargeCnss).numeroDeclaration;
  return (item as Charge9ba4a).numero;
}

function getMontant(item: AnyCharge, cat: ChargeFormCategory): number {
  if (cat === "CHARGES") return Number((item as ChargeGenerale).montantTTC ?? 0);
  if (cat === "CNSS") return Number((item as ChargeCnss).totalCnss ?? 0);
  return Number((item as Charge9ba4a).montant ?? 0);
}

function getDate(item: AnyCharge, cat: ChargeFormCategory): string | null {
  if (cat === "CNSS") return (item as ChargeCnss).date ?? null;
  return (item as ChargeGenerale | Charge9ba4a).date ?? null;
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SpecificChargesPage({
  categorie,
}: {
  categorie: ChargeFormCategory;
}) {
  const { getToken } = useAuth();
  const categoryMeta = meta[categorie];

  const [items, setItems] = useState<AnyCharge[]>([]);
  const [stats, setStats] = useState<ChargesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPaiement, setFilterPaiement] = useState("");
  const [filterCommercial, setFilterCommercial] = useState("");
  const [commerciaux, setCommerciaux] = useState<CommercialInfo[]>([]);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Charger la liste des commerciaux pour le filtre
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/clients/commerciaux`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCommerciaux(data); })
      .catch(() => {});
  }, [getToken]);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");

      const res = await fetch(`${API_URL}/achats/charges/${categorie}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: AnyCharge[] = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Erreur chargement");
      setItems(data);

      // Compute stats locally
      const montantTotal = data.reduce((acc, it) => acc + getMontant(it, categorie), 0);
      const montantPaye = data
        .filter((it) => it.statutPaiement === "PAYEE")
        .reduce((acc, it) => acc + getMontant(it, categorie), 0);
      const montantPartiel = data
        .filter((it) => it.statutPaiement === "PARTIELLEMENT_PAYEE")
        .reduce((acc, it) => acc + getMontant(it, categorie) * 0.5, 0); // approximation
      setStats({
        total: data.length,
        montantTotal,
        montantPaye,
        montantImpaye: montantTotal - montantPaye,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, categorie]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtering & pagination ───────────────────────────────────────────────

  const filtered = items.filter((item) => {
    const numero = getNumero(item, categorie).toLowerCase();
    const matchSearch =
      !search ||
      numero.includes(search.toLowerCase()) ||
      ((item as ChargeGenerale).beneficiaire ?? (item as Charge9ba4a).beneficiaire ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      ((item as ChargeGenerale).nature ?? (item as Charge9ba4a).description ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchPaiement = !filterPaiement || item.statutPaiement === filterPaiement;
    const matchCommercial =
      !filterCommercial ||
      String((item as any).commercial?.id ?? "") === filterCommercial;
    return matchSearch && matchPaiement && matchCommercial;
  });

  // Total par commercial (quand un filtre commercial est actif)
  const totalCommercialFiltered = filterCommercial
    ? filtered.reduce((sum, it) => sum + getMontant(it, categorie), 0)
    : null;

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette charge ?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/achats/charges/${categorie}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur suppression");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────────────

  const handleExportExcel = () => {
    if (categorie === "CHARGES") {
      const headers = [
        "Numéro", "Date", "Nature", "Description", "Période concernée",
        "Bénéficiaire", "Réf. Facture", "Montant HT", "TVA (%)",
        "Montant TTC", "Statut Paiement", "Mode Paiement", "Date Paiement", "Notes",
      ];
      const rows = (items as ChargeGenerale[]).map((it) => [
        it.numeroCharge,
        it.date ? new Date(it.date).toLocaleDateString("fr-FR") : "",
        it.nature,
        it.description ?? "",
        it.periodeConcernee ?? "",
        it.beneficiaire,
        it.referenceFacture ?? "",
        Number(it.montantHT).toFixed(3),
        Number(it.tauxTVA).toFixed(2),
        Number(it.montantTTC).toFixed(3),
        it.statutPaiement,
        it.modePaiement ?? "",
        it.datePaiement ? new Date(it.datePaiement).toLocaleDateString("fr-FR") : "",
        it.notes ?? "",
      ]);
      exportToCsv(`charges-${new Date().toISOString().split("T")[0]}`, headers, rows);
    } else if (categorie === "CNSS") {
      const headers = [
        "N° Déclaration", "Période", "Matricule Employeur", "Nb Salariés",
        "Masse Salariale", "Part Patronale", "Part Salariale", "Total CNSS",
        "Statut Paiement", "Date Limite Paiement", "Date Paiement", "Mode Paiement",
        "Réf. Paiement", "Notes",
      ];
      const rows = (items as ChargeCnss[]).map((it) => [
        it.numeroDeclaration,
        it.periodeDeclaration,
        it.matriculeEmployeur,
        String(it.nombreSalaries),
        Number(it.masseSalariale).toFixed(3),
        Number(it.partPatronale).toFixed(3),
        Number(it.partSalariale).toFixed(3),
        Number(it.totalCnss).toFixed(3),
        it.statutPaiement,
        it.dateLimitePaiement ? new Date(it.dateLimitePaiement).toLocaleDateString("fr-FR") : "",
        it.datePaiement ? new Date(it.datePaiement).toLocaleDateString("fr-FR") : "",
        it.modePaiement ?? "",
        it.referencePaiement ?? "",
        it.notes ?? "",
      ]);
      exportToCsv(`cnss-${new Date().toISOString().split("T")[0]}`, headers, rows);
    } else {
      const headers = [
        "Numéro", "Date", "Description", "Bénéficiaire", "Montant",
        "Statut Paiement", "Mode Paiement", "Notes",
      ];
      const rows = (items as Charge9ba4a[]).map((it) => [
        it.numero,
        it.date ? new Date(it.date).toLocaleDateString("fr-FR") : "",
        it.description,
        it.beneficiaire,
        Number(it.montant).toFixed(3),
        it.statutPaiement,
        it.modePaiement ?? "",
        it.notes ?? "",
      ]);
      exportToCsv(`9ba4a-${new Date().toISOString().split("T")[0]}`, headers, rows);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="box-border flex h-[calc(100dvh-8rem)] w-full min-w-0 max-w-full min-h-0 flex-col overflow-hidden overscroll-none p-2 md:p-3">
      {/* Breadcrumb */}
      <div className="shrink-0">
        <PageBreadcrumb pageTitle={categoryMeta.title} />
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-1 mb-1">
          {[
            { label: "Total Charges", value: stats.total, isCurrency: false },
            { label: "Montant Total", value: fmt(stats.montantTotal), isCurrency: true },
            { label: "Payé", value: fmt(stats.montantPaye), isCurrency: true, cls: "text-emerald-600" },
            { label: "Solde Impayé", value: fmt(stats.montantImpaye), isCurrency: true, cls: "text-red-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5 shadow-sm"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
              <p className={`text-base font-bold ${s.cls ?? "text-gray-800 dark:text-white"}`}>
                {s.isCurrency ? s.value : String(s.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
        <div className="min-w-0">
          <h2 className="text-base leading-tight font-bold text-gray-800 dark:text-white">
            Liste des {categoryMeta.plural}
            <span className="ml-2 text-sm font-normal text-gray-500">({filtered.length} total)</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{categoryMeta.description}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-1 md:w-auto md:justify-end">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition"
          >
            📊 Télécharger Excel
          </button>
          <Link
            href={`${categoryMeta.path}/new`}
            className="inline-flex items-center gap-1 whitespace-nowrap bg-brand-500 hover:bg-brand-600 text-white px-2 py-1 rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
            </svg>
            + AJOUTER UNE CHARGE
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_10rem_12rem] gap-1 mb-1">
        <input
          type="text"
          placeholder={
            categorie === "CNSS"
              ? "Rechercher (n° déclaration, matricule...)"
              : "Rechercher (numéro, bénéficiaire, nature...)"
          }
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="min-w-0 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        />
        <select
          value={filterPaiement}
          onChange={(e) => { setFilterPaiement(e.target.value); setPage(1); }}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Tout état paiement</option>
          <option value="NON_PAYEE">Non payée</option>
          <option value="PARTIELLEMENT_PAYEE">Partiellement payée</option>
          <option value="PAYEE">Payée</option>
        </select>
        <select
          value={filterCommercial}
          onChange={(e) => { setFilterCommercial(e.target.value); setPage(1); }}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="">Tous les commerciaux</option>
          {commerciaux.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.prenom, c.nom].filter(Boolean).join(" ")}
            </option>
          ))}
        </select>
      </div>

      {/* Total par commercial (si filtré) */}
      {totalCommercialFiltered !== null && (
        <div className="shrink-0 mb-1 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 text-sm">
          <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
            Total {commerciaux.find((c) => String(c.id) === filterCommercial) ? (
              `${[commerciaux.find((c) => String(c.id) === filterCommercial)?.prenom, commerciaux.find((c) => String(c.id) === filterCommercial)?.nom].filter(Boolean).join(" ")}`
            ) : "commercial"} :
          </span>{" "}
          <span className="text-indigo-900 dark:text-indigo-100 font-bold">{fmt(totalCommercialFiltered)}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="shrink-0 mb-1 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="relative h-0 min-h-0 w-full min-w-0 flex-1 basis-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto mb-3 w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Aucune charge trouvée</p>
            <Link
              href={`${categoryMeta.path}/new`}
              className="mt-2 inline-block text-brand-500 text-sm hover:underline"
            >
              + Créer la première charge
            </Link>
          </div>
        ) : categorie === "CHARGES" ? (
          <ChargesTable items={paginated as ChargeGenerale[]} onDelete={handleDelete} />
        ) : categorie === "CNSS" ? (
          <CnssTable items={paginated as ChargeCnss[]} onDelete={handleDelete} />
        ) : (
          <Neuf9ba4aTable items={paginated as Charge9ba4a[]} onDelete={handleDelete} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {totalPages} ({filtered.length} résultats)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Table: Charges générales ────────────────────────────────────────────────

function ChargesTable({
  items,
  onDelete,
}: {
  items: ChargeGenerale[];
  onDelete: (id: number) => void;
}) {
  const columns = [
    "Numéro",
    "Date",
    "Nature",
    "Description",
    "Période",
    "Bénéficiaire",
    "Réf. Facture",
    "Montant HT",
    "TVA (%)",
    "Montant TTC",
    "Commercial",
    "Paiement",
    "Mode",
    "Date Paiement",
    "Pièce",
    "Actions",
  ];

  return (
    <table className="min-w-[2700px] w-full table-fixed border-separate border-spacing-0 text-xs">
      <colgroup>
        {["140px","110px","130px","200px","120px","160px","130px","120px","90px","120px","150px","120px","100px","120px","80px","120px"].map(
          (w, i) => <col key={i} style={{ width: w }} />
        )}
      </colgroup>
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {columns.map((h) => (
            <th
              key={h}
              className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-left px-2 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap shadow-[0_1px_0_rgba(229,231,235,1)] dark:shadow-[0_1px_0_rgba(55,65,81,1)]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((it) => (
          <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="px-2 py-2 font-mono text-brand-600 dark:text-brand-400 font-bold whitespace-nowrap overflow-hidden text-ellipsis">
              {it.numeroCharge}
            </td>
            <td className="px-2 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {it.date ? new Date(it.date).toLocaleDateString("fr-FR") : "—"}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {it.nature}
            </td>
            <td className="px-2 py-2 text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
              {it.description ?? "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
              {it.periodeConcernee ?? "—"}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {it.beneficiaire}
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
              {it.referenceFacture ?? "—"}
            </td>
            <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {fmt(it.montantHT)}
            </td>
            <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {Number(it.tauxTVA).toFixed(1)}%
            </td>
            <td className="px-2 py-2 text-right font-semibold text-gray-800 dark:text-white whitespace-nowrap">
              {fmt(it.montantTTC)}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {it.commercial ? [it.commercial.prenom, it.commercial.nom].filter(Boolean).join(" ") : "—"}
            </td>
            <td className="px-2 py-2 whitespace-nowrap">
              <StatutBadge statut={it.statutPaiement} />
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
              {it.modePaiement ?? "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
              {it.datePaiement ? new Date(it.datePaiement).toLocaleDateString("fr-FR") : "—"}
            </td>
            <td className="px-2 py-2 whitespace-nowrap">
              {it.pieceJustificativeUrl ? (
                <a
                  href={it.pieceJustificativeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:underline"
                >
                  📎
                </a>
              ) : (
                "—"
              )}
            </td>
            <td className="px-2 py-2 whitespace-nowrap !overflow-visible">
              <ChargeActionMenu
                id={it.id}
                editPath={`/charges/${it.id}/edit`}
                onDelete={() => onDelete(it.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Table: CNSS ─────────────────────────────────────────────────────────────

function CnssTable({
  items,
  onDelete,
}: {
  items: ChargeCnss[];
  onDelete: (id: number) => void;
}) {
  const columns = [
    "N° Déclaration",
    "Période",
    "Matricule Employeur",
    "Nb Salariés",
    "Masse Salariale",
    "Part Patronale",
    "Part Salariale",
    "Total CNSS",
    "Commercial",
    "Paiement",
    "Date Limite",
    "Date Paiement",
    "Mode",
    "Réf. Paiement",
    "Pièce",
    "Actions",
  ];

  return (
    <table className="min-w-[2900px] w-full table-fixed border-separate border-spacing-0 text-xs">
      <colgroup>
        {["160px","150px","180px","100px","140px","130px","130px","130px","150px","120px","120px","120px","100px","130px","80px","120px"].map(
          (w, i) => <col key={i} style={{ width: w }} />
        )}
      </colgroup>
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {columns.map((h) => (
            <th
              key={h}
              className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-left px-2 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap shadow-[0_1px_0_rgba(229,231,235,1)] dark:shadow-[0_1px_0_rgba(55,65,81,1)]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((it) => (
          <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="px-2 py-2 font-mono text-brand-600 dark:text-brand-400 font-bold whitespace-nowrap">
              {it.numeroDeclaration}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {it.periodeDeclaration}
            </td>
            <td className="px-2 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {it.matriculeEmployeur}
            </td>
            <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {it.nombreSalaries}
            </td>
            <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {fmt(it.masseSalariale)}
            </td>
            <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {fmt(it.partPatronale)}
            </td>
            <td className="px-2 py-2 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {fmt(it.partSalariale)}
            </td>
            <td className="px-2 py-2 text-right font-semibold text-gray-800 dark:text-white whitespace-nowrap">
              {fmt(it.totalCnss)}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {it.commercial ? [it.commercial.prenom, it.commercial.nom].filter(Boolean).join(" ") : "—"}
            </td>
            <td className="px-2 py-2 whitespace-nowrap">
              <StatutBadge statut={it.statutPaiement} />
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
              {it.dateLimitePaiement ? new Date(it.dateLimitePaiement).toLocaleDateString("fr-FR") : "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
              {it.datePaiement ? new Date(it.datePaiement).toLocaleDateString("fr-FR") : "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
              {it.modePaiement ?? "—"}
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
              {it.referencePaiement ?? "—"}
            </td>
            <td className="px-2 py-2 whitespace-nowrap">
              {it.pieceJustificativeUrl ? (
                <a
                  href={it.pieceJustificativeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:underline"
                >
                  📎
                </a>
              ) : (
                "—"
              )}
            </td>
            <td className="px-2 py-2 whitespace-nowrap !overflow-visible">
              <ChargeActionMenu
                id={it.id}
                editPath={`/charges/cnss/${it.id}/edit`}
                onDelete={() => onDelete(it.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Table: 9BA4A ─────────────────────────────────────────────────────────────

function Neuf9ba4aTable({
  items,
  onDelete,
}: {
  items: Charge9ba4a[];
  onDelete: (id: number) => void;
}) {
  const columns = [
    "Numéro",
    "Date",
    "Description",
    "Bénéficiaire",
    "Montant",
    "Commercial",
    "Paiement",
    "Mode",
    "Pièce",
    "Notes",
    "Actions",
  ];

  return (
    <table className="min-w-[1950px] w-full table-fixed border-separate border-spacing-0 text-xs">
      <colgroup>
        {["140px","110px","260px","180px","130px","150px","120px","110px","80px","200px","120px"].map(
          (w, i) => <col key={i} style={{ width: w }} />
        )}
      </colgroup>
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {columns.map((h) => (
            <th
              key={h}
              className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-left px-2 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap shadow-[0_1px_0_rgba(229,231,235,1)] dark:shadow-[0_1px_0_rgba(55,65,81,1)]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((it) => (
          <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="px-2 py-2 font-mono text-brand-600 dark:text-brand-400 font-bold whitespace-nowrap">
              {it.numero}
            </td>
            <td className="px-2 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {it.date ? new Date(it.date).toLocaleDateString("fr-FR") : "—"}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
              {it.description}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {it.beneficiaire}
            </td>
            <td className="px-2 py-2 text-right font-semibold text-gray-800 dark:text-white whitespace-nowrap">
              {fmt(it.montant)}
            </td>
            <td className="px-2 py-2 text-gray-800 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {it.commercial ? [it.commercial.prenom, it.commercial.nom].filter(Boolean).join(" ") : "—"}
            </td>
            <td className="px-2 py-2 whitespace-nowrap">
              <StatutBadge statut={it.statutPaiement} />
            </td>
            <td className="px-2 py-2 text-gray-500 whitespace-nowrap">
              {it.modePaiement ?? "—"}
            </td>
            <td className="px-2 py-2 whitespace-nowrap">
              {it.pieceJustificativeUrl ? (
                <a
                  href={it.pieceJustificativeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:underline"
                >
                  📎
                </a>
              ) : (
                "—"
              )}
            </td>
            <td className="px-2 py-2 text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
              {it.notes ?? "—"}
            </td>
            <td className="px-2 py-2 whitespace-nowrap !overflow-visible">
              <ChargeActionMenu
                id={it.id}
                editPath={`/charges/9ba4a/${it.id}/edit`}
                onDelete={() => onDelete(it.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Statut badge ─────────────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: string }) {
  const cfg = paiementConfig[statut] ?? paiementConfig.NON_PAYEE;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Action menu ──────────────────────────────────────────────────────────────

function ChargeActionMenu({
  id,
  editPath,
  onDelete,
}: {
  id: number;
  editPath: string;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`relative inline-block text-left ${open ? "z-50" : "z-10"}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
      >
        <span>Actions</span>
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
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Modifier */}
          <Link
            href={editPath}
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
          >
            <span>✏️</span> Modifier
          </Link>

          <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

          {/* Supprimer */}
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left font-medium"
          >
            <span>🗑️</span> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
