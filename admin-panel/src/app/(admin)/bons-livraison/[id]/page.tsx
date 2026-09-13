"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from "@/utils/api";

const API_URL = getApiUrl();

export default function BonLivraisonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [bl, setBl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [facturerLoading, setFacturerLoading] = useState(false);

  const fetchBL = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/bons-livraison/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBl(data);
      } else {
        throw new Error("Erreur de chargement");
      }
    } catch (err) {
      setError("Impossible de charger le bon de livraison");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBL();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/bons-livraison/admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut: newStatus })
      });
      if (res.ok) {
        fetchBL();
      } else {
        alert("Erreur lors de la mise à jour du statut");
      }
    } catch {
      alert("Erreur de connexion");
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error || !bl) return <div className="p-6 text-red-500">{error || "BL introuvable"}</div>;

  const clientName = bl.clientNom || (bl.utilisateur ? `${bl.utilisateur.nom} ${bl.utilisateur.prenom}` : "Client Inconnu");
  const date = new Date(bl.creeLe).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isFacture = bl.statut === "FACTURE";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/bons-livraison" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
              ← Retour
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {bl.code}
              <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {bl.statut}
              </span>
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-14">
            Créé le {date}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Updates */}
          {!isFacture && bl.statut !== "ANNULE" && (
            <select
              value=""
              onChange={(e) => { if(e.target.value) updateStatus(e.target.value); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Modifier statut...</option>
              <option value="PREPARE">Marquer Préparé</option>
              <option value="EXPEDIE">Marquer Expédié</option>
              <option value="LIVRE">Marquer Livré</option>
              <option value="ANNULE">Annuler</option>
            </select>
          )}

          {/* Facturer Button */}
          {!isFacture && bl.statut !== "ANNULE" ? (
             <button
                onClick={() => {
                   alert("Pour facturer, utilisez le bouton '+ Créer une facture' depuis la liste des factures en choisissant la source 'Bon de livraison'.");
                   router.push('/invoices');
                }}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg text-sm transition-colors"
             >
                Facturer ce BL
             </button>
          ) : bl.factures?.length > 0 ? (
             <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Déjà facturé : 
                {bl.factures.map((f: any) => (
                   <span key={f.id} className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                      {f.numero}
                   </span>
                ))}
             </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Client */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4">Informations Client</h3>
          <div className="space-y-3 text-sm">
            <p><span className="text-gray-500">Nom :</span> <span className="font-medium dark:text-white">{clientName}</span></p>
            {bl.clientMF && <p><span className="text-gray-500">Matricule Fiscal :</span> <span className="dark:text-white">{bl.clientMF}</span></p>}
            {bl.clientTel && <p><span className="text-gray-500">Téléphone :</span> <span className="dark:text-white">{bl.clientTel}</span></p>}
            {bl.clientEmail && <p><span className="text-gray-500">Email :</span> <span className="dark:text-white">{bl.clientEmail}</span></p>}
            {bl.clientAdresse && <p><span className="text-gray-500">Adresse :</span> <span className="dark:text-white">{bl.clientAdresse}</span></p>}
          </div>
        </div>

        {/* Info Commande */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4">Lien de Commande</h3>
          <div className="space-y-3 text-sm">
            {bl.commandeId ? (
              <>
                <p><span className="text-gray-500">Commande :</span> <Link href={`/orders/${bl.commandeId}`} className="font-medium text-brand-500 hover:underline">CMD-{bl.commandeId.toString().padStart(5, '0')}</Link></p>
                <p><span className="text-gray-500">Statut de la commande :</span> <span className="dark:text-white">{bl.commande?.statut}</span></p>
              </>
            ) : (
              <p className="text-gray-500 italic">Ce bon de livraison n'est lié à aucune commande.</p>
            )}
            {bl.dateLivraison && (
              <p><span className="text-gray-500">Date de livraison prévue :</span> <span className="dark:text-white">{new Date(bl.dateLivraison).toLocaleDateString()}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Lignes de Livraison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Désignation</th>
                <th className="px-5 py-3 font-semibold text-center">Qté Commandée</th>
                <th className="px-5 py-3 font-semibold text-center">Qté Livrée</th>
                <th className="px-5 py-3 font-semibold text-right">P.U HT</th>
                <th className="px-5 py-3 font-semibold text-right">TVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {bl.lignes?.map((ligne: any) => (
                <tr key={ligne.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-5 py-4 font-medium dark:text-white">
                    {ligne.designation}
                  </td>
                  <td className="px-5 py-4 text-center text-gray-500">
                    {ligne.quantiteCmd}
                  </td>
                  <td className="px-5 py-4 text-center font-bold text-gray-800 dark:text-white">
                    {ligne.quantiteLivree}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600 dark:text-gray-300">
                    {Number(ligne.prixUnitaireHT).toFixed(3)} TND
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600 dark:text-gray-300">
                    {Number(ligne.tauxTVA).toFixed(2)} %
                  </td>
                </tr>
              ))}
              {(!bl.lignes || bl.lignes.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-500">Aucune ligne</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
