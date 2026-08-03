import xlsx from 'xlsx';
import { prisma } from '../../prisma/client';
import { productRepository } from '../../repositories/product.repository';
import { auditService } from '../../services/audit.service';
import { emitBoardUpdated, emitRealtime } from '../../socket';
import { AppError } from '../../utils/AppError';
import { inferCategory } from './infer-category';
import { validateStockImportRow } from './stock-import.validator';
import {
  StockImportApplyInput,
  StockImportApplyResult,
  StockImportMatchedRow,
  StockImportParsedRow,
  StockImportResult,
  StockImportUnmatchedRow,
} from './stock-import.types';

const DEFAULT_UNIT = 'کیلو';
const DEFAULT_PRICE = 0;

const TARGET_WORKSHEETS = ['موجودی بهزیست', 'موجودی شهرک', 'استوار'] as const;

const PRODUCT_NAME_HEADERS = new Set(['نام کالا', 'نام', 'شرح کالا', 'شرح محصول']);
const STOCK_HEADERS = new Set(['مانده', 'موجودی', 'مقدار', 'تعداد', 'وزن']);

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function findHeaderIndex(headers: string[], candidates: Set<string>): number {
  return headers.findIndex((header) => candidates.has(header));
}

function findHeaderRowIndex(rawRows: unknown[][]): number {
  return rawRows.findIndex(
    (row) => Array.isArray(row) && row.some((cell) => PRODUCT_NAME_HEADERS.has(cellToString(cell))),
  );
}

function parseSheet(sheetName: string, sheet: xlsx.WorkSheet): StockImportParsedRow[] {
  const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  console.log(`worksheet: ${sheetName}`);
  console.log('first 20 rows:', JSON.stringify(rawRows.slice(0, 20), null, 2));

  const headerRowIndex = findHeaderRowIndex(rawRows);

  console.log('detected header row index:', headerRowIndex);
  console.log(
    'detected header row:',
    headerRowIndex >= 0 ? JSON.stringify(rawRows[headerRowIndex], null, 2) : null,
  );

  if (headerRowIndex < 0) {
    throw new AppError(
      400,
      `Worksheet "${sheetName}" does not contain a recognizable product name header`,
    );
  }

  const headerRow = rawRows[headerRowIndex] as unknown[];
  const headers = headerRow.map((cell) => cellToString(cell));
  const nameColumnIndex = findHeaderIndex(headers, PRODUCT_NAME_HEADERS);
  const stockColumnIndex = findHeaderIndex(headers, STOCK_HEADERS);

  console.log('detected name column:', headers[nameColumnIndex] ?? null);
  console.log('detected stock column:', headers[stockColumnIndex] ?? null);

  if (nameColumnIndex < 0) {
    throw new AppError(400, `Worksheet "${sheetName}" is missing a product name column`);
  }

  if (stockColumnIndex < 0) {
    throw new AppError(400, `Worksheet "${sheetName}" is missing a stock column`);
  }

  const dataRows = rawRows.slice(headerRowIndex + 1);
  const parsedRows: StockImportParsedRow[] = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const rawRow = dataRows[index];

    if (!Array.isArray(rawRow)) {
      continue;
    }

    const rawName = rawRow[nameColumnIndex] ?? '';
    const name = cellToString(rawName);

    if (!name) {
      continue;
    }

    const excelRowNumber = headerRowIndex + index + 2;
    const rawStock = rawRow[stockColumnIndex] ?? '';
    const parsedRow = validateStockImportRow(excelRowNumber, rawName, rawStock);
    parsedRows.push(parsedRow);
  }

  console.log(`worksheet "${sheetName}" parsed rows:`, parsedRows.length);
  console.log(`worksheet "${sheetName}" first parsed row:`, parsedRows[0] ?? null);

  return parsedRows;
}

