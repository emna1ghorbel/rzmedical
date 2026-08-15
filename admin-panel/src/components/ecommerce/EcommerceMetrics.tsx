"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { BoxIconLine, GroupIcon } from "@/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Stats {
  totalProduits: number;
  totalCategories: number;
  totalMarques: number;
  totalSousCategories: number;
  produitsDisponibles: number;
  produitsRupture: number;
}

export const EcommerceMetrics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/stats/overview`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const MetricCard = ({ icon, label, value, sub, subColor }: {
    icon: React.ReactNode; label: string; value: string | number;
    sub?: string; subColor?: "success" | "error" | "warning";
  }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        {icon}
      </div>
      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? <span className="animate-pulse">...</span> : value}
          </h4>
        </div>
        {sub && subColor && (
          <Badge color={subColor} size="sm">{sub}</Badge>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      <MetricCard
        icon={<BoxIconLine className="text-gray-800 dark:text-white/90" />}
        label="Total Produits"
        value={stats?.totalProduits ?? 0}
        sub={stats?.produitsRupture ? `${stats.produitsRupture} en rupture` : undefined}
        subColor="error"
      />
      <MetricCard
        icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        label="Catégories"
        value={stats?.totalCategories ?? 0}
        sub={stats?.totalSousCategories ? `${stats.totalSousCategories} sous-catégories` : undefined}
        subColor="success"
      />
      <MetricCard
        icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        label="Marques"
        value={stats?.totalMarques ?? 0}
        sub={stats?.produitsDisponibles ? `${stats.produitsDisponibles} produits actifs` : undefined}
        subColor="success"
      />
    </div>
  );
};
