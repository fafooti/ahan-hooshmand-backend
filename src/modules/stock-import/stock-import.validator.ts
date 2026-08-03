import multer from 'multer';
import path from 'path';
import { AppError } from '../../utils/AppError';
import {
  StockImportApplyCreateItem,
  StockImportApplyInput,
  StockImportApplyUpdateItem,
  StockImportParsedRow,
  StockImportStockValue,
} from './stock-import.types';

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

function parsePositiveInteger(value: unknown, fieldName: string): number {
  const parsed = typeof value === 'string' ? Number(value) : value;

  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${fieldName} must be a positive integer`);
  }

  return parsed;
}

function parseNonNegativeNumber(value: unknown, fieldName: string): number {
  if (value === null || value === undefined) {
    throw new AppError(400, `${fieldName} is required`);
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    throw new AppError(400, `${fieldName} must be a non-negative number`);
  }

  const parsed = typeof value === 'string' ? Number(value.trim()) : value;

  if (
    typeof parsed !== 'number' ||
    Number.isNaN(parsed) ||
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new AppError(400, `${fieldName} must be a non-negative number`);
  }

  return parsed;
}

function parseNonEmptyName(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, `${fieldName} is required`);
  }

  return value.trim();
}

export function validateStockImportApplyInput(body: unknown): StockImportApplyInput {
  if (!body || typeof body !== 'object') {
    throw new AppError(400, 'Invalid request body');
  }

  const input = body as Record<string, unknown>;

  const rawUpdates = input.updates;
  const rawCreates = input.creates;

  if (rawUpdates !== undefined && !Array.isArray(rawUpdates)) {
    throw new AppError(400, 'Updates must be an array');
  }

  if (rawCreates !== undefined && !Array.isArray(rawCreates)) {
    throw new AppError(400, 'Creates must be an array');
  }

  const updateItems = Array.isArray(rawUpdates) ? rawUpdates : [];
  const createItems = Array.isArray(rawCreates) ? rawCreates : [];

  if (updateItems.length === 0 && createItems.length === 0) {
    throw new AppError(400, 'At least one update or create item is required');
  }

  const seenIds = new Set<number>();
  const updates: StockImportApplyUpdateItem[] = updateItems.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(400, `Update at index ${index} is invalid`);
    }

    const update = item as Record<string, unknown>;

    if (!('productId' in update)) {
      throw new AppError(400, `Update at index ${index} is missing productId`);
    }

    if (!('stock' in update)) {
      throw new AppError(400, `Update at index ${index} is missing stock`);
    }

    if (update.stock === null) {
      throw new AppError(400, `Update at index ${index}: stock cannot be null`);
    }

    const productId = parsePositiveInteger(update.productId, 'Product id');
    const stock = parseNonNegativeNumber(update.stock, 'Stock');

    if (seenIds.has(productId)) {
      throw new AppError(400, `Duplicate product id: ${productId}`);
    }

    seenIds.add(productId);

    return { productId, stock };
  });

  const seenNames = new Set<string>();
  const creates: StockImportApplyCreateItem[] = createItems.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(400, `Create at index ${index} is invalid`);
    }

    const create = item as Record<string, unknown>;

    if (!('name' in create)) {
      throw new AppError(400, `Create at index ${index} is missing name`);
    }

    if (!('stock' in create)) {
      throw new AppError(400, `Create at index ${index} is missing stock`);
    }

    if (create.stock === null) {
      throw new AppError(400, `Create at index ${index}: stock cannot be null`);
    }

    const name = parseNonEmptyName(create.name, 'Product name');
    const stock = parseNonNegativeNumber(create.stock, 'Stock');

    if (seenNames.has(name)) {
      throw new AppError(400, `Duplicate product name: ${name}`);
    }

    seenNames.add(name);

    return { name, stock };
  });

  return { updates, creates };
}
