import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import * as controller from './tiers.controller';

const router = Router();

router.get('/stats', requireAuth, controller.stats);
router.get('/', requireAuth, controller.list);
router.get('/:id', requireAuth, controller.getById);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

export default router;
