import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

// Récupérer ou initialiser le singleton
async function getOrCreate() {
  const existing = await prisma.infoSociete.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.infoSociete.create({
    data: { id: 1, nomSociete: 'RZMedical' },
  });
}

// GET /api/company-info — Public
router.get('/', async (_req: Request, res: Response) => {
  try {
    const info = await getOrCreate();
    res.json(info);
  } catch (err: unknown) {
    console.error('GET /api/company-info error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
  }
});

// PUT /api/company-info — Admin seulement
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { nomSociete, logoUrl, telephone, email, adresse, siteWeb } = req.body;

    // S'assurer que le singleton existe
    await getOrCreate();

    const updated = await prisma.infoSociete.update({
      where: { id: 1 },
      data: {
        ...(nomSociete !== undefined && { nomSociete: String(nomSociete).trim() || 'RZMedical' }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl?.trim() || null }),
        ...(telephone !== undefined && { telephone: telephone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(adresse !== undefined && { adresse: adresse?.trim() || null }),
        ...(siteWeb !== undefined && { siteWeb: siteWeb?.trim() || null }),
      },
    });

    res.json(updated);
  } catch (err: unknown) {
    console.error('PUT /api/company-info error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

export default router;
