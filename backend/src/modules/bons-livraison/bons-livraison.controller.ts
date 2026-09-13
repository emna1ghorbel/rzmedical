import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import * as service from './bons-livraison.service';
import { BLError } from './bons-livraison.service';
import { generateBLPdf } from './bl-pdf.service';

export const listAll = async (req: AuthRequest, res: Response) => {
  try {
    res.json(await service.getAllBL());
  } catch (err) {
    console.error('GET /bons-livraison/admin error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des bons de livraison' });
  }
};

export const getOne = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const bl = await service.getBL(id);
    if (!bl) return res.status(404).json({ error: 'Bon de livraison introuvable' });
    res.json(bl);
  } catch (err) {
    console.error('GET /bons-livraison/admin/:id error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
};

export const createFromOrder = async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    const bl = await service.createBLFromOrder(orderId);
    res.status(201).json(bl);
  } catch (err) {
    if (err instanceof BLError) return res.status(err.statusCode).json({ error: err.message });
    console.error('POST /bons-livraison/admin/from-order error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du bon de livraison' });
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const bl = await service.createBL(req.body);
    res.status(201).json(bl);
  } catch (err) {
    if (err instanceof BLError) return res.status(err.statusCode).json({ error: err.message });
    console.error('POST /bons-livraison/admin error:', err);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const bl = await service.updateBL(id, req.body);
    res.json(bl);
  } catch (err) {
    if (err instanceof BLError) return res.status(err.statusCode).json({ error: err.message });
    console.error('PATCH /bons-livraison/admin/:id error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await service.deleteBL(id);
    res.json({ message: 'Bon de livraison supprimé' });
  } catch (err) {
    if (err instanceof BLError) return res.status(err.statusCode).json({ error: err.message });
    console.error('DELETE /bons-livraison/admin/:id error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

export const facturer = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { timbreFiscal, dateEmission } = req.body;
    const facture = await service.facturerBL(id, Number(timbreFiscal) || 1, dateEmission || new Date().toISOString());
    res.status(201).json(facture);
  } catch (err) {
    if (err instanceof BLError) return res.status(err.statusCode).json({ error: err.message });
    console.error('POST /bons-livraison/admin/:id/facturer error:', err);
    res.status(500).json({ error: 'Erreur lors de la facturation' });
  }
};

export const downloadPdf = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide' });
    const pdfBuffer = await generateBLPdf(id);
    const bl = await service.getBL(id);
    const filename = `BL-${bl?.code || id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (err instanceof Error && err.message.includes('introuvable')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('GET /bons-livraison/admin/:id/pdf error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du PDF' });
  }
};
