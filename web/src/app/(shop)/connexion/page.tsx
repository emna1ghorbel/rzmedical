import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre compte RZmedical pour accéder à vos commandes et à vos tarifs personnalisés.",
  robots: { index: false, follow: true },
};

export default function ConnexionPage() {
  return (
    <Suspense>
      <AuthView mode="login" />
    </Suspense>
  );
}
