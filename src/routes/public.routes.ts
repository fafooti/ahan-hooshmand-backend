import { Router } from 'express';
import { boardController } from '../controllers/board.controller';

const router = Router();

router.get('/board', boardController.getBoard);

export default router;
