import prisma from '../../config/prisma';

export const getAll = (query?: { categorieId?: number }) =>
  prisma.sousCategorie.findMany({
    where: query?.categorieId ? { categorieId: query.categorieId } : undefined,
    include: { categorie: true, _count: { select: { produits: true } } },
    orderBy: [{ ordre: 'asc' }, { creeLe: 'desc' }],
  });

export const getById = (id: number) =>
  prisma.sousCategorie.findUnique({ where: { id }, include: { categorie: true } });

export const create = (data: { nom: string; categorieId: number; image?: string; description?: string; ordre?: number }) =>
  prisma.sousCategorie.create({ data });

export const update = (id: number, data: { nom?: string; categorieId?: number; image?: string; description?: string; ordre?: number }) =>
  prisma.sousCategorie.update({ where: { id }, data });

export const reorder = (items: { id: number; ordre: number }[]) =>
  prisma.$transaction(
    items.map((item) =>
      prisma.sousCategorie.update({
        where: { id: item.id },
        data: { ordre: item.ordre },
      })
    )
  );

export const remove = (id: number) =>
  prisma.sousCategorie.delete({ where: { id } });
