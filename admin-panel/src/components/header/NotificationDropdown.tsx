"use client";
import { getApiUrl, getBaseUrl } from "@/utils/api";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "@/hooks/useAuth";

const API_URL = getApiUrl();
const BASE_URL = getBaseUrl();

interface Notification {
  id: string;
  type: "user" | "order" | "stock";
  title: string;
  message: string;
  photo: string | null;
  date: string;
  link: string;
  severity?: "info" | "warning" | "error" | "success";
  extra?: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"all" | "order" | "stock" | "user">("all");
  const { getToken } = useAuth();

  // Charger les IDs lus depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("rz_read_notifs");
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      // Ignorer silencieusement les erreurs réseau (ex: serveur backend en cours de redémarrage)
      // pour éviter que Next.js n'affiche un overlay d'erreur bloquant toutes les 60 secondes.
    }
  }, [getToken]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("rz_read_notifs", JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const updated = new Set(prev).add(id);
      try {
        localStorage.setItem("rz_read_notifs", JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    return n.type === activeTab;
  });

  const getPhotoUrl = (p: string | null) => {
    if (p) return p.startsWith("/") ? BASE_URL + p : p;
    return null;
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
      const diffInSeconds = (new Date(dateStr).getTime() - new Date().getTime()) / 1000;
      
      if (Math.abs(diffInSeconds) < 60) return "À l'instant";
      if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute');
      if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
      return rtf.format(Math.round(diffInSeconds / 86400), 'day');
    } catch {
      return "Récemment";
    }
  };

  const getTypeIcon = (type: string, severity?: string) => {
    if (type === "stock") {
      return (
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
          severity === "error"
            ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
            : "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
        }`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
      );
    }
    if (type === "order") {
      return (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </span>
      );
    }
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </span>
    );
  };

  return (
    <div className="relative">
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="fixed inset-x-3 top-16 z-50 mt-1 flex max-h-[85vh] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[410px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <h5 className="text-base font-semibold text-gray-900 dark:text-white">
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
              >
                Tout marquer lu
              </button>
            )}
            <button
              onClick={closeDropdown}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 py-2 border-b border-gray-100 dark:border-gray-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-brand-500 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("order")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              activeTab === "order"
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Commandes ({notifications.filter(n => n.type === "order").length})
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              activeTab === "stock"
                ? "bg-amber-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Stock ({notifications.filter(n => n.type === "stock").length})
          </button>
          <button
            onClick={() => setActiveTab("user")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              activeTab === "user"
                ? "bg-emerald-600 text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            Clients ({notifications.filter(n => n.type === "user").length})
          </button>
        </div>

        {/* Notifications List */}
        <ul className="flex flex-col h-auto max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60 py-1">
          {filteredNotifications.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aucune notification</p>
              <p className="text-xs text-gray-400 mt-1">Vous êtes à jour dans cette catégorie</p>
            </li>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !readIds.has(notif.id);
              const avatar = getPhotoUrl(notif.photo);

              return (
                <li key={notif.id} className={`py-1.5 ${isUnread ? "bg-brand-50/30 dark:bg-brand-950/20 rounded-xl px-1" : ""}`}>
                  <DropdownItem
                    tag="a"
                    href={notif.link}
                    onItemClick={() => {
                      markAsRead(notif.id);
                      closeDropdown();
                    }}
                    className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-gray-100/80 dark:hover:bg-white/5 w-full text-left"
                  >
                    {avatar ? (
                      <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatar}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      getTypeIcon(notif.type, notif.severity)
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${isUnread ? "font-bold text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-300"}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {getRelativeTime(notif.date)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            notif.type === "stock"
                              ? notif.severity === "error"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                              : notif.type === "order"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          }`}
                        >
                          {notif.type === "stock" ? "Stock" : notif.type === "order" ? "Commande" : "Client"}
                        </span>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        )}
                      </div>
                    </div>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer */}
        <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          <Link
            href="/orders"
            onClick={closeDropdown}
            className="flex-1 text-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors"
          >
            Commandes
          </Link>
          <Link
            href="/products"
            onClick={closeDropdown}
            className="flex-1 text-center rounded-xl bg-brand-500 hover:bg-brand-600 py-2 text-xs font-semibold text-white transition-colors"
          >
            Produits & Stock
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
