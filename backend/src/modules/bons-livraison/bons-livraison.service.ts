import prisma from '../../config/prisma';
import { recordStockMovement } from '../stock/stock.service';
import { StockMovementType } from '../../../generated/prisma/enums';
import { generateDocumentNumber } from '../exercices/document-numbers.service';

export class BLError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'BLError';
    this.statusCode = statusCode;
  }
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

// ─── Code generation ─────────────────────────────────────────────────────────

// ─── Serialization ────────────────────────────────────────────────────────────

const serializeLigneBL = (l: any) => ({
  ...l,
  prixUnitaireHT: Number(l.prixUnitaireHT),
  tauxTVA: Number(l.tauxTVA),
});

export const serializeBL = (bl: any) => ({
  ...bl,
  lignes: Array.isArray(bl.lignes) ? bl.lignes.map(serializeLigneBL) : [],
});

// ─── Queries ─────────────────────────────────────────────────────────────────

const BL_INCLUDE = {
  lignes: { include: { produit: { select: { id: true, nom: true, reference: true, stock: true } } } },
  commande: { select: { id: true, numero: true, statut: true } },
  utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, matriculeFiscale: true, adresse: true } },
  factures: { select: { id: true, numero: true, statut: true } },
  facturesJonction: { select: { factureId: true } },
};

export const getAllBL = async () => {
  const bls = await prisma.bonLivraison.findMany({
    orderBy: { creeLe: 'desc' },
    include: BL_INCLUDE,
  });
  return bls.map(serializeBL);
};

export const getBL = async (id: number) => {
  const bl = await prisma.bonLivraison.findUnique({ where: { id }, include: BL_INCLUDE });
  if (!bl) return null;
  return serializeBL(bl);
};

// ─── Create from order ────────────────────────────────────────────────────────

