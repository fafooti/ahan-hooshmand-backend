import { Router } from 'express';

import { categoryController } from '../controllers/category.controller';

import { authenticate } from '../middlewares/authenticate';



const router = Router();



router.use(authenticate);



router.get('/', categoryController.list);

router.patch('/reorder', categoryController.reorder);

router.get('/:id', categoryController.getById);

router.post('/', categoryController.create);

router.patch('/:id', categoryController.update);

router.delete('/:id', categoryController.remove);



export default router;


