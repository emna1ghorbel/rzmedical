import prisma from '../../config/prisma';

export const getAll = () =>
  prisma.sousCategorie.findMany({
    include: { categorie: true, _count: { select: { produits: true } } },
    orderBy: { creeLe: 'desc' },
  });

export const getById = (id: number) =>
  prisma.sousCategorie.findUnique({ where: { id }, include: { categorie: true } });

export const create = (data: { nom: string; categorieId: number; image?: string }) =>
  prisma.sousCategorie.create({ data });

export const update = (id: number, data: { nom?: string; categorieId?: number; image?: string }) =>
  prisma.sousCategorie.update({ where: { id }, data });

export const remove = (id: number) =>
  prisma.sousCategorie.delete({ where: { id } });
