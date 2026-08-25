"use client";

import { useEffect, useState } from "react";

/**
 * Suit une media query CSS de façon réactive. SSR-safe (rend `false` avant montage).
 * Ex. : useMediaQuery("(min-width: 1024px)").
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
