import { NextFunction, Request, Response } from 'express';
import { auditService } from '../services/audit.service';

export const auditController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { action, entityType, from, to, limit, offset } = req.query;

      const logs = await auditService.list({
        action: typeof action === 'string' ? action : undefined,
        entityType: typeof entityType === 'string' ? entityType : undefined,
        from: typeof from === 'string' ? new Date(from) : undefined,
        to: typeof to === 'string' ? new Date(to) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      const total = await auditService.count({
        action: typeof action === 'string' ? action : undefined,
        entityType: typeof entityType === 'string' ? entityType : undefined,
        from: typeof from === 'string' ? new Date(from) : undefined,
        to: typeof to === 'string' ? new Date(to) : undefined,
      });

      res.status(200).json({ items: logs, total });
    } catch (error) {
      next(error);
    }
  },
};
