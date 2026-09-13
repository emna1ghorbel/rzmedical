import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import prisma from '../../config/prisma';

type OCRField<T> = { value: T | null; confidence: number };

export type OCRResult = {
  rawText: string;
  invoice: {
    numeroFacture: OCRField<string>;
    dateFacture: OCRField<string>;
    fournisseur: OCRField<string>;
    matriculeFiscal: OCRField<string>;
    totalHT: OCRField<number>;
    totalTVA: OCRField<number>;
    timbreFiscal: OCRField<number>;
    totalTTC: OCRField<number>;
  };
  lines: Array<{
    referenceProduit: OCRField<string>;
    designation: OCRField<string>;
    quantite: OCRField<number>;
    prixUnitaireHT: OCRField<number>;
    remise: OCRField<number>;
    tauxTVA: OCRField<number>;
    totalHT: OCRField<number>;
    productId: number | null;
    matchedProduct: { id: number; nom: string; reference: string } | null;
  }>;
  matchedSupplier: { id: number; nom: string; matriculeFiscale: string | null } | null;
  warnings: string[];
  confidence: number;
};

const empty = <T,>(): OCRField<T> => ({ value: null, confidence: 0 });
const numberFrom = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};
const field = <T,>(value: T | null, confidence: number): OCRField<T> => ({ value, confidence });

