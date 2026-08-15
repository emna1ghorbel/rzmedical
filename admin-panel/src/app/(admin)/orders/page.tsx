import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function OrdersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Commandes" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          Gestion des commandes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tableau des commandes à venir...
        </p>
      </div>
    </div>
  );
}
