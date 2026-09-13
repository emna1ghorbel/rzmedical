import prisma from '../../config/prisma';

// ─── List all ─────────────────────────────────────────────────────────────────
export const listExercices = async () => {
  const list = await prisma.exercice.findMany({
    orderBy: { annee: 'desc' },
  });
  if (list.length === 0) {
    const currentYear = new Date().getFullYear();
    const defaultEx = await prisma.exercice.create({
      data: {
        annee: currentYear,
        label: `Exercice ${currentYear}`,
        dateDebut: new Date(`${currentYear}-01-01T00:00:00.000Z`),
        dateFin: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        isActif: true,
      },
    });
    return [defaultEx];
  }
  return list;
};

// ─── Get one ──────────────────────────────────────────────────────────────────
export const getExercice = async (id: number) => {
  return prisma.exercice.findUnique({ where: { id } });
};

// ─── Get actif ────────────────────────────────────────────────────────────────
export const getExerciceActif = async () => {
  let actif = await prisma.exercice.findFirst({ where: { isActif: true } });
  if (!actif) {
    const anyEx = await prisma.exercice.findFirst({ orderBy: { annee: 'desc' } });
    if (anyEx) {
      actif = await prisma.exercice.update({ where: { id: anyEx.id }, data: { isActif: true } });
    } else {
      const currentYear = new Date().getFullYear();
      actif = await prisma.exercice.create({
        data: {
          annee: currentYear,
          label: `Exercice ${currentYear}`,
          dateDebut: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          dateFin: new Date(`${currentYear}-12-31T23:59:59.999Z`),
          isActif: true,
        },
      });
    }
  }
  return actif;
};

// ─── Create ───────────────────────────────────────────────────────────────────
export const createExercice = async (data: {
  annee: number;
  label?: string;
  dateDebut: Date;
  dateFin: Date;
}) => {
  const label = data.label || `Exercice ${data.annee}`;

  // Vérifier si l'année existe déjà
  const existing = await prisma.exercice.findUnique({ where: { annee: data.annee } });
  if (existing) {
    throw new Error(`Un exercice pour l'année ${data.annee} existe déjà.`);
  }

  return prisma.exercice.create({
    data: {
      annee: data.annee,
      label,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      isActif: false,
    },
  });
};

// ─── Activer un exercice ──────────────────────────────────────────────────────
export const activerExercice = async (id: number) => {
  const exercice = await prisma.exercice.findUnique({ where: { id } });
  if (!exercice) throw new Error('Exercice introuvable');

  // Désactiver tous les autres exercices
  await prisma.exercice.updateMany({
    where: { isActif: true },
    data: { isActif: false },
  });

  // Activer l'exercice demandé
  return prisma.exercice.update({
    where: { id },
    data: { isActif: true },
  });
};

// ─── Update ───────────────────────────────────────────────────────────────────
export const updateExercice = async (
  id: number,
  data: { label?: string; dateDebut?: Date; dateFin?: Date }
) => {
  return prisma.exercice.update({ where: { id }, data });
};

// ─── Delete ───────────────────────────────────────────────────────────────────
export const deleteExercice = async (id: number) => {
  const exercice = await prisma.exercice.findUnique({ where: { id } });
  if (!exercice) throw new Error('Exercice introuvable');
  if (exercice.isActif) throw new Error('Impossible de supprimer l\'exercice actuellement actif.');

  // Vérifier si des factures existent dans la période
  const facCount = await prisma.facture.count({
    where: {
      dateEmission: { gte: exercice.dateDebut, lte: exercice.dateFin },
    },
  });
  if (facCount > 0) {
    throw new Error(
      `Impossible de supprimer cet exercice : ${facCount} facture(s) sont liées à cette période.`
    );
  }

  return prisma.exercice.delete({ where: { id } });
};

// ─── Stats : nombre de factures par exercice ──────────────────────────────────
export const getExerciceStats = async (id: number) => {
  const exercice = await prisma.exercice.findUnique({ where: { id } });
  if (!exercice) return null;

  const nbFactures = await prisma.facture.count({
    where: {
      dateEmission: { gte: exercice.dateDebut, lte: exercice.dateFin },
    },
  });

  const nbDevis = await prisma.devis.count({
    where: {
      dateDevis: { gte: exercice.dateDebut, lte: exercice.dateFin },
    },
  });

  return { nbFactures, nbDevis };
};
