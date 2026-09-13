"use client";

import { useState } from "react";
import { Search, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { API_URL } from "@/lib/api";

interface OrderTrackingData {
  code: string;
  statut: string;
  dateCommande: string;
}

export function TrackingForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderTrackingData | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError("Veuillez saisir un numéro de commande");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch(`${API_URL}/api/orders/public/track/${encodeURIComponent(code.trim())}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Commande introuvable. Vérifiez votre numéro.");
        }
        throw new Error("Erreur lors de la recherche du colis");
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (statut: string) => {
    switch (statut) {
      case "LIVREE":
        return { color: "text-emerald-500", bg: "bg-emerald-500/10", icon: <CheckCircle2 className="w-5 h-5" />, label: "Livrée" };
      case "CONFIRMEE":
        return { color: "text-blue-500", bg: "bg-blue-500/10", icon: <Truck className="w-5 h-5" />, label: "Confirmée" };
      case "ANNULEE":
        return { color: "text-red-500", bg: "bg-red-500/10", icon: <XCircle className="w-5 h-5" />, label: "Annulée" };
      case "EN_ATTENTE":
      default:
        return { color: "text-amber-500", bg: "bg-amber-500/10", icon: <Clock className="w-5 h-5" />, label: "En attente" };
    }
  };

  return (
    <div>
      <form onSubmit={handleTrack} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Numéro de commande</label>
          <input 
            type="text" 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: CMD-2026-0001"
            className="w-full bg-navy-900 border border-navy-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-azure-500 placeholder:text-slate-600 uppercase" 
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-azure-600 hover:bg-azure-700 text-white font-bold py-3 rounded-md transition disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Suivre ma livraison
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-md text-center">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-5 bg-navy-950 rounded-xl border border-navy-700">
          <div className="text-sm text-slate-400 mb-3">Résultat pour : <span className="text-white font-medium">{result.code}</span></div>
          
          <div className={`flex items-center gap-3 p-3 rounded-lg ${getStatusDisplay(result.statut).bg} ${getStatusDisplay(result.statut).color}`}>
            {getStatusDisplay(result.statut).icon}
            <span className="font-bold text-lg">{getStatusDisplay(result.statut).label}</span>
          </div>
          
          <div className="mt-4 text-xs text-slate-500">
            Date de commande : {new Date(result.dateCommande).toLocaleDateString("fr-FR", { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  );
}
