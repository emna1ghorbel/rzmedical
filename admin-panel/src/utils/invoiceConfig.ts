/**
 * Valeurs de repli neutres pour les formulaires de facture/devis.
 * Ces constantes ne sont utilisées que comme état initial avant
 * le chargement des données depuis l'API (/api/company-info).
 *
 * ⚠️ Ne pas mettre de vraies données métier ici — elles doivent
 * venir de la base de données via useCompanyInfo().
 */

/** Timbre fiscal initial (0 = neutre, sera remplacé par la valeur DB) */
export const DEFAULT_TIMBRE_FISCAL = 0;

/** Taux TVA initial (0 = neutre, sera remplacé par la valeur DB) */
export const DEFAULT_TVA_RATE = 0;
