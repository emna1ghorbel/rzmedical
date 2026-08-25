"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(",");

/**
 * Piège le focus clavier à l'intérieur d'un conteneur tant que `active` est vrai
 * (overlays, drawers, modales). Met le focus sur le premier élément à l'ouverture
 * et le restaure sur l'élément précédent à la fermeture.
 * Usage : const ref = useFocusTrap<HTMLDivElement>(open);
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  active: boolean,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    // Focus initial (premier élément focusable, sinon le conteneur lui-même)
    const focusables = getFocusable();
    (focusables[0] ?? container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !container.contains(activeEl)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [active]);

  return ref;
}
