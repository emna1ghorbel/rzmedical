import prisma from '../../config/prisma';
import { Prisma } from '../../../generated/prisma/client';
import { recordStockMovement } from '../stock/stock.service';
import { StockMovementType } from '../../../generated/prisma/enums';
import { generateDocumentNumber } from '../exercices/document-numbers.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

const round3 = (x: number) => Math.round(x * 1000) / 1000;

function calcLigneHT(
  qty: number,
  pu: number,
  remise: number,
): number {
  const prixApresRemise = pu * (1 - remise / 100);
  return round3(qty * prixApresRemise);
}

function calcLigneTTC(totalHT: number, tauxTVA: number): number {
  return round3(totalHT * (1 + tauxTVA / 100));
}

// ─── Code generation ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// BON DE COMMANDE
// ─────────────────────────────────────────────────────────────────────────────

export async function listBonsCommande(params: {
  page?: number;
  limit?: number;
  statut?: string;
  fournisseurId?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, statut, fournisseurId, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.BonCommandeWhereInput = {};
  if (statut) where.statut = statut as any;
  if (fournisseurId) where.fournisseurId = fournisseurId;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { fournisseurNom: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.bonCommande.count({ where }),
    prisma.bonCommande.findMany({
      where,
      skip,
      take: limit,
      orderBy: { creeLe: 'desc' },
      include: {
        fournisseur: { select: { id: true, nom: true } },
        lignes: true,
        _count: { select: { bonsReception: true } },
      },
    }),
  ]);

  return { total, page, limit, items };
}

export async function getBonCommande(id: number) {
  return prisma.bonCommande.findUnique({
    where: { id },
    include: {
      fournisseur: true,
      lignes: true,
      bonsReception: { select: { id: true, code: true, statut: true, dateReception: true } },
      facturesFournisseur: { select: { id: true, numero: true, statut: true } },
    },
  });
}

export async function createBonCommande(body: any) {
  // Snapshot fournisseur
  let snap: any = {};
  if (body.fournisseurId) {
    const f = await prisma.fournisseur.findUnique({ where: { id: body.fournisseurId } });
    if (f) {
      snap = {
        fournisseurNom: f.nom,
        fournisseurMF: f.matriculeFiscale,
        fournisseurAdresse: f.adresse,
        fournisseurTel: f.telephone,
        fournisseurEmail: f.email,
      };
    }
  }

  // Compute totals from lignes
  const lignes = (body.lignes ?? []) as any[];
  let montantHT = 0;
  let montantRemise = 0;
  let montantTVA = 0;

  const lignesData = lignes.map((l: any) => {
    const qty = Number(l.quantite);
    const pu = Number(l.prixUnitaireHT);
    const remise = Number(l.remise ?? 0);
    const tauxTVA = Number(l.tauxTVA ?? 19);
    const puBrut = round3(qty * pu);
    const remiseMontant = round3(puBrut * remise / 100);
    const ht = round3(puBrut - remiseMontant);
    montantHT += ht;
    montantRemise += remiseMontant;
    montantTVA += round3(ht * tauxTVA / 100);
    return {
      produitId: l.produitId ?? null,
      designation: l.designation,
      quantite: qty,
      prixUnitaireHT: pu,
      remise,
      tauxTVA,
      totalHT: ht,
    };
  });

  const timbre = Number(body.timbreFiscal ?? 0);
  const montantTTC = round3(montantHT + montantTVA + timbre);

  return prisma.$transaction(async (tx) => {
    const code = await generateDocumentNumber(tx, 'COMMANDE');
    return tx.bonCommande.create({
    data: {
      code,
      fournisseurId: body.fournisseurId ?? null,
      ...snap,
      dateCommande: body.dateCommande ? new Date(body.dateCommande) : new Date(),
      dateLivraisonPrevue: body.dateLivraisonPrevue ? new Date(body.dateLivraisonPrevue) : null,
      statut: body.statut ?? 'BROUILLON',
      devise: body.devise ?? 'TND',
      montantHT,
      montantRemise,
      montantTVA,
      timbreFiscal: timbre,
      montantTTC,
      commentaire: body.commentaire ?? null,
      lignes: { create: lignesData },
    },
    include: { lignes: true },
    });
  });
}

