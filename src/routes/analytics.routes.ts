import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

router.get('/overview', analyticsController.overview);
router.get('/trends', analyticsController.trends);
router.get('/recent-changes', analyticsController.recentChanges);

export default router;
