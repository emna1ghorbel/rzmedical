import prisma from '../../config/prisma';

type ChargeCategory = 'CHARGES' | 'CNSS' | 'NEUF_BA4A';

const round3 = (value: unknown) => Math.round(Number(value) * 1000) / 1000;
const required = (value: unknown, label: string) => {
  const result = String(value ?? '').trim();
  if (!result) throw new Error(`${label} est requis`);
  return result;
};
const positive = (value: unknown, label: string, allowZero = true) => {
  const result = round3(value);
  if (!Number.isFinite(result) || (allowZero ? result < 0 : result <= 0)) throw new Error(`${label} doit être valide`);
  return result;
};

function paymentStatus(body: any) {
  return body.statutPaiement === 'PAYEE' ? 'PAYEE' : body.statutPaiement === 'PARTIELLEMENT_PAYEE' ? 'PARTIELLEMENT_PAYEE' : 'NON_PAYEE';
}

const commercialConnect = (body: any) =>
  body.commercialId ? { commercial: { connect: { id: Number(body.commercialId) } } } : {};

const commercialInclude = { commercial: { select: { id: true, prenom: true, nom: true } } };

export async function createCharge(categorie: ChargeCategory, body: any) {
  const dateFacture = body.date ? new Date(body.date) : new Date();
  if (Number.isNaN(dateFacture.getTime())) throw new Error('Date invalide');

  if (categorie === 'CHARGES') {
    const montantHT = positive(body.montantHT, 'Montant HT');
    const tauxTVA = positive(body.tauxTVA ?? 0, 'TVA');
    const montantTTC = body.montantTTC === undefined || body.montantTTC === ''
      ? round3(montantHT * (1 + tauxTVA / 100))
      : positive(body.montantTTC, 'Montant TTC');
    const montantPaye = body.statutPaiement === 'PARTIELLEMENT_PAYEE' ? positive(body.montantPaye || 0, 'Montant payé', true) : (body.statutPaiement === 'PAYEE' ? montantTTC : 0);
    return prisma.chargeGenerale.create({ data: { numeroCharge: required(body.numeroCharge, 'Numéro de charge'), date: dateFacture, nature: required(body.nature, 'Nature de la charge'), description: body.description?.trim() || null, periodeConcernee: body.periodeConcernee?.trim() || null, beneficiaire: required(body.beneficiaire, 'Bénéficiaire'), montantHT, tauxTVA, montantTTC, statutPaiement: paymentStatus(body) as any, montantPaye, modePaiement: body.modePaiement?.trim() || null, datePaiement: body.datePaiement ? new Date(body.datePaiement) : null, referenceFacture: body.referenceFacture?.trim() || null, pieceJustificativeUrl: body.pieceJustificativeUrl?.trim() || null, notes: body.notes?.trim() || null, ...commercialConnect(body) } });
  }

  if (categorie === 'CNSS') {
    const partPatronale = positive(body.partPatronale, 'Part patronale');
    const partSalariale = positive(body.partSalariale, 'Part salariale');
    const total = round3(partPatronale + partSalariale);
    const montantPaye = body.statutPaiement === 'PARTIELLEMENT_PAYEE' ? positive(body.montantPaye || 0, 'Montant payé', true) : (body.statutPaiement === 'PAYEE' ? total : 0);
    return prisma.chargeCnss.create({ data: { numeroDeclaration: required(body.numeroDeclaration, 'Numéro de déclaration'), periodeDeclaration: required(body.periodeDeclaration, 'Période de déclaration'), matriculeEmployeur: required(body.matriculeEmployeur, 'Matricule employeur'), nombreSalaries: Math.trunc(positive(body.nombreSalaries, 'Nombre de salariés', false)), masseSalariale: positive(body.masseSalariale, 'Masse salariale'), partPatronale, partSalariale, totalCnss: total, statutPaiement: paymentStatus(body) as any, montantPaye, dateLimitePaiement: body.dateLimitePaiement ? new Date(body.dateLimitePaiement) : null, datePaiement: body.datePaiement ? new Date(body.datePaiement) : null, modePaiement: body.modePaiement?.trim() || null, referencePaiement: body.referencePaiement?.trim() || null, pieceJustificativeUrl: body.pieceJustificativeUrl?.trim() || null, notes: body.notes?.trim() || null, ...commercialConnect(body) } });
  }

  const montant = positive(body.montant, 'Montant');
  const montantPaye = body.statutPaiement === 'PARTIELLEMENT_PAYEE' ? positive(body.montantPaye || 0, 'Montant payé', true) : (body.statutPaiement === 'PAYEE' ? montant : 0);
  return prisma.charge9ba4a.create({ data: { numero: required(body.numero, 'Numéro'), date: dateFacture, description: required(body.description, 'Description'), beneficiaire: required(body.beneficiaire, 'Bénéficiaire'), montant, statutPaiement: paymentStatus(body) as any, montantPaye, modePaiement: body.modePaiement?.trim() || null, pieceJustificativeUrl: body.pieceJustificativeUrl?.trim() || null, notes: body.notes?.trim() || null, ...commercialConnect(body) } });
}

