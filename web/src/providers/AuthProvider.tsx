"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthResponse, Utilisateur } from "@/lib/types";
import { ApiError, getMe } from "@/lib/api";

const TOKEN_KEY = "rz_token";
const USER_KEY = "rz_user";

interface AuthContextValue {
  token: string | null;
  user: Utilisateur | null;
  ready: boolean; // true une fois l'hydratation localStorage terminée
  isAuthenticated: boolean;
  login: (res: AuthResponse) => void;
  logout: () => void;
  setUser: (user: Utilisateur) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUserState] = useState<Utilisateur | null>(null);
  const [ready, setReady] = useState(false);

  // Hydratation depuis localStorage (client uniquement)
  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const u = localStorage.getItem(USER_KEY);
      if (t) setToken(t);
      if (u) setUserState(JSON.parse(u) as Utilisateur);
    } catch {
      /* stockage indisponible : on démarre déconnecté */
    }
    setReady(true);
  }, []);

  const login = useCallback((res: AuthResponse) => {
    setToken(res.token);
    setUserState(res.user);
    try {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setUser = useCallback((u: Utilisateur) => {
    setUserState(u);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const fresh = await getMe(token);
      setUser(fresh);
    } catch (err) {
      // Jeton expiré/invalide → on déconnecte proprement
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout();
      }
    }
  }, [token, setUser, logout]);

  // Au montage, si un jeton existe, on rafraîchit le profil (remise à jour, invalidation…)
  useEffect(() => {
    if (ready && token) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Synchronisation entre onglets (déconnexion propagée)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) {
          setToken(null);
          setUserState(null);
        } else {
          setToken(e.newValue);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      ready,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setUser,
      refresh,
    }),
    [token, user, ready, login, logout, setUser, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
