import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import * as controller from './exercices.controller';

const router = Router();

// Public (lecture seule pour le sélecteur frontend sans auth)
router.get('/', controller.list);
router.get('/actif', controller.getActif);
router.get('/:id/stats', requireAuth, controller.stats);

// Admin — protégés
router.post('/', requireAuth, controller.create);
router.patch('/:id/activer', requireAuth, controller.activer);
router.patch('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

export default router;
