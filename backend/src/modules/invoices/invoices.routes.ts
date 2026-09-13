import { Router } from 'express';
import { requireAuth, requireClient } from '../auth/auth.middleware';
import * as controller from './invoices.controller';

const router = Router();

router.get('/my', requireClient, controller.listMine);
router.get('/client/:id/pdf', requireClient, controller.downloadPdfClient);

// Admin routes
router.get('/admin/all', requireAuth, controller.listAll);
router.get('/admin/generate-number', requireAuth, controller.generateNumber);
router.get('/admin/order/:orderId', requireAuth, controller.getByOrder);
router.get('/admin/:id', requireAuth, controller.getOne);
router.post('/admin', requireAuth, controller.create);
router.post('/admin/manual', requireAuth, controller.createManual);
router.post('/admin/manual-with-bl', requireAuth, controller.createManualWithBL);
router.post('/admin/from-bls', requireAuth, controller.createFromMultipleBLs);
router.patch('/admin/:id/pdf', requireAuth, controller.updatePdf);
router.patch('/admin/:id/statut', requireAuth, controller.updateStatut);
router.patch('/admin/:id', requireAuth, controller.update);
router.put('/admin/:id', requireAuth, controller.update);
router.post('/admin/:id/paiements', requireAuth, controller.addPaiement);
router.get('/admin/:id/paiements', requireAuth, controller.listPaiements);
router.get('/admin/:id/pdf-download', requireAuth, controller.downloadPdfAdmin);

export default router;
