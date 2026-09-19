"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { montantEnLettres, formatTND } from "@/utils/numberToFrenchWords";

export interface CompanyPdfData {
  nomSociete?: string | null;
  matriculeFiscale?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  fax?: string | null;
  email?: string | null;
  banque?: string | null;
  rib?: string | null;
  logoUrl?: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceLine {
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  totalHT: number;
}

export interface InvoiceData {
  numero: string;
  dateEmission: string; // DD/MM/YYYY
  clientNom: string;
  clientMF?: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  lignes: InvoiceLine[];
  timbreFiscal: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 35,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },

  // ── Title ──
  titleSection: {
    marginBottom: 18,
  },
  logo: {
    width: 125,
    height: 90,
    objectFit: "contain",
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  invoiceTitle: {
    marginTop: 76,
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  titleText: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1a5c8a",
    letterSpacing: 2,
  },

  // ── Top two-column boxes ──
  topRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 18,
  },
  brandColumn: {
    width: 0,
    flexGrow: 1,
    flexBasis: "46%",
  },
  infoColumn: {
    width: 0,
    flexGrow: 1,
    flexBasis: "54%",
    gap: 14,
  },
  infoBox: {
    border: "1 solid #4f9bb8",
    padding: 0,
    minHeight: 112,
  },
  boxTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#1a5c8a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    borderBottom: "1 solid #b0c4d8",
    paddingBottom: 4,
  },
  boxLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },
  boxValue: {
    fontSize: 8.5,
    marginBottom: 3,
  },
  invoiceNumRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  invoiceNumLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#1a5c8a",
  },
  invoiceNumValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a5c8a",
  },

  // ── Product table ──
  table: {
    marginBottom: 16,
    border: "1 solid #b0c4d8",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#559fba",
    padding: 7,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#ffffff",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderTop: "1 solid #d9e8f4",
    padding: 5,
    minHeight: 22,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#ffffff",
  },
  tableCellText: {
    fontSize: 8.5,
    textAlign: "center",
  },
  colDesignation: { flex: 3, paddingRight: 4 },
  colQuantite: { flex: 1, textAlign: "center" },
  colPUHT: { flex: 1.5, textAlign: "right" },
  colTVA: { flex: 1, textAlign: "center" },
  colPTHT: { flex: 1.5, textAlign: "right" },

  // ── Totals ──
  totalsSection: {
    alignSelf: "flex-end",
    width: 245,
    marginBottom: 52,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "3 0",
  },
  totalRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "3 0",
  },
  totalLabel: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 8.5,
    textAlign: "right",
    color: "#333",
  },
  totalTTCLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
  },
  totalTTCValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
    textAlign: "right",
  },

  // ── Amount in words ──
  amountWords: {
    padding: 0,
    marginBottom: 24,
  },
  amountWordsText: {
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#111111",
    lineHeight: 1.5,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 20,
    left: 35,
    right: 35,
    borderTop: "1 solid #b0c4d8",
    paddingTop: 8,
    flexDirection: "row",
    gap: 12,
  },
  footerCol: {
    flex: 1,
  },
  footerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#ffffff",
    backgroundColor: "#559fba",
    textAlign: "center",
    padding: 5,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 7.5,
    color: "#555",
    lineHeight: 1.5,
  },
});

// ─── Helper Components ─────────────────────────────────────────────────────────

const TableHeaderCell = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <View style={[style]}>
    <Text style={styles.tableHeaderText}>{children}</Text>
  </View>
);

const TableCell = ({
  children,
  style,
  align = "center",
}: {
  children: React.ReactNode;
  style?: any;
  align?: "left" | "center" | "right";
}) => (
  <View style={[style]}>
    <Text style={[styles.tableCellText, { textAlign: align }]}>{children}</Text>
  </View>
);

// ─── Main Document ─────────────────────────────────────────────────────────────

