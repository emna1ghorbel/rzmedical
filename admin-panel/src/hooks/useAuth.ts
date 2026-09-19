"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";

// ── Global 401 interceptor ────────────────────────────────────────────────────
// Any API response with status 401 (token expired/invalid) triggers a forced
// logout + redirect to /signin, regardless of which page made the request.
let redirected = false;

function installAuthInterceptor() {
  if (typeof window === "undefined" || (window as any).__authInterceptorInstalled_v2) return;
  (window as any).__authInterceptorInstalled_v2 = true;

  if (!(window as any).__originalFetch) {
    (window as any).__originalFetch = window.fetch;
  }
  const originalFetch = (window as any).__originalFetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);

    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const isApi = typeof url === "string" && url.includes("/api/");
    const onSignin = window.location.pathname.startsWith("/signin");

    if (response.status === 401 && isApi && !onSignin && !redirected) {
      const token = localStorage.getItem("rzm_token");
      // Only act when a token existed (i.e. it just expired). Login/register
      // 401s happen without a token and must be ignored.
      if (token) {
        redirected = true;
        localStorage.removeItem("rzm_token");
        localStorage.removeItem("rzm_user");
        const current = window.location.pathname + window.location.search;
        window.location.href = `/signin?session=expired&redirect=${encodeURIComponent(current)}`;
      }
    }

    return response;
  };
}

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    installAuthInterceptor();
  }, []);

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
