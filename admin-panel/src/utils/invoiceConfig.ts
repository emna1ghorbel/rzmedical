/**
 * RZMedical company configuration for invoice generation.
 * Centralized here so any update reflects everywhere.
 */
export const COMPANY_INFO = {
  nom: 'R and Z Medical',
  matriculeFiscale: '1742623LAM000',
  adresse: '23 Rue Salem harzallah',
  adresseSuite: 'imm echafai 2 eme etage',
  codePostalVille: '3000, sfax Tunisie',
  telephone: '28113131',
  fax: '-',
  email: 'randzmedical@outlook.com',
  banque: 'UIB BANK',
  numeroCompte: '12023000003303530971',
} as const;

/** Default timbre fiscal value in TND (Tunisian dinar, 3 decimal places) */
export const DEFAULT_TIMBRE_FISCAL = 1.0;

/** Default TVA rate (%) when not specified per product */
export const DEFAULT_TVA_RATE = 7;
