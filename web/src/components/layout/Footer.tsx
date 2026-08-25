"use client";

import Link from "next/link";
import type { CategorieListItem } from "@/lib/types";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { NewsletterForm } from "./NewsletterForm";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TruckIcon,
  HeadsetIcon,
  CreditCardIcon,
} from "@/components/ui/icons";

const COMPANY_INFO = {
  name: "R and Z Medical",
  taxId: "1742623LAM000",
  address: "23 Rue Salem Harzallah, Imm Echafai, 2 eme etage",
  city: "3000, Sfax, Tunisie",
  phone: "28113131",
  email: "randzmedical@outlook.com",
} as const;

const FEATURES = [
  {
    icon: TruckIcon,
    title: "Livraison en Tunisie",
    text: "Expédition rapide sur tout le territoire",
    glow: "rgba(14,165,233,0.3)",
    gradient: "from-azure-500/20 to-azure-500/5",
    iconColor: "text-azure-400",
  },
  {
    icon: ShieldCheckIcon,
    title: "Produits certifiés",
    text: "Matériel médical & dentaire d'origine",
    glow: "rgba(18,183,106,0.3)",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: HeadsetIcon,
    title: "Conseil expert",
    text: "Une équipe à votre écoute",
    gradient: "from-violet-500/20 to-violet-500/5",
    glow: "rgba(139,92,246,0.3)",
    iconColor: "text-violet-400",
  },
  {
    icon: CreditCardIcon,
    title: "Paiement flexible",
    text: "À la livraison ou par virement",
    gradient: "from-amber-500/20 to-amber-500/5",
    glow: "rgba(245,158,11,0.3)",
    iconColor: "text-amber-400",
  },
];

export function Footer({ categories }: { categories: CategorieListItem[] }) {
  const topCategories = categories.slice(0, 6);
  const year = 2026;

  return (
    <footer className="mt-auto relative overflow-hidden bg-navy-960">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-azure-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* === Feature strip === */}
      <div className="relative border-b border-white/[0.06]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <Container className="grid grid-cols-1 gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text, gradient, glow, iconColor }) => (
            <div
              key={title}
              className="group flex items-start gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} border border-white/10 transition-all duration-300 group-hover:scale-105`}
                style={{ boxShadow: `0 4px 16px ${glow}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
              >
                <Icon size={20} className={iconColor} />
              </span>
              <div>
                <p className="text-[13px] font-bold text-white">{title}</p>
                <p className="mt-0.5 text-[11px] text-navy-200/80 leading-snug">{text}</p>
              </div>
            </div>
          ))}
        </Container>
      </div>

      {/* === Main columns === */}
      <Container className="grid grid-cols-2 gap-8 py-14 md:grid-cols-4 lg:grid-cols-5 relative">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 text-[13px] font-bold text-white">{COMPANY_INFO.name}</p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-navy-200/80">
            RZmedical, votre partenaire de confiance pour l&apos;équipement médical et
            dentaire en Tunisie. Des produits sélectionnés pour leur qualité et
            leur fiabilité.
          </p>

          {/* Social icons */}
          <div className="mt-6 flex items-center gap-2.5">
            {[
              { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
              { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
              { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedinIcon },
            ].map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-navy-200 transition-all hover:bg-azure-500/20 hover:text-azure-400 hover:border-azure-400/30"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <FooterHeading>Catégories</FooterHeading>
          <ul className="space-y-3 text-[13px]">
            {topCategories.map((cat) => (
              <li key={cat.id}>
                <FooterLink href={`/catalogue?categorieId=${cat.id}`}>
                  {cat.nom}
                </FooterLink>
              </li>
            ))}
            <li>
              <FooterLink href="/catalogue">Tous les produits →</FooterLink>
            </li>
          </ul>
        </div>

        {/* Mon espace */}
        <div>
          <FooterHeading>Mon espace</FooterHeading>
          <ul className="space-y-3 text-[13px]">
            {[
              { href: "/connexion", label: "Se connecter" },
              { href: "/inscription", label: "Créer un compte" },
              { href: "/compte", label: "Mes commandes" },
              { href: "/panier", label: "Mon panier" },
              { href: "/catalogue?promo=1", label: "Promotions" },
            ].map(({ href, label }) => (
              <li key={href}>
                <FooterLink href={href}>{label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <FooterHeading>Contact</FooterHeading>
          <ul className="space-y-4 text-[13px]">
            <li className="flex items-start gap-3 text-navy-200/80">
              <MapPinIcon size={16} className="mt-0.5 shrink-0 text-azure-400" />
              <span>{COMPANY_INFO.address}<br />{COMPANY_INFO.city}</span>
            </li>
            <li>
              <a
                href={`tel:+216${COMPANY_INFO.phone}`}
                className="flex items-start gap-3 text-navy-200/80 transition-colors hover:text-white group"
              >
                <PhoneIcon size={16} className="mt-0.5 shrink-0 text-azure-400 group-hover:text-azure-300 transition-colors" />
                +216 {COMPANY_INFO.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="flex items-start gap-3 text-navy-200/80 transition-colors hover:text-white group"
              >
                <MailIcon size={16} className="mt-0.5 shrink-0 text-azure-400 group-hover:text-azure-300 transition-colors" />
                {COMPANY_INFO.email}
              </a>
            </li>
            <li>
              <FooterLink href="/support">Support client</FooterLink>
            </li>
          </ul>
        </div>
      </Container>

      {/* === Newsletter === */}
      <div className="relative border-t border-white/[0.06] bg-navy-900/30">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <Container className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[15px] font-bold text-white">
              Restez informé de nos nouveautés
            </p>
            <p className="mt-1 text-[13px] text-navy-200/80">
              Recevez nos offres et arrivages directement par e-mail.
            </p>
          </div>
          <div className="w-full max-w-md">
            <NewsletterForm />
          </div>
        </Container>
      </div>

      {/* === Bottom bar === */}
      <div className="relative border-t border-white/[0.06] bg-navy-950">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-[12px] text-navy-300 sm:flex-row">
          <p>© {year} RZmedical. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-navy-400">Matériel médical & dentaire · Tunisie</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-navy-200 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-[11px] font-semibold"
            >
              Retour en haut ↑
            </button>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-5 text-[11px] font-black uppercase tracking-[0.15em] text-azure-400">
      {children}
    </h3>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-navy-200/80 transition-colors hover:text-azure-400 relative inline-flex items-center gap-1 group"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-azure-400 transition-all duration-300 group-hover:w-full" />
      </span>
    </Link>
  );
}
