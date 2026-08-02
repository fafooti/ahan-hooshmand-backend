import { auditRepository } from '../repositories/audit.repository';

export type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'PRICE_CHANGED'
  | 'PRODUCTS_BULK_UPDATED'
  | 'STOCK_IMPORT_APPLIED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_DELETED'
  | 'CATEGORIES_REORDERED';

export type AuditEntityType = 'product' | 'category' | 'price';

type LogParams = {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: number;
  userId?: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
};

export const auditService = {
  async log(params: LogParams) {
    return auditRepository.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      userId: params.userId ?? null,
      oldValues: params.oldValues ? JSON.stringify(params.oldValues) : null,
      newValues: params.newValues ? JSON.stringify(params.newValues) : null,
    });
  },

  async list(filters?: {
    action?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    return auditRepository.findMany(filters);
  },

  async count(filters?: {
    action?: string;
    entityType?: string;
    from?: Date;
    to?: Date;
  }) {
    return auditRepository.count(filters);
  },
};
