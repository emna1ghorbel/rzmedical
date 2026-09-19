import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import * as StockCommercialService from './stock-commercial.service';

export async function getStockCommercial(req: Request, res: Response) {
  try {
    const commercialId = req.query.commercialId ? Number(req.query.commercialId) : undefined;
    if (commercialId) {
      res.json(await StockCommercialService.getStockCommercial(commercialId));
    } else {
      res.json(await StockCommercialService.getAllStocksCommerciaux());
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getStockDynamiqueCommercial(req: Request, res: Response) {
  try {
    res.json(await StockCommercialService.getStockDynamiqueCommercial(Number(req.params.commercialId)));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

// ─── Bon de Sortie ──────────────────────────────────────────────────────────

export async function createBonSortie(req: Request, res: Response) {
  try { res.status(201).json(await StockCommercialService.createBonSortie(req.body)); }
  catch (err: any) { res.status(400).json({ error: err.message }); }
}
export async function listBonsSortie(req: Request, res: Response) {
  try { res.json(await StockCommercialService.listBonsSortie()); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getBonSortie(req: Request, res: Response) {
  try { res.json(await StockCommercialService.getBonSortie(Number(req.params.id))); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function updateBonSortie(req: Request, res: Response) {
  try { res.json(await StockCommercialService.updateBonSortie(Number(req.params.id), req.body)); }
  catch (err: any) { res.status(400).json({ error: err.message }); }
}
export async function downloadBonSortiePdf(req: Request, res: Response) {
  try {
    const { generateBonSortiePdf } = await import('./bon-sortie-pdf.service');
    const pdf = await generateBonSortiePdf(Number(req.params.id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bon-sortie-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err: any) { res.status(500).json({ error: err.message || 'Erreur génération PDF' }); }
}
export async function sendBonSortieEmail(req: Request, res: Response) {
  const { email, objet, message } = req.body ?? {};
  if (![email, objet, message].every((value) => typeof value === 'string' && value.trim())) return res.status(400).json({ error: 'Destinataire, objet et message sont requis' });
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return res.status(503).json({ error: 'Configuration email manquante' });
  try {
    const bon = await StockCommercialService.getBonSortie(Number(req.params.id));
    if (!bon) return res.status(404).json({ error: 'Bon de sortie introuvable' });
    const { generateBonSortiePdf } = await import('./bon-sortie-pdf.service');
    const transporter = nodemailer.createTransport({ host: process.env.EMAIL_HOST || 'smtp.gmail.com', port: Number(process.env.EMAIL_PORT) || 587, secure: process.env.EMAIL_SECURE === 'true', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }, tls: { rejectUnauthorized: false } });
    await transporter.sendMail({ from: `RZMedical <${process.env.EMAIL_USER}>`, to: email.trim(), subject: objet.trim(), text: message.trim(), attachments: [{ filename: `bon-sortie-${bon.code}.pdf`, content: await generateBonSortiePdf(bon.id), contentType: 'application/pdf' }] });
    res.json({ success: true, message: 'Email envoyé avec succès' });
  } catch (err: any) { res.status(500).json({ error: err.message || "Erreur lors de l'envoi de l'email" }); }
}
export async function validerBonSortie(req: Request, res: Response) {
  try { res.json(await StockCommercialService.validerBonSortie(Number(req.params.id), (req as any).user?.id)); }
  catch (err: any) { res.status(400).json({ error: err.message }); }
}

// ─── Inventaires ────────────────────────────────────────────────────────────

export async function listInventaires(req: Request, res: Response) {
  try { res.json(await StockCommercialService.listInventaires()); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getInventaire(req: Request, res: Response) {
  try { res.json(await StockCommercialService.getInventaireByBonSortie(Number(req.params.id))); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function createInventaire(req: Request, res: Response) {
  try { res.status(201).json(await StockCommercialService.createInventaireFromBS(Number(req.params.id))); }
  catch (err: any) { res.status(400).json({ error: err.message }); }
}

export async function updateLigneInventaire(req: Request, res: Response) {
  try { res.json(await StockCommercialService.updateLigneInventaire(Number(req.params.ligneId), Number(req.body.quantiteVoiture))); }
  catch (err: any) { res.status(400).json({ error: err.message }); }
}

export async function validerInventaire(req: Request, res: Response) {
  try { res.json(await StockCommercialService.validerInventaire(Number(req.params.id), (req as any).user?.id)); }
  catch (err: any) { res.status(400).json({ error: err.message }); }
}
