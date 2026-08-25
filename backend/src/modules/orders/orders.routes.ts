import { Router } from 'express';
import { requireClient, requireAuth } from '../auth/auth.middleware';
import * as controller from './orders.controller';

const router = Router();

// Toutes les routes de commande sont réservées aux clients authentifiés
router.post('/', requireClient, controller.create);
router.get('/', requireClient, controller.list);
router.get('/:id', requireClient, controller.getOne);

// Routes d'administration
router.get('/admin/all', requireAuth, controller.listAll);
router.patch('/admin/:id/status', requireAuth, controller.updateStatus);
router.patch('/admin/:id/items', requireAuth, controller.updateItems);

export default router;
