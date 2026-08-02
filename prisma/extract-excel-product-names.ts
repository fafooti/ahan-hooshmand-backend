import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const excelPath = process.argv[2] ?? path.join(process.env.USERPROFILE ?? '', 'Downloads', '05.04.31.xlsx');
const TARGET_WORKSHEETS = ['موجودی بهزیست', 'موجودی شهرک', 'استوار'];
const PRODUCT_NAME_HEADERS = new Set(['نام کالا', 'نام', 'شرح کالا', 'شرح محصول']);

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

const workbook = xlsx.readFile(excelPath);
const names = new Set<string>();

for (const sheetName of TARGET_WORKSHEETS) {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    console.error(`Missing sheet: ${sheetName}`);
    continue;
  }

  const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const headerRowIndex = rows.findIndex(
    (row) => Array.isArray(row) && row.some((cell) => PRODUCT_NAME_HEADERS.has(cellToString(cell))),
  );

  if (headerRowIndex < 0) {
    console.error(`No header in: ${sheetName}`);
    continue;
  }

  const headers = (rows[headerRowIndex] as unknown[]).map((cell) => cellToString(cell));
  const nameColumnIndex = headers.findIndex((header) => PRODUCT_NAME_HEADERS.has(header));
  let sheetCount = 0;

  for (let index = headerRowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];

    if (!Array.isArray(row)) {
      continue;
    }

    const name = cellToString(row[nameColumnIndex] ?? '');

    if (!name) {
      continue;
    }

    names.add(name);
    sheetCount += 1;
  }

  console.log(`${sheetName}: ${sheetCount} product rows`);
}

const list = Array.from(names).sort((a, b) => a.localeCompare(b, 'fa'));
const outPath = path.join('prisma', 'excel-unique-product-names.json');
fs.writeFileSync(outPath, JSON.stringify(list, null, 2), 'utf8');
console.log(`unique names: ${list.length}`);
console.log(`wrote: ${outPath}`);
