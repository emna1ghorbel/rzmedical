import prisma from '../../config/prisma';
import { generateDocumentNumber } from '../exercices/document-numbers.service';
import { recordStockMovement } from '../stock/stock.service';
import { StockMovementType } from '../../../generated/prisma/enums';

export class DevisError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'DevisError';
    this.statusCode = statusCode;
  }
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

// ─── Number Generation ────────────────────────────────────────────────────────

// ─── List & Get ───────────────────────────────────────────────────────────────

export const getAllDevis = async (exerciceAnnee?: number) => {
  let where: any = {};
  if (exerciceAnnee) {
    const exercice = await prisma.exercice.findUnique({ where: { annee: exerciceAnnee } });
    if (exercice) {
      where.dateDevis = { gte: exercice.dateDebut, lte: exercice.dateFin };
    } else {
      where.dateDevis = {
        gte: new Date(`${exerciceAnnee}-01-01T00:00:00.000Z`),
        lte: new Date(`${exerciceAnnee}-12-31T23:59:59.999Z`),
      };
    }
  }

  return prisma.devis.findMany({
    where,
    orderBy: { creeLe: 'desc' },
    include: {
      lignes: { include: { produit: true } },
      utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
      factures: { select: { id: true, numero: true, statut: true, montantTTC: true } },
      bonsLivraison: { select: { id: true, code: true, statut: true } },
    },
  });
};

export const getDevisById = async (id: number) => {
  return prisma.devis.findUnique({
    where: { id },
    include: {
      lignes: { include: { produit: true } },
      utilisateur: true,
      factures: { select: { id: true, numero: true, statut: true, montantTTC: true } },
      bonsLivraison: { select: { id: true, code: true, statut: true } },
    },
  });
};

// ─── Create Devis ─────────────────────────────────────────────────────────────

export interface CreateDevisInput {
  numero?: string;
  dateDevis?: string;
  dateValidite?: string;
  statut?: string;
  etat?: string;
  typeDevis?: string;
  devise?: string;
  utilisateurId?: number;
  clientNom: string;
  clientMF?: string;
  clientAdresse?: string;
  clientTelephone?: string;
  clientEmail?: string;
  timbreFiscal?: number;
  commentaire?: string;
  lignes: {
    produitId?: number;
    serviceId?: number;
    designation: string;
    quantite: number;
    prixUnitaireHT: number;
    remise?: number;
    tauxTVA?: number;
  }[];
}

export const createDevis = async (data: CreateDevisInput) => {
  if (!data.clientNom?.trim()) {
    throw new DevisError('Le nom du client est requis.');
  }
  if (!Array.isArray(data.lignes) || data.lignes.length === 0) {
    throw new DevisError('Le devis doit comporter au moins une ligne.');
  }

  // Calculate totals
  let montantHT = 0;
  let montantRemise = 0;
  let montantTVA = 0;

  const lignesComputed = data.lignes.map((l) => {
    const qte = Number(l.quantite) || 1;
    const puHT = Number(l.prixUnitaireHT) || 0;
    const rem = Number(l.remise) || 0;
    const tva = Number(l.tauxTVA) || 0;

    const brutHT = round3(qte * puHT);
    const remiseVal = round3(brutHT * (rem / 100));
    const netHT = round3(brutHT - remiseVal);
    const tvaVal = round3(netHT * (tva / 100));

    montantHT += brutHT;
    montantRemise += remiseVal;
    montantTVA += tvaVal;

    return {
      produitId: l.produitId ? Number(l.produitId) : null,
      serviceId: l.serviceId ? Number(l.serviceId) : null,
      designation: l.designation.trim(),
      quantite: qte,
      prixUnitaireHT: puHT,
      remise: rem,
      tauxTVA: tva,
      totalHT: netHT,
    };
  });

  const timbre = data.timbreFiscal !== undefined ? Number(data.timbreFiscal) : 1.0;
  const montantTTC = round3(montantHT - montantRemise + montantTVA + timbre);

  return prisma.$transaction(async (tx) => {
    const numero = await generateDocumentNumber(tx, 'DEVIS');
    return tx.devis.create({
    data: {
      numero,
      dateDevis: data.dateDevis ? new Date(data.dateDevis) : new Date(),
      dateValidite: data.dateValidite ? new Date(data.dateValidite) : null,
      statut: data.statut || 'BROUILLON',
      etat: data.etat || 'NORMAL',
      typeDevis: data.typeDevis || 'PRODUITS',
      devise: data.devise || 'TND',
      utilisateurId: data.utilisateurId ? Number(data.utilisateurId) : null,
      clientNom: data.clientNom.trim(),
      clientMF: data.clientMF?.trim() || null,
      clientAdresse: data.clientAdresse?.trim() || null,
      clientTelephone: data.clientTelephone?.trim() || null,
      clientEmail: data.clientEmail?.trim() || null,
      timbreFiscal: timbre,
      montantHT: round3(montantHT),
      montantRemise: round3(montantRemise),
      montantTVA: round3(montantTVA),
      montantTTC,
      commentaire: data.commentaire?.trim() || null,
      lignes: {
        create: lignesComputed,
      },
    },
    include: {
      lignes: true,
      factures: true,
      bonsLivraison: true,
    },
    });
  });
};

