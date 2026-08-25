"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { XIcon } from "./icons";
import { cn } from "@/lib/cn";

type ModalSize = "sm" | "md" | "lg";

const SIZES: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

/**
 * Fenêtre modale premium — light glass, 3D pop-in, piège de focus.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: ModalSize;
  className?: string;
}) {
  const ref = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[90vh] w-full flex-col rounded-t-3xl outline-none animate-modal-in sm:rounded-2xl overflow-hidden",
          "bg-white/95 backdrop-blur-2xl border border-slate-200/80",
          "shadow-[0_0_0_1px_rgba(255,255,255,1),0_40px_100px_rgba(0,0,0,0.1),0_0_60px_rgba(14,165,233,0.1)]",
          SIZES[size],
          className,
        )}
      >
        {/* Top azure accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-azure-500/60 to-transparent pointer-events-none z-10" />
        {/* Top gloss */}
        <div className="absolute top-0 left-0 right-0 h-px bg-white/80 pointer-events-none" />

        {/* Mobile drag handle */}
        <div className="mx-auto mt-3 h-1 w-10 flex-shrink-0 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />

        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-4">
            <div>
              <h2 className="text-[15px] font-bold text-navy-900">{title}</h2>
              {description && (
                <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-slate-100 hover:text-navy-900 hover:border-slate-300 shrink-0"
            >
              <XIcon size={15} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
