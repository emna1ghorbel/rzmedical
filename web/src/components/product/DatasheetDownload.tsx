import { imageUrl } from "@/lib/api";
import { DownloadIcon, FileTextIcon } from "@/components/ui/icons";

/** Lien de téléchargement de la fiche technique (PDF/document servi par le backend). */
export function DatasheetDownload({ href }: { href: string }) {
  return (
    <a
      href={imageUrl(href)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-all duration-200 hover:border-navy-200 hover:shadow-md"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-error-light text-error">
        <FileTextIcon size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy-900">
          Fiche technique
        </span>
        <span className="block text-xs text-muted">
          Consulter les spécifications détaillées
        </span>
      </span>
      <DownloadIcon
        size={20}
        className="shrink-0 text-faint transition-colors group-hover:text-azure-500"
      />
    </a>
  );
}
