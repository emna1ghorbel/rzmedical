"use client";
import React from "react";
import { useExercice } from "@/context/ExerciceContext";

export type Periode = "annee" | "annee_precedente" | "mois" | "trimestre" | "custom";

export interface DashboardFilter {
  devise: string;
  periode: Periode;
  dateDebut?: string;
  dateFin?: string;
  exerciceAnnee?: number;
}

interface Props {
  devises: string[];
  value: DashboardFilter;
  onChange: (f: DashboardFilter) => void;
  loading?: boolean;
}

export default function DashboardFilters({ devises, value, onChange, loading }: Props) {
  const { activeExercice } = useExercice();

  const periodeOptions: { val: Periode; label: string }[] = [
    { val: "annee", label: "Année en cours" },
    { val: "annee_precedente", label: "Année précédente" },
    { val: "trimestre", label: "Trimestre en cours" },
    { val: "mois", label: "Mois en cours" },
    { val: "custom", label: "Période personnalisée" },
  ];

  const allDevises = ["", ...Array.from(new Set(devises.filter(Boolean)))];

  const handleExercice = () => {
    if (activeExercice) {
      onChange({ ...value, exerciceAnnee: activeExercice.annee, periode: "annee" });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Exercice actif badge */}
      {activeExercice && (
        <button
          onClick={handleExercice}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value.exerciceAnnee === activeExercice.annee
              ? "bg-brand-500 text-white"
              : "border border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400"
          }`}
        >
          <span className="size-1.5 rounded-full bg-current opacity-70" />
          Exercice {activeExercice.annee}
        </button>
      )}

      {/* Séparateur */}
      {activeExercice && (
        <span className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Période */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Période
        </label>
        <select
          value={value.exerciceAnnee ? "" : value.periode}
          onChange={(e) =>
            onChange({ ...value, periode: e.target.value as Periode, exerciceAnnee: undefined })
          }
          disabled={!!value.exerciceAnnee || loading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 disabled:opacity-50"
        >
          {periodeOptions.map((o) => (
            <option key={o.val} value={o.val}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom date range */}
      {value.periode === "custom" && !value.exerciceAnnee && (
        <>
          <input
            type="date"
            value={value.dateDebut || ""}
            onChange={(e) => onChange({ ...value, dateDebut: e.target.value })}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            value={value.dateFin || ""}
            onChange={(e) => onChange({ ...value, dateFin: e.target.value })}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />
        </>
      )}

      {/* Devise */}
      {allDevises.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Devise
          </label>
          <select
            value={value.devise}
            onChange={(e) => onChange({ ...value, devise: e.target.value })}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 disabled:opacity-50"
          >
            <option value="">Toutes devises</option>
            {devises.filter(Boolean).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reset exercice button */}
      {value.exerciceAnnee && (
        <button
          onClick={() => onChange({ ...value, exerciceAnnee: undefined, periode: "annee" })}
          className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          Réinitialiser
        </button>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          Chargement…
        </div>
      )}
    </div>
  );
}
