import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import * as controller from './devis.controller';

const router = Router();

router.get('/', requireAuth, controller.listAll);
router.get('/:id', requireAuth, controller.getOne);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.patch('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

// Workflows
router.post('/:id/facturer', requireAuth, controller.convertToFacture);
router.post('/:id/convertir-bl', requireAuth, controller.convertToBL);
router.get('/:id/pdf', requireAuth, controller.downloadPdf);

export default router;
