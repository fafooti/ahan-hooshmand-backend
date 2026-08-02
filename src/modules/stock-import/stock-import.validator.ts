import multer from 'multer';
import path from 'path';
import { AppError } from '../../utils/AppError';
import { StockImportParsedRow, StockImportStockValue } from './stock-import.types';

const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls']);
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    cb(new AppError(400, 'Only .xlsx and .xls files are allowed'));
    return;
  }

  cb(null, true);
}

export const stockImportUpload = multer({
  storage,
  fileFilter,
});

export function validateStockImportFile(file: Express.Multer.File | undefined): Express.Multer.File {
  if (!file) {
    throw new AppError(400, 'File is required');
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new AppError(400, 'Only .xlsx and .xls files are allowed');
  }

  return file;
}

function toEnglishDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (character) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(character);

    if (persianIndex >= 0) {
      return String(persianIndex);
    }

    const arabicIndex = ARABIC_DIGITS.indexOf(character);
    return arabicIndex >= 0 ? String(arabicIndex) : character;
  });
}

function parseStockValue(rawStock: unknown): StockImportStockValue {
  if (typeof rawStock === 'number') {
    if (!Number.isFinite(rawStock) || rawStock < 0) {
      return null;
    }

    return rawStock;
  }

  if (typeof rawStock !== 'string') {
    return null;
  }

  const trimmed = rawStock.trim();

  if (trimmed.length === 0 || trimmed === '-') {
    return null;
  }

  const parsed = Number(toEnglishDigits(trimmed));

  if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function validateStockImportRow(
  row: number,
  rawName: unknown,
  rawStock: unknown,
): StockImportParsedRow {
  if (typeof rawName !== 'string' || rawName.trim().length === 0) {
    throw new AppError(400, `Row ${row} product name is required`);
  }

  return {
    row,
    name: rawName.trim(),
    stock: parseStockValue(rawStock),
  };
}
