import { NextFunction, Request, Response } from 'express';
import { priceHistoryService } from '../services/price-history.service';
import { PriceHistoryPeriod } from '../repositories/price-history.repository';
import { parseProductId } from '../validators/product.validator';

const VALID_PERIODS: PriceHistoryPeriod[] = ['daily', 'weekly', 'monthly', 'custom'];

export const priceHistoryController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, userId, period, from, to, limit, offset } = req.query;

      const data = await priceHistoryService.list({
        productId: productId ? Number(productId) : undefined,
        userId: userId ? Number(userId) : undefined,
        period:
          typeof period === 'string' && VALID_PERIODS.includes(period as PriceHistoryPeriod)
            ? (period as PriceHistoryPeriod)
            : undefined,
        from: typeof from === 'string' ? from : undefined,
        to: typeof to === 'string' ? to : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseProductId(req.params.productId);
      const { period, from, to, limit, offset } = req.query;

      const data = await priceHistoryService.getByProduct(productId, {
        period:
          typeof period === 'string' && VALID_PERIODS.includes(period as PriceHistoryPeriod)
            ? (period as PriceHistoryPeriod)
            : undefined,
        from: typeof from === 'string' ? from : undefined,
        to: typeof to === 'string' ? to : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