export function InvoicePdfDocument({
  data,
  company,
}: {
  data: InvoiceData;
  company?: CompanyPdfData | null;
}) {
  const words = montantEnLettres(data.montantTTC);
  const nomSociete = company?.nomSociete || "RZMedical";
  const logoSrc = company?.logoUrl || "/images/logo/logo-rzmedical.png";

  return (
    <Document
      title={`Facture ${data.numero}`}
      author={nomSociete}
      creator={`${nomSociete} Admin`}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Top Row: Billing Info | Client Info ── */}
        <View style={styles.topRow}>
          {/* Left: company identity */}
          <View style={[styles.brandColumn, styles.titleSection]}>
            <Image src={logoSrc} style={styles.logo} />
            <Text style={styles.companyName}>{nomSociete}</Text>
            <Text style={styles.invoiceTitle}>Facture N° {data.numero}</Text>
          </View>

          {/* Right: invoice and client details */}
          <View style={styles.infoColumn}>
            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Informations de facturation</Text>
              <Text style={styles.boxValue}>
                <Text style={styles.boxLabel}>Facture N° </Text>
                {data.numero}
              </Text>
              <Text style={styles.boxValue}>
                <Text style={styles.boxLabel}>Date : </Text>
                {data.dateEmission}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.boxTitle}>Informations du client</Text>
              <Text style={styles.boxValue}>
                <Text style={styles.boxLabel}>Client: </Text>
                {data.clientNom}
              </Text>
              {data.clientMF ? (
                <Text style={styles.boxValue}>
                  <Text style={styles.boxLabel}>M.F: </Text>
                  {data.clientMF}
                </Text>
              ) : null}
              {data.clientAdresse ? (
                <Text style={styles.boxValue}>
                  <Text style={styles.boxLabel}>Adresse: </Text>
                  {data.clientAdresse}
                </Text>
              ) : null}
              {data.clientTelephone ? (
                <Text style={styles.boxValue}>
                  <Text style={styles.boxLabel}>Tél: </Text>
                  {data.clientTelephone}
                </Text>
              ) : null}
              {data.clientEmail ? (
                <Text style={styles.boxValue}>
                  <Text style={styles.boxLabel}>Email: </Text>
                  {data.clientEmail}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Product Table ── */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <TableHeaderCell style={styles.colDesignation}>
              Désignation
            </TableHeaderCell>
            <TableHeaderCell style={styles.colQuantite}>
              Quantité
            </TableHeaderCell>
            <TableHeaderCell style={styles.colPUHT}>P.U.HT</TableHeaderCell>
            <TableHeaderCell style={styles.colTVA}>T.TVA</TableHeaderCell>
            <TableHeaderCell style={styles.colPTHT}>P.T.HT</TableHeaderCell>
          </View>

          {/* Rows */}
          {data.lignes.map((ligne, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <TableCell style={styles.colDesignation} align="left">
                {ligne.designation}
              </TableCell>
              <TableCell style={styles.colQuantite} align="center">
                {Number(ligne.quantite).toLocaleString("fr-FR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 3,
                })}
              </TableCell>
              <TableCell style={styles.colPUHT} align="right">
                {formatTND(Number(ligne.prixUnitaireHT))}
              </TableCell>
              <TableCell style={styles.colTVA} align="center">
                {Number(ligne.tauxTVA)} %
              </TableCell>
              <TableCell style={styles.colPTHT} align="right">
                {formatTND(Number(ligne.totalHT))}
              </TableCell>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>
              {formatTND(data.montantHT)} TND
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>
              {formatTND(data.montantTVA)} TND
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Timbre Fiscal</Text>
            <Text style={styles.totalValue}>
              {formatTND(data.timbreFiscal)} TND
            </Text>
          </View>
          <View style={styles.totalRowLast}>
            <Text style={styles.totalTTCLabel}>Total TTC</Text>
            <Text style={styles.totalTTCValue}>
              {formatTND(data.montantTTC)} TND
            </Text>
          </View>
        </View>

        {/* ── Amount in Words ── */}
        <View style={styles.amountWords}>
          <Text style={styles.amountWordsText}>{words}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <View style={styles.footerCol}>
            <Text style={styles.footerTitle}>{nomSociete}</Text>
            {company?.matriculeFiscale ? (
              <Text style={styles.footerText}>
                M.F {company.matriculeFiscale}
              </Text>
            ) : null}
            {company?.adresse ? (
              <Text style={styles.footerText}>{company.adresse}</Text>
            ) : null}
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerTitle}>Contact</Text>
            {company?.telephone ? (
              <Text style={styles.footerText}>
                Téléphone {company.telephone}
              </Text>
            ) : null}
            {company?.fax ? (
              <Text style={styles.footerText}>Fax {company.fax}</Text>
            ) : null}
            {company?.email ? (
              <Text style={styles.footerText}>
                Email {company.email}
              </Text>
            ) : null}
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerTitle}>Détails bancaires</Text>
            {company?.banque ? (
              <Text style={styles.footerText}>Banque {company.banque}</Text>
            ) : null}
            {company?.rib ? (
              <Text style={styles.footerText}>
                N° de compte{"\n"}{company.rib}
              </Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}
