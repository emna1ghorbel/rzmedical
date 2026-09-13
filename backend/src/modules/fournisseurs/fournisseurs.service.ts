import prisma from '../../config/prisma';

export interface FournisseurInput {
  nom: string;
  contactNom?: string;
  contactPrenom?: string;
  email?: string;
  telephone?: string;
  telephone2?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  matriculeFiscale?: string;
  registreCommerce?: string;
  categorie?: string;
  delaiPaiement?: string;
  modePaiement?: string;
  rib?: string;
  banque?: string;
  siteWeb?: string;
  notes?: string;
  actif?: boolean;
}

export const listFournisseurs = async (filters: {
  search?: string;
  categorie?: string;
  actif?: string;
}) => {
  const where: any = {};

  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { nom: { contains: q, mode: 'insensitive' } },
      { contactNom: { contains: q, mode: 'insensitive' } },
      { contactPrenom: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { telephone: { contains: q, mode: 'insensitive' } },
      { matriculeFiscale: { contains: q, mode: 'insensitive' } },
      { ville: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (filters.categorie && filters.categorie !== 'ALL') {
    where.categorie = filters.categorie;
  }

  if (filters.actif !== undefined && filters.actif !== 'ALL') {
    where.actif = filters.actif === 'true';
  }

  return prisma.fournisseur.findMany({
    where,
    orderBy: { nom: 'asc' },
  });
};

export const getFournisseursStats = async () => {
  const [total, actifs, inactifs, parCategorie] = await Promise.all([
    prisma.fournisseur.count(),
    prisma.fournisseur.count({ where: { actif: true } }),
    prisma.fournisseur.count({ where: { actif: false } }),
    prisma.fournisseur.groupBy({
      by: ['categorie'],
      _count: { id: true },
    }),
  ]);

  return {
    total,
    actifs,
    inactifs,
    parCategorie: parCategorie.map((c) => ({
      categorie: c.categorie || 'Non spécifiée',
      count: c._count.id,
    })),
  };
};

export const getFournisseurById = async (id: number) => {
  return prisma.fournisseur.findUnique({
    where: { id },
  });
};

export const createFournisseur = async (data: FournisseurInput) => {
  if (!data.nom || !data.nom.trim()) {
    throw new Error('Le nom du fournisseur est obligatoire.');
  }

  return prisma.fournisseur.create({
    data: {
      nom: data.nom.trim(),
      contactNom: data.contactNom?.trim() || null,
      contactPrenom: data.contactPrenom?.trim() || null,
      email: data.email?.trim() || null,
      telephone: data.telephone?.trim() || null,
      telephone2: data.telephone2?.trim() || null,
      adresse: data.adresse?.trim() || null,
      ville: data.ville?.trim() || null,
      codePostal: data.codePostal?.trim() || null,
      pays: data.pays?.trim() || 'Tunisie',
      matriculeFiscale: data.matriculeFiscale?.trim() || null,
      registreCommerce: data.registreCommerce?.trim() || null,
      categorie: data.categorie?.trim() || null,
      delaiPaiement: data.delaiPaiement?.trim() || null,
      modePaiement: data.modePaiement?.trim() || null,
      rib: data.rib?.trim() || null,
      banque: data.banque?.trim() || null,
      siteWeb: data.siteWeb?.trim() || null,
      notes: data.notes?.trim() || null,
      actif: data.actif !== undefined ? Boolean(data.actif) : true,
    },
  });
};

export const updateFournisseur = async (id: number, data: Partial<FournisseurInput>) => {
  const existing = await prisma.fournisseur.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Fournisseur #${id} introuvable.`);
  }

  return prisma.fournisseur.update({
    where: { id },
    data: {
      ...(data.nom !== undefined && { nom: data.nom.trim() }),
      ...(data.contactNom !== undefined && { contactNom: data.contactNom?.trim() || null }),
      ...(data.contactPrenom !== undefined && { contactPrenom: data.contactPrenom?.trim() || null }),
      ...(data.email !== undefined && { email: data.email?.trim() || null }),
      ...(data.telephone !== undefined && { telephone: data.telephone?.trim() || null }),
      ...(data.telephone2 !== undefined && { telephone2: data.telephone2?.trim() || null }),
      ...(data.adresse !== undefined && { adresse: data.adresse?.trim() || null }),
      ...(data.ville !== undefined && { ville: data.ville?.trim() || null }),
      ...(data.codePostal !== undefined && { codePostal: data.codePostal?.trim() || null }),
      ...(data.pays !== undefined && { pays: data.pays?.trim() || 'Tunisie' }),
      ...(data.matriculeFiscale !== undefined && { matriculeFiscale: data.matriculeFiscale?.trim() || null }),
      ...(data.registreCommerce !== undefined && { registreCommerce: data.registreCommerce?.trim() || null }),
      ...(data.categorie !== undefined && { categorie: data.categorie?.trim() || null }),
      ...(data.delaiPaiement !== undefined && { delaiPaiement: data.delaiPaiement?.trim() || null }),
      ...(data.modePaiement !== undefined && { modePaiement: data.modePaiement?.trim() || null }),
      ...(data.rib !== undefined && { rib: data.rib?.trim() || null }),
      ...(data.banque !== undefined && { banque: data.banque?.trim() || null }),
      ...(data.siteWeb !== undefined && { siteWeb: data.siteWeb?.trim() || null }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.actif !== undefined && { actif: Boolean(data.actif) }),
    },
  });
};

export const deleteFournisseur = async (id: number) => {
  const existing = await prisma.fournisseur.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Fournisseur #${id} introuvable.`);
  }

  return prisma.fournisseur.delete({
    where: { id },
  });
};
