import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import * as AchatsService from './achats.service';
import { analyzeSupplierInvoice, analyzeCnssReceipt } from './ocr.service';
import { createCharge as createSpecificCharge, listCharges } from './charges.service';

// ─── Bons de Commande ─────────────────────────────────────────────────────────

export async function listBonsCommande(req: Request, res: Response) {
  try {
    const { page, limit, statut, fournisseurId, search } = req.query;
    const data = await AchatsService.listBonsCommande({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      statut: statut as string | undefined,
      fournisseurId: fournisseurId ? Number(fournisseurId) : undefined,
      search: search as string | undefined,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBonCommande(req: Request, res: Response) {
  try {
    const data = await AchatsService.getBonCommande(Number(req.params.id));
    if (!data) return res.status(404).json({ error: 'Bon de commande introuvable' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createBonCommande(req: Request, res: Response) {
  try {
    const data = await AchatsService.createBonCommande(req.body);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBonCommande(req: Request, res: Response) {
  try {
    const data = await AchatsService.updateBonCommande(Number(req.params.id), req.body);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteBonCommande(req: Request, res: Response) {
  try {
    await AchatsService.deleteBonCommande(Number(req.params.id));
    res.json({ message: 'Bon de commande supprimé' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function transformerBCenBR(req: Request, res: Response) {
  try {
    const br = await AchatsService.transformerBCenBR(Number(req.params.id));
    res.status(201).json(br);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ─── Bons de Réception ────────────────────────────────────────────────────────

export async function listBonsReception(req: Request, res: Response) {
  try {
    const { page, limit, statut, fournisseurId, search } = req.query;
    const data = await AchatsService.listBonsReception({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      statut: statut as string | undefined,
      fournisseurId: fournisseurId ? Number(fournisseurId) : undefined,
      search: search as string | undefined,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getBonReception(req: Request, res: Response) {
  try {
    const data = await AchatsService.getBonReception(Number(req.params.id));
    if (!data) return res.status(404).json({ error: 'Bon de réception introuvable' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createBonReception(req: Request, res: Response) {
  try {
    const data = await AchatsService.createBonReception(req.body);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateBonReception(req: Request, res: Response) {
  try {
    const data = await AchatsService.updateBonReception(Number(req.params.id), req.body);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function validerBonReception(req: Request, res: Response) {
  try {
    const data = await AchatsService.validerBonReception(Number(req.params.id));
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function transformerBRenFF(req: Request, res: Response) {
  try {
    const ff = await AchatsService.transformerBRenFF(Number(req.params.id));
    res.status(201).json(ff);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteBonReception(req: Request, res: Response) {
  try {
    await AchatsService.deleteBonReception(Number(req.params.id));
    res.json({ message: 'Bon de réception supprimé' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ─── Factures Fournisseurs ────────────────────────────────────────────────────

export async function listFacturesFournisseurs(req: Request, res: Response) {
  try {
    const { page, limit, statut, statutPaiement, fournisseurId, search, categorie } = req.query;
    const data = await AchatsService.listFacturesFournisseurs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      statut: statut as string | undefined,
      statutPaiement: statutPaiement as string | undefined,
      fournisseurId: fournisseurId ? Number(fournisseurId) : undefined,
      search: search as string | undefined,
      categorie: categorie as string | undefined,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAchatsStats(req: Request, res: Response) {
  try {
    const data = await AchatsService.getAchatsStats(req.query.categorie as string | undefined);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getFactureFournisseur(req: Request, res: Response) {
  try {
    const data = await AchatsService.getFactureFournisseur(Number(req.params.id));
    if (!data) return res.status(404).json({ error: 'Facture fournisseur introuvable' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createFactureFournisseur(req: Request, res: Response) {
  try {
    const data = await AchatsService.createFactureFournisseur(req.body);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function createCharge(req: Request, res: Response) {
  try {
    const categorie = String(req.params.categorie);
    if (!['CHARGES', 'CNSS', 'NEUF_BA4A'].includes(categorie)) return res.status(400).json({ error: 'Catégorie de charge invalide' });
    const data = await createSpecificCharge(categorie as 'CHARGES' | 'CNSS' | 'NEUF_BA4A', req.body);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function listSpecificCharges(req: Request, res: Response) {
  try {
    const categorie = String(req.params.categorie);
    if (!['CHARGES', 'CNSS', 'NEUF_BA4A'].includes(categorie)) return res.status(400).json({ error: 'Catégorie de charge invalide' });
    res.json(await listCharges(categorie as 'CHARGES' | 'CNSS' | 'NEUF_BA4A'));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function analyzeFactureFournisseurOCR(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun document facture fourni' });
    const data = await analyzeSupplierInvoice(req.file);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'OCR indisponible' });
  }
}

export async function analyzeCnssReceiptOCR(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun document CNSS fourni' });
    const data = await analyzeCnssReceipt(req.file);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Analyse OCR du reçu CNSS indisponible' });
  }
}

export async function updateFactureFournisseur(req: Request, res: Response) {
  try {
    const data = await AchatsService.updateFactureFournisseur(Number(req.params.id), req.body);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteFactureFournisseur(req: Request, res: Response) {
  try {
    await AchatsService.deleteFactureFournisseur(Number(req.params.id));
    res.json({ message: 'Facture fournisseur supprimée' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function sendFactureFournisseurEmail(req: Request, res: Response) {
  const { email, objet, message } = req.body ?? {};
  if (typeof email !== 'string' || !email.trim() || typeof objet !== 'string' || !objet.trim() || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Destinataire, objet et message sont requis' });
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(503).json({ error: 'Configuration email manquante' });
  }

  try {
    const facture = await AchatsService.getFactureFournisseur(Number(req.params.id));
    if (!facture) return res.status(404).json({ error: 'Facture fournisseur introuvable' });

    const { generateFactureFournisseurPdf } = await import('./achats-pdf.service');
    const pdfBuffer = await generateFactureFournisseurPdf(facture.id);
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `RZMedical <${process.env.EMAIL_USER}>`,
      to: email.trim(),
      subject: objet.trim(),
      text: message.trim(),
      attachments: [{
        filename: `facture-fournisseur-${facture.numero}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }],
    });

    res.json({ success: true, message: 'Email envoyé avec succès' });
  } catch (err: any) {
    console.error('Erreur envoi facture fournisseur:', err);
    res.status(500).json({ error: err.message || "Erreur lors de l'envoi de l'email" });
  }
}

export async function addPaiementFF(req: Request, res: Response) {
  try {
    const data = await AchatsService.addPaiementFF(Number(req.params.id), req.body);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ─── PDF Downloads ────────────────────────────────────────────────────────────

export async function downloadBonCommandePdf(req: Request, res: Response) {
  try {
    const { generateBonCommandePdf } = await import('./achats-pdf.service');
    const pdfBuffer = await generateBonCommandePdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bon-commande-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur génération PDF' });
  }
}

export async function downloadBonReceptionPdf(req: Request, res: Response) {
  try {
    const { generateBonReceptionPdf } = await import('./achats-pdf.service');
    const pdfBuffer = await generateBonReceptionPdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bon-reception-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur génération PDF' });
  }
}

export async function downloadFactureFournisseurPdf(req: Request, res: Response) {
  try {
    const { generateFactureFournisseurPdf } = await import('./achats-pdf.service');
    const pdfBuffer = await generateFactureFournisseurPdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-fournisseur-${req.params.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur génération PDF' });
  }
}