// ─── Update Devis ─────────────────────────────────────────────────────────────

export const updateDevis = async (id: number, data: Partial<CreateDevisInput>) => {
  const existing = await prisma.devis.findUnique({ where: { id }, include: { lignes: true } });
  if (!existing) throw new DevisError('Devis introuvable', 404);

  // If lignes are updated
  let montantHT = Number(existing.montantHT);
  let montantRemise = Number(existing.montantRemise);
  let montantTVA = Number(existing.montantTVA);
  const timbre = data.timbreFiscal !== undefined ? Number(data.timbreFiscal) : Number(existing.timbreFiscal);

  let lignesUpdate: any = undefined;
  if (Array.isArray(data.lignes)) {
    montantHT = 0;
    montantRemise = 0;
    montantTVA = 0;

    const lignesComputed = data.lignes.map((l) => {
      const qte = Number(l.quantite) || 1;
      const puHT = Number(l.prixUnitaireHT) || 0;
      const rem = Number(l.remise) || 0;
      const tva = Number(l.tauxTVA) || 0;

      const brutHT = round3(qte * puHT);
      const remiseVal = round3(brutHT * (rem / 100));
      const netHT = round3(brutHT - remiseVal);
      const tvaVal = round3(netHT * (tva / 100));

      montantHT += brutHT;
      montantRemise += remiseVal;
      montantTVA += tvaVal;

      return {
        produitId: l.produitId ? Number(l.produitId) : null,
        serviceId: l.serviceId ? Number(l.serviceId) : null,
        designation: l.designation.trim(),
        quantite: qte,
        prixUnitaireHT: puHT,
        remise: rem,
        tauxTVA: tva,
        totalHT: netHT,
      };
    });

    lignesUpdate = {
      deleteMany: {},
      create: lignesComputed,
    };
  }

  const montantTTC = round3(montantHT - montantRemise + montantTVA + timbre);

  return prisma.devis.update({
    where: { id },
    data: {
      ...(data.dateDevis && { dateDevis: new Date(data.dateDevis) }),
      ...(data.dateValidite !== undefined && { dateValidite: data.dateValidite ? new Date(data.dateValidite) : null }),
      ...(data.statut && { statut: data.statut }),
      ...(data.etat && { etat: data.etat }),
      ...(data.typeDevis && { typeDevis: data.typeDevis }),
      ...(data.devise && { devise: data.devise }),
      ...(data.utilisateurId !== undefined && { utilisateurId: data.utilisateurId ? Number(data.utilisateurId) : null }),
      ...(data.clientNom && { clientNom: data.clientNom.trim() }),
      ...(data.clientMF !== undefined && { clientMF: data.clientMF?.trim() || null }),
      ...(data.clientAdresse !== undefined && { clientAdresse: data.clientAdresse?.trim() || null }),
      ...(data.clientTelephone !== undefined && { clientTelephone: data.clientTelephone?.trim() || null }),
      ...(data.clientEmail !== undefined && { clientEmail: data.clientEmail?.trim() || null }),
      timbreFiscal: timbre,
      montantHT: round3(montantHT),
      montantRemise: round3(montantRemise),
      montantTVA: round3(montantTVA),
      montantTTC,
      ...(data.commentaire !== undefined && { commentaire: data.commentaire?.trim() || null }),
      ...(lignesUpdate && { lignes: lignesUpdate }),
    },
    include: {
      lignes: true,
      factures: true,
      bonsLivraison: true,
    },
  });
};

