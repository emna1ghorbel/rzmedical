import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

/**
 * POST /api/newsletter
 * Inscription publique à la newsletter.
 */
router.post('/', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Adresse e-mail requise.' });
  }

  const normalized = email.trim().toLowerCase();

  // Validation basique du format e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return res.status(400).json({ error: 'Adresse e-mail invalide.' });
  }

  try {
    // Upsert : réactive l'abonné s'il s'était désabonné
    await prisma.newsletterAbonne.upsert({
      where: { email: normalized },
      update: { actif: true },
      create: { email: normalized },
    });

    return res.status(201).json({ message: 'Inscription confirmée.' });
  } catch (err) {
    console.error('[Newsletter] Erreur inscription:', err);
    return res.status(500).json({ error: 'Erreur serveur. Veuillez réessayer.' });
  }
});

/**
 * GET /api/newsletter — Liste des abonnés (admin uniquement)
 */
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const abonnes = await prisma.newsletterAbonne.findMany({
    where: { actif: true },
    orderBy: { creeLe: 'desc' },
    select: { id: true, email: true, creeLe: true },
  });
  return res.json(abonnes);
});

/**
 * DELETE /api/newsletter/:email — Désabonnement
 */
router.delete('/:email', async (req: Request, res: Response) => {
  const rawEmail = Array.isArray(req.params.email) ? req.params.email[0] : (req.params.email as string);
  const email = decodeURIComponent(rawEmail || '').trim().toLowerCase();
  try {
    await prisma.newsletterAbonne.updateMany({
      where: { email },
      data: { actif: false },
    });
    return res.json({ message: 'Désabonnement effectué.' });
  } catch {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
