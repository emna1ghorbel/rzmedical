"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useExercice, Exercice } from "@/context/ExerciceContext";
import { Dropdown } from "../ui/dropdown/Dropdown";

export default function ExerciceDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { exercices, activeExercice, isAllSelected, selectExercice, loading } = useExercice();

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleSelect = (ex: Exercice | null) => {
    selectExercice(ex);
    closeDropdown();
  };

  const currentLabel = isAllSelected
    ? "Tous les exercices"
    : activeExercice
    ? `Exercice ${activeExercice.annee}`
    : "Exercice";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        title="Changer d'exercice fiscal"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm font-medium transition-all ${
          activeExercice?.isActif
            ? "border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
            : isAllSelected
            ? "border-blue-300 bg-blue-50/70 text-blue-800 hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300"
            : "border-gray-200 bg-gray-50/80 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
        }`}
      >
        {/* Calendar Icon */}
        <svg
          className="h-3.5 w-3.5 flex-shrink-0 text-current opacity-80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>

        <span className="max-w-[70px] truncate font-semibold text-xs whitespace-nowrap sm:max-w-none sm:text-sm">
          {loading ? "Chargement..." : currentLabel}
        </span>

        {activeExercice?.isActif && (
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
            Actif
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-current opacity-60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-2 flex w-[290px] max-w-[calc(100vw-24px)] flex-col rounded-2xl border border-gray-200 bg-white p-2.5 shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-2.5 py-2 border-b border-gray-100 dark:border-gray-800 mb-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
              Exercice Fiscal
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {exercices.length} disponible{exercices.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Filtre automatiquement les factures, devis et numérotations.
          </p>
        </div>

        {/* List of Exercices */}
        <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {exercices.map((ex) => {
            const isSelected = !isAllSelected && activeExercice?.id === ex.id;
            return (
              <button
                key={ex.id}
                onClick={() => handleSelect(ex)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  isSelected
                    ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400 font-semibold"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800/70 text-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      ex.isActif ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>{ex.label || `Exercice ${ex.annee}`}</span>
                      {ex.isActif && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          ACTIF
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                      {new Date(ex.dateDebut).toLocaleDateString("fr-FR")} —{" "}
                      {new Date(ex.dateFin).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <svg
                    className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            );
          })}

          {/* Option: Tous les exercices */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
              isAllSelected
                ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold"
                : "hover:bg-gray-100 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-400"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">🌐</span>
              <div>
                <div className="text-xs font-medium">Tous les exercices</div>
                <div className="text-[10px] text-gray-400">Afficher toutes les données sans filtre</div>
              </div>
            </div>

            {isAllSelected && (
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </button>
        </div>

        {/* Footer: Manage exercices link */}
        <div className="pt-2 mt-1.5 border-t border-gray-100 dark:border-gray-800">
          <Link
            href="/exercices"
            onClick={closeDropdown}
            className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span>⚙️</span> Gérer les exercices fiscaux
            </span>
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
