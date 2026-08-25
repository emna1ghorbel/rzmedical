import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Styles partagés des champs de formulaire (inputs, selects, textarea) et petit
 * conteneur label + indice + message d'erreur. Cohérence visuelle sur les
 * formulaires d'authentification, de commande et de compte.
 */
const FIELD_BASE =
  "w-full rounded-lg border border-border-strong bg-surface text-sm text-navy-900 outline-none transition-colors placeholder:text-faint focus:border-azure-400 focus:ring-2 focus:ring-azure-500/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted";

export const fieldClass = cn(FIELD_BASE, "h-11 px-3.5");
export const textareaClass = cn(FIELD_BASE, "min-h-24 px-3.5 py-2.5 leading-relaxed");

/** Applique l'état d'erreur (bordure/anneau rouges) à un champ. */
export function fieldError(hasError?: boolean): string {
  return hasError
    ? "border-error focus:border-error focus:ring-error/20"
    : "";
}

export function Field({
  label,
  htmlFor,
  hint,
  optional,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-navy-800">
          {label}
        </label>
        {optional ? (
          <span className="text-xs text-faint">Facultatif</span>
        ) : hint ? (
          <span className="text-xs text-faint">{hint}</span>
        ) : null}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
