"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl, getBaseUrl } from "@/utils/api";

const API = getApiUrl();
const BASE_URL = getBaseUrl();
type Annonce = { id: number; texte: string; actif: boolean; ordre: number; dureeSecondes: number };
type Banniere = { id: number; image: string; titre?: string; description?: string; actif: boolean; lien?: string; hauteur: number; categorieId?: number | null };
type VideoHero = { id: number; videoUrl: string; posterUrl: string | null; titre: string | null; actif: boolean; creeLe: string };
type TypeAlerte = 'INFO' | 'PROMO' | 'WARNING' | 'SUCCESS';
type AffichageAlerte = 'POPUP' | 'BANNER' | 'TOAST';
type Alerte = { id: number; type: TypeAlerte; affichage: AffichageAlerte; titre: string; message: string; lien: string | null; texteBouton: string | null; actif: boolean; dateDebut: string | null; dateFin: string | null; creeLe: string };
type Categorie = { id: number; nom: string; visible: boolean };

function imageFullUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// Toast notification
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold shadow-2xl text-white transition-all ${type === "success" ? "bg-green-600" : "bg-red-600"}`}>
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
}

export default function SiteContentPage() {
  const { getToken } = useAuth();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [bannieres, setBannieres] = useState<Banniere[]>([]);
  const [videos, setVideos] = useState<VideoHero[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  // Alerte form
  const [alerteTitre, setAlerteTitre] = useState("");
  const [alerteMessage, setAlerteMessage] = useState("");
  const [alerteType, setAlerteType] = useState<TypeAlerte>("INFO");
  const [alerteAffichage, setAlerteAffichage] = useState<AffichageAlerte>("POPUP");
  const [alerteLien, setAlerteLien] = useState("");
  const [alerteTexteBouton, setAlerteTexteBouton] = useState("");
  const [alerteDateDebut, setAlerteDateDebut] = useState("");
  const [alerteDateFin, setAlerteDateFin] = useState("");
  const [alerteSaving, setAlerteSaving] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [lien, setLien] = useState("");
  const [hauteur, setHauteur] = useState("420");
  const [categorieId, setCategorieId] = useState<string>("");
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string>("");
  const [videoTitre, setVideoTitre] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoActionId, setVideoActionId] = useState<number | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const posterFileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = getToken();
      if (!token) throw new Error("Session expirée. Veuillez vous reconnecter.");
      const response = await fetch(`${getApiUrl()}${path}`, {
        ...options,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
      const data = response.status === 204 ? null : await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `Erreur API ${response.status}`);
      return data;
    },
    [getToken],
  );

  const load = useCallback(async () => {
    try {
      const data = await request("/site-content");
      setAnnonces(data.annonces || []);
      setBannieres(data.bannieres || []);
      setVideos(data.videos || []);
      setAlertes(data.alertes || []);
      fetch(`${API}/categories`).then(r => r.json()).then(cats => setCategories(Array.isArray(cats) ? cats : [])).catch(() => {});
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle banner image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File): Promise<string> => {
    const token = getToken();
    if (!token) throw new Error("Session expirée");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/upload/single`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erreur d'upload");
    return data.url as string;
  };

  const addAnnonce = async () => {
    const texte = phrase.trim();
    if (!texte) return;
    setSaving(true);
    try {
      await request("/site-content/annonces", {
        method: "POST",
        body: JSON.stringify({ texte, actif: true, ordre: annonces.length, dureeSecondes: 5 }),
        headers: { "Content-Type": "application/json" },
      });
      setPhrase("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'ajout");
    } finally {
      setSaving(false);
    }
  };

  const toggleAnnonce = async (annonce: Annonce) => {
    try {
      await request(`/site-content/annonces/${annonce.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...annonce, actif: !annonce.actif }),
        headers: { "Content-Type": "application/json" },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de modification");
    }
  };

  const deleteAnnonce = async (id: number) => {
    try {
      await request(`/site-content/annonces/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de suppression");
    }
  };

  // ── Alertes handlers ─────────────────────────────────────────────────────────

  const addAlerte = async () => {
    if (!alerteTitre.trim() || !alerteMessage.trim()) {
      setError("Le titre et le message de l'alerte sont requis.");
      return;
    }
    setAlerteSaving(true);
    try {
      await request("/site-content/alertes", {
        method: "POST",
        body: JSON.stringify({
          type: alerteType,
          affichage: alerteAffichage,
          titre: alerteTitre.trim(),
          message: alerteMessage.trim(),
          lien: alerteLien.trim() || null,
          texteBouton: alerteTexteBouton.trim() || null,
          actif: true,
          dateDebut: alerteDateDebut || null,
          dateFin: alerteDateFin || null,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setAlerteTitre("");
      setAlerteMessage("");
      setAlerteLien("");
      setAlerteTexteBouton("");
      setAlerteDateDebut("");
      setAlerteDateFin("");
      setAlerteType("INFO");
      setAlerteAffichage("POPUP");
      await load();
      showToast("Alerte créée avec succès.", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de création");
    } finally {
      setAlerteSaving(false);
    }
  };

  const toggleAlerte = async (a: Alerte) => {
    try {
      await request(`/site-content/alertes/${a.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...a, actif: !a.actif }),
        headers: { "Content-Type": "application/json" },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de modification");
    }
  };

  const deleteAlerte = async (id: number) => {
    if (!confirm("Supprimer cette alerte ?")) return;
    try {
      await request(`/site-content/alertes/${id}`, { method: "DELETE" });
      await load();
      showToast("Alerte supprimée.", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de suppression");
    }
  };

  const addBanniere = async () => {
    if (!imageFile) { setError("Veuillez sélectionner une image."); return; }
    setUploading(true);
    try {
      const imagePath = await uploadFile(imageFile);
      await request("/site-content/bannieres", {
        method: "POST",
        body: JSON.stringify({
          image: imagePath,
          titre: titre.trim() || null,
          description: description.trim() || null,
          lien: lien.trim() || null,
          hauteur: Math.min(700, Math.max(240, Number(hauteur) || 420)),
          categorieId: categorieId ? Number(categorieId) : null,
          ordre: bannieres.length,
          actif: true,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setTitre("");
      setDescription("");
      setLien("");
      setHauteur("420");
      setCategorieId("");
      clearImage();
      setError("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'ajout");
    } finally {
      setUploading(false);
    }
  };

  const toggleBanniere = async (b: Banniere) => {
    try {
      await request(`/site-content/bannieres/${b.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...b, actif: !b.actif }),
        headers: { "Content-Type": "application/json" },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de modification");
    }
  };

  const updateBanniereHeight = async (b: Banniere, value: string) => {
    const hauteur = Math.min(700, Math.max(240, Number(value) || 420));
    try {
      await request(`/site-content/bannieres/${b.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...b, hauteur }),
        headers: { "Content-Type": "application/json" },
      });
      setBannieres((current) =>
        current.map((item) => item.id === b.id ? { ...item, hauteur } : item),
      );
      showToast("Hauteur de la bannière mise à jour.", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de modification");
    }
  };

  const updateBanniereCategory = async (b: Banniere, value: string) => {
    const categorieId = value ? Number(value) : null;
    try {
      await request(`/site-content/bannieres/${b.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...b, categorieId }),
        headers: { "Content-Type": "application/json" },
      });
      setBannieres((current) =>
        current.map((item) => item.id === b.id ? { ...item, categorieId } : item),
      );
      showToast("Catégorie de la bannière mise à jour.", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de modification");
    }
  };

  const deleteBanniere = async (id: number) => {
    if (!confirm("Supprimer cette bannière ?")) return;
    try {
      await request(`/site-content/bannieres/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de suppression");
    }
  };

  // ── Video handlers ──────────────────────────────────────────────────────────

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["video/mp4", "video/webm", "video/ogg"];
    if (!allowed.includes(file.type)) {
      showToast("Format non supporté. Utilisez MP4, WebM ou OGG.", "error");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      showToast("La vidéo ne doit pas dépasser 200 Mo.", "error");
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPosterPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearVideoForm = () => {
    setVideoFile(null);
    setVideoPreviewUrl("");
    setPosterFile(null);
    setPosterPreviewUrl("");
    setVideoTitre("");
    if (videoFileRef.current) videoFileRef.current.value = "";
    if (posterFileRef.current) posterFileRef.current.value = "";
  };

  const uploadVideo = async () => {
    if (!videoFile) { showToast("Veuillez sélectionner une vidéo.", "error"); return; }
    setVideoUploading(true);
    try {
      const videoUrl = await uploadFile(videoFile);
      let posterUrl: string | null = null;
      if (posterFile) {
        posterUrl = await uploadFile(posterFile);
      }
      await request("/site-content/videos", {
        method: "POST",
        body: JSON.stringify({ videoUrl, posterUrl, titre: videoTitre.trim() || null }),
        headers: { "Content-Type": "application/json" },
      });
      clearVideoForm();
      showToast("Vidéo ajoutée avec succès.", "success");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur d'upload", "error");
    } finally {
      setVideoUploading(false);
    }
  };

  const activateVideo = async (id: number) => {
    setVideoActionId(id);
    try {
      const previousActive = videos.find(v => v.actif && v.id !== id);
      await request(`/site-content/videos/${id}/activate`, { method: "PATCH" });
      await load();
      let msg = "Vidéo héro activée avec succès.";
      if (previousActive) msg += " La vidéo précédente a été désactivée.";
      showToast(msg, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur d'activation", "error");
    } finally {
      setVideoActionId(null);
    }
  };

  const deactivateVideo = async (id: number) => {
    setVideoActionId(id);
    try {
      await request(`/site-content/videos/${id}/deactivate`, { method: "PATCH" });
      await load();
      showToast("Vidéo désactivée.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur de désactivation", "error");
    } finally {
      setVideoActionId(null);
    }
  };

  const deleteVideo = async (id: number) => {
    if (!confirm("Supprimer cette vidéo héro ? Cette action est irréversible.")) return;
    setVideoActionId(id);
    try {
      await request(`/site-content/videos/${id}`, { method: "DELETE" });
      await load();
      showToast("Vidéo supprimée.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur de suppression", "error");
    } finally {
      setVideoActionId(null);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Contenu du site" />

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button onClick={load} className="ml-3 underline">
            Réessayer
          </button>
        </div>
      )}

      <h2 className="mb-5 text-xl font-semibold text-gray-800 dark:text-white">
        Contenu du site
      </h2>

      {/* ── Annonces Bar ────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 font-semibold dark:text-white">
          Phrases de la barre supérieure
        </h3>
        <div className="flex gap-2">
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAnnonce()}
            placeholder="Ex. Livraison gratuite dès 200 DT..."
            className="flex-1 rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={addAnnonce}
            disabled={saving}
            className="rounded-xl bg-brand-500 px-4 text-sm text-white disabled:opacity-60"
          >
            Ajouter
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {annonces.length === 0 && (
            <p className="text-sm text-gray-400">Aucune phrase enregistrée.</p>
          )}
          {annonces.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm dark:border-gray-700 dark:text-white"
            >
              <span>{a.texte}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleAnnonce(a)}
                  className={a.actif ? "text-green-600" : "text-gray-400"}
                >
                  {a.actif ? "Active" : "Inactive"}
                </button>
                <button onClick={() => deleteAnnonce(a.id)} className="text-red-500">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alertes Site ─────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🔔</span>
          <div>
            <h3 className="font-semibold dark:text-white">Alertes &amp; Pop-ups</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Affichez un message important sur le site (promo, fermeture, annonce). Si aucune alerte n&apos;est active, la pop-up par défaut &quot;Créer un compte&quot; s&apos;affiche.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700 mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Créer une nouvelle alerte
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Type</label>
              <select
                value={alerteType}
                onChange={e => setAlerteType(e.target.value as typeof alerteType)}
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="INFO">ℹ️ Info (bleu)</option>
                <option value="PROMO">🎉 Promo (violet)</option>
                <option value="WARNING">⚠️ Important (orange)</option>
                <option value="SUCCESS">✅ Nouveauté (vert)</option>
              </select>
            </div>
            {/* Affichage */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Mode d&apos;affichage</label>
              <select
                value={alerteAffichage}
                onChange={e => setAlerteAffichage(e.target.value as typeof alerteAffichage)}
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="POPUP">🪟 Pop-up centré</option>
                <option value="BANNER">📌 Bannière bas de page</option>
                <option value="TOAST">🔔 Toast (coin bas-droite)</option>
              </select>
            </div>
            {/* Titre */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Titre *</label>
              <input
                value={alerteTitre}
                onChange={e => setAlerteTitre(e.target.value)}
                placeholder="Ex: Promotion spéciale été 2026"
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            {/* Message */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Message *</label>
              <textarea
                value={alerteMessage}
                onChange={e => setAlerteMessage(e.target.value)}
                placeholder="Ex: -15% sur tous les appareils de mesure jusqu'au 31 août."
                rows={2}
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
              />
            </div>
            {/* Lien */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Lien du bouton (optionnel)</label>
              <input
                value={alerteLien}
                onChange={e => setAlerteLien(e.target.value)}
                placeholder="Ex: /catalogue ou https://..."
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            {/* Texte bouton */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Texte du bouton (optionnel)</label>
              <input
                value={alerteTexteBouton}
                onChange={e => setAlerteTexteBouton(e.target.value)}
                placeholder="Ex: Voir les offres"
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            {/* Dates */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Date de début (optionnel)</label>
              <input
                type="datetime-local"
                value={alerteDateDebut}
                onChange={e => setAlerteDateDebut(e.target.value)}
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Date de fin (optionnel)</label>
              <input
                type="datetime-local"
                value={alerteDateFin}
                onChange={e => setAlerteDateFin(e.target.value)}
                className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={addAlerte}
            disabled={alerteSaving}
            className="mt-4 flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {alerteSaving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {alerteSaving ? "Création..." : "🔔 Créer l'alerte"}
          </button>
        </div>

        {/* Alertes list */}
        {alertes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
            <p className="text-sm text-gray-400">Aucune alerte configurée.</p>
            <p className="text-xs text-gray-400 mt-1">L&apos;alerte par défaut &quot;Créer un compte&quot; s&apos;affichera sur le site.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertes.map(a => {
              const colors: Record<string, string> = { INFO: "#0ea5e9", PROMO: "#a855f7", WARNING: "#f97316", SUCCESS: "#22c55e" };
              const icons: Record<string, string> = { INFO: "ℹ️", PROMO: "🎉", WARNING: "⚠️", SUCCESS: "✅" };
              const affLabels: Record<string, string> = { POPUP: "🪟 Pop-up", BANNER: "📌 Bannière", TOAST: "🔔 Toast" };
              const color = colors[a.type] || "#0ea5e9";
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-4 transition-all ${a.actif ? "border-green-200 bg-green-50/40 dark:border-green-800 dark:bg-green-950/20" : "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-900"}`}
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl">{icons[a.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm dark:text-white">{a.titre}</p>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: color }}>{a.type}</span>
                          <span className="rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium dark:text-gray-300">{affLabels[a.affichage]}</span>
                          {a.actif && <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.message}</p>
                        {(a.dateDebut || a.dateFin) && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {a.dateDebut && `Du ${new Date(a.dateDebut).toLocaleDateString("fr-FR")}`}
                            {a.dateFin && ` au ${new Date(a.dateFin).toLocaleDateString("fr-FR")}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleAlerte(a)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${a.actif ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200" : "bg-green-500 text-white hover:bg-green-600"}`}
                      >
                        {a.actif ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => deleteAlerte(a.id)}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Vidéo Héro ───────────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🎬</span>
          <div>
            <h3 className="font-semibold dark:text-white">Vidéo Héro</h3>
            <p className="text-xs text-gray-500 mt-0.5">Une seule vidéo peut être active à la fois. Elle remplace l&apos;image du héro sur la page d&apos;accueil.</p>
          </div>
        </div>

        {/* Upload form */}
        <div className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700 mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ajouter une vidéo héro
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Video upload zone */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Fichier vidéo (MP4, WebM — max 200 Mo) *
              </label>
              {videoPreviewUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video
                    src={videoPreviewUrl}
                    controls
                    muted
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => { setVideoFile(null); setVideoPreviewUrl(""); if (videoFileRef.current) videoFileRef.current.value = ""; }}
                    className="absolute top-2 right-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow"
                  >
                    ✕ Changer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoFileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900"
                >
                  <span className="text-3xl">🎥</span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Cliquer pour choisir une vidéo</span>
                  <span className="text-xs text-gray-400">MP4, WebM — max 200 Mo</span>
                </button>
              )}
              <input ref={videoFileRef} type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoFileChange} className="hidden" />
            </div>

            {/* Poster + title */}
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Image de couverture (poster, optionnel)
                </label>
                {posterPreviewUrl ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={posterPreviewUrl} alt="Poster" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setPosterFile(null); setPosterPreviewUrl(""); if (posterFileRef.current) posterFileRef.current.value = ""; }}
                      className="absolute top-2 right-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => posterFileRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-6 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs text-gray-500">Ajouter un poster (recommandé)</span>
                  </button>
                )}
                <input ref={posterFileRef} type="file" accept="image/*" onChange={handlePosterFileChange} className="hidden" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Titre (optionnel, pour référence)
                </label>
                <input
                  value={videoTitre}
                  onChange={(e) => setVideoTitre(e.target.value)}
                  placeholder="Ex: Campagne été 2026"
                  className="w-full rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={uploadVideo}
            disabled={videoUploading || !videoFile}
            className="mt-4 flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {videoUploading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {videoUploading ? "Upload en cours..." : "Ajouter la vidéo héro"}
          </button>
        </div>

        {/* Videos list */}
        {videos.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune vidéo héro enregistrée.</p>
        ) : (
          <div className="space-y-4">
            {videos.map((v) => (
              <div
                key={v.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  v.actif
                    ? "border-green-300 bg-green-50/60 dark:border-green-700 dark:bg-green-950/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                  {/* Video preview */}
                  <div className="relative w-full sm:w-56 shrink-0 aspect-video rounded-lg overflow-hidden bg-black">
                    <video
                      src={imageFullUrl(v.videoUrl)}
                      poster={v.posterUrl ? imageFullUrl(v.posterUrl) : undefined}
                      muted
                      controls
                      className="w-full h-full object-contain"
                    />
                    {/* Status badge */}
                    <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${v.actif ? "bg-green-500 text-white" : "bg-gray-600 text-white"}`}>
                      {v.actif ? "● ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {/* Info + actions */}
                  <div className="flex flex-1 flex-col gap-3">
                    <div>
                      {v.titre && (
                        <p className="font-semibold text-sm text-gray-800 dark:text-white">{v.titre}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{v.videoUrl}</p>
                      <p className="text-xs text-gray-400">
                        Ajoutée le {new Date(v.creeLe).toLocaleDateString("fr-FR")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {v.actif ? (
                        <button
                          onClick={() => deactivateVideo(v.id)}
                          disabled={videoActionId === v.id}
                          className="rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                        >
                          {videoActionId === v.id ? "..." : "⏸ Désactiver"}
                        </button>
                      ) : (
                        <button
                          onClick={() => activateVideo(v.id)}
                          disabled={videoActionId === v.id}
                          className="rounded-lg bg-green-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {videoActionId === v.id ? "..." : "▶ Activer"}
                        </button>
                      )}

                      <a
                        href={imageFullUrl(v.videoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        ↗ Ouvrir
                      </a>

                      <button
                        onClick={() => deleteVideo(v.id)}
                        disabled={videoActionId === v.id}
                        className="rounded-lg bg-red-100 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        {videoActionId === v.id ? "..." : "🗑 Supprimer"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Bannières ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 font-semibold dark:text-white">Bannières</h3>

        {/* Form */}
        <div className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Ajouter une nouvelle bannière
          </p>

          {/* Image upload zone */}
          <div className="mb-4">
            {imagePreview ? (
              <div className="relative">
                <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Prévisualisation"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  onClick={clearImage}
                  className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-red-600"
                >
                  ✕ Changer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-10 transition-colors hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500"
              >
                <span className="text-3xl">🖼️</span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Cliquer pour choisir une image
                </span>
                <span className="text-xs text-gray-400">
                  JPG, PNG, WEBP — max 10 Mo
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Text fields */}
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre (optionnel)"
              className="rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              className="rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              placeholder="Lien (optionnel, ex: /catalogue)"
              className="rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <select
              value={categorieId}
              onChange={(e) => setCategorieId(e.target.value)}
              className="rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Toutes les catégories (Global)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>Catégorie: {c.nom}</option>
              ))}
            </select>
            <input
              type="number"
              min={240}
              max={700}
              step={10}
              value={hauteur}
              onChange={(e) => setHauteur(e.target.value)}
              placeholder="Hauteur (px)"
              className="rounded-xl border p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <button
            onClick={addBanniere}
            disabled={uploading || !imageFile}
            className="mt-3 flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {uploading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {uploading ? "Upload en cours..." : "Ajouter la bannière"}
          </button>
        </div>

        {/* Existing banners list */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bannieres.length === 0 && (
            <p className="text-sm text-gray-400 col-span-full">Aucune bannière enregistrée.</p>
          )}
          {bannieres.map((b) => (
            <div
              key={b.id}
              className={`overflow-hidden rounded-xl border transition-all ${
                b.actif
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                  : "border-gray-200 bg-gray-50 opacity-70 dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[3/1] w-full overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageFullUrl(b.image)}
                  alt={b.titre || "Bannière"}
                  className="h-full w-full object-cover"
                />
                {/* Status & Category badge */}
                <div className="absolute left-2 top-2 flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      b.actif
                        ? "bg-green-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {b.actif ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <span className="rounded-full bg-blue-600/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
                    {b.categorieId ? (categories.find(c => c.id === b.categorieId)?.nom || `Cat #${b.categorieId}`) : "Toutes"}
                  </span>
                </div>
              </div>

              <div className="p-3">
                {b.titre && (
                  <p className="truncate text-sm font-semibold dark:text-white">{b.titre}</p>
                )}
                {b.description && (
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {b.description}
                  </p>
                )}
                <div className="mt-3 space-y-2">
                  <label className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Catégorie</span>
                    <select
                      value={b.categorieId ?? ""}
                      onChange={(e) => void updateBanniereCategory(b, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Toutes (Global)</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Hauteur</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={240}
                        max={700}
                        step={10}
                        defaultValue={b.hauteur || 420}
                        onBlur={(e) => {
                          if (Number(e.target.value) !== (b.hauteur || 420)) {
                            void updateBanniereHeight(b, e.target.value);
                          }
                        }}
                        className="w-20 rounded-lg border px-2 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                      <span>px</span>
                    </div>
                  </label>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => toggleBanniere(b)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                      b.actif
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {b.actif ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => deleteBanniere(b.id)}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
