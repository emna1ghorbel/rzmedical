"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/utils/api";

const API_URL = getApiUrl();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyInfo {
  id: number;
  nomSociete: string;
  logoUrl: string | null;
  matriculeFiscale: string | null;
  telephone: string | null;
  fax: string | null;
  email: string | null;
  adresse: string | null;
  siteWeb: string | null;
  banque: string | null;
  rib: string | null;
  valeursTva: number[];
  valeursTimbre: number[];
  tauxFrais: number | null;
  timbreFiscal: number | null;
}

interface CompanyInfoContextType {
  companyInfo: CompanyInfo | null;
  /** Taux TVA disponibles triés, ex: [0, 7, 13, 19] */
  tvaRates: number[];
  /** Valeurs timbre fiscal disponibles triées, ex: [0, 1] */
  timbreRates: number[];
  /** Valeur timbre fiscal par défaut (premier de la liste ou 0) */
  defaultTimbre: number;
  /** Taux TVA par défaut (premier de la liste ou 0) */
  defaultTva: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const CompanyInfoContext = createContext<CompanyInfoContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CompanyInfoProvider({ children }: { children: React.ReactNode }) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanyInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/company-info`);
      if (!res.ok) throw new Error("Failed to fetch company info");
      const data: CompanyInfo = await res.json();

      // Normaliser les tableaux Decimal retournés par Prisma (peuvent être des strings)
      data.valeursTva = Array.isArray(data.valeursTva)
        ? data.valeursTva.map(Number).sort((a, b) => a - b)
        : [];
      data.valeursTimbre = Array.isArray(data.valeursTimbre)
        ? data.valeursTimbre.map(Number).sort((a, b) => a - b)
        : [];

      setCompanyInfo(data);
    } catch (err) {
      console.warn("CompanyInfoContext: could not load company info", err);
      // Garder companyInfo à null — les composants afficheront un état vide
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  // Valeurs dérivées
  const tvaRates = companyInfo?.valeursTva ?? [];
  const timbreRates = companyInfo?.valeursTimbre ?? [];
  const defaultTimbre =
    companyInfo?.timbreFiscal != null
      ? Number(companyInfo.timbreFiscal)
      : timbreRates.length > 0
      ? timbreRates[timbreRates.length - 1]
      : 0;
  const defaultTva =
    tvaRates.includes(19)
      ? 19
      : tvaRates.length > 0
      ? tvaRates[tvaRates.length - 1]
      : 0;

  return (
    <CompanyInfoContext.Provider
      value={{
        companyInfo,
        tvaRates,
        timbreRates,
        defaultTimbre,
        defaultTva,
        isLoading,
        refresh: fetchCompanyInfo,
      }}
    >
      {children}
    </CompanyInfoContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCompanyInfo(): CompanyInfoContextType {
  const ctx = useContext(CompanyInfoContext);
  if (!ctx) {
    throw new Error("useCompanyInfo must be used within a CompanyInfoProvider");
  }
  return ctx;
}
