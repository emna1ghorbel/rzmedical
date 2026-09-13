"use client";

import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { getApiUrl, parseJsonSafe } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { useExercice, Exercice } from "@/context/ExerciceContext";

const API_URL = getApiUrl();

interface ExerciceStats {
  id: number;
  annee: number;
  facturesCount: number;
  facturesTotalTTC: number;
  devisCount: number;
  devisTotalTTC: number;
}

export default function ExercicesPage() {
  const { getToken } = useAuth();
  const { exercices, activeExercice, selectExercice, refreshExercices, activateExerciceOnBackend } = useExercice();

  const [stats, setStats] = useState<Record<number, ExerciceStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  // Modal Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createAnnee, setCreateAnnee] = useState<number>(new Date().getFullYear() + 1);
  const [createLabel, setCreateLabel] = useState("");
  const [createDateDebut, setCreateDateDebut] = useState("");
  const [createDateFin, setCreateDateFin] = useState("");
  const [createIsActif, setCreateIsActif] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [createError, setCreateError] = useState("");

  // Modal Edit
  const [editingEx, setEditingEx] = useState<Exercice | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDateDebut, setEditDateDebut] = useState("");
  const [editDateFin, setEditDateFin] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Auto-fill dates when year changes in create modal
  const handleYearChange = (year: number) => {
    setCreateAnnee(year);
    setCreateLabel(`Exercice ${year}`);
    setCreateDateDebut(`${year}-01-01`);
    setCreateDateFin(`${year}-12-31`);
  };

  const openCreateModal = () => {
    // Propose max year + 1
    const maxYear = exercices.reduce((max, e) => (e.annee > max ? e.annee : max), new Date().getFullYear());
    const nextYear = maxYear + 1;
    handleYearChange(nextYear);
    setCreateIsActif(false);
    setCreateError("");
    setShowCreateModal(true);
  };

  const openEditModal = (ex: Exercice) => {
    setEditingEx(ex);
    setEditLabel(ex.label || `Exercice ${ex.annee}`);
    setEditDateDebut(ex.dateDebut ? ex.dateDebut.split("T")[0] : `${ex.annee}-01-01`);
    setEditDateFin(ex.dateFin ? ex.dateFin.split("T")[0] : `${ex.annee}-12-31`);
    setEditError("");
  };

  // Fetch stats for all exercices
  const fetchAllStats = useCallback(async () => {
    if (exercices.length === 0) return;
    setLoadingStats(true);
    const token = getToken();
    const statsMap: Record<number, ExerciceStats> = {};

    await Promise.all(
      exercices.map(async (ex) => {
        try {
          const res = await fetch(`${API_URL}/exercices/${ex.id}/stats`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const data = await parseJsonSafe(res);
            statsMap[ex.id] = data;
          }
        } catch {
          // ignore stat fetch error
        }
      })
    );
    setStats(statsMap);
    setLoadingStats(false);
  }, [exercices, getToken]);

  useEffect(() => {
    fetchAllStats();
  }, [fetchAllStats]);

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAnnee || !createDateDebut || !createDateFin) {
      setCreateError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSavingCreate(true);
    setCreateError("");

    try {
      const token = getToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/exercices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          annee: Number(createAnnee),
          label: createLabel.trim() || `Exercice ${createAnnee}`,
          dateDebut: new Date(createDateDebut).toISOString(),
          dateFin: new Date(createDateFin).toISOString(),
        }),
      });

      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");

      // Si l'utilisateur voulait l'activer immédiatement
      if (createIsActif && data.id) {
        await activateExerciceOnBackend(data.id, token || undefined);
      }

      await refreshExercices();
      setShowCreateModal(false);
    } catch (err: any) {
      setCreateError(err.message || "Erreur lors de la création de l'exercice");
    } finally {
      setSavingCreate(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEx) return;
    setSavingEdit(true);
    setEditError("");

    try {
      const token = getToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/exercices/${editingEx.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          label: editLabel.trim(),
          dateDebut: new Date(editDateDebut).toISOString(),
          dateFin: new Date(editDateFin).toISOString(),
        }),
      });

      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || "Erreur lors de la modification");

      await refreshExercices();
      setEditingEx(null);
    } catch (err: any) {
      setEditError(err.message || "Erreur lors de la modification");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Activate
  const handleActivate = async (ex: Exercice) => {
    if (ex.isActif) return;
    const ok = confirm(`Voulez-vous définir l'exercice ${ex.annee} comme exercice actif principal ?\nLes nouvelles factures et devis débuteront leur numérotation sur cet exercice.`);
    if (!ok) return;

    const token = getToken();
    const success = await activateExerciceOnBackend(ex.id, token || undefined);
    if (success) {
      selectExercice(ex);
    }
  };

  // Handle Delete
  const handleDelete = async (ex: Exercice) => {
    if (ex.isActif) {
      alert("Impossible de supprimer l'exercice actuellement actif.");
      return;
    }

    const exStats = stats[ex.id];
    if (exStats && exStats.facturesCount > 0) {
      alert(`Cet exercice contient ${exStats.facturesCount} facture(s). Vous ne pouvez pas le supprimer.`);
      return;
    }

    const ok = confirm(`Êtes-vous certain de vouloir supprimer l'exercice ${ex.annee} ? Cette action est irréversible.`);
    if (!ok) return;

    try {
      const token = getToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/exercices/${ex.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const d = await parseJsonSafe(res).catch(() => ({}));
        throw new Error(d.error || "Erreur lors de la suppression");
      }

      await refreshExercices();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const fmtCurrency = (val: number) =>
    Number(val || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + " TND";

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Exercices Fiscaux" />

      {/* Top Banner / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Exercice */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/20 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Exercice Actif
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {activeExercice ? activeExercice.annee : "Aucun"}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {activeExercice?.label || ""}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {activeExercice
              ? `${new Date(activeExercice.dateDebut).toLocaleDateString("fr-FR")} au ${new Date(activeExercice.dateFin).toLocaleDateString("fr-FR")}`
              : "Aucun exercice sélectionné"}
          </p>
        </div>

        {/* Card 2: Total Exercices */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Total Exercices
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {exercices.length}
            </h3>
            <span className="text-xs text-gray-500">enregistré{exercices.length > 1 ? "s" : ""}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Années comptables configurées
          </p>
        </div>

        {/* Card 3: Invoices in Active Exercice */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Factures {activeExercice ? `(${activeExercice.annee})` : ""}
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {activeExercice && stats[activeExercice.id] ? stats[activeExercice.id].facturesCount : "—"}
            </h3>
            <span className="text-xs text-gray-500">factures</span>
          </div>
          <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {activeExercice && stats[activeExercice.id]
              ? fmtCurrency(stats[activeExercice.id].facturesTotalTTC)
              : "—"}
          </p>
        </div>

        {/* Card 4: Devis in Active Exercice */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Devis {activeExercice ? `(${activeExercice.annee})` : ""}
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">
              {activeExercice && stats[activeExercice.id] ? stats[activeExercice.id].devisCount : "—"}
            </h3>
            <span className="text-xs text-gray-500">devis créés</span>
          </div>
          <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            {activeExercice && stats[activeExercice.id]
              ? fmtCurrency(stats[activeExercice.id].devisTotalTTC)
              : "—"}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Liste des Exercices Comptables
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Chaque exercice permet d&apos;isoler et de numéroter vos factures et devis par année fiscale.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition shadow-sm hover:shadow active:scale-95"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nouvel Exercice</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Année</th>
                <th className="py-3.5 px-4">Libellé</th>
                <th className="py-3.5 px-4">Période</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4">Factures</th>
                <th className="py-3.5 px-4">Devis</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {exercices.map((ex) => {
                const exStats = stats[ex.id];
                const isSelectedInContext = activeExercice?.id === ex.id;

                return (
                  <tr
                    key={ex.id}
                    className={`transition-colors ${
                      ex.isActif
                        ? "bg-emerald-50/30 hover:bg-emerald-50/60 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                        : "hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {/* Année */}
                    <td className="py-4 px-4 sm:px-6 font-black text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{ex.annee}</span>
                        {isSelectedInContext && (
                          <span
                            title="Exercice sélectionné dans votre session de travail"
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          >
                            Vue active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Libellé */}
                    <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">
                      {ex.label}
                    </td>

                    {/* Période */}
                    <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {new Date(ex.dateDebut).toLocaleDateString("fr-FR")}
                      <span className="mx-1.5 text-gray-400">→</span>
                      {new Date(ex.dateFin).toLocaleDateString("fr-FR")}
                    </td>

                    {/* Statut */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {ex.isActif ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          Inactif
                        </span>
                      )}
                    </td>

                    {/* Factures */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {loadingStats ? (
                        <span className="text-gray-400 text-xs">...</span>
                      ) : (
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {exStats ? exStats.facturesCount : 0}
                          </span>
                          {exStats && exStats.facturesCount > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                              ({fmtCurrency(exStats.facturesTotalTTC)})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Devis */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {loadingStats ? (
                        <span className="text-gray-400 text-xs">...</span>
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {exStats ? exStats.devisCount : 0}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Activer button */}
                        {!ex.isActif && (
                          <button
                            onClick={() => handleActivate(ex)}
                            title="Définir comme exercice actif par défaut"
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition"
                          >
                            Activer
                          </button>
                        )}

                        {/* Switch View button */}
                        <button
                          onClick={() => selectExercice(ex)}
                          title="Basculer l'affichage du tableau de bord sur cet exercice"
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                        >
                          Visualiser
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => openEditModal(ex)}
                          title="Modifier l'exercice"
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>

                        {/* Delete button */}
                        {!ex.isActif && (
                          <button
                            onClick={() => handleDelete(ex)}
                            title="Supprimer l'exercice"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Créer un exercice ────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Ajouter un Exercice Fiscal
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Année Comptable *
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={createAnnee}
                  onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={createLabel}
                  onChange={(e) => setCreateLabel(e.target.value)}
                  placeholder={`Exercice ${createAnnee}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Date début *
                  </label>
                  <input
                    type="date"
                    value={createDateDebut}
                    onChange={(e) => setCreateDateDebut(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Date fin *
                  </label>
                  <input
                    type="date"
                    value={createDateFin}
                    onChange={(e) => setCreateDateFin(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsActif}
                    onChange={(e) => setCreateIsActif(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300"
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Définir immédiatement comme exercice actif
                  </span>
                </label>
                <p className="text-[11px] text-gray-400 mt-1 pl-6.5">
                  La numérotation des nouvelles factures (ex: {createAnnee}0001) et devis démarrera sur cet exercice.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingCreate}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {savingCreate ? "Création..." : "Créer l'exercice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Modifier un exercice ────────────────────────────────────────── */}
      {editingEx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Modifier l&apos;Exercice {editingEx.annee}
              </h3>
              <button
                onClick={() => setEditingEx(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Libellé
                </label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={editDateDebut}
                    onChange={(e) => setEditDateDebut(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={editDateFin}
                    onChange={(e) => setEditDateFin(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingEx(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {savingEdit ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
