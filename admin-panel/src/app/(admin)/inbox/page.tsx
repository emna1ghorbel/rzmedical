"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface Email {
  id: number;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  date: string;
  isStarred: boolean;
  isUnread: boolean;
}

interface EmailDetail {
  id: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  html: string;
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("Inbox");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();
  
  // Selection state
  const [selectedEmails, setSelectedEmails] = useState<number[]>([]);
  
  // Viewing state
  const [viewingEmailId, setViewingEmailId] = useState<number | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeText, setComposeText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchEmails = useCallback(async (folder = selectedFolder) => {
    setLoading(true);
    setError(null);
    setSelectedEmails([]);
    setViewingEmailId(null);
    try {
      const res = await fetch(`${API_URL}/inbox?folder=${encodeURIComponent(folder)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Erreur lors de la récupération des emails.");
      const data = await res.json();
      setEmails(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }, [getToken, selectedFolder]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleFolderClick = (folder: string) => {
    setSelectedFolder(folder);
    fetchEmails(folder);
  };

  const handleAction = async (action: string, uids: number[]) => {
    if (uids.length === 0) return;
    try {
      const res = await fetch(`${API_URL}/inbox/action`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ action, uids, folder: selectedFolder })
      });
      
      if (res.ok) {
        // Optimistic update
        if (action === 'read' || action === 'unread') {
          setEmails(emails.map(e => uids.includes(e.id) ? { ...e, isUnread: action === 'unread' } : e));
        } else if (action === 'star' || action === 'unstar') {
          setEmails(emails.map(e => uids.includes(e.id) ? { ...e, isStarred: action === 'star' } : e));
        } else if (action === 'trash') {
          setEmails(emails.filter(e => !uids.includes(e.id)));
          setSelectedEmails([]);
          if (viewingEmailId && uids.includes(viewingEmailId)) setViewingEmailId(null);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'action");
    }
  };

  const handleViewEmail = async (id: number) => {
    setViewingEmailId(id);
    setLoadingDetail(true);
    setEmailDetail(null);
    
    // Mark as read immediately in UI
    const emailToView = emails.find(e => e.id === id);
    if (emailToView?.isUnread) {
      handleAction('read', [id]);
    }

    try {
      const res = await fetch(`${API_URL}/inbox/${id}?folder=${encodeURIComponent(selectedFolder)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmailDetail(data);
      } else {
        alert("Erreur de chargement");
        setViewingEmailId(null);
      }
    } catch (e) {
      console.error(e);
      setViewingEmailId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/inbox/send`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ to: composeTo, subject: composeSubject, text: composeText })
      });
      if (res.ok) {
        alert("Email envoyé avec succès !");
        setIsComposing(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeText("");
      } else {
        alert("Erreur lors de l'envoi.");
      }
    } catch (err) {
      alert("Erreur serveur.");
    } finally {
      setSending(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(e => e.id));
    }
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedEmails.includes(id)) {
      setSelectedEmails(selectedEmails.filter(i => i !== id));
    } else {
      setSelectedEmails([...selectedEmails, id]);
    }
  };

  const toggleStar = (id: number, isStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    handleAction(isStarred ? 'unstar' : 'star', [id]);
  };

  const folders = [
    { name: "Inbox", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> },
    { name: "Sent", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> },
    { name: "Drafts", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> },
    { name: "Spam", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> },
    { name: "Trash", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar / Menu */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
        <button 
          onClick={() => setIsComposing(true)}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-theme-xs flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          Compose
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-theme-sm overflow-y-auto">
          {/* MAILBOX */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Mailbox</h3>
            <ul className="flex flex-col gap-1">
              {folders.map(folder => (
                <li key={folder.name}>
                  <button 
                    onClick={() => handleFolderClick(folder.name)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-colors ${selectedFolder === folder.name ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-3">
                      {folder.icon}
                      {folder.name}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-theme-sm overflow-hidden flex flex-col relative">
        
        {viewingEmailId ? (
          // --- VIEW EMAIL ---
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <button 
                onClick={() => setViewingEmailId(null)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Retour
              </button>
              <div className="flex gap-2">
                <button onClick={() => handleAction('trash', [viewingEmailId])} className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Corbeille">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {loadingDetail ? (
                 <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" /></div>
              ) : emailDetail ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{emailDetail.subject}</h2>
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                        {emailDetail.from.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{emailDetail.from}</div>
                        <div className="text-xs text-gray-500">À: {emailDetail.to}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(emailDetail.date).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  
                  {/* Email Body HTML renderer */}
                  <div 
                    className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: emailDetail.html }}
                  />
                </>
              ) : (
                <div className="text-red-500">Erreur de chargement.</div>
              )}
            </div>
          </div>
        ) : (
          // --- INBOX LIST ---
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  checked={selectedEmails.length > 0 && selectedEmails.length === emails.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer" 
                />
                
                {selectedEmails.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <button onClick={() => handleAction('trash', selectedEmails)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Delete">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                    <button onClick={() => handleAction('read', selectedEmails)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Mark as Read">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedEmails.length > 0 ? `${selectedEmails.length} sélectionnés` : `${emails.length} emails`}
                </span>
                <button onClick={() => fetchEmails()} className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" title="Actualiser">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 1.25-10.66L2 6"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mb-4" />
                  <p className="text-sm">Connexion à Gmail...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-500 p-4 text-center">
                  {error}
                </div>
              ) : emails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>Aucun email trouvé.</p>
                </div>
              ) : (
                emails.map(email => (
                  <div 
                    key={email.id} 
                    onClick={() => handleViewEmail(email.id)}
                    className={`group flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedEmails.includes(email.id) ? 'bg-brand-50 dark:bg-brand-900/20' : email.isUnread ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}
                  >
                    <div className="flex items-center gap-3 shrink-0">
                      <input 
                        type="checkbox" 
                        checked={selectedEmails.includes(email.id)}
                        onChange={(e) => toggleSelect(email.id, e as any)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 cursor-pointer" 
                      />
                      <button 
                        onClick={(e) => toggleStar(email.id, email.isStarred, e)}
                        className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${email.isStarred ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={email.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      </button>
                    </div>
                    <div className={`w-40 shrink-0 text-sm truncate ${email.isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`} title={email.sender}>
                      {email.sender}
                    </div>
                    <div className="flex-1 flex items-center gap-2 truncate text-sm">
                      <span className={`truncate ${email.isUnread ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                        {email.subject}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 px-2">-</span>
                      <span className="text-gray-500 dark:text-gray-500 truncate" title={email.snippet}>
                        {email.snippet}
                      </span>
                    </div>
                    <div className={`shrink-0 text-xs w-24 text-right ${email.isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {new Date(email.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* COMPOSE MODAL */}
      {isComposing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-theme-lg flex flex-col overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-white">Nouveau Message</h3>
              <button onClick={() => setIsComposing(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="flex flex-col flex-1">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center">
                <span className="text-gray-500 text-sm w-12">À :</span>
                <input 
                  type="email" 
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white" 
                  placeholder="exemple@email.com"
                />
              </div>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center">
                <span className="text-gray-500 text-sm w-12">Objet :</span>
                <input 
                  type="text" 
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white" 
                />
              </div>
              <textarea 
                required
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                className="flex-1 p-4 bg-transparent outline-none text-sm text-gray-800 dark:text-white min-h-[300px] resize-none"
                placeholder="Écrivez votre message..."
              ></textarea>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setIsComposing(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Annuler
                </button>
                <button type="submit" disabled={sending} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {sending ? 'Envoi...' : (
                    <>
                      <span>Envoyer</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