function extractTextFields(text: string): OCRResult {
  const normalized = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ');
  const invoiceNumber = normalized.match(/(?:facture|invoice)\s*(?:n[°ºo]?\.?\s*)?[:#-]?\s*([A-Z0-9/_-]{3,})/i)?.[1] ?? null;
  const date = normalized.match(/(?:date)\s*[:.-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i)?.[1] ?? null;
  const supplierLabel = normalized.match(/(?:fournisseur|supplier|vendeur|seller|raison\s*sociale)\s*[:.-]?\s*([^\n]{2,80})/i)?.[1]?.trim();
  // When the invoice has no "Fournisseur" label, use the issuer printed before
  // the invoice heading (common on Tunisian invoices).
  const firstLine = normalized.split('\n').map((line) => line.trim()).find((line) => line.length >= 2);
  const supplier = supplierLabel || (firstLine && !/^(facture|invoice|informations?\b)/i.test(firstLine) ? firstLine : null);
  const amountPattern = '([\\d\\s,.]+)';
  const totalHT = numberFrom(normalized.match(new RegExp(`(?:total\\s*ht|sous[- ]?total)\\s*[:.]?\\s*${amountPattern}`, 'i'))?.[1]);
  const totalTVA = numberFrom(normalized.match(new RegExp(`(?:total\\s*tva|tva)\\s*[:.]?\\s*${amountPattern}`, 'i'))?.[1]);
  const totalTTC = numberFrom(normalized.match(new RegExp(`(?:total\\s*ttc|net\\s*a\\s*payer|total)\\s*[:.]?\\s*${amountPattern}`, 'i'))?.[1]);
  const warnings: string[] = [];
  if (!invoiceNumber) warnings.push('Numéro de facture non reconnu.');
  if (!supplier) warnings.push('Fournisseur non reconnu.');
  if (totalTTC === null) warnings.push('Total TTC non reconnu. Vérification manuelle nécessaire.');

  return {
    rawText: text,
    invoice: {
      numeroFacture: field(invoiceNumber, invoiceNumber ? 0.72 : 0),
      dateFacture: field(date, date ? 0.68 : 0),
      fournisseur: field(supplier, supplier ? 0.62 : 0),
      matriculeFiscal: empty<string>(),
      totalHT: field(totalHT, totalHT !== null ? 0.65 : 0),
      totalTVA: field(totalTVA, totalTVA !== null ? 0.65 : 0),
      timbreFiscal: field(numberFrom(normalized.match(/(?:timbre|timbre fiscal)\s*[:.]?\s*([\d\s,.]+)/i)?.[1]), 0.55),
      totalTTC: field(totalTTC, totalTTC !== null ? 0.7 : 0),
    },
    lines: [],
    matchedSupplier: null,
    warnings,
    confidence: text.trim().length > 20 ? 0.6 : 0.1,
  };
}

export async function analyzeSupplierInvoice(file: Express.Multer.File): Promise<OCRResult> {
  let text = '';
  if (file.mimetype === 'application/pdf') {
    const parsed = await pdfParse(file.buffer);
    text = parsed.text;
  } else if (file.mimetype.startsWith('image/')) {
    const worker = await createWorker('fra');
    try {
      const result = await worker.recognize(file.buffer);
      text = result.data.text;
    } finally {
      await worker.terminate();
    }
  } else {
    throw new Error('Format accepté: image ou PDF');
  }

  const result = extractTextFields(text);
  const candidateLines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    if (/^(total|tva|timbre|facture|date|client|m\.?f\.?|informations?)/i.test(line)) return [];
    const standard = line.match(/^(\S+)\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(\d+[.,]\d{2,3})\s+(\d+[.,]\d{2,3})$/);
    if (standard) {
      return [{ reference: standard[1], designation: standard[2], quantity: numberFrom(standard[3]), unitPrice: numberFrom(standard[4]), taxRate: 19, total: numberFrom(standard[5]) }];
    }
    // OCR often removes table spacing: designation + quantity + unit price + TVA% + total.
    const compact = line.match(/^(.+?)(\d+(?:[.,]\d+)?)\s*(\d+[.,]\d{2,3})\s*(\d+(?:[.,]\d+)?)\s*%?\s*(\d+[.,]\d{2,3})$/);
    if (!compact) return [];
    return [{ reference: '', designation: compact[1].trim(), quantity: numberFrom(compact[2]), unitPrice: numberFrom(compact[3]), taxRate: numberFrom(compact[4]) ?? 19, total: numberFrom(compact[5]) }];
  });
  for (const candidate of candidateLines) {
    if (candidate.quantity === null || candidate.unitPrice === null) continue;
    let candidateReference = candidate.reference;
    let candidateDesignation = candidate.designation;
    let product = await prisma.produit.findFirst({
      where: {
        OR: [
          ...(candidateReference ? [{ reference: { equals: candidateReference, mode: 'insensitive' as const } }] : []),
          { nom: { equals: candidateDesignation, mode: 'insensitive' } },
        ],
      },
      select: { id: true, nom: true, reference: true },
    });
    // In compact OCR rows the reference may be merged into the designation.
    // Try the first token as a product reference before giving up.
    if (!product && !candidateReference) {
      const firstToken = candidateDesignation.split(/\s+/)[0];
      if (firstToken) {
        product = await prisma.produit.findFirst({
          where: { reference: { equals: firstToken, mode: 'insensitive' } },
          select: { id: true, nom: true, reference: true },
        });
        if (product) {
          candidateReference = firstToken;
          candidateDesignation = candidateDesignation.slice(firstToken.length).trim();
        }
      }
    }
    result.lines.push({
      referenceProduit: field(candidateReference, product ? 0.95 : 0.7),
      designation: field(candidateDesignation, 0.72),
      quantite: field(candidate.quantity, 0.78),
      prixUnitaireHT: field(candidate.unitPrice, 0.78),
      remise: field(0, 0.2),
      tauxTVA: field(candidate.taxRate, candidate.taxRate === 19 ? 0.2 : 0.7),
      totalHT: field(candidate.total, 0.7),
      productId: product?.id ?? null,
      matchedProduct: product ?? null,
    });
    if (!product) result.warnings.push(`Produit « ${candidate.reference} » non reconnu. Sélection manuelle nécessaire.`);
  }
  if (result.lines.length === 0) result.warnings.push('Aucune ligne produit suffisamment lisible pour être préremplie.');
  const supplierName = result.invoice.fournisseur.value;
  if (supplierName) {
    const supplier = await prisma.fournisseur.findFirst({
      where: { nom: { contains: supplierName, mode: 'insensitive' } },
      select: { id: true, nom: true, matriculeFiscale: true },
    });
    if (supplier) result.matchedSupplier = supplier;
    else result.warnings.push(`Fournisseur « ${supplierName} » non trouvé dans RZMedical.`);
  }
  return result;
}

// ─── CNSS Receipt OCR ─────────────────────────────────────────────────────────

export type CnssReceiptOCRResult = {
  documentType: 'CNSS_RECEIPT';
  rawText: string;
  date: OCRField<string>;
  receiptNumber: OCRField<string>;
  transactionReference: OCRField<string>;
  amount: OCRField<number>;
  affiliationNumber: OCRField<string>;
  receivedFrom: OCRField<string>;
  amountInWords: OCRField<string>;
  paymentObject: OCRField<string>;
  paymentMethod: OCRField<string>;
  warnings: string[];
  confidence: number;
};

/**
 * Extract structured data from a CNSS payment receipt (Tunisia).
 * Supports image (via Tesseract.js) and PDF (via pdf-parse).
 * Each field carries a confidence score — never invents values.
 */
function extractCnssFields(text: string): CnssReceiptOCRResult {
  const normalized = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ');

  const after = (pattern: RegExp): string | null => {
    const m = normalized.match(pattern);
    return m?.[1]?.trim() || null;
  };

  // Date: "Le : 12/03/2025" or "Date : 12-03-2025"
  const rawDate =
    after(/(?:Le|Date)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ??
    after(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
  const dateValue = rawDate
    ? (() => {
        const parts = rawDate.split(/[\/\-]/);
        if (parts.length === 3) {
          const [d, m, y] = parts.map(Number);
          const year = y < 100 ? 2000 + y : y;
          if (d && m && year) {
            return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
        }
        return rawDate;
      })()
    : null;

  // Receipt number: "N° : 123456" or "N° du reçu : 123456"
  const receiptNumber =
    after(/N[°º]\s*(?:du\s*re[çc]u)?\s*[:\-]?\s*([A-Z0-9\/\-]{2,30})/i) ??
    after(/Re[çc]u\s*n[°º]?\s*[:\-]?\s*([A-Z0-9\/\-]{2,30})/i);

  // Transaction reference: "Réf. de la transaction : XYZ"
  const transactionReference =
    after(/R[ée]f\.?\s*(?:de\s*la\s*transaction)?\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i) ??
    after(/R[ée]f(?:erence)?\s*[:\-]?\s*([A-Z0-9\-\/]{4,40})/i);

  // Amount: "Montant : 9256.40 TND"
  const rawAmount =
    after(/Montant\s*[:\-]?\s*([\d\s.,]+)\s*(?:TND|DT|dinars?)?/i) ??
    after(/Total\s*[:\-]?\s*([\d\s.,]+)\s*(?:TND|DT|dinars?)?/i);
  const amountValue = numberFrom(rawAmount ?? undefined);

  // Affiliation number: "N° affiliation : 000123"
  const affiliationNumber =
    after(/N[°º]\s*(?:d[e']?\s*)?affiliation\s*[:\-]?\s*([0-9]{3,20})/i) ??
    after(/Matricule\s*(?:employeur)?\s*[:\-]?\s*([0-9]{3,20})/i);

  // Received from: "Reçu de : Société XYZ"
  const receivedFrom =
    after(/Re[çc]u\s*de\s*[:\-]?\s*([^\n]{2,80})/i) ??
    after(/Nom\s*[:\-]?\s*([^\n]{2,80})/i);

  // Amount in words: "La somme de : Neuf mille dinars"
  const amountInWords =
    after(/(?:La\s*somme\s*de|Somme)\s*[:\-]?\s*([^\n]{3,120})/i);

  // Payment object: "Objet du règlement : CNSS Q1 2025"
  const paymentObject =
    after(/Objet\s*(?:du\s*r[èe]glement)?\s*[:\-]?\s*([^\n]{2,120})/i) ??
    after(/Motif\s*[:\-]?\s*([^\n]{2,120})/i);

  // Payment method: "Mode de paiement : Virement"
  const rawPaymentMethod = after(/Mode\s*(?:de\s*paiement)?\s*[:\-]?\s*([^\n]{2,40})/i);
  const paymentMethodNormalised = rawPaymentMethod
    ? (() => {
        const lower = rawPaymentMethod.toLowerCase();
        if (/esp[eè]ce/.test(lower)) return 'Espèces';
        if (/ch[eè]que|cheque/.test(lower)) return 'Chèque';
        if (/virement/.test(lower)) return 'Virement';
        if (/carte/.test(lower)) return 'Carte';
        if (/pr[eé]l[eè]vement/.test(lower)) return 'Prélèvement';
        return rawPaymentMethod.trim();
      })()
    : null;

  const warnings: string[] = [];
  if (!dateValue) warnings.push('Date du reçu non détectée.');
  if (!receiptNumber) warnings.push('Numéro de reçu non détecté.');
  if (!transactionReference) warnings.push('Référence de transaction non détectée.');
  if (amountValue === null) warnings.push('Montant non détecté. Vérification manuelle nécessaire.');
  if (!affiliationNumber) warnings.push('N° affiliation non détecté.');

  const detectedCount = [dateValue, receiptNumber, transactionReference, amountValue, affiliationNumber]
    .filter((v) => v !== null && v !== undefined).length;
  const confidence = text.trim().length > 30 ? Math.min(0.4 + detectedCount * 0.1, 0.95) : 0.1;

  return {
    documentType: 'CNSS_RECEIPT',
    rawText: text,
    date: field(dateValue, dateValue ? 0.75 : 0),
    receiptNumber: field(receiptNumber, receiptNumber ? 0.8 : 0),
    transactionReference: field(transactionReference, transactionReference ? 0.78 : 0),
    amount: field(amountValue, amountValue !== null ? 0.72 : 0),
    affiliationNumber: field(affiliationNumber, affiliationNumber ? 0.85 : 0),
    receivedFrom: field(receivedFrom, receivedFrom ? 0.65 : 0),
    amountInWords: field(amountInWords, amountInWords ? 0.6 : 0),
    paymentObject: field(paymentObject, paymentObject ? 0.65 : 0),
    paymentMethod: field(paymentMethodNormalised, paymentMethodNormalised ? 0.7 : 0),
    warnings,
    confidence,
  };
}

export async function analyzeCnssReceipt(file: Express.Multer.File): Promise<CnssReceiptOCRResult> {
  let text = '';
  if (file.mimetype === 'application/pdf') {
    const parsed = await pdfParse(file.buffer);
    text = parsed.text;
  } else if (file.mimetype.startsWith('image/')) {
    const worker = await createWorker('fra');
    try {
      const result = await worker.recognize(file.buffer);
      text = result.data.text;
    } finally {
      await worker.terminate();
    }
  } else {
    throw new Error('Format accepté : image (JPG/PNG) ou PDF');
  }
  return extractCnssFields(text);
}
