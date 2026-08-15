import { Request, Response } from 'express';
import * as service from './products.service';

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
    if (!data) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { nom, reference, description, prix, stock, images, video, motsCles, ficheTechnique, disponible, sousCategorieId, marqueId } = req.body;
    if (!nom || !reference || prix === undefined || !sousCategorieId || !marqueId) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    const data = await service.create({
      nom, reference, description, prix: Number(prix), stock: stock ? Number(stock) : 0,
      images, video, motsCles, ficheTechnique, disponible, sousCategorieId: Number(sousCategorieId), marqueId: Number(marqueId)
    });
    res.status(201).json(data);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cette référence de produit existe déjà' });
    res.status(500).json({ error: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (updateData.prix !== undefined) updateData.prix = Number(updateData.prix);
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
    if (updateData.sousCategorieId !== undefined) updateData.sousCategorieId = Number(updateData.sousCategorieId);
    if (updateData.marqueId !== undefined) updateData.marqueId = Number(updateData.marqueId);

    const data = await service.update(Number(req.params.id), updateData);
    res.json(data);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Produit non trouvé' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Cette référence existe déjà' });
    res.status(500).json({ error: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await service.remove(Number(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Produit non trouvé' });
    res.status(500).json({ error: err.message });
  }
};
