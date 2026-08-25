import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Panier",
  description: "Votre panier RZmedical.",
  robots: { index: false, follow: true },
};

export default function PanierPage() {
  return <CartView />;
}
