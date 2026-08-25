"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReveal } from "@/hooks/useReveal";

/**
 * Révèle son contenu en fondu + léger glissement quand il entre à l'écran.
 * Neutralisé automatiquement si l'utilisateur préfère moins d'animations.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-all duration-500 ease-out motion-reduce:transition-none",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
