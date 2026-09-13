import { Request, Response } from 'express';
import * as service from './tiers.service';
import { AuthRequest } from '../auth/auth.middleware';

// GET /api/tiers
export const list = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const data = await service.listTiers(search ? String(search) : undefined);
    res.json(data);
  } catch (err: any) {
    console.error('GET /api/tiers error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la récupération des tiers.' });
  }
};

// GET /api/tiers/stats
export const stats = async (_req: Request, res: Response) => {
  try {
    const data = await service.getTiersStats();
    res.json(data);
  } catch (err: any) {
    console.error('GET /api/tiers/stats error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du calcul des statistiques.' });
  }
};

// GET /api/tiers/:id
export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const tier = await service.getTiersById(id);
    if (!tier) {
      return res.status(404).json({ error: 'Tiers non trouvé.' });
    }
    res.json(tier);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur interne.' });
  }
};

// POST /api/tiers
export const create = async (req: AuthRequest, res: Response) => {
  try {
    const nouveau = await service.createTiers(req.body);
    res.status(201).json(nouveau);
  } catch (err: any) {
    console.error('POST /api/tiers error:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de la création du tiers.' });
  }
};

// PUT /api/tiers/:id
export const update = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const misAJour = await service.updateTiers(id, req.body);
    res.json(misAJour);
  } catch (err: any) {
    console.error('PUT /api/tiers/:id error:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de la modification.' });
  }
};

// DELETE /api/tiers/:id
export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    await service.deleteTiers(id);
    res.json({ success: true, message: 'Tiers supprimé avec succès.' });
  } catch (err: any) {
    console.error('DELETE /api/tiers/:id error:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de la suppression.' });
  }
};
