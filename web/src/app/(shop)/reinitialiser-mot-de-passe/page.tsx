import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reinitialiser mon mot de passe",
  description: "Definissez un nouveau mot de passe pour votre compte RZmedical.",
  robots: { index: false, follow: false },
};

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense>
      <ResetPasswordView />
    </Suspense>
  );
}
