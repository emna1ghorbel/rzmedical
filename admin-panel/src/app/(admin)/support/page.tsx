"use client";
import React, { useEffect, useState } from "react";
import { getApiUrl } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";

interface SupportMessage {
  id: number;
  utilisateur?: { prenom?: string; nom?: string; email: string; telephone?: string | null };
  nomContact?: string | null;
  emailContact?: string | null;
  telephoneContact?: string | null;
  sujet: string;
  message: string;
  creeLe: string;
  statut: string;
  canalReponse: string;
  reponse?: string | null;
  messages?: Array<{ id: number; auteur: string; contenu: string; canal: string }>;
}

const API_URL = getApiUrl();

export default function SupportPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [reply, setReply] = useState("");
  const [channel, setChannel] = useState("SUPPORT");

  useEffect(() => {
    fetch(`${API_URL}/support/admin`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setMessages(data));
  }, [getToken]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    if (!selectedMessage) return;
    const response = await fetch(`${API_URL}/support/admin/${selectedMessage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ reponse: reply, canalReponse: channel }),
    });
    if (response.ok) {
      const updated = await response.json();
      setMessages((current) => current.map((message) => message.id === updated.id ? updated : message));
      setSelectedMessage(updated);
      setReply("");
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
      
      {/* Liste des messages (Inbox) */}
      <div className="w-full md:w-1/3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Boîte de réception</h2>
          <span className="bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {messages.filter(m => m.statut === "NOUVEAU").length} Nouveaux
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              onClick={() => { setSelectedMessage(msg); setChannel(!msg.utilisateur && msg.canalReponse === "SUPPORT" ? "EMAIL" : msg.canalReponse); }}
              className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-brand-50 dark:bg-brand-900/20 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`text-sm font-semibold truncate pr-2 ${msg.statut === 'NOUVEAU' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  {msg.utilisateur ? `${msg.utilisateur.prenom || ""} ${msg.utilisateur.nom || ""}` : msg.nomContact || msg.emailContact}
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(msg.creeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p className={`text-xs truncate mb-2 ${msg.statut === 'NOUVEAU' ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                {msg.sujet}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  msg.statut === 'NOUVEAU' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  msg.statut === 'REPONDU' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {msg.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Détail du message et réponse */}
      <div className="w-full md:w-2/3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col overflow-hidden">
        {selectedMessage ? (
          <>
            {/* Header message */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedMessage.sujet}</h2>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                      {(selectedMessage.utilisateur?.prenom || selectedMessage.nomContact || selectedMessage.emailContact || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMessage.utilisateur ? `${selectedMessage.utilisateur.prenom || ""} ${selectedMessage.utilisateur.nom || ""}` : selectedMessage.nomContact}</p>
                      <p className="text-xs text-gray-500">{selectedMessage.utilisateur?.email || selectedMessage.emailContact}</p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(selectedMessage.creeLe).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
            
            {/* Contenu */}
            <div className="p-6 flex-1 overflow-y-auto">
              {(selectedMessage.messages?.length ? selectedMessage.messages : [{ id: 0, auteur: "CLIENT", contenu: selectedMessage.message, canal: "SUPPORT" }]).map((entry) => <div key={entry.id} className={`mt-4 flex ${entry.auteur === "ADMIN" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl p-5 text-sm whitespace-pre-wrap ${entry.auteur === "ADMIN" ? "rounded-tr-sm bg-brand-500 text-white" : "rounded-tl-sm bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300"}`}>{entry.contenu}{entry.auteur === "ADMIN" && <p className="mt-2 text-xs text-brand-100">Réponse par {entry.canal}</p>}</div></div>)}
            </div>

            {/* Zone de réponse */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Répondre au client</h3>
              <textarea 
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-900 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none mb-3"
                rows={4}
                placeholder="Écrivez votre réponse ici..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              ></textarea>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="mb-3 rounded-lg border border-gray-300 p-2 text-sm">
                {selectedMessage.utilisateur && <option value="SUPPORT">Réponse dans le support</option>}
                <option value="EMAIL">Réponse par email</option>
                <option value="TELEPHONE">Réponse par téléphone</option>
              </select>
              <div className="flex justify-end">
                {channel === "EMAIL" ? <button
                  type="button"
                  onClick={() => void handleReply()}
                  disabled={!reply.trim()}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  Envoyer l&apos;email
                </button> : channel === "TELEPHONE" ? <a
                  href={selectedMessage.utilisateur?.telephone || selectedMessage.telephoneContact ? `tel:${selectedMessage.utilisateur?.telephone || selectedMessage.telephoneContact}` : undefined}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Appeler le client
                </a> : <button 
                  onClick={handleReply}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Enregistrer la réponse
                </button>}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Sélectionnez un message</p>
            <p className="text-sm mt-2">Cliquez sur un message dans la liste pour le lire et y répondre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
