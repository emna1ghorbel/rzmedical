"use client";
import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

interface Invoice {
  id: number;
  numero: string;
  dateEmission: string;
  clientNom: string;
  montantTTC: number;
  statut: "BROUILLON" | "EMISE" | "ANNULEE";
  fichierPdf: string | null;
  commande: {
    id: number;
  };
}

export default function InvoicesPage() {
  const { getToken } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Non authentifié");
      const res = await fetch(`${API_URL}/invoices/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des factures");
      const data = await res.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const getStatusBadgeColor = (statut: string) => {
    switch (statut) {
      case "BROUILLON": return "light";
      case "EMISE": return "success";
      case "ANNULEE": return "error";
      default: return "light";
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Factures" />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button onClick={fetchInvoices} className="ml-3 underline font-medium">Réessayer</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
              <TableRow>
                <TableCell isHeader>N° Facture</TableCell>
                <TableCell isHeader>Date</TableCell>
                <TableCell isHeader>Commande</TableCell>
                <TableCell isHeader>Client</TableCell>
                <TableCell isHeader>Total TTC</TableCell>
                <TableCell isHeader>Statut</TableCell>
                <TableCell isHeader className="text-right">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Chargement des factures...</TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Aucune facture trouvée.</TableCell></TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-800/30">
                    <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                      {invoice.numero}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(invoice.dateEmission).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      #{invoice.commande.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-800 dark:text-gray-200">
                      {invoice.clientNom}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {invoice.montantTTC.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TND
                    </TableCell>
                    <TableCell>
                      <Badge color={getStatusBadgeColor(invoice.statut) as any}>
                        {invoice.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.fichierPdf && (
                          <a
                            href={`${API_URL.replace('/api', '')}${invoice.fichierPdf}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            ↓ Télécharger PDF
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
