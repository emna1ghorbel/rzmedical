"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION = 4200;

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircleIcon; accent: string; iconColor: string }
> = {
  success: {
    icon: CheckCircleIcon,
    accent: "border-l-success",
    iconColor: "text-success",
  },
  error: {
    icon: AlertTriangleIcon,
    accent: "border-l-error",
    iconColor: "text-error",
  },
  info: {
    icon: InfoIcon,
    accent: "border-l-azure-500",
    iconColor: "text-azure-500",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m) => toast(m, "success"),
      error: (m) => toast(m, "error"),
      info: (m) => toast(m, "info"),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex flex-col items-center gap-2 px-4 sm:left-auto sm:right-4 sm:items-end sm:px-0"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant];
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-l-4 bg-surface px-4 py-3 shadow-lg animate-toast-in",
                style.accent,
              )}
            >
              <Icon size={20} className={cn("mt-0.5", style.iconColor)} />
              <p className="flex-1 text-sm leading-snug text-foreground">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fermer la notification"
                className="-mr-1 -mt-0.5 rounded-md p-1 text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <XIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans <ToastProvider>");
  return ctx;
}
