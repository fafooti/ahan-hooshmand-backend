import { NextFunction, Request, Response } from 'express';
import { boardService } from '../services/board.service';

export const boardController = {
  async getBoard(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await boardService.getPublicBoard();
      res.status(200).json(board);
    } catch (error) {
      next(error);
    }
  },
};
