"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Révèle un élément quand il entre dans le viewport (IntersectionObserver).
 * Si l'utilisateur préfère moins d'animations, l'élément est visible d'emblée.
 * Usage : const { ref, isVisible } = useReveal<HTMLDivElement>();
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } =
    options;
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (reduced) {
      setIsVisible(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setIsVisible(false);
          }
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, threshold, rootMargin, once]);

  return { ref, isVisible };
}
