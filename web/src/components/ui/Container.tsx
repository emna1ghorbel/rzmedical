import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Conteneur de largeur maximale standard, centré, avec gouttières responsives. */
export function Container({
  as: As = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <As className={cn("container-page", className)}>{children}</As>;
}
