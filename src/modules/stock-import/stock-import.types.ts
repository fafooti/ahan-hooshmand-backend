export type StockImportStockValue = number | null;

export interface StockImportResult {
  success: true;
  matched: number;
  unmatched: number;
  unmatchedRows: StockImportUnmatchedRow[];
}

export interface StockImportParsedRow {
  row: number;
  name: string;
  stock: StockImportStockValue;
}

export interface StockImportUnmatchedRow {
  row: number;
  name: string;
  stock: StockImportStockValue;
}
