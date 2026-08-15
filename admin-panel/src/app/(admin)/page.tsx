import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import CategoryStats from "@/components/ecommerce/CategoryStats";

export const metadata: Metadata = {
  title: "Tableau de Bord | RZMedical Admin",
  description: "Panneau d'administration de RZMedical",
};

export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Métriques principales */}
      <div className="col-span-12">
        <EcommerceMetrics />
      </div>

      {/* Répartition par catégorie */}
      <div className="col-span-12 xl:col-span-5">
        <CategoryStats />
      </div>

      {/* Produits récents + alertes stock */}
      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}
