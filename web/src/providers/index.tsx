"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";
import { ToastProvider } from "./ToastProvider";
import { UIProvider } from "./UIProvider";

/** Compose les providers client montés à la racine de l'application. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <UIProvider>{children}</UIProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
