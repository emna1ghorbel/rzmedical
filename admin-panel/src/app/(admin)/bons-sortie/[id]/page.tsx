"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { downloadBonSortiePdf, getApiUrl } from "@/utils/api";

const API_URL = getApiUrl();

type Produit = { id: number; nom: string; reference: string };
type Ligne = { id: number; quantite: number; produit: Produit };
type Commercial = { id: number; nom: string; prenom: string; email?: string | null };
type Inventaire = { id: number; code: string; statut: string };

type BonSortie = {
  id: number;
  code: string;
  statut: "BROUILLON" | "VALIDE" | "ANNULE";
  creeLe: string;
  commercial: Commercial;
  lignes: Ligne[];
  inventaires: Inventaire[];
};

export default function BonSortieDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bon, setBon] = useState<BonSortie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [objet, setObjet] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("rzm_token");
      const res = await fetch(`${API_URL}/stock-commercial/bons-sortie/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBon(await res.json());
      } else {
        const d = await res.json();
        setError(d.error || "Bon de sortie introuvable");
      }
    } catch (e) {
      setError("Erreur de connexion");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const openEmail = () => {
    if (!bon) return;
    setEmail(bon.commercial.email || "");
    setObjet(`Bon de sortie ${bon.code} - R and Z Medical`);
    setMessage(`Bonjour ${bon.commercial.prenom},\n\nVeuillez trouver ci-joint le bon de sortie ${bon.code}.\n\nCordialement,\nR and Z Medical`);
    setEmailError(null);
    setShowEmail(true);
  };

  const sendEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!bon) return;
    setSending(true);
    setEmailError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("rzm_token");
      const response = await fetch(`${API_URL}/stock-commercial/bons-sortie/${bon.id}/envoyer-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email, objet, message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Erreur lors de l'envoi de l'email");
      setShowEmail(false);
      alert("Email envoyé au commercial avec le PDF en pièce jointe.");
    } catch (err) { setEmailError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'email"); }
    finally { setSending(false); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Chargement...</div>;
  if (error || !bon) return <div className="p-10 text-center text-red-500">{error || "Introuvable"}</div>;

  return (
    <div>
      <PageBreadcrumb pageTitle={`Détails du Bon de Sortie : ${bon.code}`} />

      <div className="mb-6 flex items-center justify-between">
        <Link href="/bons-sortie" className="text-sm font-medium text-gray-500 hover:text-brand-500">
          ← Retour à la liste
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadBonSortiePdf(bon.id, bon.code).catch((err) => alert(err.message))} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Télécharger PDF
          </button>
          <button onClick={openEmail} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Envoyer au commercial
          </button>
          {bon.statut === "BROUILLON" && (
            <Link href={`/bons-sortie/${bon.id}/edit`} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Modifier
            </Link>
          )}
          {bon.statut === "VALIDE" && bon.inventaires.length > 0 && (
            <Link 
              href={`/bons-sortie/${bon.id}/inventaire`}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Voir Inventaire
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Résumé */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informations Générales</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Code</p>
              <p className="font-semibold text-gray-900 dark:text-white">{bon.code}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date de création</p>
              <p className="font-medium text-gray-900 dark:text-white">{new Date(bon.creeLe).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Commercial</p>
              <p className="font-medium text-gray-900 dark:text-white">{bon.commercial.prenom} {bon.commercial.nom}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Statut</p>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                bon.statut === "VALIDE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {bon.statut}
              </span>
            </div>
          </div>
        </div>

        {/* Lignes de produits */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Produits Sortis</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Référence</th>
                  <th className="px-4 py-3 font-semibold">Désignation</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantité Sortie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {bon.lignes.map(ligne => (
                  <tr key={ligne.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-500">{ligne.produit.reference}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{ligne.produit.nom}</td>
                    <td className="px-4 py-3 font-bold text-right text-brand-500">{ligne.quantite}</td>
                  </tr>
                ))}
                {bon.lignes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucun produit dans ce bon.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !sending && setShowEmail(false)}>
          <form onSubmit={sendEmail} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 space-y-4">
            <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">Envoyer le bon de sortie</h2><p className="text-xs text-gray-500">Le PDF du bon sera joint automatiquement.</p></div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email du commercial<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Objet<input required value={objet} onChange={(event) => setObjet(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" /></label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message<textarea required rows={5} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800" /></label>
            {emailError && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{emailError}</p>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowEmail(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600">Annuler</button><button disabled={sending} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{sending ? "Envoi..." : "Envoyer"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
