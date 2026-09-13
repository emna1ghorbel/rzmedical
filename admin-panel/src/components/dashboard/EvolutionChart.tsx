"use client";
import React, { useEffect, useRef } from "react";

interface EvolutionPoint {
  mois: string;
  montantFactures: number;
  montantPaiements: number;
}

interface Props {
  data: EvolutionPoint[];
  loading: boolean;
  devise?: string;
}

function moisLabel(m: string) {
  const [year, month] = m.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export default function EvolutionChart({ data, loading, devise }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  const hasData = data && data.length > 0;

  useEffect(() => {
    let isMounted = true;

    if (loading || !hasData || typeof window === "undefined") return;

    const categories = data.map((d) => moisLabel(d.mois));
    const seriesFactures = data.map((d) => Math.round(d.montantFactures * 1000) / 1000);
    const seriesPaiements = data.map((d) => Math.round(d.montantPaiements * 1000) / 1000);

    const options = {
      chart: {
        type: "area",
        height: 320,
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 600 },
        zoom: { enabled: false },
      },
      series: [
        { name: "Factures émises", data: seriesFactures },
        { name: "Paiements reçus", data: seriesPaiements },
      ],
      colors: ["#6366f1", "#10b981"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      stroke: { curve: "smooth", width: 2 },
      xaxis: {
        categories,
        labels: {
          style: { colors: "#9ca3af", fontSize: "11px" },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#9ca3af", fontSize: "11px" },
          formatter: (val: number) =>
            val >= 1000
              ? `${(val / 1000).toFixed(0)}k`
              : val.toLocaleString("fr-TN", { maximumFractionDigits: 0 }),
        },
      },
      grid: {
        borderColor: "#f3f4f6",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
      },
      tooltip: {
        y: {
          formatter: (val: number) =>
            `${val.toLocaleString("fr-TN", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${devise || "TND"}`,
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        fontSize: "12px",
        labels: { colors: "#6b7280" },
        markers: { size: 8, shape: "circle" },
      },
      dataLabels: { enabled: false },
      markers: {
        size: 3,
        strokeWidth: 2,
        hover: { size: 5 },
      },
    };

    import("apexcharts").then(({ default: ApexCharts }) => {
      if (!isMounted || !chartRef.current || !document.body.contains(chartRef.current)) return;

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
        console.warn("EvolutionChart render error:", e);
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
  }, [data, loading, devise, hasData]);

  return (
    <div className="relative min-h-[320px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] dark:bg-gray-900/70">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      )}

      {!loading && !hasData && (
        <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-gray-400">
          <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <span className="text-sm">Aucune donnée d'évolution</span>
        </div>
      )}

      <div
        ref={chartRef}
        style={{ display: !loading && hasData ? "block" : "none", minHeight: 320 }}
      />
    </div>
  );
}
