import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// GET /api/clients/stats — Statistiques globales des clients
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalClients, newThisMonth, clientsWithOrders, ordersSum] = await Promise.all([
      prisma.utilisateur.count({ where: { typeUtilisateur: 'CLIENT' } }),
      prisma.utilisateur.count({
        where: {
          typeUtilisateur: 'CLIENT',
          creeLe: { gte: firstDayOfMonth }
        }
      }),
      prisma.utilisateur.count({
        where: {
          typeUtilisateur: 'CLIENT',
          commandes: { some: {} }
        }
      }),
      prisma.commande.aggregate({
        _sum: { total: true },
        where: { statut: { not: 'ANNULEE' } }
      })
    ]);

    res.json({
      totalClients,
      newThisMonth,
      clientsWithOrders,
      totalRevenue: Number(ordersSum._sum.total || 0)
    });
  } catch (err: unknown) {
    console.error("GET /api/clients/stats error:", err);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques clients' });
  }
});

// GET /api/clients — Liste tous les clients avec total dépenses
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const clients = await prisma.utilisateur.findMany({
      where: { typeUtilisateur: 'CLIENT' },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        telephone: true,
        photo: true,
        adresse: true,
        dateNaissance: true,
        creeLe: true,
        dernierLogin: true,
        remise: true,
        matriculeFiscale: true,
        activite: true,
        _count: { select: { commandes: true } },
        commandes: {
          select: { total: true, statut: true }
        }
      },
      orderBy: { creeLe: 'desc' },
    });

    const enriched = clients.map(c => {
      const totalDepense = c.commandes
        .filter(cmd => cmd.statut !== 'ANNULEE')
        .reduce((sum, cmd) => sum + Number(cmd.total), 0);
      
      const { commandes, ...rest } = c;
      return {
        ...rest,
        totalDepense
      };
    });

    res.json(enriched);
  } catch (err: unknown) {
    console.error("GET /api/clients error:", err);
    res.status(500).json({ error: 'Erreur lors de la récupération des clients' });
  }
});

// GET /api/clients/:id — Détails d'un client avec toutes ses commandes
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const client = await prisma.utilisateur.findUnique({
      where: { id, typeUtilisateur: 'CLIENT' },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        telephone: true,
        photo: true,
        adresse: true,
        dateNaissance: true,
        creeLe: true,
        dernierLogin: true,
        remise: true,
        matriculeFiscale: true,
        activite: true,
        commandes: {
          orderBy: { creeLe: 'desc' },
          include: {
            lignes: {
              include: {
                produit: {
                  select: { id: true, nom: true, reference: true, images: true, prix: true }
                }
              }
            },
            factures: {
              select: { id: true, numero: true, statut: true, montantTTC: true, fichierPdf: true }
            }
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const totalDepense = client.commandes
      .filter(cmd => cmd.statut !== 'ANNULEE')
      .reduce((sum, cmd) => sum + Number(cmd.total), 0);

    res.json({
      ...client,
      totalDepense,
      nbCommandes: client.commandes.length
    });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erreur lors de la récupération des détails du client' });
  }
});

// PUT /api/clients/:id/password — Réinitialiser le mot de passe d'un client par l'admin
router.put('/:id/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { nouveauMotDePasse } = req.body;

    if (!nouveauMotDePasse || nouveauMotDePasse.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères' });
    }

    const hash = await bcrypt.hash(nouveauMotDePasse, 12);
    await prisma.utilisateur.update({
      where: { id },
      data: { motDePasseHash: hash }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

// POST /api/clients — Créer un nouveau client
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email, motDePasse, prenom, nom, telephone, photo, adresse, dateNaissance, remise, matriculeFiscale, activite } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const existing = await prisma.utilisateur.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const hash = await bcrypt.hash(motDePasse, 12);
    const client = await prisma.utilisateur.create({
      data: {
        email: email.trim().toLowerCase(),
        motDePasseHash: hash,
        prenom: prenom?.trim() || null,
        nom: nom?.trim() || null,
        telephone: telephone?.trim() || null,
        photo: photo?.trim() || null,
        adresse: adresse?.trim() || null,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        typeUtilisateur: 'CLIENT',
        remise: Math.min(100, Math.max(0, Number(remise) || 0)),
        matriculeFiscale: matriculeFiscale?.trim() || null,
        activite: activite?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        telephone: true,
        photo: true,
        adresse: true,
        dateNaissance: true,
        creeLe: true,
      },
    });

    res.status(201).json(client);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erreur lors de la création du client' });
  }
});

// PUT /api/clients/:id — Modifier un client
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { prenom, nom, telephone, email, photo, adresse, dateNaissance, remise, matriculeFiscale, activite } = req.body;

    const updated = await prisma.utilisateur.update({
      where: { id },
      data: {
        ...(prenom !== undefined && { prenom }),
        ...(nom !== undefined && { nom }),
        ...(telephone !== undefined && { telephone }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(photo !== undefined && { photo }),
        ...(adresse !== undefined && { adresse }),
        ...(dateNaissance !== undefined && { dateNaissance: dateNaissance ? new Date(dateNaissance) : null }),
        ...(remise !== undefined && { remise: Math.min(100, Math.max(0, Number(remise) || 0)) }),
        ...(matriculeFiscale !== undefined && { matriculeFiscale: matriculeFiscale?.trim() || null }),
        ...(activite !== undefined && { activite: activite?.trim() || null }),
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        telephone: true,
        photo: true,
        adresse: true,
        dateNaissance: true,
        creeLe: true,
      },
    });

    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du client' });
  }
});

// DELETE /api/clients/:id — Supprimer un client
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await prisma.utilisateur.delete({ where: { id } });
    res.json({ message: 'Client supprimé avec succès' });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erreur lors de la suppression du client' });
  }
});

export default router;
