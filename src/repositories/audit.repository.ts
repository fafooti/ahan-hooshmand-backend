import { prisma } from '../prisma/client';

type AuditFilters = {
  action?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
};

function buildWhere(filters?: AuditFilters) {
  return {
    ...(filters?.action && { action: filters.action }),
    ...(filters?.entityType && { entityType: filters.entityType }),
    ...((filters?.from || filters?.to) && {
      createdAt: {
        ...(filters.from && { gte: filters.from }),
        ...(filters.to && { lte: filters.to }),
      },
    }),
  };
}

export const auditRepository = {
  create(data: {
    action: string;
    entityType: string;
    entityId: number | null;
    userId: number | null;
    oldValues: string | null;
    newValues: string | null;
  }) {
    return prisma.auditLog.create({
      data,
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
      },
    });
  },

  findMany(filters?: AuditFilters) {
    return prisma.auditLog.findMany({
      where: buildWhere(filters),
      include: {
        user: {
          select: { id: true, username: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
  },

  count(filters?: AuditFilters) {
    return prisma.auditLog.count({
      where: buildWhere(filters),
    });
  },
};
