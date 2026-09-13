import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import * as service from './invoices.service';
import { InvoiceError } from './invoices.service';
import { generateInvoicePdf } from './invoice-pdf.service';

// â”€â”€â”€ GET /api/invoices/my â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const listMine = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await service.getMyInvoices(req.user!.id);
    res.json(invoices);
  } catch (err: unknown) {
    console.error('GET /api/invoices/my error:', err);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration de vos factures' });
  }
};

// â”€â”€â”€ GET /api/invoices/admin/all â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const listAll = async (req: AuthRequest, res: Response) => {
  try {
    const exerciceAnnee = req.query.exerciceAnnee ? Number(req.query.exerciceAnnee) : undefined;
    const invoices = await service.getAllInvoices(exerciceAnnee);
    res.json(invoices);
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/all error:', err);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration des factures' });
  }
};

// â”€â”€â”€ GET /api/invoices/admin/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration de la facture' });
  }
};

// â”€â”€â”€ GET /api/invoices/admin/order/:orderId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration de la facture' });
  }
};

// â”€â”€â”€ PATCH /api/invoices/admin/:id/statut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const updateStatut = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { statut } = req.body;
    if (!statut) return res.status(400).json({ error: 'Statut requis' });
    const invoice = await service.updateInvoiceStatut(id, statut);
    res.json(invoice);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) return res.status(err.statusCode).json({ error: err.message });
    console.error('PATCH /api/invoices/admin/:id/statut error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise Ã  jour du statut' });
  }
};

// â”€â”€â”€ PATCH/PUT /api/invoices/admin/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const update = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide' });
    const invoice = await service.updateInvoice(id, req.body);
    res.json(invoice);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) return res.status(err.statusCode).json({ error: err.message });
    console.error('PATCH /api/invoices/admin/:id error:', err);
    res.status(500).json({ error: 'Erreur lors de la modification de la facture' });
  }
};

// â”€â”€â”€ POST /api/invoices/admin/:id/paiements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const addPaiement = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await service.addPaiement(id, req.body);
    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) return res.status(err.statusCode).json({ error: err.message });
    console.error('POST /api/invoices/admin/:id/paiements error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du paiement' });
  }
};

// â”€â”€â”€ GET /api/invoices/admin/:id/paiements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const listPaiements = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const paiements = await service.getPaiements(id);
    res.json(paiements);
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/:id/paiements error:', err);
    res.status(500).json({ error: 'Erreur lors de la rÃ©cupÃ©ration des paiements' });
  }
};

// â”€â”€â”€ GET /api/invoices/admin/generate-number â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const generateNumber = async (req: AuthRequest, res: Response) => {
  try {
    const exerciceAnnee = req.query.exerciceAnnee ? Number(req.query.exerciceAnnee) : undefined;
    const { numero, lastDateEmission } = await service.generateInvoiceNumber(exerciceAnnee);
    res.json({ numero, lastDateEmission });
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/generate-number error:', err);
    res.status(500).json({ error: 'Erreur lors de la gÃ©nÃ©ration du numÃ©ro de facture' });
  }
};


// â”€â”€â”€ POST /api/invoices/admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ POST /api/invoices/admin/manual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createManual = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await service.createManualInvoice(req.body);
    res.status(201).json(invoice);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('POST /api/invoices/admin/manual error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la facture manuelle', details: String(err) });
  }
};

// â”€â”€â”€ POST /api/invoices/admin/manual-with-bl â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createManualWithBL = async (req: AuthRequest, res: Response) => {
  try {
    const result = await service.createManualWithBL(req.body);
    res.status(201).json(result);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('POST /api/invoices/admin/manual-with-bl FULL error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la facture manuelle avec BL', details: String(err) });
  }
};

// â”€â”€â”€ POST /api/invoices/admin/from-bls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createFromMultipleBLs = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await service.createFromMultipleBLs(req.body);
    res.status(201).json(invoice);
  } catch (err: unknown) {
    if (err instanceof InvoiceError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('POST /api/invoices/admin/from-bls error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la facture depuis les BLs' });
  }
};

// â”€â”€â”€ PATCH /api/invoices/admin/:id/pdf â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    res.status(500).json({ error: 'Erreur lors de la mise Ã  jour du PDF' });
  }
};
// â”€â”€â”€ GET /api/invoices/admin/:id/pdf-download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const downloadPdfAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }
    const pdfBuffer = await generateInvoicePdf(id); // no userId restriction for admin
    const invoice = await service.getInvoice(id);
    const isAvoir = invoice?.statut === 'ANNULEE' && invoice.numeroAvoir;
    const filename = isAvoir
      ? `avoir-${invoice.numeroAvoir}.pdf`
      : `facture-${invoice?.numero || id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err: unknown) {
    console.error('GET /api/invoices/admin/:id/pdf-download error:', err);
    res.status(500).json({ error: 'Erreur lors de la gÃ©nÃ©ration du PDF' });
  }
};

// â”€â”€â”€ GET /api/invoices/client/:id/pdf â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const downloadPdfClient = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.id;
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant invalide' });
    }
    const pdfBuffer = await generateInvoicePdf(id, userId);
    const invoice = await service.getInvoice(id);
    const isAvoir = invoice?.statut === 'ANNULEE' && invoice.numeroAvoir;
    const filename = isAvoir
      ? `avoir-${invoice.numeroAvoir}.pdf`
      : `facture-${invoice?.numero || id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('introuvable')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('GET /api/invoices/client/:id/pdf error:', err);
    res.status(500).json({ error: 'Erreur lors de la gÃ©nÃ©ration du PDF' });
  }
};


