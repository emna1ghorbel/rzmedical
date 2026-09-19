import { Router } from 'express';
import * as controller from './products.controller';

const router = Router();

router.get('/', controller.getAll);
router.get('/new', controller.getNew);
router.get('/promo', controller.getPromo);
router.get('/reference/:reference', controller.getByReference);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/stock-repartition', controller.getStockRepartition);

export default router;
