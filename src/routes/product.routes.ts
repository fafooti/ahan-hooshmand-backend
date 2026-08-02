import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/authenticate';
import { stockImportController } from '../modules/stock-import/stock-import.controller';
import { stockImportUpload } from '../modules/stock-import/stock-import.validator';

const router = Router();

router.use(authenticate);

router.get('/', productController.list);
router.post(
  '/import-stock',
  stockImportUpload.single('file'),
  stockImportController.handleUploadError,
  stockImportController.importStock,
);
router.patch('/bulk-update', productController.bulkUpdate);
router.get('/:id/history', productController.getPriceHistory);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.patch('/:id', productController.update);
router.delete('/:id', productController.remove);

export default router;
