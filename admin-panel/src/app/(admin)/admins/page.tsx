"use client";
import { getApiUrl, getBaseUrl } from "@/utils/api";
import React, { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

interface Admin {
  id: number;
  email: string;
  prenom: string | null;
  nom: string | null;
  dernierLogin: string | null;
  creeLe: string;
}

export default function AdminsPage() {
  const { getToken, getUser } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPrenom, setFormPrenom] = useState("");
  const [formNom, setFormNom] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const currentUser = getUser();

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/admins`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      setAdmins(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword) { setFormError("Email et mot de passe requis"); return; }
    setSaving(true); setFormError(null);
    try {
      const res = await fetch(`${API_URL}/auth/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email: formEmail, password: formPassword, prenom: formPrenom, nom: formNom }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur création");
      setShowModal(false);
      setFormEmail(""); setFormPassword(""); setFormPrenom(""); setFormNom("");
      fetchAdmins();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet administrateur ?")) return;
    try {
      await fetch(`${API_URL}/auth/admins/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchAdmins();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Gestion des Administrateurs</h2>
          <p className="text-sm text-gray-500 mt-1">Seuls les admins connectés peuvent créer ou supprimer des comptes.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + Nouvel Administrateur
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-10">{error}</div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-6 py-3 text-start">Nom</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Email</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Dernier login</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Créé le</TableCell>
                <TableCell isHeader className="px-6 py-3 text-end">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">
                    {admin.prenom} {admin.nom}
                    {currentUser?.id === admin.id && <Badge color="success" size="sm" className="ml-2">Vous</Badge>}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500">{admin.email}</TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500">
                    {admin.dernierLogin ? new Date(admin.dernierLogin).toLocaleString("fr-FR") : "Jamais"}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-500">
                    {new Date(admin.creeLe).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-end">
                    {currentUser?.id !== admin.id && (
                      <button onClick={() => handleDelete(admin.id)} className="text-sm text-red-500 hover:underline">
                        Supprimer
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-2xl p-6 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150 relative"
          >
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white">Nouvel Administrateur</h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Prénom</label>
                  <input type="text" value={formPrenom} onChange={e => setFormPrenom(e.target.value)} className="w-full rounded-xl border border-gray-300 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Nom</label>
                  <input type="text" value={formNom} onChange={e => setFormNom(e.target.value)} className="w-full rounded-xl border border-gray-300 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Email *</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full rounded-xl border border-gray-300 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Mot de passe *</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} className="w-full rounded-xl border border-gray-300 p-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" required minLength={8} />
                <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
              </div>
              {formError && <p className="text-xs text-red-500 font-medium mb-4">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">{saving ? "Création..." : "Créer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
