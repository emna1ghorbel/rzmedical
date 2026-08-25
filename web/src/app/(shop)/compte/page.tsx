import type { Metadata } from "next";
import { AccountView } from "@/components/account/AccountView";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Gérez votre profil et suivez vos commandes RZmedical.",
  robots: { index: false, follow: false },
};

export default function ComptePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccountView />
    </Suspense>
  );
}
