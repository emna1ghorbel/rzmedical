"use client";
import React from "react";

interface StatutPaiementGroup {
  count: number;
  montant: number;
}

interface FactureStats {
  total: number;
  montantTotalTTC: number;
  montantTotalHT: number;
  montantTotalTVA: number;
  montantTotalTimbre?: number;
  montantTotalRetenue?: number;
  parStatutPaiement: Record<string, StatutPaiementGroup>;
  parStatut: Record<string, { count: number; montant: number }>;
  parEtat: Record<string, { count: number; montant: number }>;
}

interface PaiementStats {
  total: number;
  montantTotal: number;
}

interface DevisStats {
  total: number;
  montantTotal: number;
}

interface Props {
  factures: FactureStats;
  paiements: PaiementStats;
  devis: DevisStats;
  devise: string;
  loading: boolean;
}

function fmt(n: number, devise: string) {
  return `${n.toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${devise || "TND"}`;
}

export default function InvoiceKPICards({ factures, paiements, devis, devise, loading }: Props) {
  const d = devise || "TND";

  const payee = factures.parStatutPaiement?.["PAYEE"] ?? { count: 0, montant: 0 };
  const nonPayee = factures.parStatutPaiement?.["NON_PAYEE"] ?? { count: 0, montant: 0 };
  const partPayee = factures.parStatutPaiement?.["PARTIELLEMENT_PAYEE"] ?? { count: 0, montant: 0 };

  const totalPct = factures.total > 0 ? Math.round((payee.count / factures.total) * 100) : 0;
  const timbreFiscalTotal = factures.montantTotalTimbre ?? factures.total * 1.0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── SECTION 1 : Totaux Financiers Globaux (TTC, HT, TVA, Timbre) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. TOTAL TTC */}
        <div className="relative overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50/50 via-white to-white p-5 shadow-sm dark:border-brand-500/20 dark:from-brand-950/20 dark:via-gray-900 dark:to-gray-900 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
              Total TTC
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Facturé TTC
            </span>
            {loading ? (
              <div className="h-8 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mt-1" />
            ) : (
              <p className="text-2xl lg:text-3xl font-extrabold text-brand-900 dark:text-white mt-0.5 tracking-tight">
                {fmt(factures.montantTotalTTC, d)}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{factures.total}</span> pièces justificatives émises
            </p>
          </div>
        </div>

        {/* 2. TOTAL HT */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Net HT
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Hors Taxes (HT)
            </span>
            {loading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {fmt(factures.montantTotalHT, d)}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Chiffre d'affaires brut imposable
            </p>
          </div>
        </div>

        {/* 3. TOTAL TVA */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              TVA
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total TVA Collectée
            </span>
            {loading ? (
              <div className="h-8 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {fmt(factures.montantTotalTVA, d)}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Montant cumulé des taxes sur factures
            </p>
          </div>
        </div>

        {/* 4. TOTAL TIMBRE FISCAL */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Fiscale
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Timbres Fiscaux
            </span>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {fmt(timbreFiscalTotal, d)}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Droits de timbre fiscaux légaux
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2 : Suivi de Trésorerie & Recouvrement ───────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Encaissé / Payé */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Montant Encaissé (Payé)
                </span>
                <p className="text-xs text-gray-400">
                  {payee.count} factures payées ({totalPct}%)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              {totalPct}%
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {fmt(payee.montant, d)}
              </p>
            )}
          </div>
        </div>

        {/* Impayé / Reste à recouvrer */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Reste à Encaisser (Impayé)
                </span>
                <p className="text-xs text-gray-400">
                  {nonPayee.count + partPayee.count} factures non ou part. payées
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              {100 - totalPct}%
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {fmt(nonPayee.montant + partPayee.montant, d)}
              </p>
            )}
          </div>
        </div>

        {/* Total Règlements / Devis */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Paiements Reçus & Devis
                </span>
                <p className="text-xs text-gray-400">
                  {paiements.total} paiements enregistrés
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              Flux
            </span>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="h-7 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <p className="text-xl font-bold text-gray-800 dark:text-white">
                {fmt(paiements.montantTotal, d)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
