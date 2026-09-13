import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { TrackingForm } from "@/components/ui/TrackingForm";
import {
  ShieldCheck,
  Zap,
  HeartPulse,
  ThumbsUp,
  Package,
  ClipboardList,
  Truck,
  BarChart3,
  Search,
  Headphones,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { API_URL } from "@/lib/api";

export const metadata: Metadata = {
  title: "À propos | R&Z Medical",
  description: "À propos de R&Z Medical, distributeur de matériel médical à Sfax.",
};

interface PublicStats {
  totalProduits: number;
  totalClients: number;
  totalCommandes: number;
}

async function getPublicStats(): Promise<PublicStats> {
  try {
    const res = await fetch(`${API_URL}/api/stats/public`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("failed");
    return res.json();
  } catch {
    return { totalProduits: 0, totalClients: 0, totalCommandes: 0 };
  }
}

export default async function AboutPage() {
  const stats = await getPublicStats();

  const valeurs = [
    {
      icon: ShieldCheck,
      title: "Fiabilité",
      desc: "Des équipements médicaux aux normes.",
    },
    {
      icon: Zap,
      title: "Rapidité",
      desc: "Une livraison rapide et fiable partout en Tunisie.",
    },
    {
      icon: HeartPulse,
      title: "Qualité",
      desc: "Une sélection stricte des produits que nous distribuons.",
    },
    {
      icon: ThumbsUp,
      title: "Satisfaction client",
      desc: "Un service client toujours à votre écoute.",
    },
  ];

  const chiffres = [
    {
      label: "Clients",
      value: stats.totalClients > 0 ? stats.totalClients : 50,
      sub: "professionnels",
    },
    {
      label: "Produits",
      value: stats.totalProduits > 0 ? stats.totalProduits : 500,
      sub: "disponibles",
    },
    {
      label: "Commandes",
      value: stats.totalCommandes > 0 ? stats.totalCommandes : 1000,
      sub: "livrées",
    },
    {
      label: "Années d'expérience",
      value: 5,
      sub: "dans le domaine",
    },
  ];

  const timeline = [
    {
      step: "01",
      title: "Commande",
      desc: "Passez votre commande via notre plateforme.",
    },
    {
      step: "02",
      title: "Préparation",
      desc: "Nous préparons vos articles dans notre dépôt.",
    },
    {
      step: "03",
      title: "Expédition",
      desc: "Votre commande est remise au transporteur.",
    },
    {
      step: "04",
      title: "Livraison",
      desc: "Vous recevez votre marchandise dans les délais.",
    },
  ];

  const services = [
    { icon: Package, title: "Vente de produits médicaux" },
    { icon: ClipboardList, title: "Gestion des commandes" },
    { icon: Truck, title: "Livraison" },
    { icon: BarChart3, title: "Gestion du stock" },
    { icon: Search, title: "Suivi des commandes" },
    { icon: Headphones, title: "Service client" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* 1. Hero simple */}
      <section className="bg-navy-900 py-16 text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl font-bold">À propos de R&amp;Z Medical</h1>
          <p className="mt-4 text-lg text-slate-300">
            Distributeur de produits et équipements médicaux en Tunisie.
          </p>
        </div>
      </section>

      {/* 2. Présentation */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-navy-900 mb-6">Présentation</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              RZ Medical est une entreprise spécialisée dans la distribution de produits et équipements médicaux, avec une attention particulière portée à la qualité, la disponibilité et la rapidité de livraison.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Basés à Sfax, nous mettons notre expertise au service des professionnels de la santé sur tout le territoire national.
            </p>
          </div>
          <div className="relative h-96 w-full rounded-xl overflow-hidden bg-slate-200">
            <Image 
              src="/images/medical_hero.jpg" 
              alt="Locaux R&Z Medical" 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* 3. Nos valeurs */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-navy-900 mb-10 text-center">Nos valeurs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valeurs.map((v) => (
              <div key={v.title} className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center">
                <v.icon className="w-10 h-10 mx-auto text-azure-600 mb-4" />
                <h3 className="font-bold text-navy-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Nos chiffres */}
      <section className="bg-azure-600 py-16 text-white text-center">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold mb-10">Nos chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {chiffres.map((c) => (
              <div key={c.label}>
                <div className="text-4xl font-bold mb-2">
                  <AnimatedCounter value={c.value} prefix="+" />
                </div>
                <div className="font-semibold">{c.label}</div>
                <div className="text-sm text-blue-100">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Notre fonctionnement */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-navy-900 mb-10 text-center">Notre fonctionnement</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {timeline.map((item) => (
              <div key={item.step} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-azure-600 font-bold text-xl mb-3">{item.step}</div>
                <h3 className="font-bold text-navy-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Nos services */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-navy-900 mb-10 text-center">Nos services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="p-6 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                <s.icon className="w-8 h-8 text-azure-600 shrink-0" />
                <h3 className="font-bold text-navy-900">{s.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Section livraison */}
      <section className="bg-navy-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Livraison</h2>
              <p className="text-slate-300 text-lg">
                Une livraison rapide et fiable partout en Tunisie.
              </p>
            </div>
            
            <div className="bg-navy-800 p-8 rounded-xl border border-navy-700">
              <h3 className="font-bold mb-4">Suivi du colis</h3>
              <TrackingForm />
            </div>
          </div>
        </div>
      </section>

      {/* Contact info & CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold text-navy-900 mb-4">Besoin d'un produit médical ?</h2>
          <p className="text-slate-600 mb-8">Découvrez notre catalogue et passez votre commande.</p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link href="/catalogue" className="bg-azure-600 text-white px-6 py-3 rounded-md font-bold hover:bg-azure-700">
              Voir le catalogue
            </Link>
            <Link href="/contact" className="border border-navy-900 text-navy-900 px-6 py-3 rounded-md font-bold hover:bg-navy-50">
              Nous contacter
            </Link>
          </div>
          
          <div className="flex justify-center gap-8 text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-azure-600" />
              <span>Sfax, Tunisie</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-azure-600" />
              <span>+216 28 113 131</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-azure-600" />
              <span>randzmedical@hotmail.com</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
