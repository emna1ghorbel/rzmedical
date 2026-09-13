"use client";
import React, { useEffect, useRef } from "react";

interface Props {
  statutData: Record<string, { count: number; montant: number }>;
  etatData: Record<string, { count: number; montant: number }>;
  loading: boolean;
}

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  EMISE: "Émise",
  VALIDEE: "Validée",
  ENVOYEE: "Envoyée",
  ANNULEE: "Annulée",
};

const ETAT_LABELS: Record<string, string> = {
  NORMALE: "Normale",
  PROFORMA: "Proforma",
  AVOIR: "Avoir",
};

const STATUT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#f43f5e"];

export default function InvoiceStatusChart({ statutData, etatData, loading }: Props) {
  const statutChartRef = useRef<HTMLDivElement>(null);
  const etatChartRef = useRef<HTMLDivElement>(null);
  const statutChartInstance = useRef<any>(null);
  const etatChartInstance = useRef<any>(null);

  const hasStatutData = Object.keys(statutData).length > 0;
  const hasEtatData = Object.keys(etatData).length > 0;

  useEffect(() => {
    let isMounted = true;

    if (loading || typeof window === "undefined") return;

    const makeBar = (
      ref: React.RefObject<HTMLDivElement | null>,
      instanceRef: React.MutableRefObject<any>,
      data: Record<string, { count: number; montant: number }>,
      labels: Record<string, string>,
    ) => {
      const entries = Object.entries(data);
      if (entries.length === 0) return;

      const categories = entries.map(([k]) => labels[k] || k);
      const counts = entries.map(([, v]) => v.count);

      const options = {
        chart: {
          type: "bar",
          height: 200,
          fontFamily: "Inter, sans-serif",
          toolbar: { show: false },
          animations: { enabled: true, easing: "easeinout", speed: 500 },
        },
        series: [{ name: "Factures", data: counts }],
        colors: STATUT_COLORS,
        plotOptions: {
          bar: {
            borderRadius: 6,
            columnWidth: "55%",
            distributed: true,
            dataLabels: { position: "top" },
          },
        },
        dataLabels: {
          enabled: true,
          offsetY: -18,
          style: { fontSize: "11px", colors: ["#6b7280"], fontWeight: "600" },
        },
        xaxis: {
          categories,
          labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: { style: { colors: "#9ca3af", fontSize: "11px" } },
          min: 0,
        },
        grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
        legend: { show: false },
        tooltip: {
          y: { formatter: (val: number) => `${val} factures` },
        },
      };

      import("apexcharts").then(({ default: ApexCharts }) => {
        if (!isMounted || !ref.current || !document.body.contains(ref.current)) return;

        if (instanceRef.current) {
          try {
            instanceRef.current.destroy();
          } catch (_) {}
          instanceRef.current = null;
        }

        try {
          if (ref.current) {
            ref.current.innerHTML = "";
            instanceRef.current = new ApexCharts(ref.current, options);
            instanceRef.current.render();
          }
        } catch (e) {
          console.warn("InvoiceStatusChart render error:", e);
        }
      });
    };

    if (hasStatutData) {
      makeBar(statutChartRef, statutChartInstance, statutData, STATUT_LABELS);
    }
    if (hasEtatData) {
      makeBar(etatChartRef, etatChartInstance, etatData, ETAT_LABELS);
    }

    return () => {
      isMounted = false;
      if (statutChartInstance.current) {
        try {
          statutChartInstance.current.destroy();
        } catch (_) {}
        statutChartInstance.current = null;
      }
      if (etatChartInstance.current) {
        try {
          etatChartInstance.current.destroy();
        } catch (_) {}
        etatChartInstance.current = null;
      }
    };
  }, [statutData, etatData, loading, hasStatutData, hasEtatData]);

  const EmptyPlaceholder = () => (
    <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-gray-400">
      <svg className="h-9 w-9 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span className="text-xs">Aucune donnée</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Statuts facture */}
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Statuts des factures
        </h3>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[1px] dark:bg-gray-900/70">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
          </div>
        )}
        {!loading && !hasStatutData && <EmptyPlaceholder />}
        <div
          ref={statutChartRef}
          style={{ display: !loading && hasStatutData ? "block" : "none", minHeight: 200 }}
        />
      </div>

      {/* États facture */}
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Types de factures
        </h3>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[1px] dark:bg-gray-900/70">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
          </div>
        )}
        {!loading && !hasEtatData && <EmptyPlaceholder />}
        <div
          ref={etatChartRef}
          style={{ display: !loading && hasEtatData ? "block" : "none", minHeight: 200 }}
        />
      </div>
    </div>
  );
}
