import prisma from '../../config/prisma';

export class InvoiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'InvoiceError';
    this.statusCode = statusCode;
  }
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

// ─── Number generation ──────────────────────────────────────────────────────

export const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = year.toString();

  // Find the highest existing number for this year
  const lastInvoice = await prisma.facture.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  let seq = 1;
  if (lastInvoice) {
    const suffix = lastInvoice.numero.slice(4);
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${seq.toString().padStart(4, '0')}`;
};

export const isInvoiceNumberUnique = async (numero: string): Promise<boolean> => {
  const existing = await prisma.facture.findUnique({ where: { numero }, select: { id: true } });
  return !existing;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getInvoiceByOrderId = async (orderId: number) => {
  return prisma.facture.findUnique({
    where: { commandeId: orderId },
    include: { lignes: true },
  });
};

export const getMyInvoices = async (userId: number) => {
  const factures = await prisma.facture.findMany({
    where: { commande: { utilisateurId: userId } },
    orderBy: { creeLe: 'desc' },
    include: { lignes: true },
  });
  return factures.map(serializeFacture);
};

export const getInvoice = async (id: number) => {
  const facture = await prisma.facture.findUnique({
    where: { id },
    include: {
      lignes: true,
      commande: {
        include: {
          utilisateur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true,
              adresse: true,
              matriculeFiscale: true,
            },
          },
        },
      },
    },
  });
  if (!facture) return null;
  return serializeFacture(facture);
};

export const getAllInvoices = async () => {
  const factures = await prisma.facture.findMany({
    orderBy: { creeLe: 'desc' },
    include: {
      lignes: true,
      commande: {
        include: {
          utilisateur: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
        },
      },
    },
  });
  return factures.map(serializeFacture);
};

// ─── Serialization ────────────────────────────────────────────────────────────

const serializeLigne = (l: any) => ({
  ...l,
  quantite: Number(l.quantite),
  prixUnitaireHT: Number(l.prixUnitaireHT),
  tauxTVA: Number(l.tauxTVA),
  totalHT: Number(l.totalHT),
});

const serializeFacture = (f: any) => ({
  ...f,
  timbreFiscal: Number(f.timbreFiscal),
  montantHT: Number(f.montantHT),
  montantTVA: Number(f.montantTVA),
  montantTTC: Number(f.montantTTC),
  lignes: Array.isArray(f.lignes) ? f.lignes.map(serializeLigne) : [],
  commande: f.commande
    ? {
        ...f.commande,
        total: Number(f.commande.total),
      }
    : undefined,
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface LigneFactureInput {
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  totalHT: number;
}

export interface CreateInvoiceInput {
  numero: string;
  commandeId: number;
  dateEmission: string; // ISO string
  clientNom: string;
  clientMF?: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  timbreFiscal: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  montantEnLettres?: string;
  fichierPdf?: string;
  lignes: LigneFactureInput[];
}

export const createInvoice = async (data: CreateInvoiceInput) => {
  // Validate: no duplicate per order
  const existingByOrder = await prisma.facture.findUnique({
    where: { commandeId: data.commandeId },
    select: { id: true, numero: true },
  });
  if (existingByOrder) {
    throw new InvoiceError(
      `Cette commande possède déjà une facture (N° ${existingByOrder.numero})`,
      409
    );
  }

  // Validate: unique numero
  const existingNumero = await prisma.facture.findUnique({
    where: { numero: data.numero },
    select: { id: true },
  });
  if (existingNumero) {
    throw new InvoiceError(`Le numéro de facture "${data.numero}" est déjà utilisé`, 409);
  }

  // Validate: order exists
  const commande = await prisma.commande.findUnique({
    where: { id: data.commandeId },
    select: { id: true },
  });
  if (!commande) {
    throw new InvoiceError('Commande introuvable', 404);
  }

  // Validate: lines non-empty
  if (!Array.isArray(data.lignes) || data.lignes.length === 0) {
    throw new InvoiceError('La facture doit contenir au moins une ligne');
  }

  // Recompute and validate totals server-side
  let computedHT = 0;
  let computedTVA = 0;
  for (const l of data.lignes) {
    if (!l.designation || l.designation.trim() === '') {
      throw new InvoiceError('La désignation de chaque ligne est obligatoire');
    }
    if (l.quantite <= 0) throw new InvoiceError('La quantité doit être supérieure à 0');
    if (l.prixUnitaireHT < 0) throw new InvoiceError('Le prix unitaire HT ne peut pas être négatif');
    if (l.tauxTVA < 0 || l.tauxTVA > 100) {
      throw new InvoiceError('Le taux de TVA doit être compris entre 0 et 100');
    }
    const lineHT = round3(l.quantite * l.prixUnitaireHT);
    const lineTVA = round3(lineHT * (l.tauxTVA / 100));
    computedHT += lineHT;
    computedTVA += lineTVA;
  }
  computedHT = round3(computedHT);
  computedTVA = round3(computedTVA);
  const computedTTC = round3(computedHT + computedTVA + data.timbreFiscal);

  const facture = await prisma.facture.create({
    data: {
      numero: data.numero,
      statut: 'EMISE',
      commandeId: data.commandeId,
      dateEmission: new Date(data.dateEmission),
      clientNom: data.clientNom,
      clientMF: data.clientMF || null,
      clientAdresse: data.clientAdresse || null,
      clientTelephone: data.clientTelephone || null,
      clientEmail: data.clientEmail || null,
      timbreFiscal: data.timbreFiscal,
      montantHT: computedHT,
      montantTVA: computedTVA,
      montantTTC: computedTTC,
      montantEnLettres: data.montantEnLettres || null,
      fichierPdf: data.fichierPdf || null,
      lignes: {
        create: data.lignes.map((l) => ({
          designation: l.designation.trim(),
          quantite: l.quantite,
          prixUnitaireHT: l.prixUnitaireHT,
          tauxTVA: l.tauxTVA,
          totalHT: round3(l.quantite * l.prixUnitaireHT),
        })),
      },
    },
    include: { lignes: true },
  });

  return serializeFacture(facture);
};

export const updateInvoicePdf = async (id: number, fichierPdf: string) => {
  const facture = await prisma.facture.findUnique({ where: { id }, select: { id: true } });
  if (!facture) throw new InvoiceError('Facture introuvable', 404);

  const updated = await prisma.facture.update({
    where: { id },
    data: { fichierPdf },
    include: { lignes: true },
  });
  return serializeFacture(updated);
};
