import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import * as service from './devis.service';
import { DevisError } from './devis.service';
import { generateDevisPdf } from './devis-pdf.service';

export const listAll = async (req: AuthRequest, res: Response) => {
  try {
    const exerciceAnnee = req.query.exerciceAnnee ? Number(req.query.exerciceAnnee) : undefined;
    const list = await service.getAllDevis(exerciceAnnee);
    res.json(list);
  } catch (err: any) {
    console.error('GET /api/devis error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des devis' });
  }
};

export const getOne = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await service.getDevisById(id);
    if (!item) return res.status(404).json({ error: 'Devis introuvable' });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur récupération devis' });
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const devis = await service.createDevis(req.body);
    res.status(201).json(devis);
  } catch (err: any) {
    if (err instanceof DevisError) return res.status(err.statusCode).json({ error: err.message });
    console.error('POST /api/devis error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la création du devis' });
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await service.updateDevis(id, req.body);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof DevisError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message || 'Erreur lors de la mise à jour' });
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await service.deleteDevis(id);
    res.json({ message: 'Devis supprimé avec succès' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

export const convertToFacture = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const facture = await service.convertDevisToFacture(id);
    res.status(201).json({ message: 'Devis facturé avec succès', facture });
  } catch (err: any) {
    if (err instanceof DevisError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message || 'Erreur conversion facture' });
  }
};

export const convertToBL = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const bl = await service.convertDevisToBonLivraison(id);
    res.status(201).json({ message: 'Devis converti en Bon de Livraison avec succès', bonLivraison: bl });
  } catch (err: any) {
    if (err instanceof DevisError) return res.status(err.statusCode).json({ error: err.message });
    res.status(500).json({ error: err.message || 'Erreur conversion bon de livraison' });
  }
};

export const downloadPdf = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const devis = await service.getDevisById(id);
    if (!devis) return res.status(404).json({ error: 'Devis introuvable' });

    const pdfBuffer = await generateDevisPdf(id);
    const filename = `DEVIS-${devis.numero}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF du devis' });
  }
};
