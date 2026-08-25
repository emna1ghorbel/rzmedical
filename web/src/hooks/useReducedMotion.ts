"use client";

import { useEffect, useState } from "react";

/**
 * true si l'utilisateur a demandé une réduction des animations au niveau OS.
 * SSR-safe : rend `false` au premier rendu, puis se synchronise au montage.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
