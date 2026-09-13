"use client";

import React, { useState, useRef, useEffect } from "react";

export interface SearchableSelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | number;
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  placement?: "auto" | "top" | "bottom";
  showSelectedSublabel?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Rechercher...",
  className = "",
  size = "md",
  placement = "auto",
  showSelectedSublabel = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (placement === "top") {
        setOpenUpward(true);
      } else if (placement === "bottom") {
        setOpenUpward(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // Si l'espace en bas est inférieur à 260px, on ouvre vers le haut
        setOpenUpward(spaceBelow < 260);
      }

      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [isOpen, placement]);

  const filteredOptions = options.filter((opt) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const matchLabel = opt.label.toLowerCase().includes(term);
    const matchSublabel = opt.sublabel
      ? opt.sublabel.toLowerCase().includes(term)
      : false;
    return matchLabel || matchSublabel;
  });

  const isSmall = size === "sm";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch("");
        }}
        className={`w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition select-none ${
          isSmall
            ? "px-2.5 py-1.5 text-xs"
            : "px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
        } ${isOpen ? "ring-2 ring-amber-500 border-transparent" : ""}`}
      >
        <div className="truncate flex-1">
          {selectedOption ? (
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedOption.label}
              {showSelectedSublabel && selectedOption.sublabel && (
                <span className="text-gray-400 dark:text-gray-500 ml-1.5 text-xs font-normal">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400 italic">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-1 text-gray-400 shrink-0">
          {value !== "" && value !== 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              title="Effacer"
              className="hover:text-red-500 text-xs px-1"
            >
              ✕
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div
          className={`absolute z-[999] min-w-[280px] w-full rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in zoom-in-95 duration-100 max-h-64 flex flex-col ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className="px-2 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-gray-400 text-xs">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Taper pour filtrer..."
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 mt-1 max-h-48 divide-y divide-gray-50 dark:divide-gray-800/40">
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-xs text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer italic"
            >
              -- Aucun --
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 text-xs cursor-pointer flex flex-col transition-colors ${
                      isSelected
                        ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 font-semibold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <span className="text-amber-600 text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    {opt.sublabel && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-gray-400 italic">
                Aucun résultat trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