export async function listCharges(categorie: ChargeCategory) {
  if (categorie === 'CHARGES') return prisma.chargeGenerale.findMany({ orderBy: { creeLe: 'desc' }, include: commercialInclude });
  if (categorie === 'CNSS') return prisma.chargeCnss.findMany({ orderBy: { creeLe: 'desc' }, include: commercialInclude });
  return prisma.charge9ba4a.findMany({ orderBy: { creeLe: 'desc' }, include: commercialInclude });
}

export async function getCharge(categorie: ChargeCategory, id: number) {
  if (categorie === 'CHARGES') return prisma.chargeGenerale.findUnique({ where: { id }, include: commercialInclude });
  if (categorie === 'CNSS') return prisma.chargeCnss.findUnique({ where: { id }, include: commercialInclude });
  return prisma.charge9ba4a.findUnique({ where: { id }, include: commercialInclude });
}

export async function updateCharge(categorie: ChargeCategory, id: number, body: any) {
  const dateFacture = body.date ? new Date(body.date) : new Date();
  if (Number.isNaN(dateFacture.getTime())) throw new Error('Date invalide');

  if (categorie === 'CHARGES') {
    const montantHT = positive(body.montantHT, 'Montant HT');
    const tauxTVA = positive(body.tauxTVA ?? 0, 'TVA');
    const montantTTC = body.montantTTC === undefined || body.montantTTC === ''
      ? round3(montantHT * (1 + tauxTVA / 100))
      : positive(body.montantTTC, 'Montant TTC');
    const montantPaye = body.statutPaiement === 'PARTIELLEMENT_PAYEE' ? positive(body.montantPaye || 0, 'Montant payé', true) : (body.statutPaiement === 'PAYEE' ? montantTTC : 0);
    return prisma.chargeGenerale.update({ where: { id }, data: { numeroCharge: required(body.numeroCharge, 'Numéro de charge'), date: dateFacture, nature: required(body.nature, 'Nature de la charge'), description: body.description?.trim() || null, periodeConcernee: body.periodeConcernee?.trim() || null, beneficiaire: required(body.beneficiaire, 'Bénéficiaire'), montantHT, tauxTVA, montantTTC, statutPaiement: paymentStatus(body) as any, montantPaye, modePaiement: body.modePaiement?.trim() || null, datePaiement: body.datePaiement ? new Date(body.datePaiement) : null, referenceFacture: body.referenceFacture?.trim() || null, pieceJustificativeUrl: body.pieceJustificativeUrl?.trim() || null, notes: body.notes?.trim() || null, ...commercialConnect(body) } });
  }

  if (categorie === 'CNSS') {
    const partPatronale = positive(body.partPatronale, 'Part patronale');
    const partSalariale = positive(body.partSalariale, 'Part salariale');
    const total = round3(partPatronale + partSalariale);
    const montantPaye = body.statutPaiement === 'PARTIELLEMENT_PAYEE' ? positive(body.montantPaye || 0, 'Montant payé', true) : (body.statutPaiement === 'PAYEE' ? total : 0);
    return prisma.chargeCnss.update({ where: { id }, data: { numeroDeclaration: required(body.numeroDeclaration, 'Numéro de déclaration'), periodeDeclaration: required(body.periodeDeclaration, 'Période de déclaration'), matriculeEmployeur: required(body.matriculeEmployeur, 'Matricule employeur'), nombreSalaries: Math.trunc(positive(body.nombreSalaries, 'Nombre de salariés', false)), masseSalariale: positive(body.masseSalariale, 'Masse salariale'), partPatronale, partSalariale, totalCnss: total, statutPaiement: paymentStatus(body) as any, montantPaye, dateLimitePaiement: body.dateLimitePaiement ? new Date(body.dateLimitePaiement) : null, datePaiement: body.datePaiement ? new Date(body.datePaiement) : null, modePaiement: body.modePaiement?.trim() || null, referencePaiement: body.referencePaiement?.trim() || null, pieceJustificativeUrl: body.pieceJustificativeUrl?.trim() || null, notes: body.notes?.trim() || null, ...commercialConnect(body) } });
  }

  const montant = positive(body.montant, 'Montant');
  const montantPaye = body.statutPaiement === 'PARTIELLEMENT_PAYEE' ? positive(body.montantPaye || 0, 'Montant payé', true) : (body.statutPaiement === 'PAYEE' ? montant : 0);
  return prisma.charge9ba4a.update({ where: { id }, data: { numero: required(body.numero, 'Numéro'), date: dateFacture, description: required(body.description, 'Description'), beneficiaire: required(body.beneficiaire, 'Bénéficiaire'), montant, statutPaiement: paymentStatus(body) as any, montantPaye, modePaiement: body.modePaiement?.trim() || null, pieceJustificativeUrl: body.pieceJustificativeUrl?.trim() || null, notes: body.notes?.trim() || null, ...commercialConnect(body) } });
}
