import { Router } from 'express';
import { requireAuth, requireClient } from '../auth/auth.middleware';
import * as controller from './invoices.controller';

const router = Router();

router.get('/my', requireClient, controller.listMine);

// All invoice routes are admin-only
router.get('/admin/all', requireAuth, controller.listAll);
router.get('/admin/generate-number', requireAuth, controller.generateNumber);
router.get('/admin/order/:orderId', requireAuth, controller.getByOrder);
router.get('/admin/:id', requireAuth, controller.getOne);
router.post('/admin', requireAuth, controller.create);
router.patch('/admin/:id/pdf', requireAuth, controller.updatePdf);

export default router;
