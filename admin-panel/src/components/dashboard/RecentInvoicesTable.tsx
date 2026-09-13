"use client";
import React from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

interface RecentFacture {
  id: number;
  numero: string;
  clientNom: string;
  dateEmission: string;
  montantTTC: number;
  statut: string;
  statutPaiement: string;
  devise: string;
  etat: string;
}

interface Props {
  factures: RecentFacture[];
  loading: boolean;
}

const STATUT_COLORS: Record<string, "success" | "warning" | "error" | "info"> = {
  VALIDEE: "success",
  ENVOYEE: "info",
  BROUILLON: "warning",
  ANNULEE: "error",
  EMISE: "info",
};

const STATUT_PAIEMENT_COLORS: Record<string, "success" | "warning" | "error"> = {
  PAYEE: "success",
  PARTIELLEMENT_PAYEE: "warning",
  NON_PAYEE: "error",
};

const STATUT_PAIEMENT_LABELS: Record<string, string> = {
  PAYEE: "Payée",
  PARTIELLEMENT_PAYEE: "Part. payée",
  NON_PAYEE: "Non payée",
};

const STATUT_LABELS: Record<string, string> = {
  VALIDEE: "Validée",
  ENVOYEE: "Envoyée",
  BROUILLON: "Brouillon",
  ANNULEE: "Annulée",
  EMISE: "Émise",
};

export default function RecentInvoicesTable({ factures, loading }: Props) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
      </div>
    );
  }

  if (factures.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-400">
        <svg className="h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm">Aucune facture trouvée</span>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
          <TableRow>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
              Numéro
            </TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Client
            </TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
              Date
            </TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">
              Montant TTC
            </TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Statut
            </TableCell>
            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Paiement
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
          {factures.map((f) => (
            <TableRow key={f.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <TableCell className="py-3">
                <Link
                  href={`/invoices/${f.id}`}
                  className="font-mono text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  {f.numero}
                </Link>
              </TableCell>
              <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300 max-w-[160px] truncate">
                {f.clientNom}
              </TableCell>
              <TableCell className="py-3 text-gray-500 text-theme-xs dark:text-gray-400 whitespace-nowrap">
                {new Date(f.dateEmission).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell className="py-3 font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                {Number(f.montantTTC).toLocaleString("fr-TN", {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}{" "}
                {f.devise || "TND"}
              </TableCell>
              <TableCell className="py-3">
                <Badge
                  size="sm"
                  color={STATUT_COLORS[f.statut] || "info"}
                >
                  {STATUT_LABELS[f.statut] || f.statut}
                </Badge>
              </TableCell>
              <TableCell className="py-3">
                <Badge
                  size="sm"
                  color={STATUT_PAIEMENT_COLORS[f.statutPaiement] || "warning"}
                >
                  {STATUT_PAIEMENT_LABELS[f.statutPaiement] || f.statutPaiement}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
