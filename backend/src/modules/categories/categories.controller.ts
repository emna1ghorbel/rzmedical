import { Request, Response } from 'express';
import * as service from './categories.service';

// Admin : liste toutes les catÃ©gories (visibles et masquÃ©es)
export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Public client : liste uniquement les catÃ©gories visibles
export const getAllVisible = async (req: Request, res: Response) => {
  try {
    const data = await service.getAllVisible();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const data = await service.getById(Number(req.params.id));
    if (!data) return res.status(404).json({ error: 'CatÃ©gorie non trouvÃ©e' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ error: "Le champ 'nom' est requis" });
    const data = await service.create(nom);
    res.status(201).json(data);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ce nom de catÃ©gorie existe dÃ©jÃ ' });
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { nom, visible } = req.body;
    if (!nom) return res.status(400).json({ error: "Le champ 'nom' est requis" });
    const data = await service.update(
      Number(req.params.id),
      nom,
      visible !== undefined ? Boolean(visible) : undefined
    );
    res.json(data);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Catégorie non trouvée' });
    if (err.code === 'CATEGORY_IN_USE') return res.status(409).json({ error: err.message });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ce nom de catÃ©gorie existe dÃ©jÃ ' });
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/categories/:id/toggle-visible â†’ inverse la visibilitÃ©
export const toggleVisible = async (req: Request, res: Response) => {
  try {
    const data = await service.toggleVisible(Number(req.params.id));
    res.json(data);
  } catch (err: any) {
    if (err.message === 'CatÃ©gorie non trouvÃ©e') return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Catégorie non trouvée' });
    if (err.code === 'CATEGORY_IN_USE') return res.status(409).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};


