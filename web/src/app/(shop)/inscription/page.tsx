import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte RZmedical pour commander votre matériel médical et dentaire et suivre vos livraisons.",
  robots: { index: false, follow: true },
};

export default function InscriptionPage() {
  return (
    <Suspense>
      <AuthView mode="register" />
    </Suspense>
  );
}