function parseWorkbook(file: Express.Multer.File): StockImportParsedRow[] {
  const workbook = xlsx.read(file.buffer, { type: 'buffer' });

  console.log('worksheet names:', workbook.SheetNames);

  const missingSheets = TARGET_WORKSHEETS.filter((name) => !workbook.SheetNames.includes(name));

  if (missingSheets.length > 0) {
    throw new AppError(400, `Missing required worksheets: ${missingSheets.join(', ')}`);
  }

  const parsedRows: StockImportParsedRow[] = [];

  for (const sheetName of TARGET_WORKSHEETS) {
    const sheet = workbook.Sheets[sheetName];
    parsedRows.push(...parseSheet(sheetName, sheet));
  }

  return parsedRows;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

/** Analysis-only normalization. NOT used for matching. */
function analyzeNormalizeName(value: string): string {
  return value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[-‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/(\D)\s*(\d)/g, '$1 $2')
    .replace(/(\d)\s*(\D)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function findClosestCandidates(
  excelName: string,
  dbNames: string[],
  limit = 3,
): { name: string; distance: number; analyzeNormalized: string }[] {
  const excelNormalized = analyzeNormalizeName(excelName);

  return dbNames
    .map((name) => ({
      name,
      analyzeNormalized: analyzeNormalizeName(name),
      distance: levenshtein(excelNormalized, analyzeNormalizeName(name)),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

function analyzeUnmatchedRows(
  unmatchedRows: StockImportParsedRow[],
  dbNames: string[],
): void {
  const dbNormalizedMap = new Map<string, string[]>();

  for (const name of dbNames) {
    const key = analyzeNormalizeName(name);
    const list = dbNormalizedMap.get(key) ?? [];
    list.push(name);
    dbNormalizedMap.set(key, list);
  }

  let formattingOnly = 0;
  let missingInDb = 0;
  const formattingExamples: unknown[] = [];
  const missingExamples: unknown[] = [];

  for (const row of unmatchedRows) {
    const excelName = row.name;
    const normalizedExcelName = analyzeNormalizeName(excelName);
    const similarExact = dbNormalizedMap.get(normalizedExcelName) ?? [];
    const closest = findClosestCandidates(excelName, dbNames);
    const isFormattingOnly = similarExact.length > 0;

    if (isFormattingOnly) {
      formattingOnly += 1;
    } else {
      missingInDb += 1;
    }

    const debugEntry = {
      excelName,
      normalizedExcelName,
      similarDbExists: isFormattingOnly,
      similarDbNames: similarExact,
      closestCandidates: closest,
      category: isFormattingOnly ? 'formatting-difference' : 'missing-in-database',
    };

    console.log('UNMATCHED_ANALYSIS:', JSON.stringify(debugEntry, null, 2));

    if (isFormattingOnly && formattingExamples.length < 10) {
      formattingExamples.push(debugEntry);
    }

    if (!isFormattingOnly && missingExamples.length < 10) {
      missingExamples.push(debugEntry);
    }
  }

  console.log('UNMATCHED_SUMMARY:', {
    totalUnmatched: unmatchedRows.length,
    formattingOnly,
    missingInDb,
    formattingExamples,
    missingExamples,
  });
}

export const stockImportService = {
  async prepareImport(file: Express.Multer.File): Promise<StockImportResult> {
    const rows = parseWorkbook(file);
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    const productNameMap = new Map<
      string,
      { id: number; name: string; stock: number }
    >();
    const dbNames = products.map((product) => product.name);

    for (const product of products) {
      const trimmedName = product.name.trim();

      if (!productNameMap.has(trimmedName)) {
        productNameMap.set(trimmedName, {
          id: product.id,
          name: product.name,
          stock: product.stock,
        });
      }
    }

    const matchedRows: StockImportMatchedRow[] = [];
    const unmatchedRows: StockImportUnmatchedRow[] = [];

    for (const row of rows) {
      const product = productNameMap.get(row.name.trim());

      if (!product) {
        unmatchedRows.push(row);
        continue;
      }

      console.log('MATCHED:', row.name, product.name);

      matchedRows.push({
        row: row.row,
        name: row.name,
        productId: product.id,
        productName: product.name,
        stock: row.stock,
        currentStock: product.stock,
      });
    }

    analyzeUnmatchedRows(unmatchedRows, dbNames);

    return {
      success: true,
      matched: matchedRows.length,
      unmatched: unmatchedRows.length,
      matchedRows,
      unmatchedRows,
    };
  },

  async applyImport(
    input: StockImportApplyInput,
    userId?: number,
  ): Promise<StockImportApplyResult> {
    if (input.updates.length > 0) {
      const ids = input.updates.map((update) => update.productId);
      const products = await productRepository.findByIds(ids);

      if (products.length !== ids.length) {
        throw new AppError(404, 'One or more products not found');
      }
    }

    const { updatedProducts, createdProducts } = await prisma.$transaction(
      async (tx) => {
        const updated = [];
        const created = [];
        const categoryIdByName = new Map<string, number>();

        async function resolveCategoryId(categoryName: string): Promise<number> {
          const cached = categoryIdByName.get(categoryName);
          if (cached !== undefined) {
            return cached;
          }

          const existing = await tx.category.findFirst({
            where: { name: categoryName },
          });

          if (existing) {
            categoryIdByName.set(categoryName, existing.id);
            return existing.id;
          }

          const maxOrder = await tx.category.aggregate({
            _max: { sortOrder: true },
          });
          const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;

          const createdCategory = await tx.category.create({
            data: {
              name: categoryName,
              sortOrder,
            },
          });

          categoryIdByName.set(categoryName, createdCategory.id);
          return createdCategory.id;
        }

        for (const update of input.updates) {
          const product = await tx.product.update({
            where: { id: update.productId },
            data: { stock: update.stock },
            include: { category: true },
          });

          updated.push(product);
        }

        for (const create of input.creates) {
          const name = create.name.trim();

          // Exact-name race guard: if name appeared since preview, update stock instead.
          const existingByName = await tx.product.findFirst({
            where: { name },
            include: { category: true },
          });

          if (existingByName) {
            const product = await tx.product.update({
              where: { id: existingByName.id },
              data: { stock: create.stock },
              include: { category: true },
            });
            updated.push(product);
            continue;
          }

          const categoryName = inferCategory(name);
          const categoryId = await resolveCategoryId(categoryName);

          const product = await tx.product.create({
            data: {
              name,
              stock: create.stock,
              price: DEFAULT_PRICE,
              buyPrice: DEFAULT_PRICE,
              factoryPrice: DEFAULT_PRICE,
              unit: DEFAULT_UNIT,
              isActive: true,
              priceUpdatedAt: new Date(),
              categoryId,
            },
            include: { category: true },
          });

          created.push(product);
        }

        return { updatedProducts: updated, createdProducts: created };
      },
    );

    await auditService.log({
      action: 'STOCK_IMPORT_APPLIED',
      entityType: 'product',
      userId,
      newValues: {
        updates: input.updates,
        creates: input.creates,
        updated: updatedProducts.length,
        created: createdProducts.length,
      },
    });

    if (updatedProducts.length > 0) {
      emitRealtime('products:bulk-updated', updatedProducts);
    }

    for (const product of createdProducts) {
      emitRealtime('product:created', product);
    }

    if (updatedProducts.length > 0 || createdProducts.length > 0) {
      emitBoardUpdated();
    }

    return {
      success: true,
      updated: updatedProducts.length,
      created: createdProducts.length,
    };
  },
};
