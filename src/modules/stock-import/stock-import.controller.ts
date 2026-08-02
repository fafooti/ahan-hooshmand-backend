import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../../utils/AppError';
import { stockImportService } from './stock-import.service';
import {
  validateStockImportApplyInput,
  validateStockImportFile,
} from './stock-import.validator';

export const stockImportController = {
  async importStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = validateStockImportFile(req.file);
      const result = await stockImportService.prepareImport(file);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async applyImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = validateStockImportApplyInput(req.body);
      const result = await stockImportService.applyImport(input, req.user?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  handleUploadError(error: unknown, _req: Request, _res: Response, next: NextFunction): void {
    if (error instanceof multer.MulterError) {
      next(new AppError(400, error.message));
      return;
    }

    next(error);
  },
};
