import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';

export type PriceHistoryPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

type PriceHistoryFilters = {
  productId?: number;
  userId?: number;
  period?: PriceHistoryPeriod;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
};

function getPeriodStart(period: PriceHistoryPeriod): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      return start;
    case 'weekly':
      start.setDate(now.getDate() - 7);
      return start;
    case 'monthly':
      start.setMonth(now.getMonth() - 1);
      return start;
    default:
      return start;
  }
}

function buildWhere(filters: PriceHistoryFilters): Prisma.PriceHistoryWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};

  if (filters.period && filters.period !== 'custom') {
    createdAt.gte = getPeriodStart(filters.period);
  }

  if (filters.from) {
    createdAt.gte = filters.from;
  }

  if (filters.to) {
    createdAt.lte = filters.to;
  }

  return {
    ...(filters.productId && { productId: filters.productId }),
    ...(filters.userId && { userId: filters.userId }),
    ...(Object.keys(createdAt).length > 0 && { createdAt }),
  };
}

export const priceHistoryRepository = {
  create(data: {
    productId: number;
    oldPrice: number | null;
    newPrice: number;
    userId?: number | null;
  }) {
    return prisma.priceHistory.create({
      data: {
        productId: data.productId,
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
        userId: data.userId ?? null,
      },
      include: {
        product: { include: { category: true } },
        user: { select: { id: true, username: true, name: true } },
      },
    });
  },

  findMany(filters: PriceHistoryFilters = {}) {
    return prisma.priceHistory.findMany({
      where: buildWhere(filters),
      include: {
        product: { include: { category: true } },
        user: { select: { id: true, username: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ?? 100,
      skip: filters.offset ?? 0,
    });
  },

  count(filters: PriceHistoryFilters = {}) {
    return prisma.priceHistory.count({
      where: buildWhere(filters),
    });
  },

  findByProductId(productId: number, filters: Omit<PriceHistoryFilters, 'productId'> = {}) {
    return this.findMany({ ...filters, productId });
  },
};
