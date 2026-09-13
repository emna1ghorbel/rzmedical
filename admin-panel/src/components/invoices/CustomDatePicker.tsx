"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

interface CustomDatePickerProps {
  value: string; // Format "YYYY-MM-DD"
  minDate?: string; // Format "YYYY-MM-DD" or ISO string
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAY_NAMES_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CustomDatePicker({
  value,
  minDate,
  onChange,
  label,
  required,
  className = "",
  disabled = false,
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalise la date minimale en YYYY-MM-DD
  const cleanMinDate = useMemo(() => {
    if (!minDate) return "";
    return minDate.split("T")[0].trim();
  }, [minDate]);

  // Normalise la valeur actuelle en YYYY-MM-DD
  const cleanValue = useMemo(() => {
    if (!value) return "";
    return value.split("T")[0].trim();
  }, [value]);

  // Année et mois visualisés dans le calendrier
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (cleanValue) {
      const y = parseInt(cleanValue.split("-")[0], 10);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (cleanValue) {
      const m = parseInt(cleanValue.split("-")[1], 10) - 1;
      if (!isNaN(m) && m >= 0 && m <= 11) return m;
    }
    return new Date().getMonth();
  });

  // Synchronise le mois affiché lors de l'ouverture ou du changement de valeur
  useEffect(() => {
    const target = cleanValue || cleanMinDate || todayISO();
    const parts = target.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
        setCurrentYear(y);
        setCurrentMonth(m);
      }
    }
  }, [cleanValue, cleanMinDate, open]);

  // Fermer le calendrier en cliquant à l'extérieur
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Déterminer si le mois précédent est autorisé par rapport à minDate
  const isPrevMonthDisabled = useMemo(() => {
    if (!cleanMinDate) return false;
    const [minY, minM] = cleanMinDate.split("-").map(Number);
    if (!minY || !minM) return false;
    const minMonthIndex = minM - 1;
    return currentYear < minY || (currentYear === minY && currentMonth <= minMonthIndex);
  }, [cleanMinDate, currentYear, currentMonth]);

  const prevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Calcul des jours du mois
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  // En France / ISO, Lundi = 0, Dimanche = 6
  const firstDayIndex = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [firstDayIndex, daysInMonth]);

  // Vérifie si un jour donné est désactivé (< cleanMinDate)
  const isDateDisabled = (day: number) => {
    if (!cleanMinDate) return false;
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${currentYear}-${m}-${d}`;
    return dateStr < cleanMinDate;
  };

  const isDateSelected = (day: number) => {
    if (!cleanValue) return false;
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${currentYear}-${m}-${d}`;
    return dateStr === cleanValue;
  };

  const isDateToday = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${currentYear}-${m}-${d}`;
    return dateStr === todayISO();
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${currentYear}-${m}-${d}`;
    onChange(dateStr);
    setOpen(false);
  };

  // Format affichage texte (ex: "07/09/2026")
  const formattedDisplay = useMemo(() => {
    if (!cleanValue) return "";
    const parts = cleanValue.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return cleanValue;
  }, [cleanValue]);

  const formattedMinDate = useMemo(() => {
    if (!cleanMinDate) return "";
    const parts = cleanMinDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return cleanMinDate;
  }, [cleanMinDate]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input bar avec bouton calendrier intégré et cliquable */}
      <div
        onClick={() => {
          if (!disabled) setOpen(prev => !prev);
        }}
        className={`flex items-center justify-between w-full rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer select-none
          ${
            disabled
              ? "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
              : open
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-amber-400"
          }
        `}
      >
        <div className="flex items-center gap-2">
          <span className={formattedDisplay ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}>
            {formattedDisplay || "Sélectionner une date..."}
          </span>
          {cleanMinDate && (
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
              Min: {formattedMinDate}
            </span>
          )}
        </div>

        {/* Bouton calendrier dédié avec icône */}
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setOpen(prev => !prev);
          }}
          title="Ouvrir le calendrier pour choisir une date"
          aria-label="Ouvrir le calendrier"
          className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {/* Pop-up Calendrier customisé */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] p-4 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header du calendrier : Mois / Année & Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isPrevMonthDisabled}
              title={isPrevMonthDisabled ? "Mois antérieur à la date minimale bloqué" : "Mois précédent"}
              className={`p-1.5 rounded-lg border transition-colors ${
                isPrevMonthDisabled
                  ? "opacity-25 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400"
                  : "hover:bg-amber-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 cursor-pointer"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center font-bold text-sm text-gray-900 dark:text-white capitalize">
              {MONTH_NAMES_FR[currentMonth]} {currentYear}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              title="Mois suivant"
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-amber-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* En-têtes des jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_NAMES_FR.map((d) => (
              <div key={d} className="text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="w-9 h-9" />;
              }

              const disabledDay = isDateDisabled(day);
              const selectedDay = isDateSelected(day);
              const todayDay = isDateToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  title={
                    disabledDay
                      ? `Date désactivée (antérieure à la dernière facture : ${formattedMinDate})`
                      : `Choisir le ${String(day).padStart(2, "0")}/${String(currentMonth + 1).padStart(2, "0")}/${currentYear}`
                  }
                  className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition-all select-none
                    ${
                      disabledDay
                        ? "text-gray-300 dark:text-gray-600 bg-gray-50/70 dark:bg-gray-900/30 cursor-not-allowed line-through opacity-40"
                        : selectedDay
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold scale-105"
                        : todayDay
                        ? "text-amber-700 dark:text-amber-400 font-bold border border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                        : "text-gray-700 dark:text-gray-200 hover:bg-amber-100/70 dark:hover:bg-gray-700 hover:text-amber-800 dark:hover:text-amber-300 cursor-pointer"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Pied de calendrier : information & raccourcis */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
            {cleanMinDate && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="text-amber-600 font-bold">ℹ️</span>
                Dates antérieures au <strong className="text-gray-700 dark:text-gray-200">{formattedMinDate}</strong> désactivées.
              </p>
            )}

            <div className="flex items-center justify-between gap-2">
              {todayISO() >= cleanMinDate ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange(todayISO());
                    setOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  Aujourd'hui
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
