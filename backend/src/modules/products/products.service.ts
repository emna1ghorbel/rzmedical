import prisma from '../../config/prisma';

// Include partagé par toutes les requêtes produit (catégorie + sous-catégorie + marque)
const productInclude = {
  sousCategorie: { include: { categorie: true } },
  marque: true,
} as const;

export interface ProductQuery {
  filter?: string;          // héritage : 'new' | 'promo'
  categorieId?: number;
  sousCategorieId?: number;
  marqueId?: number;
  q?: string;               // recherche texte
  promo?: boolean;          // uniquement les produits en promotion
  disponible?: boolean;
  minPrix?: number;
  maxPrix?: number;
  sort?: string;            // 'recent' | 'prix-asc' | 'prix-desc' | 'nom' | 'remise'
}

export const getAll = (query: ProductQuery = {}) => {
  // Raccourcis historiques conservés à l'identique
  if (query.filter === 'new') return getNew(20);
  if (query.filter === 'promo') return getPromo();

  const where: any = {};
  const and: any[] = [];

  if (query.categorieId) where.sousCategorie = { categorieId: query.categorieId };
  if (query.sousCategorieId) where.sousCategorieId = query.sousCategorieId;
  if (query.marqueId) where.marqueId = query.marqueId;
  if (query.disponible !== undefined) where.disponible = query.disponible;
  if (query.promo) where.remise = { gt: 0 };
  if (query.minPrix !== undefined || query.maxPrix !== undefined) {
    where.prix = {};
    if (query.minPrix !== undefined) where.prix.gte = query.minPrix;
    if (query.maxPrix !== undefined) where.prix.lte = query.maxPrix;
  }
  if (query.q && query.q.trim()) {
    const q = query.q.trim();
    const qLower = q.toLowerCase();
    const qUpper = q.toUpperCase();
    const qCap = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
    
    and.push({
      OR: [
        { nom: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { motsCles: { hasSome: [q, qLower, qUpper, qCap] } },
        { marque: { nom: { contains: q, mode: 'insensitive' } } },
        { sousCategorie: { nom: { contains: q, mode: 'insensitive' } } },
        { sousCategorie: { categorie: { nom: { contains: q, mode: 'insensitive' } } } },
      ],
    });
  }
  if (and.length) where.AND = and;

  const orderBy =
    query.sort === 'prix-asc' ? { prix: 'asc' as const } :
    query.sort === 'prix-desc' ? { prix: 'desc' as const } :
    query.sort === 'nom' ? { nom: 'asc' as const } :
    query.sort === 'remise' ? { remise: 'desc' as const } :
    { creeLe: 'desc' as const };

  return prisma.produit.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: productInclude,
    orderBy,
  });
};

export const getNew = (limit: number = 20) =>
  prisma.produit.findMany({
    take: limit,
    include: productInclude,
    orderBy: { creeLe: 'desc' },
  });

export const getPromo = () =>
  prisma.produit.findMany({
    where: {
      remise: { gt: 0 },
    },
    include: productInclude,
    orderBy: { remise: 'desc' },
  });

export const getById = (id: number) =>
  prisma.produit.findUnique({
    where: { id },
    include: productInclude,
  });

export const getByReference = (reference: string) =>
  prisma.produit.findUnique({
    where: { reference },
    include: productInclude,
  });

export const create = (data: {
  nom: string;
  reference: string;
  description?: string;
  expirationDate?: Date | null;
  prix: number;
  remise?: number;
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
