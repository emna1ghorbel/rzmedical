import type { ComponentType } from "react";
import { Container } from "@/components/ui/Container";
import {
  CreditCardIcon,
  HeadsetIcon,
  ShieldCheckIcon,
  TruckIcon,
  type IconProps,
} from "@/components/ui/icons";

const FEATURES: {
  icon: ComponentType<IconProps>;
  title: string;
  text: string;
  gradient: string;
  glow: string;
}[] = [
  {
    icon: TruckIcon,
    title: "Livraison rapide",
    text: "Expédition 24–48h partout en Tunisie",
    gradient: "from-azure-50 to-white",
    glow: "rgba(14,165,233,0.15)",
  },
  {
    icon: ShieldCheckIcon,
    title: "Produits certifiés",
    text: "Matériel conforme et traçable",
    gradient: "from-emerald-50 to-white",
    glow: "rgba(18,183,106,0.15)",
  },
  {
    icon: HeadsetIcon,
    title: "Support expert",
    text: "Une équipe à votre écoute",
    gradient: "from-violet-50 to-white",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    icon: CreditCardIcon,
    title: "Paiement flexible",
    text: "À la livraison ou par virement",
    gradient: "from-amber-50 to-white",
    glow: "rgba(245,158,11,0.15)",
  },
];

/** Bandeau de réassurance premium 3D light. */
export function FeatureStrip() {
  return (
    <section className="relative bg-white border-b border-slate-200/60 select-none overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 grid-pattern opacity-[0.1] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-slate-50/50 to-white/0 pointer-events-none" />

      <Container className="relative py-10 lg:py-14">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text, gradient, glow }, i) => (
            <li
              key={title}
              className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 cursor-default transition-all duration-400 hover:-translate-y-[3px] hover:border-azure-200 hover:shadow-md overflow-hidden"
              style={{
                animationDelay: `${i * 60}ms`,
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              {/* Top gloss */}
              <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80 pointer-events-none" />

              {/* Hover glow blob */}
              <span
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: glow }}
              />

              {/* Icon orb */}
              <span
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} border border-slate-200 transition-all duration-300 group-hover:scale-[1.08] group-hover:border-azure-200`}
                style={{ boxShadow: `0 4px 12px ${glow}, inset 0 1px 0 rgba(255,255,255,1)` }}
              >
                <Icon size={22} className="text-slate-600 group-hover:text-azure-600 transition-colors duration-200" />
              </span>

              {/* Text */}
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-navy-900 group-hover:text-azure-700 transition-colors duration-200">
                  {title}
                </span>
                <span className="mt-1 block text-[12px] leading-snug text-slate-500 group-hover:text-slate-600 transition-colors duration-200">
                  {text}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