export const createBLFromOrder = async (orderId: number) => {
  const commande = await prisma.commande.findUnique({
    where: { id: orderId },
    include: {
      lignes: { include: { produit: { select: { id: true, nom: true, prix: true, tva: true, remise: true } } } },
      utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, adresse: true, matriculeFiscale: true } },
    },
  });
  if (!commande) throw new BLError('Commande introuvable', 404);

  const u = commande.utilisateur;

  const bl = await prisma.$transaction(async (tx) => {
    const code = await generateDocumentNumber(tx, 'BON_LIVRAISON');
    return tx.bonLivraison.create({
    data: {
      code,
      commandeId: commande.id,
      utilisateurId: commande.utilisateurId,
      clientNom: `${u.nom || ''} ${u.prenom || ''}`.trim() || null,
      clientEmail: u.email || null,
      clientTel: u.telephone || null,
      clientAdresse: u.adresse || null,
      clientMF: u.matriculeFiscale || null,
      statut: 'BROUILLON',
      lignes: {
        create: commande.lignes.map((l) => {
          const remise = Number(l.produit.remise) / 100;
          const prixHT = round3(Number(l.produit.prix) * (1 - remise));
          return {
            produitId: l.produitId,
            designation: l.produit.nom,
            quantiteCmd: l.quantite,
            quantiteLivree: l.quantite,
            prixUnitaireHT: prixHT,
            tauxTVA: Number(l.produit.tva) || 0,
          };
        }),
      },
    },
    include: BL_INCLUDE,
    });
  });

  // La sortie de stock est portée par le bon de livraison dès sa création,
  // indépendamment de la facture qui pourra éventuellement être générée plus tard.
  await prisma.$transaction(async (tx) => {
    for (const ligne of bl.lignes) {
      if (!ligne.produitId) continue;
      await recordStockMovement(tx, {
        productId: ligne.produitId,
        quantity: ligne.quantiteLivree,
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
    await tx.bonLivraison.update({ where: { id: bl.id }, data: { stockMisAJour: true } });
  });

  (bl as any).stockMisAJour = true;
  return serializeBL(bl);
};

// ─── Create BL manually ──────────────────────────────────────────────────────

export interface CreateBLInput {
  commandeId?: number;
  utilisateurId?: number;
  clientNom?: string;
  clientMF?: string;
  clientAdresse?: string;
  clientTel?: string;
  clientEmail?: string;
  dateLivraison?: string;
  commentaire?: string;
  statut?: string;
  lignes: {
    produitId?: number | null;
    designation: string;
    quantiteCmd?: number;
    quantiteLivree?: number;
    quantite?: number;
    prixUnitaireHT: number;
    remise?: number;
    tauxTVA: number;
  }[];
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export const createBL = async (data: CreateBLInput) => {
  if (!Array.isArray(data.lignes) || data.lignes.length === 0) {
    throw new BLError('Le bon de livraison doit contenir au moins une ligne');
  }
  // Calcul du total et préparation des lignes commande
  let totalCommande = 0;
  const lignesCommandeData: { produitId: number; quantite: number; prixUnitaire: number }[] = [];

  const lignesPrep = data.lignes.map((l) => {
    const remise = Number(l.remise) || 0;
    const puApres = round3(Number(l.prixUnitaireHT) * (1 - remise / 100));
    const qty = Math.ceil(Number(l.quantiteLivree ?? l.quantiteCmd ?? l.quantite ?? 1));
    const lineHT = round3(qty * puApres);
    const lineTTC = round3(lineHT * (1 + (Number(l.tauxTVA) || 0) / 100));
    totalCommande += lineTTC;

    if (l.produitId) {
      lignesCommandeData.push({
        produitId: Number(l.produitId),
        quantite: qty,
        prixUnitaire: puApres,
      });
    }

    return {
      produitId: l.produitId ? Number(l.produitId) : null,
      designation: (l.designation || '').trim(),
      quantiteCmd: qty,
      quantiteLivree: qty,
      prixUnitaireHT: puApres,
      tauxTVA: Number(l.tauxTVA) || 0,
    };
  });

  return prisma.$transaction(async (tx) => {
    const code = await generateDocumentNumber(tx, 'BON_LIVRAISON');
    let commandeId = data.commandeId || null;

    // Création automatique de la Commande liée si un client utilisateur existe
    if (!commandeId && data.utilisateurId) {
      let commandeStatut: any = 'LIVREE';
      if (data.statut === 'BROUILLON') commandeStatut = 'CONFIRMEE';
      else if (data.statut === 'PREPARE') commandeStatut = 'EN_PREPARATION';
      else if (data.statut === 'EXPEDIE') commandeStatut = 'EXPEDIEE';
      else commandeStatut = 'LIVREE';

      const numero = await generateDocumentNumber(tx, 'COMMANDE');
      const commande = await tx.commande.create({
        data: {
          numero,
          utilisateurId: Number(data.utilisateurId),
          statut: commandeStatut,
          total: round2(totalCommande),
          lignes: lignesCommandeData.length > 0 ? { create: lignesCommandeData } : undefined,
        },
      });
      commandeId = commande.id;
    }

    const bl = await tx.bonLivraison.create({
      data: {
        code,
        commandeId,
        utilisateurId: data.utilisateurId || null,
        clientNom: data.clientNom || null,
        clientMF: data.clientMF || null,
        clientAdresse: data.clientAdresse || null,
        clientTel: data.clientTel || null,
        clientEmail: data.clientEmail || null,
        dateLivraison: data.dateLivraison ? new Date(data.dateLivraison) : null,
        commentaire: data.commentaire || null,
        statut: (data.statut as any) || 'LIVRE',
        lignes: {
          create: lignesPrep,
        },
      },
      include: BL_INCLUDE,
    });

    if (!bl.stockMisAJour) {
      // Utiliser les IDs DB réels des lignes (pas lineIndex) pour garantir l'idempotence de operationKey
      for (const ligneBL of bl.lignes) {
        if (ligneBL.produitId) {
          await recordStockMovement(tx, {
            productId: ligneBL.produitId,
            quantity: ligneBL.quantiteLivree,
            type: StockMovementType.SALE,
            unitPrice: Number(ligneBL.prixUnitaireHT),
            nature: 'SORTIE',
            documentType: 'BON_LIVRAISON',
            reference: bl.code,
            sourceType: 'BON_LIVRAISON',
            sourceId: bl.id,
            sourceLineId: ligneBL.id,
          });
        }
      }
      await tx.bonLivraison.update({ where: { id: bl.id }, data: { stockMisAJour: true } });
    }

    return serializeBL(bl);
  });
};

// ─── Update BL ───────────────────────────────────────────────────────────────

export const updateBL = async (id: number, data: Partial<CreateBLInput> & { statut?: string }) => {
  const existing = await prisma.bonLivraison.findUnique({ where: { id }, include: { lignes: true } });
  if (!existing) throw new BLError('Bon de livraison introuvable', 404);
  if (existing.statut === 'FACTURE' && data.statut && data.statut !== 'FACTURE') {
    throw new BLError('Un bon de livraison facturé ne peut plus changer de statut', 409);
  }

  const updateData: any = {};
  if (data.statut !== undefined) updateData.statut = data.statut;
  if (data.dateLivraison !== undefined) updateData.dateLivraison = data.dateLivraison ? new Date(data.dateLivraison) : null;
  if (data.commentaire !== undefined) updateData.commentaire = data.commentaire;
  if (data.clientNom !== undefined) updateData.clientNom = data.clientNom;
  if (data.clientMF !== undefined) updateData.clientMF = data.clientMF;
  if (data.clientAdresse !== undefined) updateData.clientAdresse = data.clientAdresse;
  if (data.clientTel !== undefined) updateData.clientTel = data.clientTel;
  if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;

  const shouldUpdateStock = (data.statut === 'LIVRE' || data.statut === 'FACTURE') && !existing.stockMisAJour;
  const bl = await prisma.$transaction(async (tx) => {
    const updated = await tx.bonLivraison.update({
      where: { id },
      data: { ...updateData, ...(shouldUpdateStock ? { stockMisAJour: true } : {}) },
      include: BL_INCLUDE,
    });
    if (shouldUpdateStock) {
      for (const ligne of existing.lignes) {
        if (ligne.produitId) {
          await recordStockMovement(tx, {
            productId: ligne.produitId,
            quantity: ligne.quantiteLivree,
            type: StockMovementType.SALE,
            unitPrice: Number(ligne.prixUnitaireHT),
            nature: 'SORTIE',
            documentType: 'BON_LIVRAISON',
            reference: updated.code,
            sourceType: 'BON_LIVRAISON',
            sourceId: id,
            sourceLineId: ligne.id,
          });
        }
      }
    }
    return updated;
  });

  // If command linked, update order status based on BL statuses
  if (bl.commandeId) {
    await syncCommandeStatus(bl.commandeId);
  }

  return serializeBL(bl);
};

// ─── Delete BL ───────────────────────────────────────────────────────────────

export const deleteBL = async (id: number) => {
  const bl = await prisma.bonLivraison.findUnique({
    where: { id },
    include: {
      lignes: true,
      factures: { select: { id: true } },
      facturesJonction: { select: { factureId: true } },
    },
  });
  if (!bl) throw new BLError('Bon de livraison introuvable', 404);

  return prisma.$transaction(async (tx) => {
    // 0. Annuler les sorties de stock si le BL avait mis à jour le stock
    if (bl.stockMisAJour) {
      for (const ligne of bl.lignes) {
        if (ligne.produitId) {
          const restoreKey = `DELETE_BL:${id}:${ligne.produitId}:${ligne.id}`;
          await recordStockMovement(tx, {
            productId: ligne.produitId,
            quantity: ligne.quantiteLivree,
            type: StockMovementType.ADJUSTMENT,
            stockDelta: ligne.quantiteLivree, // Restitution → delta positif
            nature: 'AJUSTEMENT',
            documentType: 'ANNULATION_BL',
            reference: bl.code,
            sourceType: 'DELETE_BL',
            sourceId: id,
            sourceLineId: ligne.id,
            operationKey: restoreKey,
          });
        }
      }
    }

    // 1. Supprimer les factures associées (via lien direct ou jonction)
    const factureIds = [
      ...bl.factures.map((f) => f.id),
      ...bl.facturesJonction.map((fj) => fj.factureId),
    ];
    const uniqueFactureIds = Array.from(new Set(factureIds));

    for (const fid of uniqueFactureIds) {
      await tx.paiement.deleteMany({ where: { factureId: fid } });
      await tx.ligneFacture.deleteMany({ where: { factureId: fid } });
      await tx.factureBonLivraison.deleteMany({ where: { factureId: fid } });
      await tx.facture.delete({ where: { id: fid } });
    }

    // 2. Supprimer la jonction pour ce BL
    await tx.factureBonLivraison.deleteMany({ where: { bonLivraisonId: id } });

    // 3. Supprimer les lignes du BL
    await tx.ligneBonLivraison.deleteMany({ where: { bonId: id } });

    // 4. Supprimer le Bon de Livraison
    await tx.bonLivraison.delete({ where: { id } });

    // 5. Supprimer la Commande associée si elle existe et qu'aucun autre BL n'y est rattaché
    if (bl.commandeId) {
      const otherBLsCount = await tx.bonLivraison.count({
        where: { commandeId: bl.commandeId },
      });
      if (otherBLsCount === 0) {
        // Supprimer les lignes de la commande
        await tx.ligneCommande.deleteMany({ where: { commandeId: bl.commandeId } });
        // Supprimer la commande
        await tx.commande.delete({ where: { id: bl.commandeId } });
      }
    }

    return { message: 'Bon de livraison et commande associée supprimés avec succès' };
  });
};

// ─── Facture from BL ─────────────────────────────────────────────────────────

export const facturerBL = async (id: number, timbreFiscal: number, dateEmission: string) => {
  const bl = await prisma.bonLivraison.findUnique({
    where: { id },
    include: {
      lignes: true,
      utilisateur: true,
      factures: { select: { id: true, numero: true } },
    },
  });
  if (!bl) throw new BLError('Bon de livraison introuvable', 404);
  if (bl.factures.length > 0) {
    throw new BLError(`Ce bon de livraison a déjà été facturé (${bl.factures[0].numero})`, 409);
  }
  if (bl.lignes.length === 0) throw new BLError('Le bon de livraison ne contient aucune ligne');

  let computedHT = 0;
  let computedTVA = 0;
  const lignesFacture = bl.lignes.map((l) => {
    const qty = l.quantiteLivree;
    const pu = Number(l.prixUnitaireHT);
    const tva = Number(l.tauxTVA);
    const lineHT = round3(qty * pu);
    const lineTVA = round3(lineHT * (tva / 100));
    computedHT += lineHT;
    computedTVA += lineTVA;
    return { designation: l.designation, quantite: qty, prixUnitaireHT: pu, tauxTVA: tva, totalHT: lineHT };
  });
  computedHT = round3(computedHT);
  computedTVA = round3(computedTVA);
  const computedTTC = round3(computedHT + computedTVA + timbreFiscal);

  const clientNom = bl.clientNom || (bl.utilisateur ? `${bl.utilisateur.nom || ''} ${bl.utilisateur.prenom || ''}`.trim() : 'Client');

  return prisma.$transaction(async (tx) => {
    const numero = await generateDocumentNumber(tx, 'FACTURE_VENTE');
    const facture = await tx.facture.create({
      data: {
        numero,
        statut: 'BROUILLON',
        statutPaiement: 'NON_PAYEE',
        typeFacture: 'FACTURE',
        bonLivraisonId: bl.id,
        commandeId: bl.commandeId || null,
        utilisateurId: bl.utilisateurId || null,
        dateEmission: new Date(dateEmission),
        clientNom,
        clientMF: bl.clientMF || bl.utilisateur?.matriculeFiscale || null,
        clientAdresse: bl.clientAdresse || bl.utilisateur?.adresse || null,
        clientTelephone: bl.clientTel || bl.utilisateur?.telephone || null,
        clientEmail: bl.clientEmail || bl.utilisateur?.email || null,
        timbreFiscal,
        montantHT: computedHT,
        montantTVA: computedTVA,
        montantTTC: computedTTC,
        lignes: { create: lignesFacture },
      },
      include: { lignes: true },
    });
    await tx.bonLivraison.update({
      where: { id: bl.id },
      data: { statut: 'FACTURE' },
    });
    return facture;
  });
};

// ─── Sync Commande status ─────────────────────────────────────────────────────

export const syncCommandeStatus = async (commandeId: number) => {
  const bls = await prisma.bonLivraison.findMany({
    where: { commandeId },
    select: { statut: true },
  });
  if (bls.length === 0) return;
  const allLivre = bls.every((b) => b.statut === 'LIVRE' || b.statut === 'FACTURE');
  const anyLivre = bls.some((b) => b.statut === 'LIVRE' || b.statut === 'FACTURE');
  let newStatut: string;
  if (allLivre) newStatut = 'LIVREE';
  else if (anyLivre) newStatut = 'PARTIELLEMENT_LIVREE';
  else newStatut = 'EN_PREPARATION';

  await prisma.commande.update({ where: { id: commandeId }, data: { statut: newStatut as any } });
};
