import prisma from '../../config/prisma';

export const getAll = () =>
  prisma.categorie.findMany({
    include: {
      _count: { select: { sousCategories: true } },
      sousCategories: { select: { id: true, nom: true }, orderBy: { nom: 'asc' } },
    },
    orderBy: { creeLe: 'desc' },
  });

export const getById = (id: number) =>
  prisma.categorie.findUnique({ where: { id } });

export const create = (nom: string) =>
  prisma.categorie.create({ data: { nom } });

export const update = (id: number, nom: string) =>
  prisma.categorie.update({ where: { id }, data: { nom } });

export const remove = (id: number) =>
  prisma.categorie.delete({ where: { id } });
