import type { Metadata } from "next";
import AccueilHub from "@/components/accueil/AccueilHub";

export const metadata: Metadata = {
  title: "Accueil | RZMedical Admin",
  description: "Portail principal des fonctionnalités de gestion RZMedical",
};

export default function RootPage() {
  return <AccueilHub />;
}
