import { prisma } from '../prisma/client';

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export const analyticsService = {
  async getOverview() {
    const [
      productCount,
      categoryCount,
      activeProductCount,
      recentChanges,
      categoryDistribution,
      mostChangedProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.product.count({ where: { isActive: true } }),
      this.getRecentPriceChanges(10),
      this.getCategoryDistribution(),
      this.getMostChangedProducts(10),
    ]);

    return {
      productCount,
      categoryCount,
      activeProductCount,
      recentChanges,
      categoryDistribution,
      mostChangedProducts,
    };
  },

  async getRecentPriceChanges(limit = 20) {
    return prisma.priceHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { include: { category: true } },
        user: { select: { id: true, username: true, name: true } },
      },
    });
  },

  async getMostChangedProducts(limit = 10) {
    const grouped = await prisma.priceHistory.groupBy({
      by: ['productId'],
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    const productIds = grouped.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return grouped.map((g) => ({
      product: productMap.get(g.productId)!,
      changeCount: g._count.productId,
    }));
  },

  async getCategoryDistribution() {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      productCount: c._count.products,
    }));
  },

  async getPriceTrends(period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    const since =
      period === 'daily' ? daysAgo(1) : period === 'weekly' ? daysAgo(7) : daysAgo(30);

    const history = await prisma.priceHistory.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        oldPrice: true,
        newPrice: true,
        productId: true,
      },
    });

    const byDay = new Map<string, { date: string; changes: number; avgChange: number }>();

    for (const entry of history) {
      const day = entry.createdAt.toISOString().slice(0, 10);
      const existing = byDay.get(day) ?? { date: day, changes: 0, avgChange: 0 };
      const delta =
        entry.oldPrice !== null ? Math.abs(entry.newPrice - entry.oldPrice) : 0;
      existing.changes += 1;
      existing.avgChange =
        (existing.avgChange * (existing.changes - 1) + delta) / existing.changes;
      byDay.set(day, existing);
    }

    return Array.from(byDay.values());
  },
};
