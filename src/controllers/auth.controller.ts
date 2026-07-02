import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError(400, 'Username and password are required');
      }

      const result = await authService.login(username, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
