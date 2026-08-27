"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ArrowRight } from "lucide-react";
import type { AlerteSite } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useCategory } from "@/providers/CategoryProvider";

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_ALERT: AlerteSite = {
  id: 0,
  type: "INFO",
  affichage: "POPUP",
  titre: "Rejoignez RZ Medical",
  message:
    "Créez votre compte pour profiter d'offres exclusives, suivre vos commandes et accéder à vos factures en ligne.",
  lien: "/inscription",
  texteBouton: "Créer un compte",
  actif: true,
  dateDebut: null,
  dateFin: null,
  creeLe: "",
};

const TOAST_DURATION_MS = 8000;

// ── Design tokens — one quiet accent per type, no icons, no labels ─────────────
// The "magic" lives in the glow behind the card and the motion, not in chrome.

const TYPE_STYLES = {
  INFO: { accent: "#0284C7", glow: "rgba(2,132,199,0.16)" },
  PROMO: { accent: "#0F766E", glow: "rgba(15,118,110,0.16)" },
  WARNING: { accent: "#B45309", glow: "rgba(180,83,9,0.16)" },
  SUCCESS: { accent: "#15803D", glow: "rgba(21,128,61,0.16)" },
} as const;

// ── Shared: focus trap for the modal popup ─────────────────────────────────────

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!active || !containerRef.current) return;
    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [active, containerRef]);
}

// ── Global keyframes (mounted once) ─────────────────────────────────────────────

