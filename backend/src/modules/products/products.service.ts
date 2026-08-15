import prisma from '../../config/prisma';

export const getAll = () =>
  prisma.produit.findMany({
    include: {
      sousCategorie: { include: { categorie: true } },
      marque: true,
    },
    orderBy: { creeLe: 'desc' },
  });

export const getById = (id: number) =>
  prisma.produit.findUnique({
    where: { id },
    include: {
      sousCategorie: { include: { categorie: true } },
      marque: true,
    },
  });

export const create = (data: {
  nom: string;
  reference: string;
  description?: string;
  prix: number;
  stock?: number;
  images?: string[];
  video?: string;
  motsCles?: string[];
  ficheTechnique?: string;
  disponible?: boolean;
  sousCategorieId: number;
  marqueId: number;
}) => prisma.produit.create({ data });

export const update = (id: number, data: any) =>
  prisma.produit.update({ where: { id }, data });

export const remove = (id: number) =>
  prisma.produit.delete({ where: { id } });
