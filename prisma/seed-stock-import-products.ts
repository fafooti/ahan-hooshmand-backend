import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { inferCategory } from '../src/modules/stock-import/infer-category';

dotenv.config();

const prisma = new PrismaClient();

const UNIT = 'کیلو';
const DEFAULT_PRICE = 100000;
const EXCEL_NAMES_PATH = path.join(__dirname, 'excel-unique-product-names.json');

type SeedProduct = {
  name: string;
  buyPrice?: number;
  factoryPrice?: number;
  price?: number;
  stock?: number;
};

type SeedGroup = {
  category: string;
  products: SeedProduct[];
};

function loadExcelProductNames(): string[] {
  const raw = fs.readFileSync(EXCEL_NAMES_PATH, 'utf8');
  const names = JSON.parse(raw) as string[];

  if (!Array.isArray(names) || names.length === 0) {
    throw new Error(`No Excel product names found in ${EXCEL_NAMES_PATH}`);
  }

  // Keep exact Excel strings; only drop empties. Do not normalize.
  return names.filter((name) => typeof name === 'string' && name.length > 0);
}

function buildSeedGroups(names: string[]): SeedGroup[] {
  const groups = new Map<string, SeedProduct[]>();

  for (const name of names) {
    const category = inferCategory(name);
    const products = groups.get(category) ?? [];
    products.push({ name });
    groups.set(category, products);
  }

  return Array.from(groups.entries()).map(([category, products]) => ({
    category,
    products,
  }));
}

async function upsertCategory(name: string, sortOrder: number) {
  const existing = await prisma.category.findFirst({ where: { name } });

  if (existing) {
    const record = await prisma.category.update({
      where: { id: existing.id },
      data: { name, sortOrder },
    });
    return { record, created: false };
  }

  const record = await prisma.category.create({ data: { name, sortOrder } });
  return { record, created: true };
}

async function upsertProductByName(categoryId: number, item: SeedProduct) {
  // Exact Excel name — trim only for safety; no other normalization.
  const name = item.name.trim();
  const buyPrice = item.buyPrice ?? DEFAULT_PRICE;
  const factoryPrice = item.factoryPrice ?? DEFAULT_PRICE;
  const price = item.price ?? DEFAULT_PRICE;
  const stock = item.stock ?? 0;

  const existing = await prisma.product.findFirst({ where: { name } });

  const data = {
    name,
    buyPrice,
    factoryPrice,
    price,
    stock,
    unit: UNIT,
    isActive: true,
    priceUpdatedAt: new Date(),
    categoryId,
  };

  if (existing) {
    const record = await prisma.product.update({
      where: { id: existing.id },
      data,
    });
    return { record, created: false };
  }

  const record = await prisma.product.create({ data });
  return { record, created: true };
}

async function main() {
  const excelNames = loadExcelProductNames();
  const stockImportSeedData = buildSeedGroups(excelNames);

  let categoriesInserted = 0;
  let categoriesUpdated = 0;
  let productsInserted = 0;
  let productsUpdated = 0;

  console.log(`Loaded ${excelNames.length} exact Excel product names`);
  console.log(`Seed groups: ${stockImportSeedData.length}`);

  for (let i = 0; i < stockImportSeedData.length; i += 1) {
    const group = stockImportSeedData[i];
    const { record: category, created: categoryCreated } = await upsertCategory(
      group.category,
      100 + i,
    );

    if (categoryCreated) {
      categoriesInserted += 1;
    } else {
      categoriesUpdated += 1;
    }

    for (const item of group.products) {
      const { created } = await upsertProductByName(category.id, item);

      if (created) {
        productsInserted += 1;
      } else {
        productsUpdated += 1;
      }
    }
  }

  const totalProducts = await prisma.product.count();

  console.log(`Categories inserted: ${categoriesInserted}`);
  console.log(`Categories updated: ${categoriesUpdated}`);
  console.log(`Products inserted: ${productsInserted}`);
  console.log(`Products updated: ${productsUpdated}`);
  console.log(`Products total seeded this run: ${productsInserted + productsUpdated}`);
  console.log(`Total Product count in database: ${totalProducts}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
