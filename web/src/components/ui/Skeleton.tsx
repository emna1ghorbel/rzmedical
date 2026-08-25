import { cn } from "@/lib/cn";

/** Bloc de chargement animé (shimmer). Respecte prefers-reduced-motion. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}
