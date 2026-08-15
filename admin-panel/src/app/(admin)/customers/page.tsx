"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { useAuth } from "@/hooks/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const BASE_URL = API_URL.replace("/api", "");

interface Client {
  id: number;
  email: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  photo: string | null;
  adresse: string | null;
  dateNaissance: string | null;
  creeLe: string;
  dernierLogin: string | null;
  _count: { commandes: number };
}

export default function CustomersPage() {
  const { getToken } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPrenom, setFormPrenom] = useState("");
  const [formNom, setFormNom] = useState("");
  const [formTelephone, setFormTelephone] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formAdresse, setFormAdresse] = useState("");
  const [formDateNaissance, setFormDateNaissance] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement des clients");
      setClients(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const resetForm = () => {
    setFormEmail(""); setFormPassword(""); setFormPrenom(""); setFormNom("");
    setFormTelephone(""); setFormPhoto(""); setFormAdresse(""); setFormDateNaissance("");
    setFormError(null);
  };

  const openAddModal = () => {
    setEditClient(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditClient(client);
    setFormEmail(client.email);
    setFormPassword("");
    setFormPrenom(client.prenom || "");
    setFormNom(client.nom || "");
    setFormTelephone(client.telephone || "");
    setFormPhoto(client.photo || "");
    setFormAdresse(client.adresse || "");
    setFormDateNaissance(
      client.dateNaissance ? new Date(client.dateNaissance).toISOString().split("T")[0] : ""
    );
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditClient(null);
    resetForm();
  };

  // Upload photo for client
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/upload/single`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur upload");
      setFormPhoto(data.url);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editClient && (!formEmail || !formPassword)) {
      setFormError("Email et mot de passe requis");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        prenom: formPrenom || null,
        nom: formNom || null,
        telephone: formTelephone || null,
        photo: formPhoto || null,
        adresse: formAdresse || null,
        dateNaissance: formDateNaissance || null,
        email: formEmail,
      };

      if (editClient) {
        const res = await fetch(`${API_URL}/clients/${editClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur modification");
      } else {
        const res = await fetch(`${API_URL}/clients`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ ...payload, motDePasse: formPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur création");
      }
      closeModal();
      fetchClients();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce client ? Cette action est irréversible.")) return;
    try {
      await fetch(`${API_URL}/clients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchClients();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.prenom || "").toLowerCase().includes(q) ||
      (c.nom || "").toLowerCase().includes(q) ||
      (c.telephone || "").includes(q)
    );
  });

  const photoUrl = (p: string | null) => p ? (p.startsWith("/") ? BASE_URL + p : p) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Gestion des Clients</h2>
          <p className="text-sm text-gray-500 mt-1">{clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + Nouveau Client
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom, email ou téléphone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-10">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="font-medium">Aucun client trouvé</p>
          <p className="text-sm mt-1">{search ? "Modifiez votre recherche" : "Cliquez sur '+ Nouveau Client' pour commencer"}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="px-6 py-3 text-start">Client</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Contact</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Adresse</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Né(e) le</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Commandes</TableCell>
                <TableCell isHeader className="px-6 py-3 text-start">Inscrit le</TableCell>
                <TableCell isHeader className="px-6 py-3 text-end">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((client) => {
                const avatar = photoUrl(client.photo);
                const initials = ((client.prenom?.[0] || "") + (client.nom?.[0] || "C")).toUpperCase();
                return (
                  <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden border bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm shrink-0">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {[client.prenom, client.nom].filter(Boolean).join(" ") || "—"}
                          </p>
                          <p className="text-xs text-gray-400">#{client.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{client.email}</p>
                      {client.telephone && <p className="text-xs text-gray-400 mt-0.5">{client.telephone}</p>}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                      {client.adresse || "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-500">
                      {client.dateNaissance ? new Date(client.dateNaissance).toLocaleDateString("fr-FR") : "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge color={client._count.commandes > 0 ? "success" : "warning"} size="sm">
                        {client._count.commandes} commande{client._count.commandes !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-500">
                      {new Date(client.creeLe).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-end">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => openEditModal(client)} className="text-sm text-brand-500 hover:underline">Modifier</button>
                        <button onClick={() => handleDelete(client.id)} className="text-sm text-red-500 hover:underline">Supprimer</button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal Ajout / Modification */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center px-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-6">
              <h4 className="text-lg font-semibold mb-5 text-gray-800 dark:text-white">
                {editClient ? "Modifier le client" : "Nouveau Client"}
              </h4>

              <form onSubmit={handleSave}>
                {/* Photo de profil */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border flex items-center justify-center text-gray-400 shrink-0">
                    {formPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl(formPhoto) || ""} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      {uploading ? "Téléversement..." : "Choisir une photo"}
                      <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                    </label>
                    {formPhoto && (
                      <button type="button" onClick={() => setFormPhoto("")} className="ml-3 text-xs text-red-500 hover:underline">Supprimer</button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG ou WEBP — Optionnel</p>
                  </div>
                </div>

                {/* Nom / Prénom */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Prénom</label>
                    <input type="text" value={formPrenom} onChange={e => setFormPrenom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Prénom" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Nom</label>
                    <input type="text" value={formNom} onChange={e => setFormNom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Nom" />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email *</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="client@exemple.com" required />
                </div>

                {/* Mot de passe (ajout uniquement) */}
                {!editClient && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Mot de passe *</label>
                    <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      placeholder="Minimum 8 caractères" required minLength={8} />
                  </div>
                )}

                {/* Téléphone / Date de naissance */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Téléphone</label>
                    <input type="text" value={formTelephone} onChange={e => setFormTelephone(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="+216 XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Date de naissance</label>
                    <input type="date" value={formDateNaissance} onChange={e => setFormDateNaissance(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                  </div>
                </div>

                {/* Adresse */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Adresse</label>
                  <textarea
                    value={formAdresse}
                    onChange={e => setFormAdresse(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white resize-none"
                    placeholder="Rue, Ville, Code postal, Pays..."
                  />
                </div>

                {formError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 p-3 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 mb-4">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-60">
                    {saving ? "Enregistrement..." : editClient ? "Enregistrer" : "Créer le client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
