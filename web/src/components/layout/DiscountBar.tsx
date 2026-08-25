"use client";

import { useAuth } from "@/providers/AuthProvider";
import { PercentIcon } from "@/components/ui/icons";

export function DiscountBar() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user || !user.remise || user.remise <= 0) {
    return null;
  }

  return (
    <div className="w-full bg-emerald-50 border-b border-emerald-200">
      <div className="mx-auto flex min-h-[36px] max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8 text-center">
        <p className="flex items-center justify-center gap-2 text-[12px] font-semibold text-emerald-800">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700">
            <PercentIcon size={12} strokeWidth={2.5} />
          </span>
          Vous bénéficiez d&apos;une remise permanente de {user.remise}% sur tout notre catalogue !
        </p>
      </div>
    </div>
  );
}
