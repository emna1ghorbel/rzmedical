"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

export interface TiersItem {
  id: number;
  source: "utilisateur";
  nom: string;
  prenom: string;
  nomComplet: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  matriculeFiscale: string | null;
  activite: string | null;
  remise: number;
  creeLe: string;
  facturesCount: number;
  totalFacturesTTC: number;
  derniereFacture: string | null;
  bonsLivraisonCount: number;
  devisCount: number;
  factures: {
    id: number;
    numero: string;
    montantTTC: number;
    statut: string;
    statutPaiement: string;
    dateEmission: string;
  }[];
}

interface TiersStats {
  totalTiers: number;
  tiersAvecFactures: number;
  totalFacturesCount: number;
  totalChiffreAffaires: number;
}

const ACTIVITES = [
  "Clinique",
  "Médecin",
  "Dentiste",
  "Pharmacie",
  "Hôpital",
  "Laboratoire",
  "Centre médical",
  "Cabinet médical",
  "Autre",
];

export default function TiersPage() {
  const { getToken } = useAuth();

  const [tiers, setTiers] = useState<TiersItem[]>([]);
  const [stats, setStats] = useState<TiersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [activiteFilter, setActiviteFilter] = useState("ALL");

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<TiersItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    matriculeFiscale: "",
    activite: ACTIVITES[0],
    remise: 0,
  });

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const [resList, resStats] = await Promise.all([
        fetch(`${API_URL}/tiers?${params.toString()}`, { headers }),
        fetch(`${API_URL}/tiers/stats`, { headers }),
      ]);

      if (!resList.ok) {
        throw new Error("Erreur lors du chargement des tiers.");
      }

      const listData = await resList.json();
      const statsData = resStats.ok ? await resStats.json() : null;

      setTiers(listData);
      if (statsData) setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de récupérer les tiers.");
    } finally {
      setLoading(false);
    }
  }, [getToken, search]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  // Filtrage local par activité
  const filteredTiers = useMemo(() => {
    return tiers.filter((t) => {
      if (activiteFilter !== "ALL" && t.activite !== activiteFilter) {
        return false;
      }
      return true;
    });
  }, [tiers, activiteFilter]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedTiers(null);
    setFormError(null);
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
      matriculeFiscale: "",
      activite: ACTIVITES[0],
      remise: 0,
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (t: TiersItem) => {
    setIsEditing(true);
    setSelectedTiers(t);
    setFormError(null);
    setFormData({
      nom: t.nom || "",
      prenom: t.prenom || "",
      email: t.email || "",
      telephone: t.telephone || "",
      adresse: t.adresse || "",
      matriculeFiscale: t.matriculeFiscale || "",
      activite: t.activite || ACTIVITES[0],
      remise: t.remise || 0,
    });
    setShowFormModal(true);
  };

  const handleOpenDetail = (t: TiersItem) => {
    setSelectedTiers(t);
    setShowDetailModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() && !formData.prenom.trim()) {
      setFormError("Veuillez renseigner au moins un nom ou prénom.");
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
        ? `${API_URL}/tiers/${selectedTiers?.id}`
        : `${API_URL}/tiers`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erreur lors de l'enregistrement du tiers.");
      }

      setShowFormModal(false);
      fetchTiers();
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: TiersItem) => {
    const confirmation = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le tiers "${t.nomComplet}" ?\nSes factures éventuelles resteront conservées dans le système.`
    );
    if (!confirmation) return;

    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/tiers/${t.id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Erreur lors de la suppression.");
      }

      fetchTiers();
    } catch (err: any) {
      alert(err.message || "Impossible de supprimer ce tiers.");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTiers.length === 0) return;
    const headers = ["Nom", "Prénom", "Téléphone", "Email", "Matricule Fiscale", "Activité", "Factures", "Total TTC (TND)"];
    const rows = filteredTiers.map((t) => [
      `"${(t.nom || "").replace(/"/g, '""')}"`,
      `"${(t.prenom || "").replace(/"/g, '""')}"`,
      `"${(t.telephone || "").replace(/"/g, '""')}"`,
      `"${(t.email || "").replace(/"/g, '""')}"`,
      `"${(t.matriculeFiscale || "").replace(/"/g, '""')}"`,
      `"${(t.activite || "").replace(/"/g, '""')}"`,
      `"${t.facturesCount}"`,
      `"${t.totalFacturesTTC.toFixed(3)}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tiers_facturation_${new Date().toISOString().split("T")[0]}.csv`);
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
              Tiers & Clients Facturation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              Sans compte web
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Clients de passage, cliniques et praticiens saisis lors des factures sans compte de connexion e-commerce.
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
            Nouveau Tiers
          </button>
        </div>
      </div>

      {/* ── Cartes Statistiques ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Tiers
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {stats?.totalTiers ?? tiers.length}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Clients sans compte enregistrés
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tiers Facturés
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.tiersAvecFactures ?? 0}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ayant au moins une facture
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Factures Tiers
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats?.totalFacturesCount ?? 0}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Pièces justificatives émises
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Facturé
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {(stats?.totalChiffreAffaires ?? 0).toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Chiffre d'affaires réalisé
          </p>
        </div>
      </div>

      {/* ── Filtres & Recherche ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, MF, adresse..."
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
          value={activiteFilter}
          onChange={(e) => setActiviteFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none"
        >
          <option value="ALL">Toutes les activités</option>
          {ACTIVITES.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table des Tiers ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des tiers...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500">
            <p>{error}</p>
            <button
              onClick={() => fetchTiers()}
              className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
            >
              Réessayer
            </button>
          </div>
        ) : filteredTiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-800 dark:text-white">Aucun tiers trouvé</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Les tiers sont créés lors de la saisie des factures ou ajoutés manuellement ici.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-xs font-semibold text-white hover:bg-brand-600 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un Tiers
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 dark:border-gray-800 dark:bg-gray-800/40 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4">Tiers / Client Facturation</th>
                  <th className="py-3.5 px-4">Activité</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Matricule Fiscale</th>
                  <th className="py-3.5 px-4">Adresse</th>
                  <th className="py-3.5 px-4 text-center">Factures</th>
                  <th className="py-3.5 px-4 text-right">Total Facturé</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredTiers.map((t) => {
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      {/* Tiers */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold text-xs uppercase">
                            {t.nom.substring(0, 2) || "TR"}
                          </div>
                          <div>
                            <div>{t.nomComplet}</div>
                            <div className="text-[11px] text-gray-400 font-normal">
                              Ajouté le {new Date(t.creeLe).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Activité */}
                      <td className="py-3.5 px-4">
                        {t.activite ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {t.activite}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          {t.telephone && (
                            <div className="text-gray-800 dark:text-gray-200 font-medium">
                              📞 {t.telephone}
                            </div>
                          )}
                          {t.email && (
                            <div className="text-gray-500 dark:text-gray-400 truncate max-w-[170px]">
                              ✉️ {t.email}
                            </div>
                          )}
                          {!t.telephone && !t.email && <span className="text-gray-400">—</span>}
                        </div>
                      </td>

                      {/* Matricule Fiscale */}
                      <td className="py-3.5 px-4">
                        {t.matriculeFiscale ? (
                          <span className="font-mono text-xs text-gray-800 dark:text-gray-200">
                            {t.matriculeFiscale}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Adresse */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                        {t.adresse || <span className="text-gray-400">—</span>}
                      </td>

                      {/* Factures count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                          {t.facturesCount}
                        </span>
                      </td>

                      {/* Total Facturé */}
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900 dark:text-white text-xs">
                        {t.totalFacturesTTC.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            href={`/invoices/new?clientId=${t.id}`}
                            title="Nouvelle Facture pour ce tiers"
                            className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleOpenDetail(t)}
                            title="Voir l'historique"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Modifier"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800 dark:hover:text-brand-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
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

      {/* ── MODAL : Nouveau / Modifier Tiers ─────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEditing ? `Modifier : ${selectedTiers?.nomComplet}` : "Ajouter un Tiers"}
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

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nom / Raison Sociale *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Clinique Ennasr"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Prénom (si particulier)
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    placeholder="Ex: Dr. Ahmed"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Activité médicale
                  </label>
                  <select
                    value={formData.activite}
                    onChange={(e) => setFormData({ ...formData, activite: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                  >
                    {ACTIVITES.map((act) => (
                      <option key={act} value={act}>
                        {act}
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
                    placeholder="Ex: 00012345/A/M/000"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
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
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@clinique.tn"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Adresse postale
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Ex: Avenue Habib Bourguiba, Tunis"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Remise commerciale permanente (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.remise}
                  onChange={(e) => setFormData({ ...formData, remise: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer le Tiers"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL : Fiche Détails Tiers & Historique ────────────────────── */}
      {showDetailModal && selectedTiers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 font-bold text-base uppercase">
                  {selectedTiers.nom.substring(0, 2) || "TR"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTiers.nomComplet}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedTiers.activite && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {selectedTiers.activite}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      Tiers Facturation
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

            {/* Coordonnées */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <div>
                <span className="text-gray-400">Téléphone :</span>{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {selectedTiers.telephone || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Email :</span>{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {selectedTiers.email || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Matricule Fiscale :</span>{" "}
                <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                  {selectedTiers.matriculeFiscale || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Remise accordée :</span>{" "}
                <span className="font-semibold text-emerald-600">
                  {selectedTiers.remise}%
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Adresse :</span>{" "}
                <span className="text-gray-800 dark:text-gray-200">
                  {selectedTiers.adresse || "—"}
                </span>
              </div>
            </div>

            {/* Historique Factures */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                  Factures émises ({selectedTiers.factures.length})
                </h3>
                <span className="text-xs font-semibold text-brand-600">
                  Total : {selectedTiers.totalFacturesTTC.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND
                </span>
              </div>

              {selectedTiers.factures.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  Aucune facture enregistrée pour ce tiers pour l'instant.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTiers.factures.map((fac) => (
                    <div
                      key={fac.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-800/60 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-gray-800 dark:text-white">
                          N° {fac.numero}
                        </span>
                        <span className="text-gray-400">
                          {new Date(fac.dateEmission).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            fac.statutPaiement === "PAYEE"
                              ? "bg-emerald-50 text-emerald-600"
                              : fac.statutPaiement === "PARTIELLEMENT_PAYEE"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {fac.statutPaiement}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {fac.montantTTC.toLocaleString("fr-TN", { minimumFractionDigits: 3 })} TND
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions modal footer */}
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <Link
                href={`/invoices/new?clientId=${selectedTiers.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer une facture pour ce tiers
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEdit(selectedTiers);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
