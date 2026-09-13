"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

export interface Fournisseur {
  id: number;
  nom: string;
  contactNom?: string | null;
  contactPrenom?: string | null;
  email?: string | null;
  telephone?: string | null;
  telephone2?: string | null;
  adresse?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  pays?: string | null;
  matriculeFiscale?: string | null;
  registreCommerce?: string | null;
  categorie?: string | null;
  delaiPaiement?: string | null;
  modePaiement?: string | null;
  rib?: string | null;
  banque?: string | null;
  siteWeb?: string | null;
  notes?: string | null;
  actif: boolean;
  creeLe: string;
}

interface StatsData {
  total: number;
  actifs: number;
  inactifs: number;
  parCategorie: { categorie: string; count: number }[];
}

const CATEGORIES_FOURNISSEUR = [
  "Consommables médicaux",
  "Équipements & Appareils",
  "Réactifs & Laboratoire",
  "Maintenance & SAV",
  "Mobilier médical",
  "Médicaments & Pharmacie",
  "Informatique & Logiciels",
  "Autre",
];

const DELAIS_PAIEMENT = [
  "Comptant à la livraison",
  "30 jours fin de mois",
  "60 jours",
  "90 jours",
  "50% commande / 50% livraison",
  "Autre",
];

const MODES_PAIEMENT = [
  "Virement bancaire",
  "Chèque",
  "Traite",
  "Espèces",
  "Prélèvement",
];

