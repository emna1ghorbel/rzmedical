import { AlertTriangleIcon } from "./icons";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

/**
 * État d'erreur premium — red ambient glow, glassy container.
 */
export function ErrorState({
  title = "Une erreur est survenue",
  description = "Impossible de charger le contenu pour le moment. Veuillez réessayer.",
  retry,
  retryLabel = "Réessayer",
  className,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in select-none",
        className,
      )}
    >
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        {/* Red ambient glow */}
        <div className="absolute inset-0 rounded-3xl bg-red-500/8 animate-pulse" />
        {/* Icon container */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200/80 bg-red-50/80 text-red-500 shadow-sm shadow-red-100">
          <AlertTriangleIcon size={30} strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-[17px] font-bold text-navy-900 tracking-tight">{title}</h3>
      <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-slate-500">{description}</p>
      {retry && (
        <Button variant="primary" className="mt-7" onClick={retry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