function AlertKeyframes() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes rz-overlay-in { from { opacity: 0 } to { opacity: 1 } }
          @keyframes rz-modal-in {
            from { opacity: 0; transform: translateY(16px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes rz-glow-pulse {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50%      { opacity: 1;   transform: scale(1.06); }
          }
          @keyframes rz-banner-in {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
          @keyframes rz-toast-in {
            from { opacity: 0; transform: translateX(24px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes rz-progress {
            from { transform: scaleX(1); }
            to   { transform: scaleX(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .rz-anim { animation-duration: 0.01ms !important; }
          }
        `,
      }}
    />
  );
}

// ── Popup ────────────────────────────────────────────────────────────────────

function PopupAlert({ alert, onDismiss }: { alert: AlerteSite; onDismiss: () => void }) {
  const router = useRouter();
  const s = TYPE_STYLES[alert.type];
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(true, modalRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onDismiss]);

  return (
    <>
      <AlertKeyframes />
      <div
        onClick={onDismiss}
        className="rz-anim fixed inset-0 z-[9998] bg-slate-900/20 backdrop-blur-sm"
        style={{ animation: "rz-overlay-in 220ms ease both" }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rz-alert-title"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div className="relative" style={{ pointerEvents: "auto" }}>
          {/* Soft ambient glow behind the card — the one "magic" touch */}
          <div
            className="rz-anim pointer-events-none absolute -inset-6 -z-10 rounded-[32px] blur-2xl"
            style={{ background: s.glow, animation: "rz-glow-pulse 3.6s ease-in-out infinite" }}
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            className="rz-anim w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5"
            style={{ animation: "rz-modal-in 320ms cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <div className="p-8">
              <button
                onClick={onDismiss}
                aria-label="Fermer"
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              <h2
                id="rz-alert-title"
                className="mb-2.5 pr-6 text-[20px] font-bold leading-snug text-slate-900"
              >
                {alert.titre}
              </h2>
              <p className="mb-7 text-[14.5px] leading-relaxed text-slate-500">{alert.message}</p>

              <div className="flex items-center gap-3">
                {alert.lien && alert.texteBouton && (
                  <button
                    onClick={() => {
                      onDismiss();
                      router.push(alert.lien!);
                    }}
                    className="group flex flex-1 items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
                    style={{ background: s.accent }}
                  >
                    {alert.texteBouton}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                )}
                <button
                  onClick={onDismiss}
                  className={`rounded-xl border border-slate-200 px-5 py-2.5 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-50 ${
                    alert.lien && alert.texteBouton ? "" : "flex-1"
                  }`}
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Banner ───────────────────────────────────────────────────────────────────

function BannerAlert({ alert, onDismiss }: { alert: AlerteSite; onDismiss: () => void }) {
  const router = useRouter();
  const s = TYPE_STYLES[alert.type];

  return (
    <>
      <AlertKeyframes />
      <div
        role="alert"
        className="rz-anim fixed inset-x-0 bottom-0 z-[9999] border-t bg-white shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.12)]"
        style={{ borderTopColor: s.accent, animation: "rz-banner-in 360ms cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-3.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: s.accent }}
            aria-hidden="true"
          />
          <div className="min-w-[200px] flex-1">
            <p className="text-[14px] font-semibold text-slate-900">{alert.titre}</p>
            <p className="text-[13px] text-slate-500">{alert.message}</p>
          </div>
          <div className="flex items-center gap-2">
            {alert.lien && alert.texteBouton && (
              <button
                onClick={() => {
                  onDismiss();
                  router.push(alert.lien!);
                }}
                className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-transform active:scale-[0.98]"
                style={{ background: s.accent }}
              >
                {alert.texteBouton}
              </button>
            )}
            <button
              onClick={onDismiss}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function ToastAlert({ alert, onDismiss }: { alert: AlerteSite; onDismiss: () => void }) {
  const router = useRouter();
  const s = TYPE_STYLES[alert.type];

  useEffect(() => {
    const t = setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <>
      <AlertKeyframes />
      <div
        role="alert"
        className="rz-anim fixed bottom-6 right-6 z-[9999] w-[calc(100vw-3rem)] max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-900/5"
        style={{ animation: "rz-toast-in 320ms cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <div className="flex items-start gap-3 p-4">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ background: s.accent }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-slate-900">{alert.titre}</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{alert.message}</p>
            {alert.lien && alert.texteBouton && (
              <button
                onClick={() => {
                  onDismiss();
                  router.push(alert.lien!);
                }}
                className="mt-2.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98]"
                style={{ background: s.accent }}
              >
                {alert.texteBouton}
              </button>
            )}
          </div>
          <button
            onClick={onDismiss}
            aria-label="Fermer"
            className="shrink-0 text-slate-400 transition-colors hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>
        {/* Countdown progress bar */}
        <div className="h-[3px] w-full bg-slate-100">
          <div
            className="rz-anim h-full origin-left"
            style={{
              background: s.accent,
              animation: `rz-progress ${TOAST_DURATION_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SiteAlert({ alertes }: { alertes: AlerteSite[] }) {
  const [visible, setVisible] = useState(false);
  const { isAuthenticated, ready } = useAuth();
  const pathname = usePathname();
  const { categories } = useCategory();

  // Determine which alert to show (real DB alert takes priority over default)
  const hasRealAlert = alertes?.length > 0;
  const alert = hasRealAlert ? alertes[0] : DEFAULT_ALERT;

  // For the default "sign-up" alert, only show on exact category root pages (/nom-cat)
  const isOnCategoryPage = (() => {
    if (!pathname) return false;
    const segments = pathname.split("/").filter(Boolean);
    // Must be exactly /nom-de-cat (one segment only, not /nom-de-cat/produits/78)
    if (segments.length !== 1) return false;
    const firstSegment = segments[0];
    return categories.some(
      (c) =>
        c.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ===
        firstSegment.toLowerCase()
    );
  })();

  const shouldShow = hasRealAlert
    ? true // always show real admin alerts
    : ready && !isAuthenticated && isOnCategoryPage; // default sign-up alert: category page + not logged in

  useEffect(() => {
    if (!shouldShow) {
      setVisible(false);
      return;
    }
    // Reappears on every page load/refresh, even if it was closed before.
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, [alert.id, shouldShow]);

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  if (alert.affichage === "BANNER") return <BannerAlert alert={alert} onDismiss={handleDismiss} />;
  if (alert.affichage === "TOAST") return <ToastAlert alert={alert} onDismiss={handleDismiss} />;
  return <PopupAlert alert={alert} onDismiss={handleDismiss} />;
}