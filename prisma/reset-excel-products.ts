/**
 * Test-only reset: wipe all Products and recreate them from Excel names.
 * Does not change stock-import matching/API logic.
 */
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

dotenv.config();

const prisma = new PrismaClient();

const UNIT = 'کیلو';
const TARGET_WORKSHEETS = ['موجودی بهزیست', 'موجودی شهرک', 'استوار'] as const;
const PRODUCT_NAME_HEADERS = new Set(['نام کالا', 'نام', 'شرح کالا', 'شرح محصول']);

const CATEGORY_RULES: { category: string; match: (name: string) => boolean }[] = [
  { category: 'میلگرد', match: (name) => name.includes('میلگرد') },
  { category: 'نبشی', match: (name) => name.includes('نبشی') },
  { category: 'ناودانی', match: (name) => name.includes('ناودانی') },
  { category: 'قوطی', match: (name) => name.includes('قوطی') },
  { category: 'ورق', match: (name) => name.includes('ورق') },
  { category: 'تیرآهن', match: (name) => /تیر\s*آهن|تیرآهن|تیراهن/.test(name) },
  { category: 'لوله', match: (name) => name.includes('لوله') },
  { category: 'سپری', match: (name) => name.includes('سپری') },
  { category: 'تسمه', match: (name) => name.includes('تسمه') },
  { category: 'پانچ', match: (name) => name.includes('پانچ') },
  { category: 'توری', match: (name) => name.includes('توری') },
  { category: 'ستونی', match: (name) => name.includes('ستونی') },
  { category: 'چهارسو', match: (name) => name.includes('چهارسو') },
  { category: 'لقمه', match: (name) => name.includes('لقمه') },
  { category: 'پروفیل', match: (name) => name.includes('پروفیل') || name.includes('چهارچوبی') },
];

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function inferCategory(name: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.match(name)) {
      return rule.category;
    }
  }

  return 'سایر';
}

function resolveExcelPath(): string {
  return (
    process.argv[2] ??
    path.join(process.env.USERPROFILE ?? '', 'Downloads', '05.04.31.xlsx')
  );
}

/** Same extraction approach as prisma/extract-excel-product-names.ts */
function extractUniqueExcelProductNames(excelPath: string): string[] {
  const workbook = xlsx.readFile(excelPath);
  const names = new Set<string>();

  for (const sheetName of TARGET_WORKSHEETS) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error(`Missing required worksheet: ${sheetName}`);
    }

    const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    const headerRowIndex = rows.findIndex(
      (row) =>
        Array.isArray(row) &&
        row.some((cell) => PRODUCT_NAME_HEADERS.has(cellToString(cell))),
    );

    if (headerRowIndex < 0) {
      throw new Error(`Worksheet "${sheetName}" does not contain a product name header`);
    }

    const headers = (rows[headerRowIndex] as unknown[]).map((cell) => cellToString(cell));
    const nameColumnIndex = headers.findIndex((header) => PRODUCT_NAME_HEADERS.has(header));

    if (nameColumnIndex < 0) {
      throw new Error(`Worksheet "${sheetName}" is missing a product name column`);
    }

    for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
      const row = rows[index];

      if (!Array.isArray(row)) {
        continue;
      }

      const name = cellToString(row[nameColumnIndex] ?? '');

      if (!name) {
        continue;
      }

      // Exact Excel string after cell trim only — no other normalization.
      names.add(name);
    }
  }

  return Array.from(names);
}

async function ensureCategories(categoryNames: string[]): Promise<Map<string, number>> {
  const categoryIdByName = new Map<string, number>();

  for (const [index, name] of categoryNames.entries()) {
    const existing = await prisma.category.findFirst({ where: { name } });

    if (existing) {
      categoryIdByName.set(name, existing.id);
      continue;
    }

    const created = await prisma.category.create({
      data: {
        name,
        sortOrder: 100 + index,
      },
    });
    categoryIdByName.set(name, created.id);
  }

  return categoryIdByName;
}

async function main() {
  const excelPath = resolveExcelPath();
  console.log(`Excel source: ${excelPath}`);

  const uniqueNames = extractUniqueExcelProductNames(excelPath);
  console.log(`Unique Excel product names: ${uniqueNames.length}`);

  if (uniqueNames.length === 0) {
    throw new Error('No product names found in Excel');
  }

  const namesByCategory = new Map<string, string[]>();

  for (const name of uniqueNames) {
    const category = inferCategory(name);
    const list = namesByCategory.get(category) ?? [];
    list.push(name);
    namesByCategory.set(category, list);
  }

  const categoryIdByName = await ensureCategories(Array.from(namesByCategory.keys()));

  const productRows = uniqueNames.map((name) => ({
    name,
    buyPrice: 0,
    factoryPrice: 0,
    price: 0,
    stock: 0,
    unit: UNIT,
    isActive: true,
    priceUpdatedAt: new Date(),
    categoryId: categoryIdByName.get(inferCategory(name))!,
  }));

  const { deletedCount, createdCount, totalCount } = await prisma.$transaction(
    async (tx) => {
      const deleted = await tx.product.deleteMany();
      const created = await tx.product.createMany({ data: productRows });
      const total = await tx.product.count();

      return {
        deletedCount: deleted.count,
        createdCount: created.count,
        totalCount: total,
      };
    },
  );

  console.log(`Deleted products: ${deletedCount}`);
  console.log(`Created products: ${createdCount}`);
  console.log(`Total Product count: ${totalCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
