"use client";
import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Categorie {
  id: number;
  nom: string;
}

interface SousCategorie {
  id: number;
  nom: string;
  categorieId: number;
  categorie: Categorie;
  creeLe: string;
  _count: { produits: number };
}

export default function SubcategoriesPage() {
  const [items, setItems] = useState<SousCategorie[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SousCategorie | null>(null);
  const [formNom, setFormNom] = useState("");
  const [formCatId, setFormCatId] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resSub, resCat] = await Promise.all([
        fetch(`${API_URL}/subcategories`),
        fetch(`${API_URL}/categories`)
      ]);
      if (!resSub.ok || !resCat.ok) throw new Error("Erreur de chargement");
      
      const [dataSub, dataCat] = await Promise.all([resSub.json(), resCat.json()]);
      setItems(dataSub);
      setCategories(dataCat);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setFormNom("");
    setFormCatId(categories.length > 0 ? categories[0].id.toString() : "");
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (item: SousCategorie) => {
    setEditing(item);
    setFormNom(item.nom);
    setFormCatId(item.categorieId.toString());
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!formNom.trim() || !formCatId) {
      setFormError("Nom et Catégorie requis");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const url = editing ? `${API_URL}/subcategories/${editing.id}` : `${API_URL}/subcategories`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: formNom.trim(), categorieId: formCatId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'enregistrement");
      closeModal();
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/subcategories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      setDeleteId(null);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur de suppression");
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Sous-Catégories" />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Gestion des sous-catégories</h3>
          <p className="text-sm text-gray-500">{items.length} sous-catégorie(s)</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
          Ajouter
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3"><p className="text-red-500">{error}</p><button onClick={fetchData} className="text-sm text-brand-500 underline">Réessayer</button></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3"><p className="text-gray-500">Aucune sous-catégorie</p><button onClick={openAdd} className="text-sm text-brand-500 underline">Créer</button></div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="px-6 py-3 text-start">Nom</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-start">Catégorie Parente</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-start">Produits</TableCell>
                  <TableCell isHeader className="px-6 py-3 text-end">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-6 py-4 font-medium text-gray-800 dark:text-white/90">{item.nom}</TableCell>
                    <TableCell className="px-6 py-4 text-sm text-gray-500">{item.categorie?.nom}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge color={item._count.produits > 0 ? "success" : "warning"} size="sm">{item._count.produits} produits</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-end">
                      <button onClick={() => openEdit(item)} className="text-sm text-brand-500 hover:underline mr-3">Modifier</button>
                      <button onClick={() => setDeleteId(item.id)} className="text-sm text-red-500 hover:underline">Supprimer</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-6 mx-4">
            <h4 className="text-lg font-semibold mb-5">{editing ? "Modifier" : "Nouvelle Sous-Catégorie"}</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Nom</label>
              <input type="text" value={formNom} onChange={(e) => setFormNom(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" autoFocus />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Catégorie Parente</label>
              <select value={formCatId} onChange={(e) => setFormCatId(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800">
                <option value="" disabled>-- Sélectionner --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            {formError && <p className="mt-1.5 text-xs text-red-500">{formError}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "En cours..." : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-6 mx-4">
            <h4 className="text-lg font-semibold text-center mb-2">Confirmer</h4>
            <p className="text-sm text-center mb-6">Action irréversible.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">Annuler</button>
              <button onClick={() => handleDelete(deleteId)} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
