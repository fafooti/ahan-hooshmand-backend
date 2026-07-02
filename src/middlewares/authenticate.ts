import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/AppError';

interface AuthTokenPayload {
  sub: number;
  username: string;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized');
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret) as unknown as AuthTokenPayload;

    req.user = {
      id: decoded.sub,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, 'Unauthorized'));
  }
}
