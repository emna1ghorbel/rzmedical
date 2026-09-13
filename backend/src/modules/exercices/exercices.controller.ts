import { Request, Response } from 'express';
import * as service from './exercices.service';
import { AuthRequest } from '../auth/auth.middleware';

// GET /api/exercices
export const list = async (_req: Request, res: Response) => {
  try {
    const exercices = await service.listExercices();
    res.json(exercices);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/exercices/actif
export const getActif = async (_req: Request, res: Response) => {
  try {
    const exercice = await service.getExerciceActif();
    res.json(exercice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/exercices
export const create = async (req: AuthRequest, res: Response) => {
  try {
    const { annee, label, dateDebut, dateFin } = req.body;
    if (!annee || !dateDebut || !dateFin) {
      return res.status(400).json({ error: 'annee, dateDebut et dateFin sont requis.' });
    }
    const exercice = await service.createExercice({
      annee: Number(annee),
      label,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
    });
    res.status(201).json(exercice);
  } catch (err: any) {
    console.error('Activation Error:', err); res.status(400).json({ error: err.message });
  }
};

// PATCH /api/exercices/:id/activer
export const activer = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const exercice = await service.activerExercice(id);
    res.json(exercice);
  } catch (err: any) {
    console.error('Activation Error:', err); res.status(400).json({ error: err.message });
  }
};

// PATCH /api/exercices/:id
export const update = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { label, dateDebut, dateFin } = req.body;
    const exercice = await service.updateExercice(id, {
      label,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
    });
    res.json(exercice);
  } catch (err: any) {
    console.error('Activation Error:', err); res.status(400).json({ error: err.message });
  }
};

// DELETE /api/exercices/:id
export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await service.deleteExercice(id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Activation Error:', err); res.status(400).json({ error: err.message });
  }
};

// GET /api/exercices/:id/stats
export const stats = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = await service.getExerciceStats(id);
    if (!data) return res.status(404).json({ error: 'Exercice introuvable' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

