"use client";

import Link from "next/link";
import type { CategorieListItem } from "@/lib/types";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { useCompany } from "@/providers/CompanyProvider";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon
} from "@/components/ui/icons";

export function Footer({ categories }: { categories: CategorieListItem[] }) {
  const topCategories = categories.slice(0, 5);
  const year = new Date().getFullYear();
  const company = useCompany();

  const name = company?.nomSociete || "RZMedical";
  const address = company?.adresse || "Adresse non renseignée";
  const phone = company?.telephone || "28113131";
  const email = company?.email || "randzmedical@outlook.com";

  return (
    <footer className="mt-auto bg-[#0a1120] text-slate-300 border-t border-white/[0.05]">
      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          
          {/* Brand & Social (Spans 4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="max-w-[200px]">
              <Logo tone="light" />
            </div>
            <p className="text-[13px] leading-relaxed text-slate-400 max-w-sm">
              Votre partenaire de confiance pour l'équipement médical et dentaire en Tunisie. Des produits certifiés pour les professionnels exigeants.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[
                { label: "Facebook", href: "https://www.facebook.com/T28113131/", Icon: FacebookIcon },
                { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
                { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedinIcon },
              ].map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group flex h-9 w-9 items-center justify-center rounded border border-slate-700/50 bg-slate-800/30 text-slate-400 transition-all hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Contact (Spans 3 columns) */}
          <div className="lg:col-span-3">
            <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Contact</h3>
            <ul className="space-y-4 text-[13px] text-slate-400">
              <li className="flex items-start gap-3">
                <MapPinIcon size={16} className="mt-0.5 shrink-0 text-azure-400/80" />
                <span className="leading-relaxed">{address}</span>
              </li>
              <li>
                <a href={`tel:+216${phone}`} className="flex items-center gap-3 transition-colors hover:text-white">
                  <PhoneIcon size={16} className="shrink-0 text-azure-400/80" />
                  +216 {phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-3 transition-colors hover:text-white">
                  <MailIcon size={16} className="shrink-0 text-azure-400/80" />
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* Categories (Spans 3 columns) */}
          <div className="lg:col-span-3">
            <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Catégories</h3>
            <ul className="space-y-3">
              {topCategories.map((cat) => (
                <li key={cat.id}>
                  <FooterLink href={`/catalogue?categorieId=${cat.id}`}>{cat.nom}</FooterLink>
                </li>
              ))}
              <li className="pt-2">
                <Link href="/catalogue" className="text-[13px] font-medium text-azure-400 hover:text-azure-300 transition-colors">
                  Voir tout le catalogue &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Mon espace (Spans 2 columns) */}
          <div className="lg:col-span-2">
            <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Espace client</h3>
            <ul className="space-y-3">
              {[
                { href: "/connexion", label: "Se connecter" },
                { href: "/inscription", label: "Créer un compte" },
                { href: "/compte", label: "Mes commandes" },
                { href: "/panier", label: "Mon panier" },
                { href: "/support", label: "Assistance" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.05] bg-[#070c17]">
        <Container className="flex flex-col-reverse items-center justify-between gap-4 py-6 text-[12px] text-slate-500 sm:flex-row">
          <p>© {year} {name}. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/mentions-legales" className="transition-colors hover:text-slate-300">Mentions légales</Link>
            <Link href="/confidentialite" className="transition-colors hover:text-slate-300">Confidentialité</Link>
            <Link href="/cgv" className="transition-colors hover:text-slate-300">CGV</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center text-[13px] text-slate-400 transition-colors hover:text-white"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-white/30 transition-all duration-300 group-hover:w-full" />
      </span>
    </Link>
  );
}
