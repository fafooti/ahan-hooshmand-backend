export type StockImportStockValue = number | null;

export interface StockImportMatchedRow {
  row: number;
  name: string;
  productId: number;
  productName: string;
  stock: StockImportStockValue;
  currentStock: number;
}

export interface StockImportUnmatchedRow {
  row: number;
  name: string;
  stock: StockImportStockValue;
}

export interface StockImportResult {
  success: true;
  matched: number;
  unmatched: number;
  matchedRows: StockImportMatchedRow[];
  unmatchedRows: StockImportUnmatchedRow[];
}

export interface StockImportParsedRow {
  row: number;
  name: string;
  stock: StockImportStockValue;
}

export interface StockImportApplyUpdateItem {
  productId: number;
  stock: number;
}

export interface StockImportApplyCreateItem {
  name: string;
  stock: number;
}

export interface StockImportApplyInput {
  updates: StockImportApplyUpdateItem[];
  creates: StockImportApplyCreateItem[];
}

export interface StockImportApplyResult {
  success: true;
  updated: number;
  created: number;
}
