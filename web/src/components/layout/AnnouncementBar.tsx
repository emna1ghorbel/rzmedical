"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type AnnonceSite = {
  texte: string;
  actif: boolean;
};

const EMAIL       = "randzmedical@outlook.com";
const TEL_DISPLAY = "+216 28 113 131";
const TEL_HREF    = "+21628113131";

const DEFAULT_PHRASES = [
  "Livraison partout en Tunisie",
  "Paiement a la livraison disponible",
  "Une facture pour chaque commande",
];

const TONES = [
  { light: "#7dd3fc", accent: "#38bdf8", sweep: "rgba(125,211,252,0.55)" },
  { light: "#6ee7b7", accent: "#2dd4bf", sweep: "rgba(110,231,183,0.55)" },
  { light: "#c4b5fd", accent: "#a78bfa", sweep: "rgba(196,181,253,0.55)" },
] as const;

const SHOW_MS = 3500;
const ANIM_MS = 480;

function useReducedMotion(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setV(mql.matches);
    const fn = (e: MediaQueryListEvent) => setV(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, []);
  return v;
}

export function AnnouncementBar({ annonces }: { annonces: AnnonceSite[] }) {
  const reduced = useReducedMotion();

  const phrases = useMemo(() => {
    const list = (annonces || [])
      .filter((a) => a.actif && a.texte.trim().length > 0)
      .map((a) => a.texte.trim());
    return list.length > 0 ? list : DEFAULT_PHRASES;
  }, [annonces]);

  const count = phrases.length;

  /*
   * "slot" est un compteur qui monte a chaque changement de phrase.
   * On affiche DEUX elements en meme temps pendant la transition :
   *   - l ancien (slot-1) qui part vers le haut
   *   - le nouveau (slot)  qui arrive par le bas
   * Grace a key={slot}, React cree de nouveaux noeuds DOM a chaque fois
   * et les animations @keyframes jouent automatiquement.
   */
  const [slot,      setSlot]      = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const pausedRef = useRef(false);

  // index de la phrase courante = slot % count
  const curIndex = slot % count;
  const prevIndex = (slot - 1 + count) % count;

  useEffect(() => {
    if (dismissed || count <= 1) return;
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;

    const cycle = () => {
      t = setTimeout(() => {
        if (cancelled) return;
        if (pausedRef.current) { cycle(); return; }
        setSlot((s) => s + 1);
        cycle();
      }, SHOW_MS);
    };

    cycle();
    return () => { cancelled = true; clearTimeout(t); };
  }, [count, dismissed]);

  if (dismissed) return null;

  const tone    = TONES[curIndex % TONES.length];
  const prevTone = TONES[prevIndex % TONES.length];

  const sweepGradient = `linear-gradient(100deg,
    transparent 0%,
    ${tone.sweep} 30%,
    rgba(255,255,255,0.92) 50%,
    ${tone.sweep} 70%,
    transparent 100%)`;

  const barShadow = `inset 0 -2px 0 0 ${tone.accent}55`;

  // gradient du texte : chaque phrase a sa propre couleur
  const gradient = (t: typeof tone) =>
    `linear-gradient(90deg, #ffffff 0%, ${t.light} 30%, ${t.accent} 58%, #ffffff 82%)`;

  const isFirstSlot = slot === 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rzSlideOut {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(-130%); opacity: 0; }
        }
        @keyframes rzSlideIn {
          from { transform: translateY(130%);  opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes rzSweep {
          0%   { opacity: 0; transform: translateX(-110%); }
          30%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(110%);  }
        }
        @keyframes rzGlow {
          0%   { filter: brightness(1); }
          40%  { filter: brightness(1.7) drop-shadow(0 0 6px var(--rz-light)); }
          100% { filter: brightness(1); }
        }
        @keyframes rzSpark {
          0%   { filter: drop-shadow(0 0 0 transparent); transform: rotate(0) scale(1); }
          45%  { filter: drop-shadow(0 0 10px var(--rz-accent)); transform: rotate(52deg) scale(1.25); }
          100% { filter: drop-shadow(0 0 0 transparent); transform: rotate(90deg) scale(1); }
        }
      `}} />

      <div
        style={{ boxShadow: barShadow, transition: "box-shadow 600ms ease",
                 "--rz-light": tone.light, "--rz-accent": tone.accent } as React.CSSProperties}
        className="relative overflow-hidden bg-[#0C2340] text-white"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {/* Reflet lumineux — rejoue a chaque slot */}
        {!reduced && (
          <span
            key={`sweep-${slot}`}
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: sweepGradient,
              animation: `rzSweep ${ANIM_MS * 2}ms cubic-bezier(0.16,1,0.3,1) both`,
            }}
          />
        )}

        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* GAUCHE */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">

            {/* Etoile — re-anime a chaque slot */}
            <svg
              key={`spark-${slot}`}
              width="14" height="14" viewBox="0 0 24 24"
              fill={tone.accent} aria-hidden="true"
              className="shrink-0"
              style={reduced ? undefined : { animation: "rzSpark 700ms ease-out both" }}
            >
              <path d="M12 2l1.9 5.6a3 3 0 0 0 1.9 1.9L21.4 11.4a.6.6 0 0 1 0 1.2l-5.6 1.9a3 3 0 0 0-1.9 1.9L12 22l-1.9-5.6a3 3 0 0 0-1.9-1.9L2.6 12.6a.6.6 0 0 1 0-1.2l5.6-1.9a3 3 0 0 0 1.9-1.9z" />
            </svg>

            {/* Zone de texte : overflow:hidden pour masquer haut et bas */}
            <div
              className="relative h-9 min-w-0 flex-1 overflow-hidden"
              aria-live="polite" aria-atomic="true"
            >
              {/* Ancienne phrase — sort vers le haut (seulement si on a deja change) */}
              {!reduced && !isFirstSlot && (
                <p
                  key={`old-${slot}`}
                  aria-hidden="true"
                  style={{
                    position: "absolute", inset: 0,
                    fontSize: "12px", fontWeight: 500,
                    lineHeight: "2.25rem", letterSpacing: "0.025em",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    backgroundImage: gradient(prevTone),
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    animation: `rzSlideOut ${ANIM_MS}ms cubic-bezier(0.4,0,0.6,1) both`,
                    pointerEvents: "none",
                  }}
                >
                  {phrases[prevIndex]}
                </p>
              )}

              {/* Nouvelle phrase — entre par le bas */}
              <p
                key={`new-${slot}`}
                style={{
                  position: "absolute", inset: 0,
                  fontSize: "12px", fontWeight: 500,
                  lineHeight: "2.25rem", letterSpacing: "0.025em",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  backgroundImage: gradient(tone),
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  animation: reduced || isFirstSlot
                    ? "none"
                    : `rzSlideIn ${ANIM_MS}ms cubic-bezier(0.16,1,0.3,1) both,
                       rzGlow 1000ms ease-out both`,
                }}
              >
                {phrases[curIndex]}
              </p>
            </div>
          </div>

          {/* DROITE */}
          <div className="flex shrink-0 items-center gap-3 text-[12px] font-medium tracking-wide sm:gap-4 sm:text-[12.5px]">
            <a href={`mailto:${EMAIL}`}
               className="flex items-center gap-1.5 rounded transition-colors hover:text-sky-300 focus-visible:outline-none"
               aria-label={`Email ${EMAIL}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span className="hidden sm:inline">{EMAIL}</span>
            </a>

            <span aria-hidden="true" className="h-3.5 w-px bg-white/20"/>

            <a href={`tel:${TEL_HREF}`}
               className="flex items-center gap-1.5 rounded transition-colors hover:text-sky-300 focus-visible:outline-none"
               aria-label={`Appeler ${TEL_DISPLAY}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.8-.8a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span className="hidden sm:inline">{TEL_DISPLAY}</span>
              <span className="sm:hidden">Appeler</span>
            </a>

            <button type="button" onClick={() => setDismissed(true)}
                    className="-mr-1 ml-1 rounded p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none"
                    aria-label="Masquer la barre">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