export async function updateBonCommande(id: number, body: any) {
  // Snapshot fournisseur if changed
  let snap: any = {};
  if (body.fournisseurId) {
    const f = await prisma.fournisseur.findUnique({ where: { id: body.fournisseurId } });
    if (f) {
      snap = {
        fournisseurNom: f.nom,
        fournisseurMF: f.matriculeFiscale,
        fournisseurAdresse: f.adresse,
        fournisseurTel: f.telephone,
        fournisseurEmail: f.email,
      };
    }
  }

  // Compute totals
  const lignes = (body.lignes ?? []) as any[];
  let montantHT = 0;
  let montantRemise = 0;
  let montantTVA = 0;

  const lignesData = lignes.map((l: any) => {
    const qty = Number(l.quantite);
    const pu = Number(l.prixUnitaireHT);
    const remise = Number(l.remise ?? 0);
    const tauxTVA = Number(l.tauxTVA ?? 19);
    const puBrut = round3(qty * pu);
    const remiseMontant = round3(puBrut * remise / 100);
    const ht = round3(puBrut - remiseMontant);
    montantHT += ht;
    montantRemise += remiseMontant;
    montantTVA += round3(ht * tauxTVA / 100);
    return {
      produitId: l.produitId ?? null,
      designation: l.designation,
      quantite: qty,
      prixUnitaireHT: pu,
      remise,
      tauxTVA,
      totalHT: ht,
    };
  });

  const timbre = Number(body.timbreFiscal ?? 0);
  const montantTTC = round3(montantHT + montantTVA + timbre);

  // Delete existing lignes then recreate
  await prisma.ligneBonCommande.deleteMany({ where: { bonCommandeId: id } });

  return prisma.bonCommande.update({
    where: { id },
    data: {
      fournisseurId: body.fournisseurId ?? null,
      ...snap,
      dateCommande: body.dateCommande ? new Date(body.dateCommande) : undefined,
      dateLivraisonPrevue: body.dateLivraisonPrevue ? new Date(body.dateLivraisonPrevue) : null,
      statut: body.statut,
      devise: body.devise,
      montantHT,
      montantRemise,
      montantTVA,
      timbreFiscal: timbre,
      montantTTC,
      commentaire: body.commentaire ?? null,
      lignes: { create: lignesData },
    },
    include: { lignes: true },
  });
}

export async function deleteBonCommande(id: number) {
  return prisma.bonCommande.delete({ where: { id } });
}

/** Transform a BC into a new BR */
export async function transformerBCenBR(bcId: number) {
  const bc = await prisma.bonCommande.findUnique({
    where: { id: bcId },
    include: { lignes: true, bonsReception: { select: { id: true, code: true } } },
  });
  if (!bc) throw new Error('Bon de commande introuvable');
  if (bc.statut === 'ANNULE') throw new Error('Un bon de commande annulé ne peut pas être réceptionné');
  if (bc.bonsReception.length > 0) {
    throw new Error(`Ce bon de commande possède déjà un bon de réception (${bc.bonsReception[0].code})`);
  }

  const br = await prisma.$transaction(async (tx) => {
    const code = await generateDocumentNumber(tx, 'BON_RECEPTION');
    return tx.bonReception.create({
    data: {
      code,
      bonCommandeId: bcId,
      fournisseurId: bc.fournisseurId,
      fournisseurNom: bc.fournisseurNom,
      statut: 'BROUILLON',
      lignes: {
        create: bc.lignes.map((l) => ({
          produitId: l.produitId,
          designation: l.designation,
          quantiteCmd: l.quantite,
          quantiteRecue: l.quantite, // prefilled, to adjust
          prixUnitaireHT: l.prixUnitaireHT,
          tauxTVA: l.tauxTVA,
        })),
      },
    },
    include: { lignes: true },
    });
  });

  // Update BC status
  await prisma.bonCommande.update({
    where: { id: bcId },
    data: { statut: 'RECEPTIONNE_PARTIEL' },
  });

  return br;
}

// ─────────────────────────────────────────────────────────────────────────────
// BON DE RÉCEPTION
// ─────────────────────────────────────────────────────────────────────────────

export async function listBonsReception(params: {
  page?: number;
  limit?: number;
  statut?: string;
  fournisseurId?: number;
  search?: string;
}) {
  const { page = 1, limit = 20, statut, fournisseurId, search } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.BonReceptionWhereInput = {};
  if (statut) where.statut = statut as any;
  if (fournisseurId) where.fournisseurId = fournisseurId;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { fournisseurNom: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.bonReception.count({ where }),
    prisma.bonReception.findMany({
      where,
      skip,
      take: limit,
      orderBy: { creeLe: 'desc' },
      include: {
        fournisseur: { select: { id: true, nom: true } },
        bonCommande: { select: { id: true, code: true } },
        lignes: true,
      },
    }),
  ]);

  return { total, page, limit, items };
}

