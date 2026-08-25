"use client";

import { cn } from "@/lib/cn";
import { MinusIcon, PlusIcon } from "./icons";

type StepperSize = "sm" | "md";

/** Sélecteur de quantité accessible (boutons +/- + saisie directe, bornée). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
  disabled = false,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: StepperSize;
  disabled?: boolean;
  className?: string;
}) {
  const clamp = (n: number) => {
    let v = Math.max(min, Math.floor(n));
    if (typeof max === "number" && max > 0) v = Math.min(max, v);
    return v;
  };

  const atMin = value <= min;
  const atMax = typeof max === "number" && max > 0 && value >= max;

  return (
    <div
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-lg border border-border-strong bg-surface",
        size === "sm" ? "h-9" : "h-11",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Diminuer la quantité"
        onClick={() => onChange(clamp(value - 1))}
        disabled={atMin}
        className="flex w-9 items-center justify-center text-navy-700 transition-colors hover:bg-navy-50 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <MinusIcon size={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Quantité"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isNaN(n)) return;
          onChange(clamp(n));
        }}
        className="w-11 border-x border-border bg-transparent text-center text-sm font-semibold tabular-nums text-navy-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Augmenter la quantité"
        onClick={() => onChange(clamp(value + 1))}
        disabled={atMax}
        className="flex w-9 items-center justify-center text-navy-700 transition-colors hover:bg-navy-50 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
