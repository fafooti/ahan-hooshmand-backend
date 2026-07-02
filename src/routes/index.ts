import { Router } from 'express';

import analyticsRoutes from './analytics.routes';

import auditRoutes from './audit.routes';

import authRoutes from './auth.routes';

import categoryRoutes from './category.routes';

import priceHistoryRoutes from './price-history.routes';

import productRoutes from './product.routes';

import publicRoutes from './public.routes';



const router = Router();



router.use('/auth', authRoutes);

router.use('/public', publicRoutes);

router.use('/categories', categoryRoutes);

router.use('/products', productRoutes);

router.use('/price-history', priceHistoryRoutes);

router.use('/analytics', analyticsRoutes);

router.use('/audit-logs', auditRoutes);



export default router;


