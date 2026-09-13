"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface FeatureCard {
  id: string;
  title: string;
  category: "pilotage" | "ventes" | "achats" | "catalogue" | "tiers" | "config";
  categoryLabel: string;
  description: string;
  path: string;
  badge?: string;
  badgeColor?: string;
  colorScheme: {
    bg: string;
    text: string;
    borderHover: string;
    accent: string;
  };
  icon: React.ReactNode;
  shortcutLabel?: string;
}

export default function AccueilHub() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Toutes les fonctionnalités" },
    { id: "pilotage", label: "Pilotage & Finances" },
    { id: "ventes", label: "Ventes & Facturation" },
    { id: "achats", label: "Achats & Approvisionnement" },
    { id: "catalogue", label: "Catalogue & Stocks" },
    { id: "tiers", label: "Tiers & Clients" },
    { id: "config", label: "Configuration & Outils" },
  ];

  const cards: FeatureCard[] = [
    {
      id: "dashboard",
      title: "Tableau de Bord",
      category: "pilotage",
      categoryLabel: "Pilotage",
      description: "Indicateurs financiers en temps réel, chiffre d'affaires, statistiques factures et paiements.",
      path: "/dashboard",
      badge: "Temps réel",
      badgeColor: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
      colorScheme: {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        text: "text-indigo-600 dark:text-indigo-400",
        borderHover: "hover:border-indigo-400 dark:hover:border-indigo-600",
        accent: "bg-indigo-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      shortcutLabel: "Accéder au dashboard",
    },
    {
      id: "invoices",
      title: "Factures Clients",
      category: "ventes",
      categoryLabel: "Ventes",
      description: "Création et suivi des factures, TVA, timbres fiscaux, règlements et gestion des statuts de paiement.",
      path: "/invoices",
      badge: "Essentiel",
      badgeColor: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      colorScheme: {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-600 dark:text-blue-400",
        borderHover: "hover:border-blue-400 dark:hover:border-blue-600",
        accent: "bg-blue-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      shortcutLabel: "Gérer les factures",
    },
    {
      id: "bons-livraison",
      title: "Bons de Livraison",
      category: "ventes",
      categoryLabel: "Logistique",
      description: "Émission des BL, suivi logistique des expéditions et transformation directe en factures clients.",
      path: "/bons-livraison",
      badge: "Nouveau",
      badgeColor: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
      colorScheme: {
        bg: "bg-purple-50 dark:bg-purple-950/40",
        text: "text-purple-600 dark:text-purple-400",
        borderHover: "hover:border-purple-400 dark:hover:border-purple-600",
        accent: "bg-purple-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      shortcutLabel: "Gérer les BL",
    },
    {
      id: "devis",
      title: "Devis Clients",
      category: "ventes",
      categoryLabel: "Commercial",
      description: "Élaboration des devis médicaux, calcul automatique des remises et conversion en BL ou facture.",
      path: "/devis",
      badge: "Chiffrage",
      badgeColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      colorScheme: {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-600 dark:text-emerald-400",
        borderHover: "hover:border-emerald-400 dark:hover:border-emerald-600",
        accent: "bg-emerald-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      shortcutLabel: "Consulter les devis",
    },
    {
      id: "avoirs",
      title: "Avoirs Clients",
      category: "ventes",
      categoryLabel: "Facturation",
      description: "Gestion des factures d'avoir, rectifications comptables, retours de matériel et remboursements.",
      path: "/avoirs",
      colorScheme: {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-600 dark:text-amber-400",
        borderHover: "hover:border-amber-400 dark:hover:border-amber-600",
        accent: "bg-amber-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      shortcutLabel: "Gérer les avoirs",
    },
    {
      id: "orders",
      title: "Ventes & Commandes",
      category: "ventes",
      categoryLabel: "Ventes",
      description: "Suivi des commandes en ligne, préparation des colis, statuts d'expédition et facturation.",
      path: "/orders",
      colorScheme: {
        bg: "bg-rose-50 dark:bg-rose-950/40",
        text: "text-rose-600 dark:text-rose-400",
        borderHover: "hover:border-rose-400 dark:hover:border-rose-600",
        accent: "bg-rose-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      shortcutLabel: "Voir les commandes",
    },
    {
      id: "factures-fournisseurs",
      title: "Factures Fournisseurs",
      category: "achats",
      categoryLabel: "Achats",
      description: "Gestion des factures fournisseurs, suivi des paiements, règlements et dettes envers les fournisseurs.",
      path: "/factures-fournisseurs",
      badge: "Achats",
      badgeColor: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
      colorScheme: {
        bg: "bg-orange-50 dark:bg-orange-950/40",
        text: "text-orange-600 dark:text-orange-400",
        borderHover: "hover:border-orange-400 dark:hover:border-orange-600",
        accent: "bg-orange-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      shortcutLabel: "Voir les factures fournisseurs",
    },
    {
      id: "bons-commande",
      title: "Bons de Commande",
      category: "achats",
      categoryLabel: "Achats",
      description: "Commandes auprès des fournisseurs pour réapprovisionner le stock.",
      path: "/bons-commande",
      colorScheme: {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        text: "text-indigo-600 dark:text-indigo-400",
        borderHover: "hover:border-indigo-400 dark:hover:border-indigo-600",
        accent: "bg-indigo-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      shortcutLabel: "Créer un BC",
    },
    {
      id: "bons-reception",
      title: "Bons de Réception",
      category: "achats",
      categoryLabel: "Achats",
      description: "Réception de marchandises, contrôle des quantités, et mise à jour automatique des stocks.",
      path: "/bons-reception",
      colorScheme: {
        bg: "bg-teal-50 dark:bg-teal-950/40",
        text: "text-teal-600 dark:text-teal-400",
        borderHover: "hover:border-teal-400 dark:hover:border-teal-600",
        accent: "bg-teal-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
        </svg>
      ),
      shortcutLabel: "Gérer les réceptions",
    },
    {
      id: "stocks",
      title: "Stocks & Produits",
      category: "catalogue",
      categoryLabel: "Catalogue",
      description: "Gestion des stocks, articles médicaux, références, prix d'achat, prix de vente et alertes de rupture.",
      path: "/products",
      badge: "Stock",
      badgeColor: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
      colorScheme: {
        bg: "bg-cyan-50 dark:bg-cyan-950/40",
        text: "text-cyan-600 dark:text-cyan-400",
        borderHover: "hover:border-cyan-400 dark:hover:border-cyan-600",
        accent: "bg-cyan-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      shortcutLabel: "Consulter l'inventaire",
    },
    {
      id: "categories",
      title: "Catégories & Gammes",
      category: "catalogue",
      categoryLabel: "Catalogue",
      description: "Classification des équipements médicaux, sous-catégories, marques partenaires et ordre d'affichage.",
      path: "/categories",
      colorScheme: {
        bg: "bg-teal-50 dark:bg-teal-950/40",
        text: "text-teal-600 dark:text-teal-400",
        borderHover: "hover:border-teal-400 dark:hover:border-teal-600",
        accent: "bg-teal-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      shortcutLabel: "Gérer les catégories",
    },
    {
      id: "achats",
      title: "Achats & Dépenses",
      category: "pilotage",
      categoryLabel: "Finances",
      description: "Suivi des dépenses globales, approvisionnements fournisseurs et calcul des marges d'exploitation.",
      path: "/dashboard",
      colorScheme: {
        bg: "bg-orange-50 dark:bg-orange-950/40",
        text: "text-orange-600 dark:text-orange-400",
        borderHover: "hover:border-orange-400 dark:hover:border-orange-600",
        accent: "bg-orange-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      shortcutLabel: "Suivre les dépenses",
    },
    {
      id: "tresorerie",
      title: "Trésorerie & Règlements",
      category: "pilotage",
      categoryLabel: "Finances",
      description: "Encaissements, gestion des paiements reçus (espèces, virements), soldes impayés et créances.",
      path: "/invoices",
      badge: "Finance",
      badgeColor: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
      colorScheme: {
        bg: "bg-green-50 dark:bg-green-950/40",
        text: "text-green-600 dark:text-green-400",
        borderHover: "hover:border-green-400 dark:hover:border-green-600",
        accent: "bg-green-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      shortcutLabel: "Suivre les règlements",
    },
    {
      id: "tiers",
      title: "Tiers & Clients Facturation",
      category: "tiers",
      categoryLabel: "Tiers",
      description: "Clients sans compte créés au cours des factures, cliniques, médecins et historique financier.",
      path: "/tiers",
      badge: "Facturation",
      badgeColor: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
      colorScheme: {
        bg: "bg-sky-50 dark:bg-sky-950/40",
        text: "text-sky-600 dark:text-sky-400",
        borderHover: "hover:border-sky-400 dark:hover:border-sky-600",
        accent: "bg-sky-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      shortcutLabel: "Répertoire des tiers",
    },
    {
      id: "fournisseurs",
      title: "Fournisseurs",
      category: "tiers",
      categoryLabel: "Tiers",
      description: "Gestion des fournisseurs médicaux, coordonnées, délais de paiement, RIB et contacts.",
      path: "/fournisseurs",
      badge: "Partenaires",
      badgeColor: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      colorScheme: {
        bg: "bg-amber-50 dark:bg-amber-950/40",
        text: "text-amber-600 dark:text-amber-400",
        borderHover: "hover:border-amber-400 dark:hover:border-amber-600",
        accent: "bg-amber-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      shortcutLabel: "Gérer les fournisseurs",
    },
    {
      id: "contrats",
      title: "Contrats Clients",
      category: "tiers",
      categoryLabel: "Commercial",
      description: "Accords-cadres avec les établissements de santé, conventions tarifaires et remises contractuelles.",
      path: "/customers",
      colorScheme: {
        bg: "bg-violet-50 dark:bg-violet-950/40",
        text: "text-violet-600 dark:text-violet-400",
        borderHover: "hover:border-violet-400 dark:hover:border-violet-600",
        accent: "bg-violet-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      shortcutLabel: "Consulter les conventions",
    },
    {
      id: "exercices",
      title: "Exercices Fiscaux",
      category: "ventes",
      categoryLabel: "Comptabilité",
      description: "Gestion des années comptables, clôture d'exercice et numérotation séquentielle des factures.",
      path: "/exercices",
      colorScheme: {
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        text: "text-emerald-600 dark:text-emerald-400",
        borderHover: "hover:border-emerald-400 dark:hover:border-emerald-600",
        accent: "bg-emerald-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      shortcutLabel: "Paramétrer les exercices",
    },
    {
      id: "exports",
      title: "États et Export",
      category: "pilotage",
      categoryLabel: "Rapports",
      description: "Extraction des journaux de vente, exports des factures PDF, récapitulatifs pour l'expert-comptable.",
      path: "/invoices",
      colorScheme: {
        bg: "bg-pink-50 dark:bg-pink-950/40",
        text: "text-pink-600 dark:text-pink-400",
        borderHover: "hover:border-pink-400 dark:hover:border-pink-600",
        accent: "bg-pink-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      shortcutLabel: "Exporter les pièces",
    },
    {
      id: "admins",
      title: "Gestion des Utilisateurs",
      category: "config",
      categoryLabel: "Sécurité",
      description: "Comptes d'administration, attribution des rôles, sécurité des accès et historique des connexions.",
      path: "/admins",
      colorScheme: {
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        text: "text-indigo-600 dark:text-indigo-400",
        borderHover: "hover:border-indigo-400 dark:hover:border-indigo-600",
        accent: "bg-indigo-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      shortcutLabel: "Gérer les accès",
    },
    {
      id: "config",
      title: "Configuration Fiscale",
      category: "config",
      categoryLabel: "Système",
      description: "Taux de TVA paramétrables, valeur du timbre fiscal, coordonnées légales de la société RZMedical.",
      path: "/configuration",
      badge: "Système",
      badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      colorScheme: {
        bg: "bg-slate-100 dark:bg-slate-800/60",
        text: "text-slate-700 dark:text-slate-300",
        borderHover: "hover:border-slate-400 dark:hover:border-slate-600",
        accent: "bg-slate-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      shortcutLabel: "Modifier les paramètres",
    },
    {
      id: "services",
      title: "Autres Outils & Services",
      category: "config",
      categoryLabel: "Services",
      description: "Catalogue des prestations de service facturables, maintenance de matériel médical et assistance.",
      path: "/configuration/services",
      colorScheme: {
        bg: "bg-teal-50 dark:bg-teal-950/40",
        text: "text-teal-600 dark:text-teal-400",
        borderHover: "hover:border-teal-400 dark:hover:border-teal-600",
        accent: "bg-teal-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      shortcutLabel: "Gérer les prestations",
    },
    {
      id: "support",
      title: "Support & Assistance",
      category: "config",
      categoryLabel: "Communication",
      description: "Messages de contact, tickets d'assistance des professionnels de santé et requêtes clients.",
      path: "/support",
      colorScheme: {
        bg: "bg-blue-50 dark:bg-blue-950/40",
        text: "text-blue-600 dark:text-blue-400",
        borderHover: "hover:border-blue-400 dark:hover:border-blue-600",
        accent: "bg-blue-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      shortcutLabel: "Voir les demandes",
    },
    {
      id: "site-content",
      title: "Contenu du Site Web",
      category: "config",
      categoryLabel: "Boutique",
      description: "Bannières d'accueil, bandeaux promotionnels et alertes d'information sur la vitrine publique.",
      path: "/site-content",
      colorScheme: {
        bg: "bg-violet-50 dark:bg-violet-950/40",
        text: "text-violet-600 dark:text-violet-400",
        borderHover: "hover:border-violet-400 dark:hover:border-violet-600",
        accent: "bg-violet-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      shortcutLabel: "Éditer le contenu web",
    },
    {
      id: "ancien-dashboard",
      title: "Statistiques E-Commerce",
      category: "pilotage",
      categoryLabel: "Pilotage",
      description: "Métriques produits, commandes récentes de la boutique en ligne et performance des catégories.",
      path: "/ancien-dashboard",
      colorScheme: {
        bg: "bg-gray-100 dark:bg-gray-800/60",
        text: "text-gray-700 dark:text-gray-300",
        borderHover: "hover:border-gray-400 dark:hover:border-gray-600",
        accent: "bg-gray-500",
      },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      shortcutLabel: "Voir les statistiques boutique",
    },
  ];

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchCategory = activeCategory === "all" || card.category === activeCategory;
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.categoryLabel.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [cards, activeCategory, searchTerm]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── En-tête de bienvenue ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-brand-50/20 to-white p-6 md:p-8 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900/80 dark:to-gray-950">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 mb-3 border border-brand-200/50 dark:border-brand-500/20">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              Système de Gestion RZMedical
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Accueil RZMedical
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Sélectionnez une fonctionnalité pour y accéder directement. Toutes les opérations de vente, facturation, logistique et paramétrage sont regroupées ici.
            </p>
          </div>

          {/* Raccourcis de création rapide */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle Facture
            </Link>
            <Link
              href="/bons-livraison"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-750"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau BL
            </Link>
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-all hover:shadow hover:-translate-y-0.5 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-750"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Devis
            </Link>
          </div>
        </div>

        {/* Effet d'arrière plan subtil */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-400/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Barre de recherche et Filtres par catégorie ──────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filtres par catégories (pilules) */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm font-semibold"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Recherche instantanée */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une fonctionnalité..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 transition-all"
          />
          <svg
            className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* ── Compteur de résultats ───────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>
          {filteredCards.length} module{filteredCards.length > 1 ? "s" : ""} disponible{filteredCards.length > 1 ? "s" : ""}
          {searchTerm ? ` pour "${searchTerm}"` : ""}
        </span>
        <span className="text-gray-400">Cliquez sur une carte pour ouvrir la section</span>
      </div>

      {/* ── Grille de cartes professionnelles ─────────────────────────────── */}
      {filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-white/[0.02]">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Aucune fonctionnalité trouvée</p>
          <p className="text-xs text-gray-500 mt-1">Essayez un autre mot-clé ou réinitialisez les filtres.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setActiveCategory("all");
            }}
            className="mt-4 px-4 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
          >
            Réinitialiser
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filteredCards.map((card) => {
            return (
              <Link
                key={card.id}
                href={card.path}
                className={`group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${card.colorScheme.borderHover} dark:border-gray-800 dark:bg-gray-900/60 dark:hover:bg-gray-900`}
              >
                <div>
                  {/* Haut de la carte : Icône + Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.colorScheme.bg} ${card.colorScheme.text} transition-transform duration-200 group-hover:scale-110`}
                    >
                      {card.icon}
                    </div>

                    {card.badge && (
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          card.badgeColor || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>

                  {/* Titre & Description */}
                  <div className="mb-4">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {card.categoryLabel}
                    </span>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex items-center gap-1.5 mt-0.5">
                      {card.title}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Bas de la carte : Lien d'action + Flèche */}
                <div className="pt-3 mt-auto border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span className="group-hover:underline">
                    {card.shortcutLabel || "Accéder au module"}
                  </span>
                  <svg
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