export async function getBonReception(id: number) {
  return prisma.bonReception.findUnique({
    where: { id },
    include: {
      fournisseur: true,
      bonCommande: { select: { id: true, code: true, statut: true } },
      lignes: true,
      facturesFournisseur: { select: { id: true, numero: true, statut: true } },
    },
  });
}

export async function createBonReception(body: any) {
  let fournisseurNom: string | null = null;
  let fournisseurId = body.fournisseurId ?? null;
  if (body.bonCommandeId) {
    const bc = await prisma.bonCommande.findUnique({ where: { id: Number(body.bonCommandeId) }, select: { fournisseurId: true, fournisseurNom: true } });
    if (!bc) throw new Error('Bon de commande introuvable');
    if (fournisseurId && bc.fournisseurId && Number(fournisseurId) !== bc.fournisseurId) {
      throw new Error('Le fournisseur du bon de réception doit être celui du bon de commande');
    }
    fournisseurId = bc.fournisseurId;
    fournisseurNom = bc.fournisseurNom;
  }
  if (fournisseurId && !fournisseurNom) {
    const f = await prisma.fournisseur.findUnique({ where: { id: Number(fournisseurId) } });
    fournisseurNom = f?.nom ?? null;
  }

  const lignes = (body.lignes ?? []) as any[];

  return prisma.$transaction(async (tx) => {
    const code = await generateDocumentNumber(tx, 'BON_RECEPTION');
    return tx.bonReception.create({
    data: {
      code,
      bonCommandeId: body.bonCommandeId ?? null,
      fournisseurId,
      fournisseurNom,
      dateReception: body.dateReception ? new Date(body.dateReception) : new Date(),
      statut: body.statut ?? 'BROUILLON',
      commentaire: body.commentaire ?? null,
      lignes: {
        create: lignes.map((l: any) => ({
          produitId: l.produitId ?? null,
          designation: l.designation,
          quantiteCmd: Number(l.quantiteCmd ?? 0),
          quantiteRecue: Number(l.quantiteRecue),
          prixUnitaireHT: Number(l.prixUnitaireHT),
          tauxTVA: Number(l.tauxTVA ?? 19),
        })),
      },
    },
    include: { lignes: true },
    });
  });
}

export async function updateBonReception(id: number, body: any) {
  const current = await prisma.bonReception.findUnique({ where: { id }, select: { statut: true, bonCommandeId: true, fournisseurId: true } });
  if (!current) throw new Error('Bon de réception introuvable');
  if (current.statut === 'FACTURE' || current.statut === 'VALIDE') throw new Error('Un bon de réception validé ou facturé ne peut plus être modifié');
  const bonCommandeId = body.bonCommandeId !== undefined ? body.bonCommandeId : current.bonCommandeId;
  const fournisseurId = body.fournisseurId !== undefined ? body.fournisseurId : current.fournisseurId;
  if (bonCommandeId && fournisseurId) {
    const bc = await prisma.bonCommande.findUnique({ where: { id: Number(bonCommandeId) }, select: { fournisseurId: true } });
    if (bc?.fournisseurId && Number(fournisseurId) !== bc.fournisseurId) throw new Error('Le fournisseur doit correspondre au bon de commande');
  }
  let fournisseurNom: string | null | undefined = undefined;
  if (fournisseurId) {
    const f = await prisma.fournisseur.findUnique({ where: { id: Number(fournisseurId) } });
    fournisseurNom = f?.nom ?? null;
  }

  const lignes = (body.lignes ?? []) as any[];
  await prisma.ligneBonReception.deleteMany({ where: { bonReceptionId: id } });

  return prisma.bonReception.update({
    where: { id },
    data: {
      bonCommandeId,
      fournisseurId,
      fournisseurNom,
      dateReception: body.dateReception ? new Date(body.dateReception) : undefined,
      statut: body.statut,
      commentaire: body.commentaire ?? null,
      lignes: {
        create: lignes.map((l: any) => ({
          produitId: l.produitId ?? null,
          designation: l.designation,
          quantiteCmd: Number(l.quantiteCmd ?? 0),
          quantiteRecue: Number(l.quantiteRecue),
          prixUnitaireHT: Number(l.prixUnitaireHT),
          tauxTVA: Number(l.tauxTVA ?? 19),
        })),
      },
    },
    include: { lignes: true },
  });
}

