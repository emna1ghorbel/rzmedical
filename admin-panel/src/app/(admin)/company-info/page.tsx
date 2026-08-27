"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { API_URL } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function CompanyInfoPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    nomSociete: "",
    telephone: "",
    email: "",
    adresse: "",
    siteWeb: "",
  });
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/company-info`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          nomSociete: data.nomSociete || "",
          telephone: data.telephone || "",
          email: data.email || "",
          adresse: data.adresse || "",
          siteWeb: data.siteWeb || "",
        });
        setLogoUrl(data.logoUrl);
      }
    } catch (err) {
      console.error("Erreur chargement infos société:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const data = new FormData();
    data.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/upload/single`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: data,
      });

      if (!res.ok) throw new Error("Erreur lors de l'upload");

      const result = await res.json();
      setLogoUrl(result.url);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Erreur lors de l'upload du logo." });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}/company-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ...formData, logoUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Erreur ${res.status}`);
      }
      
      setMessage({ type: "success", text: "Informations mises à jour avec succès !" });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Une erreur est survenue lors de la sauvegarde.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageBreadcrumb pageTitle="Informations de la Société" />

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm mt-6">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section Logo */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Logo de la boutique</h3>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden relative">
                {logoUrl ? (
                  <img src={logoUrl.startsWith('http') ? logoUrl : `${API_URL.replace('/api', '')}${logoUrl}`} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-gray-400 text-sm text-center px-2">Aucun logo</span>
                )}
              </div>
              
              <div>
                <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block font-medium">
                  {uploading ? "Upload en cours..." : "Changer de logo"}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Format recommandé : PNG transparent.
                </p>
              </div>
            </div>
          </div>

          {/* Section Infos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la société</label>
              <input 
                type="text" 
                value={formData.nomSociete}
                onChange={e => setFormData({...formData, nomSociete: e.target.value})}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input 
                type="text" 
                value={formData.telephone}
                onChange={e => setFormData({...formData, telephone: e.target.value})}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de contact</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Web</label>
              <input 
                type="url" 
                value={formData.siteWeb}
                onChange={e => setFormData({...formData, siteWeb: e.target.value})}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
              <textarea 
                value={formData.adresse}
                onChange={e => setFormData({...formData, adresse: e.target.value})}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
