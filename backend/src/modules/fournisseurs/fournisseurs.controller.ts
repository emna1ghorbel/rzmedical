import { Request, Response } from 'express';
import * as service from './fournisseurs.service';
import { AuthRequest } from '../auth/auth.middleware';

// GET /api/fournisseurs
export const list = async (req: Request, res: Response) => {
  try {
    const { search, categorie, actif } = req.query;
    const data = await service.listFournisseurs({
      search: search ? String(search) : undefined,
      categorie: categorie ? String(categorie) : undefined,
      actif: actif !== undefined ? String(actif) : undefined,
    });
    res.json(data);
  } catch (err: any) {
    console.error('GET /api/fournisseurs error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la récupération des fournisseurs.' });
  }
};

// GET /api/fournisseurs/stats
export const stats = async (_req: Request, res: Response) => {
  try {
    const data = await service.getFournisseursStats();
    res.json(data);
  } catch (err: any) {
    console.error('GET /api/fournisseurs/stats error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors du calcul des statistiques.' });
  }
};

// GET /api/fournisseurs/:id
export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const fournisseur = await service.getFournisseurById(id);
    if (!fournisseur) {
      return res.status(404).json({ error: 'Fournisseur non trouvé.' });
    }
    res.json(fournisseur);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur interne.' });
  }
};

// POST /api/fournisseurs
export const create = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const nouveau = await service.createFournisseur(data);
    res.status(201).json(nouveau);
  } catch (err: any) {
    console.error('POST /api/fournisseurs error:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de la création du fournisseur.' });
  }
};

// PUT /api/fournisseurs/:id
export const update = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const misAJour = await service.updateFournisseur(id, req.body);
    res.json(misAJour);
  } catch (err: any) {
    console.error('PUT /api/fournisseurs/:id error:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de la mise à jour.' });
  }
};

// DELETE /api/fournisseurs/:id
export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    await service.deleteFournisseur(id);
    res.json({ success: true, message: 'Fournisseur supprimé avec succès.' });
  } catch (err: any) {
    console.error('DELETE /api/fournisseurs/:id error:', err);
    res.status(400).json({ error: err.message || 'Erreur lors de la suppression.' });
  }
};
