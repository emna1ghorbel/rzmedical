import { Router } from 'express';
import * as controller from './categories.controller';

const router = Router();

// Public (client) : uniquement les catégories visibles
router.get('/visible', controller.getAllVisible);

// Admin : toutes les catégories + CRUD complet
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/toggle-visible', controller.toggleVisible);
router.delete('/:id', controller.remove);

export default router;
