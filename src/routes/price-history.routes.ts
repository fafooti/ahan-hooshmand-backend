import { Router } from 'express';
import { priceHistoryController } from '../controllers/price-history.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', priceHistoryController.list);
router.get('/product/:productId', priceHistoryController.getByProduct);

export default router;
