"use client";
import React, { useState } from "react";

interface SupportMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: "Nouveau" | "Lu" | "Répondu";
}

export default function SupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 1,
      name: "Jean Dupont",
      email: "jean.dupont@example.com",
      subject: "Problème avec ma commande #1024",
      message: "Bonjour, je n'ai toujours pas reçu ma commande passée il y a 3 jours. Pouvez-vous vérifier ?",
      date: "2024-05-10T10:30:00",
      status: "Nouveau",
    },
    {
      id: 2,
      name: "Clinique des Lilas",
      email: "contact@clinique-lilas.fr",
      subject: "Demande de devis - Matériel IRM",
      message: "Nous souhaitons obtenir un devis pour l'achat de 2 machines IRM nouvelle génération. Merci de nous recontacter.",
      date: "2024-05-09T14:15:00",
      status: "Lu",
    },
    {
      id: 3,
      name: "Pharmacie Centrale",
      email: "pharmacie.centrale@test.com",
      subject: "Erreur de facturation",
      message: "La facture #F-2024-89 comporte une erreur sur la TVA. Pouvez-vous la corriger ?",
      date: "2024-05-08T09:00:00",
      status: "Répondu",
    }
  ]);

  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [reply, setReply] = useState("");

  const handleReply = () => {
    if (!reply.trim()) return;
    alert(`Réponse envoyée à ${selectedMessage?.email} :\n\n${reply}`);
    setReply("");
    
    // Marquer comme répondu (simulation)
    if (selectedMessage) {
      setMessages(messages.map(m => m.id === selectedMessage.id ? { ...m, status: "Répondu" } : m));
      setSelectedMessage({ ...selectedMessage, status: "Répondu" });
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
      
      {/* Liste des messages (Inbox) */}
      <div className="w-full md:w-1/3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Boîte de réception</h2>
          <span className="bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {messages.filter(m => m.status === "Nouveau").length} Nouveaux
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-brand-50 dark:bg-brand-900/20 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className={`text-sm font-semibold truncate pr-2 ${msg.status === 'Nouveau' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  {msg.name}
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(msg.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p className={`text-xs truncate mb-2 ${msg.status === 'Nouveau' ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                {msg.subject}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  msg.status === 'Nouveau' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  msg.status === 'Répondu' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {msg.status}
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
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                      {selectedMessage.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMessage.name}</p>
                      <p className="text-xs text-gray-500">{selectedMessage.email}</p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(selectedMessage.date).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
            
            {/* Contenu */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </div>
            </div>

            {/* Zone de réponse */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Répondre à {selectedMessage.name}</h3>
              <textarea 
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-900 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none mb-3"
                rows={4}
                placeholder="Écrivez votre réponse ici..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              ></textarea>
              <div className="flex justify-end">
                <button 
                  onClick={handleReply}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  Envoyer
                </button>
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