/** Valider un BR : marque VALIDE et incrémente le stock des produits */
export async function validerBonReception(id: number) {
  const br = await prisma.bonReception.findUnique({
    where: { id },
    include: { lignes: true },
  });
  if (!br) throw new Error('Bon de réception introuvable');
  if (br.statut === 'VALIDE') throw new Error('Ce bon de réception est déjà validé');
  if (br.stockMisAJour) throw new Error('Le stock a déjà été mis à jour pour ce bon');

  // Atomic: update stock for each product ligne
  await prisma.$transaction(async (tx) => {
    for (const ligne of br.lignes) {
      if (ligne.produitId) {
        await recordStockMovement(tx, {
          productId: ligne.produitId,
          quantity: Number(ligne.quantiteRecue),
          type: StockMovementType.PURCHASE,
          unitPrice: Number(ligne.prixUnitaireHT),
          nature: 'ENTREE',
          documentType: 'BON_RECEPTION',
          reference: br.code,
          sourceType: 'BON_RECEPTION',
          sourceId: br.id,
          sourceLineId: ligne.id,
        });
      }
    }
    await tx.bonReception.update({
      where: { id },
      data: { statut: 'VALIDE', stockMisAJour: true },
    });
    // Update parent BC if any
    if (br.bonCommandeId) {
      await tx.bonCommande.update({
        where: { id: br.bonCommandeId },
        data: { statut: 'RECEPTIONNE' },
      });
    }
  });

  return prisma.bonReception.findUnique({ where: { id }, include: { lignes: true } });
}

/** Transform a BR into a Facture Fournisseur */
export async function transformerBRenFF(brId: number) {
  const br = await prisma.bonReception.findUnique({
    where: { id: brId },
    include: {
      lignes: true,
      bonCommande: true,
      fournisseur: true,
    },
  });
  if (!br) throw new Error('Bon de réception introuvable');
  if (br.statut !== 'VALIDE') throw new Error('Le bon de réception doit être validé avant de créer une facture');
  const existing = await prisma.factureFournisseur.findFirst({ where: { bonReceptionId: brId }, select: { numero: true } });
  if (existing) throw new Error(`Ce bon de réception est déjà facturé (${existing.numero})`);

  // Snapshot fournisseur
  const f = br.fournisseur;

  // Compute totals from BR lignes
  let montantHT = 0;
  let montantTVA = 0;

  const lignesData = br.lignes.map((l) => {
    const ht = round3(Number(l.quantiteRecue) * Number(l.prixUnitaireHT));
    const tva = round3(ht * Number(l.tauxTVA) / 100);
    const ttc = round3(ht + tva);
    montantHT += ht;
    montantTVA += tva;
    return {
      produitId: l.produitId,
      designation: l.designation,
      quantite: l.quantiteRecue,
      prixUnitaireHT: l.prixUnitaireHT,
      remise: 0,
      tauxTVA: l.tauxTVA,
      totalHT: ht,
      totalTTC: ttc,
    };
  });

  const montantTTC = round3(montantHT + montantTVA);

  return prisma.$transaction(async (tx) => {
    const numero = await generateDocumentNumber(tx, 'FACTURE_ACHAT');
    const ff = await tx.factureFournisseur.create({
      data: {
      numero,
      bonCommandeId: br.bonCommandeId,
      bonReceptionId: brId,
      fournisseurId: br.fournisseurId,
      fournisseurNom: f?.nom ?? br.fournisseurNom,
      fournisseurMF: f?.matriculeFiscale ?? null,
      fournisseurAdresse: f?.adresse ?? null,
      fournisseurTel: f?.telephone ?? null,
      fournisseurEmail: f?.email ?? null,
      statut: 'BROUILLON',
      montantHT,
      montantTVA,
      montantTTC,
      solde: montantTTC,
      lignes: { create: lignesData },
      },
      include: { lignes: true },
    });

    await tx.bonReception.update({ where: { id: brId }, data: { statut: 'FACTURE' } });

    return ff;
  });
}

