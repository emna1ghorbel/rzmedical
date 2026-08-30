import prisma from '../../config/prisma';

// Admin : retourne TOUTES les catégories (visible ou non)
export const getAll = () =>
  prisma.categorie.findMany({
    include: {
      _count: { select: { sousCategories: true } },
      sousCategories: { select: { id: true, nom: true }, orderBy: [{ ordre: 'asc' }, { nom: 'asc' }] },
    },
    orderBy: { creeLe: 'desc' },
  });

// Client : retourne uniquement les catégories visibles
export const getAllVisible = () =>
  prisma.categorie.findMany({
    where: { visible: true },
    include: {
      _count: { select: { sousCategories: true } },
      sousCategories: { select: { id: true, nom: true }, orderBy: [{ ordre: 'asc' }, { nom: 'asc' }] },
    },
    orderBy: { nom: 'asc' },
  });

export const getById = (id: number) =>
  prisma.categorie.findUnique({ where: { id } });

export const create = (nom: string) =>
  prisma.categorie.create({ data: { nom } });

export const update = (id: number, nom: string, visible?: boolean) =>
  prisma.categorie.update({
    where: { id },
    data: {
      nom,
      ...(visible !== undefined && { visible }),
    },
  });

export const remove = async (id: number) => {
  const categorie = await prisma.categorie.findUnique({
    where: { id },
    include: {
      sousCategories: { include: { _count: { select: { produits: true } } } },
      marques: { include: { _count: { select: { produits: true } } } },
    },
  });
  if (!categorie) {
    const error = new Error('Catégorie non trouvée') as Error & { code?: string };
    error.code = 'P2025';
    throw error;
  }
  const produitsLies = [
    ...categorie.sousCategories.filter((item) => item._count.produits > 0),
    ...categorie.marques.filter((item) => item._count.produits > 0),
  ];
  if (produitsLies.length > 0) {
    const error = new Error(
      'Cette catégorie contient des produits. Supprimez ou archivez d’abord ses produits, ou masquez la catégorie.',
    ) as Error & { code?: string };
    error.code = 'CATEGORY_IN_USE';
    throw error;
  }
  return prisma.$transaction(async (tx) => {
    await tx.sousCategorie.deleteMany({ where: { categorieId: id } });
    await tx.marque.deleteMany({ where: { categorieId: id } });
    return tx.categorie.delete({ where: { id } });
  });
};

// Toggle rapide : inverse la visibilité d'une catégorie
export const toggleVisible = async (id: number) => {
  const categorie = await prisma.categorie.findUnique({ where: { id } });
  if (!categorie) throw new Error('Catégorie non trouvée');
  return prisma.categorie.update({
    where: { id },
    data: { visible: !categorie.visible },
  });
};