export default function FournisseursPage() {
  const { getToken } = useAuth();

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    contactNom: "",
    contactPrenom: "",
    email: "",
    telephone: "",
    telephone2: "",
    adresse: "",
    ville: "",
    codePostal: "",
    pays: "Tunisie",
    matriculeFiscale: "",
    registreCommerce: "",
    categorie: "",
    delaiPaiement: "30 jours fin de mois",
    modePaiement: "Virement bancaire",
    rib: "",
    banque: "",
    siteWeb: "",
    notes: "",
    actif: true,
  });

  const fetchFournisseurs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("actif", statusFilter);
      if (categoryFilter !== "ALL") params.set("categorie", categoryFilter);

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/fournisseurs?${params.toString()}`, { headers }),
        fetch(`${API_URL}/fournisseurs/stats`, { headers }),
      ]);

      if (!resList.ok) {
        throw new Error("Erreur lors du chargement des fournisseurs.");
      }

      const listData = await resList.json();
      const statsData = resStats.ok ? await resStats.json() : null;

      setFournisseurs(listData);
      if (statsData) setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de récupérer les fournisseurs.");
    } finally {
      setLoading(false);
    }
  }, [getToken, search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchFournisseurs();
  }, [fetchFournisseurs]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedFournisseur(null);
    setFormError(null);
    setFormData({
      nom: "",
      contactNom: "",
      contactPrenom: "",
      email: "",
      telephone: "",
      telephone2: "",
      adresse: "",
      ville: "",
      codePostal: "",
      pays: "Tunisie",
      matriculeFiscale: "",
      registreCommerce: "",
      categorie: CATEGORIES_FOURNISSEUR[0],
      delaiPaiement: DELAIS_PAIEMENT[1],
      modePaiement: MODES_PAIEMENT[0],
      rib: "",
      banque: "",
      siteWeb: "",
      notes: "",
      actif: true,
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (f: Fournisseur) => {
    setIsEditing(true);
    setSelectedFournisseur(f);
    setFormError(null);
    setFormData({
      nom: f.nom || "",
      contactNom: f.contactNom || "",
      contactPrenom: f.contactPrenom || "",
      email: f.email || "",
      telephone: f.telephone || "",
      telephone2: f.telephone2 || "",
      adresse: f.adresse || "",
      ville: f.ville || "",
      codePostal: f.codePostal || "",
      pays: f.pays || "Tunisie",
      matriculeFiscale: f.matriculeFiscale || "",
      registreCommerce: f.registreCommerce || "",
      categorie: f.categorie || CATEGORIES_FOURNISSEUR[0],
      delaiPaiement: f.delaiPaiement || DELAIS_PAIEMENT[1],
      modePaiement: f.modePaiement || MODES_PAIEMENT[0],
      rib: f.rib || "",
      banque: f.banque || "",
      siteWeb: f.siteWeb || "",
      notes: f.notes || "",
      actif: f.actif,
    });
    setShowFormModal(true);
  };

  const handleOpenDetail = (f: Fournisseur) => {
    setSelectedFournisseur(f);
    setShowDetailModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      setFormError("Le nom de l'entreprise est obligatoire.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = isEditing
        ? `${API_URL}/fournisseurs/${selectedFournisseur?.id}`
        : `${API_URL}/fournisseurs`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de l'enregistrement.");
      }

      setShowFormModal(false);
      fetchFournisseurs();
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${nom}" ?`)) {
      return;
    }

    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/fournisseurs/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la suppression.");
      }

      fetchFournisseurs();
    } catch (err: any) {
      alert(err.message || "Impossible de supprimer ce fournisseur.");
    }
  };

  const handleToggleActif = async (f: Fournisseur) => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API_URL}/fournisseurs/${f.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ actif: !f.actif }),
      });

      fetchFournisseurs();
    } catch (err) {
      console.error(err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (fournisseurs.length === 0) return;
    const headers = ["Nom", "Contact", "Email", "Telephone", "Ville", "MF", "Categorie", "Statut"];
    const rows = fournisseurs.map((f) => [
      `"${(f.nom || "").replace(/"/g, '""')}"`,
      `"${([f.contactPrenom, f.contactNom].filter(Boolean).join(" ")).replace(/"/g, '""')}"`,
      `"${(f.email || "").replace(/"/g, '""')}"`,
      `"${(f.telephone || "").replace(/"/g, '""')}"`,
      `"${(f.ville || "").replace(/"/g, '""')}"`,
      `"${(f.matriculeFiscale || "").replace(/"/g, '""')}"`,
      `"${(f.categorie || "").replace(/"/g, '""')}"`,
      `"${f.actif ? "Actif" : "Inactif"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fournisseurs_rzmedical_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── En-tête de page ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Fournisseurs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {stats?.total ?? fournisseurs.length} au total
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestion des partenaires, fabricants médicaux, distributeurs et conditions de règlement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter CSV
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition-all hover:shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau Fournisseur
          </button>
        </div>
      </div>

      {/* ── Cartes Statistiques ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Fournisseurs
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.total ?? 0}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Entreprises enregistrées
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Fournisseurs Actifs
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.actifs ?? 0}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Partenaires opérationnels
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Fournisseurs Inactifs
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-700 dark:text-gray-300">
            {stats?.inactifs ?? 0}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Comptes suspendus ou archivés
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Catégories de Fournitures
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats?.parCategorie?.length ?? 0}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Domaines de prestations
          </p>
        </div>
      </div>

      {/* ── Filtres & Recherche ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, contact, tél, MF, ville..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 transition-all"
            />
            <svg
              className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="ALL">Toutes les catégories</option>
            {CATEGORIES_FOURNISSEUR.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Pilules de statut */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "ALL"
                ? "bg-brand-500 text-white font-semibold shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setStatusFilter("true")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "true"
                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            Actifs
          </button>
          <button
            onClick={() => setStatusFilter("false")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "false"
                ? "bg-gray-600 text-white font-semibold shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            Inactifs
          </button>
        </div>
      </div>

      {/* ── Table des Fournisseurs ──────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des fournisseurs...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <p>{error}</p>
            <button
              onClick={() => fetchFournisseurs()}
              className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
            >
              Réessayer
            </button>
          </div>
        ) : fournisseurs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-800 dark:text-white">Aucun fournisseur trouvé</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Commencez par ajouter votre premier fournisseur médical ou modifiez vos critères de recherche.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un Fournisseur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 dark:border-gray-800 dark:bg-gray-800/40 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4">Fournisseur</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Coordonnées</th>
                  <th className="py-3.5 px-4">Catégorie</th>
                  <th className="py-3.5 px-4">Fiscalité</th>
                  <th className="py-3.5 px-4">Règlement</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {fournisseurs.map((f) => {
                  const contactFull = [f.contactPrenom, f.contactNom].filter(Boolean).join(" ");
                  return (
                    <tr
                      key={f.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Fournisseur */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold text-xs uppercase">
                            {f.nom.substring(0, 2)}
                          </div>
                          <div>
                            <div>{f.nom}</div>
                            {f.ville && (
                              <div className="text-xs text-gray-400 font-normal">
                                {f.ville}, {f.pays || "Tunisie"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                        {contactFull || <span className="text-gray-400 text-xs">—</span>}
                      </td>

                      {/* Coordonnées */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          {f.telephone && (
                            <div className="text-gray-800 dark:text-gray-200 font-medium">
                              📞 {f.telephone}
                            </div>
                          )}
                          {f.email && (
                            <div className="text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                              ✉️ {f.email}
                            </div>
                          )}
                          {!f.telephone && !f.email && <span className="text-gray-400">—</span>}
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3.5 px-4">
                        {f.categorie ? (
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {f.categorie}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Matricule Fiscale */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          {f.matriculeFiscale ? (
                            <div className="font-mono text-gray-700 dark:text-gray-300">
                              MF: {f.matriculeFiscale}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {f.registreCommerce && (
                            <div className="text-gray-400 text-[11px]">
                              RC: {f.registreCommerce}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Modalité règlement */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <div>{f.delaiPaiement || "30j"}</div>
                          {f.modePaiement && (
                            <div className="text-[11px] text-gray-400">
                              {f.modePaiement}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Statut (Cliquable pour basculer) */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActif(f)}
                          title="Cliquez pour changer le statut"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                            f.actif
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              f.actif ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          {f.actif ? "Actif" : "Inactif"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(f)}
                            title="Voir la fiche détaillée"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(f)}
                            title="Modifier"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(f.id, f.nom)}
                            title="Supprimer"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL : Nouveau / Modifier Fournisseur ──────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditing ? `Modifier : ${selectedFournisseur?.nom}` : "Ajouter un Fournisseur"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-sm">
                  {formError}
                </div>
              )}

              {/* Section : Informations générales */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-3">
                  1. Identification de l'entreprise
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Nom du Fournisseur / Raison Sociale *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      placeholder="Ex: MediTech Tunisie SARL"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Catégorie de fournitures
                    </label>
                    <select
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    >
                      {CATEGORIES_FOURNISSEUR.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Matricule Fiscale (MF)
                    </label>
                    <input
                      type="text"
                      value={formData.matriculeFiscale}
                      onChange={(e) => setFormData({ ...formData, matriculeFiscale: e.target.value })}
                      placeholder="Ex: 1234567/A/M/000"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Registre de Commerce (RC)
                    </label>
                    <input
                      type="text"
                      value={formData.registreCommerce}
                      onChange={(e) => setFormData({ ...formData, registreCommerce: e.target.value })}
                      placeholder="Ex: B01234562024"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Site Internet
                    </label>
                    <input
                      type="text"
                      value={formData.siteWeb}
                      onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section : Contact */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-3">
                  2. Personne de contact & Coordonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Prénom du contact
                    </label>
                    <input
                      type="text"
                      value={formData.contactPrenom}
                      onChange={(e) => setFormData({ ...formData, contactPrenom: e.target.value })}
                      placeholder="Ex: Mohamed"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Nom du contact
                    </label>
                    <input
                      type="text"
                      value={formData.contactNom}
                      onChange={(e) => setFormData({ ...formData, contactNom: e.target.value })}
                      placeholder="Ex: Ben Ali"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Téléphone principal
                    </label>
                    <input
                      type="text"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      placeholder="Ex: +216 71 000 000"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Téléphone secondaire / Mobile
                    </label>
                    <input
                      type="text"
                      value={formData.telephone2}
                      onChange={(e) => setFormData({ ...formData, telephone2: e.target.value })}
                      placeholder="Ex: +216 98 000 000"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@fournisseur.com"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section : Adresse */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-3">
                  3. Adresse & Localisation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Adresse postale
                    </label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      placeholder="Rue, Zone industrielle, Bâtiment..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      placeholder="Tunis, Sfax, Sousse..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Code Postal
                    </label>
                    <input
                      type="text"
                      value={formData.codePostal}
                      onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                      placeholder="Ex: 1002"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Pays
                    </label>
                    <input
                      type="text"
                      value={formData.pays}
                      onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section : Modalités de paiement */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-3">
                  4. Conditions financières & Paiement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Délai de paiement
                    </label>
                    <select
                      value={formData.delaiPaiement}
                      onChange={(e) => setFormData({ ...formData, delaiPaiement: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    >
                      {DELAIS_PAIEMENT.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Mode de règlement préféré
                    </label>
                    <select
                      value={formData.modePaiement}
                      onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    >
                      {MODES_PAIEMENT.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Banque
                    </label>
                    <input
                      type="text"
                      value={formData.banque}
                      onChange={(e) => setFormData({ ...formData, banque: e.target.value })}
                      placeholder="Ex: BIAT, Attijari, BNA..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Relevé d'Identité Bancaire (RIB)
                    </label>
                    <input
                      type="text"
                      value={formData.rib}
                      onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                      placeholder="20 chiffres du RIB..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Notes & Statut */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Notes internes & Conditions particulières
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Remarques, contacts d'astreinte, remises conventionnées..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="actifCheck"
                      checked={formData.actif}
                      onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label htmlFor="actifCheck" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Fournisseur actif (disponible pour les commandes et approvisionnements)
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer boutons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm disabled:opacity-50 transition-colors"
                >
                  {saving ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Créer le Fournisseur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL : Fiche Détails Fournisseur ───────────────────────────── */}
      {showDetailModal && selectedFournisseur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-bold text-base uppercase">
                  {selectedFournisseur.nom.substring(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedFournisseur.nom}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedFournisseur.categorie && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {selectedFournisseur.categorie}
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        selectedFournisseur.actif
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {selectedFournisseur.actif ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              {/* Contact */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Contact Principal
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Interlocuteur :</span>{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {[selectedFournisseur.contactPrenom, selectedFournisseur.contactNom].filter(Boolean).join(" ") || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Téléphone :</span>{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.telephone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email :</span>{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.email || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mobile / Tél 2 :</span>{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.telephone2 || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adresse & Fiscalité */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Localisation & Identifiants Fiscaux
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-gray-400">Adresse :</span>{" "}
                    <span className="text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.adresse || "—"}
                      {selectedFournisseur.codePostal ? ` (${selectedFournisseur.codePostal})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ville / Pays :</span>{" "}
                    <span className="text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.ville || "—"}, {selectedFournisseur.pays || "Tunisie"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Matricule Fiscale :</span>{" "}
                    <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">
                      {selectedFournisseur.matriculeFiscale || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Registre Commerce :</span>{" "}
                    <span className="text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.registreCommerce || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Site Web :</span>{" "}
                    {selectedFournisseur.siteWeb ? (
                      <a
                        href={selectedFournisseur.siteWeb}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {selectedFournisseur.siteWeb}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Règlement */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Modalités Financières & Coordonnées Bancaires
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Délai accordé :</span>{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.delaiPaiement || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Mode de paiement :</span>{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.modePaiement || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Banque :</span>{" "}
                    <span className="text-gray-800 dark:text-gray-200">
                      {selectedFournisseur.banque || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">RIB :</span>{" "}
                    <span className="font-mono text-gray-800 dark:text-gray-200 font-semibold">
                      {selectedFournisseur.rib || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedFournisseur.notes && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40 text-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Notes & Remarques
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {selectedFournisseur.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleOpenEdit(selectedFournisseur);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
              >
                Modifier la fiche
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
