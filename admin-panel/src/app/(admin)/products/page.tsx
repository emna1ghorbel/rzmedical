"use client";
import React, { useEffect, useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Categorie { id: number; nom: string; }
interface SousCategorie { id: number; nom: string; categorie: Categorie; }
interface Marque { id: number; nom: string; }

interface Produit {
  id: number;
  nom: string;
  reference: string;
  prix: number;
  stock: number;
  disponible: boolean;
  description?: string;
  images?: string[];
  video?: string;
  motsCles?: string[];
  sousCategorieId: number;
  sousCategorie: SousCategorie;
  marqueId: number;
  marque: Marque;
}

export default function ProductsPage() {
  const [items, setItems] = useState<Produit[]>([]);
  const [subcategories, setSubcategories] = useState<SousCategorie[]>([]);
  const [brands, setBrands] = useState<Marque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Produit | null>(null);

  // Form fields
  const [formNom, setFormNom] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formPrix, setFormPrix] = useState("");
  const [formStock, setFormStock] = useState("0");
  const [formSubCatId, setFormSubCatId] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formDispo, setFormDispo] = useState(true);
  const [formDesc, setFormDesc] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formFicheTechnique, setFormFicheTechnique] = useState("");
  const [formVideo, setFormVideo] = useState("");
  const [formMotsCles, setFormMotsCles] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [resProd, resSub, resBrand] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/subcategories`),
        fetch(`${API_URL}/brands`)
      ]);
      if (!resProd.ok || !resSub.ok || !resBrand.ok) throw new Error("Erreur de chargement");
      setItems(await resProd.json());
      const subs = await resSub.json();
      setSubcategories(subs);
      const brds = await resBrand.json();
      setBrands(brds);

      if (!formSubCatId && subs.length > 0) setFormSubCatId(subs[0].id.toString());
      if (!formBrandId && brds.length > 0) setFormBrandId(brds[0].id.toString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/upload/single`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      setFormFicheTechnique(data.url);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally { setUploading(false); }
  };

  const handleMultipleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true); setFormError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("files", f));
      const res = await fetch(`${API_URL}/upload/multiple`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'upload");
      setFormImages(prev => [...prev, ...data.urls]);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally { setUploading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setFormNom(""); setFormRef(""); setFormPrix(""); setFormStock("0"); setFormDispo(true);
    setFormDesc(""); setFormImages([]); setFormFicheTechnique(""); setFormVideo(""); setFormMotsCles("");
    setFormSubCatId(subcategories.length > 0 ? subcategories[0].id.toString() : "");
    setFormBrandId(brands.length > 0 ? brands[0].id.toString() : "");
    setFormError(null); setShowModal(true);
  };

  const openEdit = (item: Produit) => {
    setEditing(item);
    setFormNom(item.nom); setFormRef(item.reference); setFormPrix(item.prix.toString());
    setFormStock(item.stock.toString()); setFormDispo(item.disponible);
    setFormDesc(item.description || "");
    setFormImages(item.images || []);
    setFormFicheTechnique(item.ficheTechnique || "");
    setFormVideo(item.video || "");
    setFormMotsCles((item.motsCles || []).join(", "));
    setFormSubCatId(item.sousCategorieId.toString());
    setFormBrandId(item.marqueId.toString());
    setFormError(null); setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSave = async () => {
    if (!formNom || !formRef || !formPrix || !formSubCatId || !formBrandId) {
      setFormError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSaving(true); setFormError(null);
    try {
      const url = editing ? `${API_URL}/products/${editing.id}` : `${API_URL}/products`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formNom.trim(),
          reference: formRef.trim(),
          prix: Number(formPrix),
          stock: Number(formStock),
          disponible: formDispo,
          description: formDesc.trim() || undefined,
          images: formImages,
          ficheTechnique: formFicheTechnique.trim() || undefined,
          video: formVideo.trim() || undefined,
          motsCles: formMotsCles.split(",").map(s => s.trim()).filter(Boolean),
          sousCategorieId: formSubCatId,
          marqueId: formBrandId
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur d'enregistrement");
      closeModal(); fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur de suppression");
      setDeleteId(null); fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Produits" />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Gestion des produits</h3>
          <p className="text-sm text-gray-500">{items.length} produit(s)</p>
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
          <div className="flex flex-col items-center justify-center py-20 gap-3"><p className="text-gray-500">Aucun produit</p><button onClick={openAdd} className="text-sm text-brand-500 underline">Créer</button></div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-start">Image</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Réf</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Nom</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Prix</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Stock</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Sous-Catégorie</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start">Marque</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-end">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-4 py-4">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0].startsWith("/") ? API_URL.replace("/api", "") + item.images[0] : item.images[0]} alt={item.nom} className="h-10 w-10 object-cover rounded-md border" />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">-</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-xs font-mono text-gray-500">{item.reference}</TableCell>
                    <TableCell className="px-4 py-4 font-medium text-gray-800 dark:text-white/90">{item.nom}</TableCell>
                    <TableCell className="px-4 py-4 font-semibold text-brand-500">{item.prix} TND</TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge color={item.stock > 10 ? "success" : item.stock > 0 ? "warning" : "error"} size="sm">{item.stock}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-gray-500">{item.sousCategorie?.nom} <span className="text-xs">({item.sousCategorie?.categorie?.nom})</span></TableCell>
                    <TableCell className="px-4 py-4 text-sm text-gray-500">{item.marque?.nom}</TableCell>
                    <TableCell className="px-4 py-4 text-end whitespace-nowrap">
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <div className="flex min-h-full items-start justify-center px-4 py-8">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-6">
              <h4 className="text-lg font-semibold mb-5">{editing ? "Modifier Produit" : "Nouveau Produit"}</h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nom *</label>
                  <input type="text" value={formNom} onChange={(e) => setFormNom(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Référence *</label>
                  <input type="text" value={formRef} onChange={(e) => setFormRef(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Prix (TND) *</label>
                  <input type="number" step="0.01" value={formPrix} onChange={(e) => setFormPrix(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Stock initial</label>
                  <input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Sous-Catégorie *</label>
                  <select value={formSubCatId} onChange={(e) => setFormSubCatId(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800">
                    <option value="" disabled>-- Sélectionner --</option>
                    {subcategories.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.categorie?.nom})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Marque *</label>
                  <select value={formBrandId} onChange={(e) => setFormBrandId(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800">
                    <option value="" disabled>-- Sélectionner --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" rows={3}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Images du produit (PNG, JPG)</label>
                  <input type="file" multiple accept="image/png, image/jpeg, image/webp" onChange={handleMultipleUpload} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" />
                  {uploading && <p className="text-xs text-brand-500 mt-1">Upload en cours...</p>}
                  {formImages.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {formImages.map((img, i) => (
                        <img key={i} src={img.startsWith("/") ? API_URL.replace("/api", "") + img : img} alt="Aperçu" className="h-10 w-10 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fiche Technique (PDF)</label>
                  <input type="file" accept="application/pdf" onChange={handleSingleUpload} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" />
                  {formFicheTechnique && <a href={formFicheTechnique.startsWith("/") ? API_URL.replace("/api", "") + formFicheTechnique : formFicheTechnique} target="_blank" rel="noreferrer" className="text-sm text-brand-500 mt-1 block hover:underline">Voir le fichier PDF actuel</a>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Vidéo (URL optionnelle, YouTube/Vimeo)</label>
                <input type="text" value={formVideo} onChange={(e) => setFormVideo(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" placeholder="https://..." />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Mots-clés (séparés par des virgules)</label>
                <input type="text" value={formMotsCles} onChange={(e) => setFormMotsCles(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 dark:bg-gray-800" placeholder="stéthoscope, médical, diagnostic..." />
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={formDispo} onChange={(e) => setFormDispo(e.target.checked)} className="rounded border-gray-300 w-4 h-4 text-brand-500 focus:ring-brand-500" />
                  Produit disponible à la vente
                </label>
              </div>

              {formError && <p className="mt-1.5 text-xs text-red-500">{formError}</p>}

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeModal} className="rounded-lg border px-4 py-2 text-sm">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white disabled:opacity-60">{saving ? "En cours..." : "Enregistrer"}</button>
              </div>
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
