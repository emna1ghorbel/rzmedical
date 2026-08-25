import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Commande",
  description: "Finalisez votre commande RZmedical en toute sécurité.",
  robots: { index: false, follow: false },
};

export default function CommandePage() {
  return <CheckoutView />;
}
