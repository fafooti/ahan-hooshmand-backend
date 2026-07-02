import {
  priceHistoryRepository,
  PriceHistoryPeriod,
} from '../repositories/price-history.repository';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/AppError';

export type PriceHistoryQuery = {
  productId?: number;
  userId?: number;
  period?: PriceHistoryPeriod;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

function parseDate(value: string, fieldName: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `Invalid ${fieldName} date`);
  }
  return date;
}

export const priceHistoryService = {
  async list(query: PriceHistoryQuery = {}) {
    const filters = {
      productId: query.productId,
      userId: query.userId,
      period: query.period,
      from: query.from ? parseDate(query.from, 'from') : undefined,
      to: query.to ? parseDate(query.to, 'to') : undefined,
      limit: query.limit,
      offset: query.offset,
    };

    const [items, total] = await Promise.all([
      priceHistoryRepository.findMany(filters),
      priceHistoryRepository.count(filters),
    ]);

    return { items, total };
  },

  async getByProduct(productId: number, query: Omit<PriceHistoryQuery, 'productId'> = {}) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return this.list({ ...query, productId });
  },
};
