import { Request, Response } from 'express';
import * as service from './subcategories.service';

export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const data = await service.getById(Number(req.params.id));
    if (!data) return res.status(404).json({ error: 'Sous-catégorie non trouvée' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { nom, categorieId, image } = req.body;
    if (!nom || !categorieId) return res.status(400).json({ error: 'Nom et categorieId sont requis' });
    const data = await service.create({ nom, categorieId: Number(categorieId), image });
    res.status(201).json(data);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cette sous-catégorie existe déjà pour cette catégorie' });
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { nom, categorieId, image } = req.body;
    const data = await service.update(Number(req.params.id), {
      nom,
      ...(categorieId ? { categorieId: Number(categorieId) } : {}),
      image
    });
    res.json(data);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sous-catégorie non trouvée' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cette sous-catégorie existe déjà pour cette catégorie' });
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Sous-catégorie non trouvée' });
    res.status(500).json({ error: err.message });
  }
};
