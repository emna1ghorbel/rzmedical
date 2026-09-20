"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * Applies the client-side session check to every route, including the
 * application not-found page. Authentication state currently lives in
 * localStorage, so a server-side route guard cannot inspect it.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  useAuth();

  return children;
}
