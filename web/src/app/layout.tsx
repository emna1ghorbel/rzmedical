import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RZMedical — Équipements & consommables médico-dentaires",
    template: "%s · RZMedical",
  },
  description:
    "RZMedical, votre partenaire de confiance en Tunisie pour l'équipement médical et dentaire : matériel professionnel, consommables et instruments de marques reconnues, au meilleur prix.",
  applicationName: "RZMedical",
  keywords: [
    "matériel médical",
    "équipement dentaire",
    "consommables médicaux",
    "instruments dentaires",
    "Tunisie",
    "RZMedical",
  ],
  authors: [{ name: "RZMedical" }],
  openGraph: {
    type: "website",
    locale: "fr_TN",
    siteName: "RZMedical",
    title: "RZMedical — Équipements & consommables médico-dentaires",
    description:
      "Votre partenaire de confiance en Tunisie pour l'équipement médical et dentaire professionnel.",
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0c2340",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
