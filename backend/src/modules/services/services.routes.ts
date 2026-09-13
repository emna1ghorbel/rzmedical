import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { label: 'asc' } });
    res.json(services);
  } catch (err) {
    console.error('GET /services error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des services' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { label } = req.body;
    if (!label?.trim()) return res.status(400).json({ error: 'Label requis' });
    const service = await prisma.service.create({ data: { label: label.trim() } });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du service' });
  }
});

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { label, actif } = req.body;
    const data: any = {};
    if (label !== undefined) data.label = label.trim();
    if (actif !== undefined) data.actif = Boolean(actif);
    const service = await prisma.service.update({ where: { id }, data });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du service' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.service.delete({ where: { id } });
    res.json({ message: 'Service supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression du service' });
  }
});

export default router;
