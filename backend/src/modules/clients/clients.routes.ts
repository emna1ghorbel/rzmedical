import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// GET /api/clients — Liste tous les clients
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
        _count: { select: { commandes: true } },
      },
      orderBy: { creeLe: 'desc' },
    });
    res.json(clients);
  } catch (err: unknown) {
    console.error("GET /api/clients error:", err);
    res.status(500).json({ error: 'Erreur lors de la récupération des clients' });
  }
});

// POST /api/clients — Créer un nouveau client
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email, motDePasse, prenom, nom, telephone, photo, adresse, dateNaissance } = req.body;

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
    const id = parseInt(req.params.id);
    const { prenom, nom, telephone, email, photo, adresse, dateNaissance } = req.body;

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
    const id = parseInt(req.params.id);
    await prisma.utilisateur.delete({ where: { id } });
    res.json({ message: 'Client supprimé avec succès' });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erreur lors de la suppression du client' });
  }
});

export default router;
