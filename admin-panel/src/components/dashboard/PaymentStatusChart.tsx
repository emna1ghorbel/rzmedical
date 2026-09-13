"use client";
import React, { useEffect, useRef } from "react";

interface Props {
  data: Record<string, { count: number; montant: number }>;
  title: string;
  loading: boolean;
  colorMap?: Record<string, string>;
  showMontant?: boolean;
  devise?: string;
}

const STATUT_PAIEMENT_LABELS: Record<string, string> = {
  PAYEE: "Payée",
  NON_PAYEE: "Non payée",
  PARTIELLEMENT_PAYEE: "Part. payée",
};

const STATUT_PAIEMENT_COLORS: Record<string, string> = {
  PAYEE: "#10b981",
  NON_PAYEE: "#f43f5e",
  PARTIELLEMENT_PAYEE: "#f59e0b",
};

export default function PaymentStatusChart({ data, title, loading, colorMap, showMontant, devise }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  const hasData = Object.keys(data).length > 0;

  useEffect(() => {
    let isMounted = true;

    if (loading || !hasData || typeof window === "undefined") {
      return;
    }

    const entries = Object.entries(data);
    const labels = entries.map(([k]) => colorMap ? k : (STATUT_PAIEMENT_LABELS[k] || k));
    const series = entries.map(([, v]) => showMontant ? Math.round(v.montant) : v.count);
    const colors = entries.map(([k]) => (colorMap || STATUT_PAIEMENT_COLORS)[k] || "#6366f1");

    const options = {
      chart: {
        type: "donut",
        height: 280,
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 500 },
      },
      series,
      labels,
      colors,
      legend: {
        position: "bottom",
        fontSize: "12px",
        labels: { colors: ["#6b7280"] },
        markers: { size: 8, shape: "circle" },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: {
                show: true,
                label: showMontant ? `Total (${devise || "TND"})` : "Total Factures",
                fontSize: "11px",
                color: "#9ca3af",
                formatter: () => {
                  const total = entries.reduce(
                    (acc, [, v]) => acc + (showMontant ? v.montant : v.count),
                    0,
                  );
                  return showMontant
                    ? total.toLocaleString("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : total.toString();
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${Math.round(val)}%`,
        dropShadow: { enabled: false },
      },
      stroke: { width: 2, colors: ["#fff"] },
      tooltip: {
        y: {
          formatter: (val: number) =>
            showMontant
              ? `${val.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} ${devise || "TND"}`
              : `${val} factures`,
        },
      },
      responsive: [{ breakpoint: 480, options: { chart: { height: 250 }, legend: { position: "bottom" } } }],
    };

    import("apexcharts").then(({ default: ApexCharts }) => {
      if (!isMounted || !chartRef.current || !document.body.contains(chartRef.current)) {
        return;
      }

      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
        } catch (_) {}
        chartInstance.current = null;
      }

      try {
        if (chartRef.current) {
          chartRef.current.innerHTML = "";
          chartInstance.current = new ApexCharts(chartRef.current, options);
          chartInstance.current.render();
        }
      } catch (e) {
        console.warn("PaymentStatusChart render error:", e);
      }
    });

    return () => {
      isMounted = false;
      if (chartInstance.current) {
        try {
          chartInstance.current.destroy();
        } catch (_) {}
        chartInstance.current = null;
      }
    };
  }, [data, loading, colorMap, showMontant, devise, hasData]);

  return (
    <div className="relative min-h-[280px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] dark:bg-gray-900/70">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      )}

      {!loading && !hasData && (
        <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-gray-400">
          <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm">Aucune donnée</span>
        </div>
      )}

      <div
        ref={chartRef}
        style={{ display: !loading && hasData ? "block" : "none" }}
      />
    </div>
  );
}
