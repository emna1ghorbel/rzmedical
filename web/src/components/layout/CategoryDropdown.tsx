"use client";

import { useEffect, useRef, useState } from "react";
import { useCategory } from "@/providers/CategoryProvider";
import type { CategorieListItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "@/components/ui/icons";

interface CategoryDropdownProps {
    isGlass?: boolean;
}

export function CategoryDropdown({ isGlass = false }: CategoryDropdownProps) {
    const { selectedCategory, categories, switchCategory } = useCategory();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const handleSelect = (cat: CategorieListItem) => {
        switchCategory(cat);
        setOpen(false);
    };

    const label = selectedCategory?.nom ?? "Toutes les catégories";

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    "flex items-center gap-3 px-1 py-1.5 border-b-2 transition-colors outline-none",
                    "font-medium text-[13px] tracking-tight uppercase",
                    isGlass
                        ? open
                            ? "border-white text-white"
                            : "border-transparent text-white/80 hover:text-white hover:border-white/50"
                        : open
                            ? "border-navy-900 text-navy-900"
                            : "border-transparent text-slate-600 hover:text-navy-900 hover:border-slate-300"
                )}
            >
                <span className="truncate max-w-[200px]">{label}</span>
                <ChevronDownIcon
                    size={14}
                    strokeWidth={2}
                    className={cn(
                        "transition-transform duration-200",
                        open && "rotate-180"
                    )}
                />
            </button>

            {open && (
                <div
                    role="listbox"
                    className={cn(
                        "absolute left-0 top-full mt-2 z-50 min-w-[240px]",
                        "bg-white border border-slate-200 shadow-sm"
                    )}
                >
                    {categories.map((cat) => {
                        const isActive = cat.id === selectedCategory?.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => handleSelect(cat)}
                                className={cn(
                                    "flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors text-left outline-none",
                                    isActive
                                        ? "bg-slate-50 text-navy-900 font-bold"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-navy-900"
                                )}
                            >
                                <span className="truncate pr-4">{cat.nom}</span>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-navy-900 flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
