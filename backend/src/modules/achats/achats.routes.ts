import { Router } from 'express';
import * as ctrl from './achats.controller';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ocrUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 15 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const accepted = file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');
		// Multer's callback type accepts a nullable error; rejected files are
		// handled by the controller as a regular JSON 400 response.
		cb(null, accepted);
	},
});

const chargeUploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', 'charges');
fs.mkdirSync(chargeUploadDir, { recursive: true });
const chargeDocumentUpload = multer({
  storage: multer.diskStorage({
    destination: chargeUploadDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')),
});

const router = Router();

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', ctrl.getAchatsStats);

// ─── Bons de Commande ─────────────────────────────────────────────────────────
router.get('/bons-commande', ctrl.listBonsCommande);
router.get('/bons-commande/:id', ctrl.getBonCommande);
router.get('/bons-commande/:id/pdf', ctrl.downloadBonCommandePdf);
router.post('/bons-commande', ctrl.createBonCommande);
router.put('/bons-commande/:id', ctrl.updateBonCommande);
router.delete('/bons-commande/:id', ctrl.deleteBonCommande);
router.post('/bons-commande/:id/transformer-br', ctrl.transformerBCenBR);

// ─── Bons de Réception ────────────────────────────────────────────────────────
router.get('/bons-reception', ctrl.listBonsReception);
router.get('/bons-reception/:id', ctrl.getBonReception);
router.get('/bons-reception/:id/pdf', ctrl.downloadBonReceptionPdf);
router.post('/bons-reception', ctrl.createBonReception);
router.put('/bons-reception/:id', ctrl.updateBonReception);
router.delete('/bons-reception/:id', ctrl.deleteBonReception);
router.patch('/bons-reception/:id/valider', ctrl.validerBonReception);
router.post('/bons-reception/:id/transformer-facture', ctrl.transformerBRenFF);

// ─── Factures Fournisseurs ────────────────────────────────────────────────────
router.post('/factures/ocr', ocrUpload.single('file'), ctrl.analyzeFactureFournisseurOCR);
router.get('/factures', ctrl.listFacturesFournisseurs);
router.get('/factures/:id', ctrl.getFactureFournisseur);
router.get('/factures/:id/pdf', ctrl.downloadFactureFournisseurPdf);
router.post('/factures', ctrl.createFactureFournisseur);
router.put('/factures/:id', ctrl.updateFactureFournisseur);
router.post('/factures/:id/envoyer-email', ctrl.sendFactureFournisseurEmail);
router.delete('/factures/:id', ctrl.deleteFactureFournisseur);
router.post('/factures/:id/paiements', ctrl.addPaiementFF);

// Formulaires de charges spécialisés. Ils conservent leur facture liée.
router.post('/charges/document', chargeDocumentUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Pièce justificative invalide' });
  res.status(201).json({ url: `/uploads/charges/${req.file.filename}` });
});
// Route OCR spécifique CNSS — doit être AVANT /charges/:categorie pour éviter le conflit
router.post('/charges/cnss/ocr', ocrUpload.single('file'), ctrl.analyzeCnssReceiptOCR);
router.get('/charges/:categorie', ctrl.listSpecificCharges);
router.post('/charges/:categorie', ctrl.createCharge);

export default router;
