import prisma from '../../config/prisma';

export interface TiersInput {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  matriculeFiscale?: string;
  activite?: string;
  remise?: number;
}

export const listTiers = async (search?: string) => {
  const whereUsers: any = {
    typeUtilisateur: 'CLIENT',
    OR: [
      { motDePasseHash: '' },
      { email: { contains: 'rzmedical.local' } },
      { email: { contains: 'client.facture' } },
    ],
  };

  if (search && search.trim()) {
    const q = search.trim();
    whereUsers.AND = [
      {
        OR: [
          { nom: { contains: q, mode: 'insensitive' } },
          { prenom: { contains: q, mode: 'insensitive' } },
          { telephone: { contains: q, mode: 'insensitive' } },
          { matriculeFiscale: { contains: q, mode: 'insensitive' } },
          { adresse: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
    ];
  }

  // 1. Récupérer les clients sans compte enregistrés dans Utilisateur
  const tiersUsers = await prisma.utilisateur.findMany({
    where: whereUsers,
    orderBy: { creeLe: 'desc' },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      adresse: true,
      matriculeFiscale: true,
      activite: true,
      remise: true,
      creeLe: true,
      factures: {
        select: {
          id: true,
          numero: true,
          montantTTC: true,
          statut: true,
          statutPaiement: true,
          dateEmission: true,
        },
        orderBy: { dateEmission: 'desc' },
      },
      bonsLivraison: {
        select: {
          id: true,
          code: true,
          statut: true,
        },
      },
      devis: {
        select: {
          id: true,
          numero: true,
          statut: true,
          montantTTC: true,
        },
      },
    },
  });

  // Calcul des métriques pour chaque tiers
  const formattedTiers = tiersUsers.map((u) => {
    const isSyntheticEmail = u.email.includes('rzmedical.local');
    const totalTTC = u.factures.reduce((sum, f) => sum + Number(f.montantTTC || 0), 0);
    const derniereFacture = u.factures[0]?.dateEmission || null;

    return {
      id: u.id,
      source: 'utilisateur' as const,
      nom: u.nom || '',
      prenom: u.prenom || '',
      nomComplet: `${u.nom || ''} ${u.prenom || ''}`.trim() || 'Client sans nom',
      email: isSyntheticEmail ? null : u.email,
      telephone: u.telephone,
      adresse: u.adresse,
      matriculeFiscale: u.matriculeFiscale,
      activite: u.activite,
      remise: Number(u.remise || 0),
      creeLe: u.creeLe,
      facturesCount: u.factures.length,
      totalFacturesTTC: Math.round(totalTTC * 1000) / 1000,
      derniereFacture,
      bonsLivraisonCount: u.bonsLivraison.length,
      devisCount: u.devis.length,
      factures: u.factures.slice(0, 5).map((f) => ({
        id: f.id,
        numero: f.numero,
        montantTTC: Number(f.montantTTC),
        statut: f.statut,
        statutPaiement: f.statutPaiement,
        dateEmission: f.dateEmission,
      })),
    };
  });

  return formattedTiers;
};

export const getTiersStats = async () => {
  const tiers = await listTiers();

  const totalTiers = tiers.length;
  const tiersAvecFactures = tiers.filter((t) => t.facturesCount > 0).length;
  const totalFacturesCount = tiers.reduce((acc, t) => acc + t.facturesCount, 0);
  const totalChiffreAffaires = tiers.reduce((acc, t) => acc + t.totalFacturesTTC, 0);

  return {
    totalTiers,
    tiersAvecFactures,
    totalFacturesCount,
    totalChiffreAffaires: Math.round(totalChiffreAffaires * 1000) / 1000,
  };
};

export const getTiersById = async (id: number) => {
  const user = await prisma.utilisateur.findUnique({
    where: { id },
    include: {
      factures: {
        orderBy: { dateEmission: 'desc' },
        include: {
          lignes: true,
          paiements: true,
        },
      },
      bonsLivraison: {
        orderBy: { creeLe: 'desc' },
        include: {
          lignes: true,
        },
      },
      devis: {
        orderBy: { dateDevis: 'desc' },
        include: {
          lignes: true,
        },
      },
    },
  });

  if (!user) return null;

  const isSyntheticEmail = user.email.includes('rzmedical.local');
  const totalTTC = user.factures.reduce((sum, f) => sum + Number(f.montantTTC || 0), 0);

  return {
    id: user.id,
    nom: user.nom || '',
    prenom: user.prenom || '',
    nomComplet: `${user.nom || ''} ${user.prenom || ''}`.trim() || 'Client sans nom',
    email: isSyntheticEmail ? null : user.email,
    telephone: user.telephone,
    adresse: user.adresse,
    matriculeFiscale: user.matriculeFiscale,
    activite: user.activite,
    remise: Number(user.remise || 0),
    creeLe: user.creeLe,
    totalFacturesTTC: Math.round(totalTTC * 1000) / 1000,
    factures: user.factures.map((f) => ({
      id: f.id,
      numero: f.numero,
      montantHT: Number(f.montantHT),
      montantTVA: Number(f.montantTVA),
      montantTTC: Number(f.montantTTC),
      statut: f.statut,
      statutPaiement: f.statutPaiement,
      dateEmission: f.dateEmission,
      lignesCount: f.lignes.length,
    })),
    bonsLivraison: user.bonsLivraison.map((b) => ({
      id: b.id,
      code: b.code,
      statut: b.statut,
      creeLe: b.creeLe,
      lignesCount: b.lignes.length,
    })),
    devis: user.devis.map((d) => ({
      id: d.id,
      numero: d.numero,
      statut: d.statut,
      montantTTC: Number(d.montantTTC),
      dateDevis: d.dateDevis,
    })),
  };
};

export const createTiers = async (data: TiersInput) => {
  if (!data.nom && !data.prenom) {
    throw new Error('Le nom ou le prénom est obligatoire.');
  }

  const timestamp = Date.now();
  const syntheticEmail = data.email && data.email.trim()
    ? data.email.trim()
    : `tiers.${timestamp}@rzmedical.local`;

  // Vérifier si l'email existe déjà
  const existingEmail = await prisma.utilisateur.findFirst({
    where: { email: syntheticEmail, typeUtilisateur: 'CLIENT' },
  });
  const finalEmail = existingEmail
    ? `tiers.${timestamp}.${Math.floor(Math.random() * 1000)}@rzmedical.local`
    : syntheticEmail;

  return prisma.utilisateur.create({
    data: {
      email: finalEmail,
      motDePasseHash: '', // Aucun mot de passe = pas de compte de connexion
      nom: data.nom?.trim() || null,
      prenom: data.prenom?.trim() || null,
      telephone: data.telephone?.trim() || null,
      adresse: data.adresse?.trim() || null,
      matriculeFiscale: data.matriculeFiscale?.trim() || null,
      activite: data.activite?.trim() || null,
      remise: data.remise ? Number(data.remise) : 0,
      typeUtilisateur: 'CLIENT',
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      adresse: true,
      matriculeFiscale: true,
      activite: true,
      remise: true,
      creeLe: true,
    },
  });
};

export const updateTiers = async (id: number, data: Partial<TiersInput>) => {
  const existing = await prisma.utilisateur.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Tiers #${id} introuvable.`);
  }

  return prisma.utilisateur.update({
    where: { id },
    data: {
      ...(data.nom !== undefined && { nom: data.nom?.trim() || null }),
      ...(data.prenom !== undefined && { prenom: data.prenom?.trim() || null }),
      ...(data.email !== undefined && data.email.trim() && { email: data.email.trim() }),
      ...(data.telephone !== undefined && { telephone: data.telephone?.trim() || null }),
      ...(data.adresse !== undefined && { adresse: data.adresse?.trim() || null }),
      ...(data.matriculeFiscale !== undefined && { matriculeFiscale: data.matriculeFiscale?.trim() || null }),
      ...(data.activite !== undefined && { activite: data.activite?.trim() || null }),
      ...(data.remise !== undefined && { remise: Number(data.remise) }),
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      adresse: true,
      matriculeFiscale: true,
      activite: true,
      remise: true,
      creeLe: true,
    },
  });
};

export const deleteTiers = async (id: number) => {
  const existing = await prisma.utilisateur.findUnique({
    where: { id },
    include: {
      _count: { select: { factures: true, bonsLivraison: true, devis: true, commandes: true } },
    },
  });

  if (!existing) {
    throw new Error(`Tiers #${id} introuvable.`);
  }

  // Si le client a des pièces rattachées, on dissocie l'utilisateurId pour conserver l'historique financier
  if (existing._count.factures > 0) {
    await prisma.facture.updateMany({
      where: { utilisateurId: id },
      data: { utilisateurId: null },
    });
  }

  if (existing._count.bonsLivraison > 0) {
    await prisma.bonLivraison.updateMany({
      where: { utilisateurId: id },
      data: { utilisateurId: null },
    });
  }

  if (existing._count.devis > 0) {
    await prisma.devis.updateMany({
      where: { utilisateurId: id },
      data: { utilisateurId: null },
    });
  }

  return prisma.utilisateur.delete({
    where: { id },
  });
};
