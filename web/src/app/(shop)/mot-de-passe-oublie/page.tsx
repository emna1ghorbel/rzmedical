import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";

export const metadata: Metadata = {
  title: "Mot de passe oublie",
  description: "Reinitalisez votre mot de passe RZmedical.",
  robots: { index: false, follow: false },
};

export default function MotDePasseOubliePage() {
  return (
    <Suspense>
      <ForgotPasswordView />
    </Suspense>
  );
}
