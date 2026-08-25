// Helpers de formatage et de calcul de prix.
//
// Rappel : les prix/remises produit arrivent en STRING depuis l'API. On les
// convertit systématiquement avec parsePrice() avant tout calcul.

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const round2 = (x: number) => Math.round(x * 100) / 100;

/** Convertit une valeur monétaire (string Decimal ou number) en number sûr. */
export function parsePrice(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Formate un montant en Dinar Tunisien : "1 250,000 DT". */
export function formatTND(value: string | number | null | undefined): string {
  return `${numberFormatter.format(parsePrice(value))} DT`;
}

/** Prix après remise produit (remise = pourcentage 0-100). */
export function discountedPrice(
  prix: string | number,
  remise: string | number,
): number {
  const p = parsePrice(prix);
  const r = parsePrice(remise);
  if (r <= 0) return p;
  return round2(p * (1 - r / 100));
}

export function clientPrice(
  prix: string | number,
  remiseProduit: string | number,
  remiseClient: string | number = 0,
): number {
  const p = parsePrice(prix);
  const rp = parsePrice(remiseProduit);
  const rc = parsePrice(remiseClient);
  const maxRemise = Math.max(rp, rc);
  
  if (maxRemise <= 0) return p;
  return round2(p * (1 - maxRemise / 100));
}

/** Pourcentage de remise arrondi (pour les badges "-X%"). */
export function discountPercent(remise: string | number | null | undefined): number {
  return Math.round(parsePrice(remise));
}

/** true si le produit bénéficie d'une remise. */
export function hasDiscount(remise: string | number | null | undefined): boolean {
  return parsePrice(remise) > 0;
}

// --- Dates -------------------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const dateShortFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Formate une date ISO en français long : "19 août 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return dateFormatter.format(d);
}

/** Formate une date ISO en format court : "19/08/2026". */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return dateShortFormatter.format(d);
}

/** true si la date d'expiration est dépassée. */
export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

/** true si la date est récente (par défaut : moins de 30 jours). Pour le badge « Nouveau ». */
export function isRecent(
  iso: string | null | undefined,
  days = 30,
): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < days * 24 * 60 * 60 * 1000;
}

// --- Divers ------------------------------------------------------------------

/** Libellés lisibles pour le statut d'une commande. */
export const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  PAYEE: "Payée",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

/** Numéro de commande lisible : "CMD-000123". */
export function orderNumber(id: number): string {
  return `CMD-${String(id).padStart(6, "0")}`;
}
