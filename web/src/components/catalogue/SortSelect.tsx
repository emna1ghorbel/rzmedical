"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "@/components/ui/icons";

const OPTIONS: { value: string; label: string }[] = [
  { value: "recent", label: "Plus récents" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "nom", label: "Nom (A→Z)" },
  { value: "remise", label: "Meilleures remises" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "recent";

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recent") params.delete("sort");
    else params.set("sort", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="relative">
      <label htmlFor="tri" className="sr-only">
        Trier les produits
      </label>
      <select
        id="tri"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-lg border border-border-strong bg-surface pl-3 pr-9 text-sm font-medium text-navy-800 outline-none transition-colors hover:border-navy-300 focus:border-azure-400 focus:ring-4 focus:ring-azure-500/10"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Trier : {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}
