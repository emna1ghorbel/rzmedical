// Minuscule utilitaire de composition de classes (pas de dépendance externe).
// Accepte chaînes, tableaux et objets { classe: condition }.
export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const push = (value: ClassValue): void => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === "object") {
      for (const key in value) {
        if (value[key]) out.push(key);
      }
    }
  };

  inputs.forEach(push);
  return out.join(" ");
}
