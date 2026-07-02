import { NextFunction, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export const analyticsController = {
  async overview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getOverview();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async trends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') ?? 'weekly';
      const data = await analyticsService.getPriceTrends(period);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async recentChanges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const data = await analyticsService.getRecentPriceChanges(limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
