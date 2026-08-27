"use client";

import { createContext, useContext, ReactNode } from "react";
import type { InfoSociete } from "@/lib/types";

const CompanyContext = createContext<InfoSociete | null>(null);

export function CompanyProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: InfoSociete | null;
}) {
  return (
    <CompanyContext.Provider value={initialData}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
