import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import * as controller from './bons-livraison.controller';

const router = Router();

router.get('/admin', requireAuth, controller.listAll);
router.get('/admin/:id', requireAuth, controller.getOne);
router.post('/admin/from-order/:orderId', requireAuth, controller.createFromOrder);
router.post('/admin', requireAuth, controller.create);
router.patch('/admin/:id', requireAuth, controller.update);
router.delete('/admin/:id', requireAuth, controller.remove);
router.post('/admin/:id/facturer', requireAuth, controller.facturer);
router.get('/admin/:id/pdf', requireAuth, controller.downloadPdf);

export default router;
