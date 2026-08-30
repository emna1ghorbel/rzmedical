import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import * as service from './invoices.service';
import { InvoiceError } from './invoices.service';

// ─── GET /api/invoices/my ────────────────────────────────────────────────────
export const listMine = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await service.getMyInvoices(req.user!.id);
    res.json(invoices);
  } catch (err: unknown) {
    console.error('GET /api/invoices/my error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de vos factures' });
  }
};

// ─── GET /api/invoices/admin/all ─────────────────────────────────────────────
export const listAll = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await service.getAllInvoices();
    res.json(invoices);
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/all error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des factures' });
  }
};

// ─── GET /api/invoices/admin/:id ─────────────────────────────────────────────
export const getOne = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }
    const invoice = await service.getInvoice(id);
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });
    res.json(invoice);
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/:id error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la facture' });
  }
};

// ─── GET /api/invoices/admin/order/:orderId ───────────────────────────────────
export const getByOrder = async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isInteger(orderId)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide' });
    }
    const invoice = await service.getInvoiceByOrderId(orderId);
    if (!invoice) return res.status(404).json({ error: 'Aucune facture pour cette commande' });
    res.json(invoice);
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/order/:orderId error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la facture' });
  }
};

// ─── GET /api/invoices/admin/generate-number ──────────────────────────────────
export const generateNumber = async (req: AuthRequest, res: Response) => {
  try {
    const numero = await service.generateInvoiceNumber();
    res.json({ numero });
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/generate-number error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du numéro de facture' });
  }
};

// ─── POST /api/invoices/admin ─────────────────────────────────────────────────
export const create = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await service.createInvoice(req.body);
    res.status(201).json(invoice);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('POST /api/invoices/admin error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la facture' });
  }
};

// ─── POST /api/invoices/admin/manual ──────────────────────────────────────────
export const createManual = async (req: AuthRequest, res: Response) => {
  console.log('[DEBUG] POST /api/invoices/admin/manual received');
  console.log('[DEBUG] body:', JSON.stringify(req.body, null, 2));
  try {
    const invoice = await service.createManualInvoice(req.body);
    console.log('[DEBUG] Manual invoice created successfully, id:', (invoice as any).id);
    res.status(201).json(invoice);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) {
      console.error('[DEBUG] InvoiceError:', err.message, 'status:', err.statusCode);
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('POST /api/invoices/admin/manual error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la facture manuelle' });
  }
};

// ─── PATCH /api/invoices/admin/:id/pdf ────────────────────────────────────────
export const updatePdf = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }
    const { fichierPdf } = req.body;
    if (!fichierPdf) {
      return res.status(400).json({ error: 'URL du PDF requis' });
    }
    const invoice = await service.updateInvoicePdf(id, fichierPdf);
    res.json(invoice);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('PATCH /api/invoices/admin/:id/pdf error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du PDF' });
  }
};
