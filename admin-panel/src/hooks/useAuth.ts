"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("rzm_token");
    const isAuthPage = pathname?.startsWith("/signin") || pathname?.startsWith("/signup");

    if (!token && !isAuthPage) {
      router.replace("/signin");
    }
  }, [pathname, router]);

  const logout = useCallback(async () => {
    localStorage.removeItem("rzm_token");
    localStorage.removeItem("rzm_user");
    window.location.href = "/signin";
  }, []);

  const getUser = useCallback(() => {
    try {
      const u = localStorage.getItem("rzm_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("rzm_token");
  }, []);

  return { logout, getUser, getToken };
}
