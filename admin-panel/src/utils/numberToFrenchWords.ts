/**
 * Converts a TND monetary amount to French words.
 *
 * Format: "Arrêtée la présente facture à la somme de,
 *          [dinars en lettres] Dinars Tunisiens et [millimes en lettres] Millimes"
 *
 * Example: 296.001 → "Deux Cent Quatre-vingt-seize Dinars Tunisiens et Un Millimes"
 */

const ONES: string[] = [
  '',
  'Un',
  'Deux',
  'Trois',
  'Quatre',
  'Cinq',
  'Six',
  'Sept',
  'Huit',
  'Neuf',
  'Dix',
  'Onze',
  'Douze',
  'Treize',
  'Quatorze',
  'Quinze',
  'Seize',
  'Dix-sept',
  'Dix-huit',
  'Dix-neuf',
];

const TENS: string[] = [
  '',
  'Dix',
  'Vingt',
  'Trente',
  'Quarante',
  'Cinquante',
  'Soixante',
  'Soixante',
  'Quatre-vingt',
  'Quatre-vingt',
];

/** Convert a number 1–999 to French words */
function below1000(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  let result = '';

  if (hundreds > 0) {
    if (hundreds === 1) {
      result = 'Cent';
    } else {
      result = ONES[hundreds] + ' Cent';
      if (remainder === 0) result += 's'; // Deux cents (plural when exact)
    }
    if (remainder > 0) result += ' ';
  }

  if (remainder > 0) {
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;

    if (remainder < 20) {
      result += ONES[remainder];
    } else if (ten === 7) {
      // 70–79: soixante + (10–19)
      result += one === 0 ? 'Soixante-dix' : 'Soixante-' + ONES[10 + one];
    } else if (ten === 8) {
      // 80–89: quatre-vingt + ...
      if (one === 0) result += 'Quatre-vingts';
      else result += 'Quatre-vingt-' + ONES[one];
    } else if (ten === 9) {
      // 90–99: quatre-vingt + (10–19)
      result += 'Quatre-vingt-' + ONES[10 + one];
    } else {
      const tenWord = TENS[ten];
      if (one === 0) {
        result += tenWord;
      } else if (one === 1) {
        // "et un" for 21, 31, 41, 51, 61 (not 81, 71)
        result += tenWord + '-et-Un';
      } else {
        result += tenWord + '-' + ONES[one];
      }
    }
  }

  return result;
}

/** Convert any non-negative integer to French words */
function integerToFrench(n: number): string {
  if (n === 0) return 'Zéro';
  if (n < 0) return 'Moins ' + integerToFrench(-n);

  const billion = Math.floor(n / 1_000_000_000);
  const million = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];

  if (billion > 0) {
    parts.push(below1000(billion) + ' Milliard' + (billion > 1 ? 's' : ''));
  }

  if (million > 0) {
    parts.push(below1000(million) + ' Million' + (million > 1 ? 's' : ''));
  }

  if (thousand > 0) {
    if (thousand === 1) parts.push('Mille');
    else parts.push(below1000(thousand) + ' Mille');
  }

  if (rest > 0) {
    parts.push(below1000(rest));
  }

  return parts.filter(Boolean).join(' ');
}

/**
 * Convert TND amount (with up to 3 decimal places) to French words sentence.
 *
 * @param amount - The TND amount (e.g., 296.001)
 * @returns Full French words sentence
 */
export function montantEnLettres(amount: number): string {
  if (isNaN(amount) || amount < 0) return '';

  // Round to 3 decimal places
  const rounded = Math.round(amount * 1000) / 1000;

  const dinars = Math.floor(rounded);
  const millimes = Math.round((rounded - dinars) * 1000);

  const dinarWords = integerToFrench(dinars);
  const millimeWords = millimes > 0 ? integerToFrench(millimes) : 'Zéro';

  return `Arrêtée la présente facture à la somme de,\n${dinarWords} Dinars Tunisiens et ${millimeWords} Millimes`;
}

/**
 * Format a TND amount with 3 decimal places.
 */
export function formatTND(amount: number): string {
  return amount.toLocaleString('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}
