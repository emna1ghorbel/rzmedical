"use client";

import React, { useState, useEffect } from "react";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();

interface Service {
  id: number;
  label: string;
  actif: boolean;
}

export default function ServicesConfigPage() {
  const { getToken } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchServices = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (err) {
      setError("Erreur lors du chargement des services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: newLabel }),
      });
      if (res.ok) {
        setNewLabel("");
        fetchServices();
      } else {
        const err = await res.json();
        setError(err.error || "Erreur d'ajout");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: number, currentActif: boolean) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actif: !currentActif }),
      });
      if (res.ok) {
        fetchServices();
      }
    } catch {
      setError("Erreur de modification");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce service ?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchServices();
      }
    } catch {
      setError("Erreur de suppression");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Configuration des Services
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Ajouter un service
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Nom du service
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex: Frais de livraison, Prestation..."
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-black outline-none focus:border-brand-500 focus-visible:shadow-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={adding || !newLabel.trim()}
                className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-white font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {adding ? "Ajout en cours..." : "Ajouter le service"}
              </button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Liste des services
              </h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : services.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aucun service configuré</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Service</th>
                      <th className="px-6 py-3 font-medium text-center">Statut</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {service.label}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleActive(service.id, service.actif)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                              service.actif
                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${service.actif ? "bg-green-500" : "bg-gray-500"}`}></span>
                            {service.actif ? "Actif" : "Inactif"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-500/10 p-2 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