export async function deleteBonReception(id: number) {
  const br = await prisma.bonReception.findUnique({
    where: { id },
    include: { lignes: true },
  });
  if (!br) throw new Error('Bon de réception introuvable');

  return prisma.$transaction(async (tx) => {
    // Annuler les entrées de stock si le BR avait été validé
    if (br.stockMisAJour) {
      for (const ligne of br.lignes) {
        if (ligne.produitId) {
          const restoreKey = `DELETE_BR:${id}:${ligne.produitId}:${ligne.id}`;
          await recordStockMovement(tx, {
            productId: ligne.produitId,
            quantity: Number(ligne.quantiteRecue),
            type: StockMovementType.ADJUSTMENT,
            stockDelta: -Number(ligne.quantiteRecue), // Annulation → delta négatif
            nature: 'AJUSTEMENT',
            documentType: 'ANNULATION_BR',
            reference: br.code,
            sourceType: 'DELETE_BR',
            sourceId: id,
            sourceLineId: ligne.id,
            operationKey: restoreKey,
          });
        }
      }
    }
    // Supprimer les lignes puis le BR
    await tx.ligneBonReception.deleteMany({ where: { bonReceptionId: id } });
    return tx.bonReception.delete({ where: { id } });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTURE FOURNISSEUR
// ─────────────────────────────────────────────────────────────────────────────

export async function listFacturesFournisseurs(params: {
  page?: number;
  limit?: number;
  statut?: string;
  statutPaiement?: string;
  fournisseurId?: number;
  search?: string;
  categorie?: string;
}) {
  const { page = 1, limit = 20, statut, statutPaiement, fournisseurId, search, categorie } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.FactureFournisseurWhereInput = {};
  if (statut) where.statut = statut as any;
  if (statutPaiement) where.statutPaiement = statutPaiement as any;
  if (fournisseurId) where.fournisseurId = fournisseurId;
  if (categorie) where.categorie = categorie as any;
  if (search) {
    where.OR = [
      { numero: { contains: search, mode: 'insensitive' } },
      { fournisseurNom: { contains: search, mode: 'insensitive' } },
      { numeroFactureFournisseur: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.factureFournisseur.count({ where }),
    prisma.factureFournisseur.findMany({
      where,
      skip,
      take: limit,
      orderBy: { creeLe: 'desc' },
      include: {
        fournisseur: { select: { id: true, nom: true } },
        bonCommande: { select: { id: true, code: true } },
        bonReception: { select: { id: true, code: true } },
        _count: { select: { paiements: true } },
      },
    }),
  ]);

  return { total, page, limit, items };
}

export async function getFactureFournisseur(id: number) {
  return prisma.factureFournisseur.findUnique({
    where: { id },
    include: {
      fournisseur: true,
      bonCommande: { select: { id: true, code: true, statut: true } },
      bonReception: { select: { id: true, code: true, statut: true } },
      lignes: true,
      paiements: { orderBy: { datePaiement: 'desc' } },
    },
  });
}

export async function createFactureFournisseur(body: any) {
  // Snapshot fournisseur
  let snap: any = {};
  if (body.fournisseurId) {
    const f = await prisma.fournisseur.findUnique({ where: { id: body.fournisseurId } });
    if (f) {
      snap = {
        fournisseurNom: f.nom,
        fournisseurMF: f.matriculeFiscale,
        fournisseurAdresse: f.adresse,
        fournisseurTel: f.telephone,
        fournisseurEmail: f.email,
      };
    }
  }
  if (body.fournisseurMF !== undefined) snap.fournisseurMF = String(body.fournisseurMF).trim() || null;

  const lignes = (body.lignes ?? []) as any[];
  let montantHT = 0;
  let montantRemise = 0;
  let montantTVA = 0;
  let montantLignesTTC = 0;
  let hasManualLineTTC = false;

  const lignesData = lignes.map((l: any) => {
    const qty = Number(l.quantite);
    const pu = Number(l.prixUnitaireHT);
    const remise = Number(l.remise ?? 0);
    const tauxTVA = Number(l.tauxTVA ?? 19);
    const puBrut = round3(qty * pu);
    const remiseMontant = round3(puBrut * remise / 100);
    const ht = round3(puBrut - remiseMontant);
    const ttcAuto = round3(ht * (1 + tauxTVA / 100));
    const ttc = body.calculManuel && l.totalTTC !== undefined
      ? round3(Number(l.totalTTC))
      : ttcAuto;
    if (body.calculManuel && l.totalTTCManuel !== undefined) hasManualLineTTC = true;
    montantLignesTTC += ttc;
    montantHT += ht;
    montantRemise += remiseMontant;
    montantTVA += round3(ht * tauxTVA / 100);
    return {
      produitId: l.produitId ?? null,
      designation: l.designation,
      quantite: qty,
      prixUnitaireHT: pu,
      remise,
      tauxTVA,
      totalHT: ht,
      totalTTC: ttc,
    };
  });

  const timbre = Number(body.timbreFiscal ?? 0);
  const equilibre = Number(body.equilibre ?? 0);
  const montantTTCAuto = round3(montantHT + montantTVA + timbre + equilibre);
  const montantTTC = hasManualLineTTC
    ? round3(montantLignesTTC + timbre + equilibre)
    : body.calculManuel && body.montantTTC !== undefined
    ? round3(Number(body.montantTTC))
    : montantTTCAuto;

  return prisma.$transaction(async (tx) => {
    const numero = await generateDocumentNumber(
      tx,
      body.etat === 'AVOIR' ? 'AVOIR_ACHAT' : 'FACTURE_ACHAT',
    );
    const facture = await tx.factureFournisseur.create({
      data: {
      numero,
      numeroFactureFournisseur: body.numeroFactureFournisseur ?? null,
      fournisseurId: body.fournisseurId ?? null,
      ...snap,
      bonCommandeId: body.bonCommandeId ?? null,
      bonReceptionId: body.bonReceptionId ?? null,
      dateFacture: body.dateFacture ? new Date(body.dateFacture) : new Date(),
      dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
      statut: body.statut ?? 'BROUILLON',
      typeFacture: body.typeFacture ?? 'PRODUIT',
      categorie: body.categorie ?? 'FOURNISSEUR',
      etat: body.etat ?? 'NORMALE',
      devise: body.devise ?? 'TND',
      montantHT,
      montantRemise,
      montantTVA,
      timbreFiscal: timbre,
      equilibre,
      montantTTC,
      montantPaye: 0,
      solde: montantTTC,
      calculManuel: body.calculManuel ?? false,
      stockMisAJour: Boolean(body.bonReceptionId),
      commentaire: body.commentaire ?? null,
      documentJointUrl: body.documentJointUrl ?? null,
      lignes: { create: lignesData },
    },
      include: { lignes: true },
    });

    if (!body.bonReceptionId) {
      for (const [lineIndex, ligne] of lignesData.entries()) {
        if (ligne.produitId) {
          await recordStockMovement(tx, {
            productId: Number(ligne.produitId),
            quantity: Number(ligne.quantite),
            type: StockMovementType.PURCHASE,
            unitPrice: Number(ligne.prixUnitaireHT),
            nature: 'ENTREE',
            documentType: 'FACTURE_FOURNISSEUR',
            reference: facture.numero,
            sourceType: 'FACTURE_FOURNISSEUR',
            sourceId: facture.id,
            sourceLineId: lineIndex,
          });
        }
      }
      await tx.factureFournisseur.update({ where: { id: facture.id }, data: { stockMisAJour: true } });
    }

    return facture;
  });
}

export async function updateFactureFournisseur(id: number, body: any) {
  const currentDocument = await prisma.factureFournisseur.findUnique({
    where: { id },
    select: {
      statut: true,
      bonCommandeId: true,
      bonReceptionId: true,
      fournisseurId: true,
      montantPaye: true,
      stockMisAJour: true,
      lignes: {
        select: { produitId: true, quantite: true, prixUnitaireHT: true },
      },
    },
  });
  if (!currentDocument) throw new Error('Facture fournisseur introuvable');
  if (currentDocument.statut === 'ANNULEE') throw new Error('Une facture fournisseur annulée ne peut plus être modifiée');

  const bonCommandeId = body.bonCommandeId !== undefined ? body.bonCommandeId : currentDocument.bonCommandeId;
  const bonReceptionId = body.bonReceptionId !== undefined ? body.bonReceptionId : currentDocument.bonReceptionId;
  const fournisseurId = body.fournisseurId !== undefined ? body.fournisseurId : currentDocument.fournisseurId;
  if (bonReceptionId) {
    const br = await prisma.bonReception.findUnique({ where: { id: Number(bonReceptionId) }, select: { fournisseurId: true, statut: true, bonCommandeId: true } });
    if (!br) throw new Error('Bon de réception introuvable');
    if (br.statut === 'FACTURE' && bonReceptionId !== currentDocument.bonReceptionId) throw new Error('Ce bon de réception est déjà facturé');
    if (br.fournisseurId && fournisseurId && Number(fournisseurId) !== br.fournisseurId) throw new Error('Le fournisseur doit correspondre au bon de réception');
  }
  let snap: any = {};
  if (fournisseurId) {
    const f = await prisma.fournisseur.findUnique({ where: { id: Number(fournisseurId) } });
    if (f) {
      snap = {
        fournisseurNom: f.nom,
        fournisseurMF: f.matriculeFiscale,
        fournisseurAdresse: f.adresse,
        fournisseurTel: f.telephone,
        fournisseurEmail: f.email,
      };
    }
  }
  if (body.fournisseurMF !== undefined) snap.fournisseurMF = String(body.fournisseurMF).trim() || null;

  const lignes = (body.lignes ?? []) as any[];
  let montantHT = 0;
  let montantRemise = 0;
  let montantTVA = 0;

  const lignesData = lignes.map((l: any) => {
    const qty = Number(l.quantite);
    const pu = Number(l.prixUnitaireHT);
    const remise = Number(l.remise ?? 0);
    const tauxTVA = Number(l.tauxTVA ?? 19);
    const puBrut = round3(qty * pu);
    const remiseMontant = round3(puBrut * remise / 100);
    const ht = round3(puBrut - remiseMontant);
    const ttc = round3(ht * (1 + tauxTVA / 100));
    montantHT += ht;
    montantRemise += remiseMontant;
    montantTVA += round3(ht * tauxTVA / 100);
    return {
      produitId: l.produitId ?? null,
      designation: l.designation,
      quantite: qty,
      prixUnitaireHT: pu,
      remise,
      tauxTVA,
      totalHT: ht,
      totalTTC: ttc,
    };
  });

  const timbre = Number(body.timbreFiscal ?? 0);
  const equilibre = Number(body.equilibre ?? 0);
  const montantTTC = round3(montantHT + montantTVA + timbre + equilibre);

  // Recalc solde
  const current = await prisma.factureFournisseur.findUnique({
    where: { id },
    select: { montantPaye: true },
  });
  const montantPaye = Number(currentDocument.montantPaye ?? current?.montantPaye ?? 0);
  const solde = round3(montantTTC - montantPaye);

  const aggregateStockLines = (source: Array<{ produitId: number | null; quantite: unknown; prixUnitaireHT: unknown }>) => {
    const grouped = new Map<number, { quantity: number; unitPrice: number }>();
    for (const line of source) {
      if (!line.produitId) continue;
      const quantity = Math.trunc(Number(line.quantite));
      if (!Number.isFinite(quantity) || quantity <= 0) continue;
      const productId = Number(line.produitId);
      const existing = grouped.get(productId);
      grouped.set(productId, {
        quantity: (existing?.quantity ?? 0) + quantity,
        unitPrice: Number(line.prixUnitaireHT),
      });
    }
    return grouped;
  };

  const invoiceAlreadyUpdatedStock = !currentDocument.bonReceptionId && currentDocument.stockMisAJour;
  const previousStockLines = invoiceAlreadyUpdatedStock
    ? aggregateStockLines(currentDocument.lignes)
    : new Map<number, { quantity: number; unitPrice: number }>();
  const nextStockLines = invoiceAlreadyUpdatedStock && !bonReceptionId
    ? aggregateStockLines(lignesData)
    : new Map<number, { quantity: number; unitPrice: number }>();

  return prisma.$transaction(async (tx) => {
    await tx.ligneFactureFournisseur.deleteMany({ where: { factureFournisseurId: id } });

    const facture = await tx.factureFournisseur.update({
      where: { id },
      data: {
        numeroFactureFournisseur: body.numeroFactureFournisseur ?? null,
        fournisseurId,
        ...snap,
        bonCommandeId,
        bonReceptionId,
        dateFacture: body.dateFacture ? new Date(body.dateFacture) : undefined,
        dateEcheance: body.dateEcheance ? new Date(body.dateEcheance) : null,
        statut: body.statut,
        typeFacture: body.typeFacture,
        etat: body.etat,
        devise: body.devise,
        montantHT,
        montantRemise,
        montantTVA,
        timbreFiscal: timbre,
        equilibre,
        montantTTC,
        solde,
        calculManuel: body.calculManuel ?? false,
        commentaire: body.commentaire ?? null,
        documentJointUrl: body.documentJointUrl ?? null,
        lignes: { create: lignesData },
      },
      include: { lignes: true },
    });

    const correctionId = Date.now();
    const productIds = new Set([...previousStockLines.keys(), ...nextStockLines.keys()]);
    for (const productId of productIds) {
      const previous = previousStockLines.get(productId);
      const next = nextStockLines.get(productId);
      const stockDelta = (next?.quantity ?? 0) - (previous?.quantity ?? 0);
      if (stockDelta === 0) continue;

      await recordStockMovement(tx, {
        productId,
        quantity: Math.abs(stockDelta),
        stockDelta,
        type: stockDelta > 0 ? StockMovementType.PURCHASE : StockMovementType.ADJUSTMENT,
        unitPrice: stockDelta > 0 ? next?.unitPrice : previous?.unitPrice,
        nature: stockDelta > 0 ? 'ENTREE' : 'AJUSTEMENT',
        documentType: 'MODIFICATION_FACTURE_FOURNISSEUR',
        reference: facture.numero,
        sourceType: 'FACTURE_FOURNISSEUR_UPDATE',
        sourceId: facture.id,
        sourceLineId: productId,
        operationKey: `FACTURE_FOURNISSEUR_UPDATE:${id}:${productId}:${correctionId}`,
      });
    }

    return facture;
  });
}

export async function deleteFactureFournisseur(id: number) {
  return prisma.factureFournisseur.delete({ where: { id } });
}

/** Enregistrer un paiement sur une Facture Fournisseur */
export async function addPaiementFF(ffId: number, body: {
  montant: number;
  modePaiement?: string;
  datePaiement?: string;
  reference?: string;
  commentaire?: string;
}) {
  const ff = await prisma.factureFournisseur.findUnique({
    where: { id: ffId },
    select: { montantTTC: true, montantPaye: true, solde: true, statut: true },
  });
  if (!ff) throw new Error('Facture fournisseur introuvable');
  if (ff.statut === 'ANNULEE') throw new Error('Impossible de payer une facture annulée');

  const montant = round3(Number(body.montant));
  const newMontantPaye = round3(Number(ff.montantPaye) + montant);
  const newSolde = round3(Number(ff.montantTTC) - newMontantPaye);

  let statutPaiement: string;
  if (newSolde <= 0) statutPaiement = 'PAYEE';
  else if (newMontantPaye > 0) statutPaiement = 'PARTIELLEMENT_PAYEE';
  else statutPaiement = 'NON_PAYEE';

  await prisma.$transaction(async (tx) => {
    await tx.paiementFactureFournisseur.create({
      data: {
        factureFournisseurId: ffId,
        montant,
        modePaiement: body.modePaiement ?? 'Virement',
        datePaiement: body.datePaiement ? new Date(body.datePaiement) : new Date(),
        reference: body.reference ?? null,
        commentaire: body.commentaire ?? null,
      },
    });
    await tx.factureFournisseur.update({
      where: { id: ffId },
      data: {
        montantPaye: newMontantPaye,
        solde: Math.max(0, newSolde),
        statutPaiement: statutPaiement as any,
      },
    });
  });

  return prisma.factureFournisseur.findUnique({
    where: { id: ffId },
    include: { paiements: { orderBy: { datePaiement: 'desc' } }, lignes: true },
  });
}

/** Statistiques globales du module ACHATS */
export async function getAchatsStats(categorie?: string) {
  const factureWhere = categorie ? { categorie: categorie as any } : {};
  const [
    totalBC,
    totalBR,
    totalFF,
    ffStats,
    ffParStatutPaiement,
  ] = await Promise.all([
    prisma.bonCommande.count(),
    prisma.bonReception.count(),
    prisma.factureFournisseur.count({ where: factureWhere }),
    prisma.factureFournisseur.aggregate({
      where: factureWhere,
      _sum: { montantHT: true, montantTTC: true, montantPaye: true, solde: true },
    }),
    prisma.factureFournisseur.groupBy({
      where: factureWhere,
      by: ['statutPaiement'],
      _count: { id: true },
      _sum: { montantTTC: true },
    }),
  ]);

  return {
    totalBC,
    totalBR,
    totalFF,
    montantTotalHT: Number(ffStats._sum.montantHT ?? 0),
    montantTotalTTC: Number(ffStats._sum.montantTTC ?? 0),
    montantPaye: Number(ffStats._sum.montantPaye ?? 0),
    montantImpaye: Number(ffStats._sum.solde ?? 0),
    parStatutPaiement: ffParStatutPaiement.map((r) => ({
      statut: r.statutPaiement,
      count: r._count.id,
      montant: Number(r._sum.montantTTC ?? 0),
    })),
  };
}