// ─── Delete Devis ─────────────────────────────────────────────────────────────

export const deleteDevis = async (id: number) => {
  return prisma.devis.delete({ where: { id } });
};

// ─── Workflow : Devis → Facture ───────────────────────────────────────────────

export const convertDevisToFacture = async (devisId: number) => {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: { lignes: true },
  });
  if (!devis) throw new DevisError('Devis introuvable', 404);

  const facture = await prisma.$transaction(async (tx) => {
    const invoiceNumero = await generateDocumentNumber(tx, 'FACTURE_VENTE');
    return tx.facture.create({
    data: {
      numero: invoiceNumero,
      statut: 'BROUILLON',
      statutPaiement: 'NON_PAYEE',
      typeFacture: devis.typeDevis === 'SERVICE' ? 'SERVICE' : 'PRODUITS',
      etat: 'NORMALE',
      devisId: devis.id,
      utilisateurId: devis.utilisateurId,
      dateEmission: new Date(),
      clientNom: devis.clientNom,
      clientMF: devis.clientMF,
      clientAdresse: devis.clientAdresse,
      clientTelephone: devis.clientTelephone,
      clientEmail: devis.clientEmail,
      timbreFiscal: devis.timbreFiscal,
      montantHT: devis.montantHT,
      montantTVA: devis.montantTVA,
      montantTTC: devis.montantTTC,
      devise: devis.devise,
      commentaire: `Facture générée automatiquement à partir du Devis ${devis.numero}`,
      lignes: {
        create: devis.lignes.map((l) => ({
          designation: l.designation,
          quantite: l.quantite,
          prixUnitaireHT: l.prixUnitaireHT,
          tauxTVA: l.tauxTVA,
          totalHT: l.totalHT,
        })),
      },
    },
    });
  });

  // Update Devis status
  await prisma.devis.update({
    where: { id: devis.id },
    data: { statut: 'FACTURE' },
  });

  return facture;
};

// ─── Workflow : Devis → Bon de Livraison ──────────────────────────────────────

export const convertDevisToBonLivraison = async (devisId: number) => {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: { lignes: true },
  });
  if (!devis) throw new DevisError('Devis introuvable', 404);

  const bl = await prisma.$transaction(async (tx) => {
    const blCode = await generateDocumentNumber(tx, 'BON_LIVRAISON');
    return tx.bonLivraison.create({
    data: {
      code: blCode,
      devisId: devis.id,
      utilisateurId: devis.utilisateurId,
      clientNom: devis.clientNom,
      clientMF: devis.clientMF,
      clientAdresse: devis.clientAdresse,
      clientTel: devis.clientTelephone,
      clientEmail: devis.clientEmail,
      dateLivraison: new Date(),
      statut: 'LIVRE',
      commentaire: `Bon de Livraison généré à partir du Devis ${devis.numero}`,
      lignes: {
        create: devis.lignes.map((l) => ({
          produitId: l.produitId,
          designation: l.designation,
          quantiteCmd: Math.round(Number(l.quantite)),
          quantiteLivree: Math.round(Number(l.quantite)),
          prixUnitaireHT: l.prixUnitaireHT,
          tauxTVA: l.tauxTVA,
        })),
      },
    },
    });
  });

  await prisma.$transaction(async (tx) => {
    for (const ligne of devis.lignes) {
      if (ligne.produitId) {
        await recordStockMovement(tx, {
          productId: ligne.produitId,
          quantity: Math.round(Number(ligne.quantite)),
          type: StockMovementType.SALE,
          unitPrice: Number(ligne.prixUnitaireHT),
          nature: 'SORTIE',
          documentType: 'BON_LIVRAISON',
          reference: bl.code,
          sourceType: 'BON_LIVRAISON',
          sourceId: bl.id,
          sourceLineId: ligne.id,
        });
      }
    }
    await tx.bonLivraison.update({ where: { id: bl.id }, data: { stockMisAJour: true } });
  });

  // Update Devis status
  await prisma.devis.update({
    where: { id: devis.id },
    data: { statut: 'CONVERTI_BL' },
  });

  return bl;
};
