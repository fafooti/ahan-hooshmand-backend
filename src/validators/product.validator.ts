import { AppError } from '../utils/AppError';

import { ProductSortOption } from '../repositories/product.repository';



export interface CreateProductInput {

  name: string;

  price: number;

  stock?: number;

  description?: string;

  unit: string;

  categoryId: number;

  isActive?: boolean;

}



export interface UpdateProductInput {

  name?: string;

  price?: number;

  stock?: number;

  description?: string | null;

  unit?: string;

  categoryId?: number;

  isActive?: boolean;

}



export interface BulkPriceUpdateItem {

  id: number;

  price: number;

}



export interface BulkPriceUpdateInput {

  updates: BulkPriceUpdateItem[];

}



export interface ProductListQuery {

  search?: string;

  categoryId?: number;

  minPrice?: number;

  maxPrice?: number;

  sort?: ProductSortOption;

}



function parsePositiveInteger(value: unknown, fieldName: string): number {

  const parsed = typeof value === 'string' ? Number(value) : value;



  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed <= 0) {

    throw new AppError(400, `${fieldName} must be a positive integer`);

  }



  return parsed;

}



function parseNonNegativeInteger(value: unknown, fieldName: string): number {

  const parsed = typeof value === 'string' ? Number(value) : value;



  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 0) {

    throw new AppError(400, `${fieldName} must be a non-negative integer`);

  }



  return parsed;

}



function parsePrice(value: unknown): number {

  const parsed = typeof value === 'string' ? Number(value) : value;



  if (typeof parsed !== 'number' || Number.isNaN(parsed) || parsed < 0) {

    throw new AppError(400, 'Price must be a non-negative number');

  }



  return parsed;

}



function parseNonEmptyString(value: unknown, fieldName: string): string {

  if (typeof value !== 'string' || value.trim().length === 0) {

    throw new AppError(400, `${fieldName} is required`);

  }



  return value.trim();

}



function parseOptionalString(value: unknown): string | undefined {

  if (value === undefined) return undefined;

  if (typeof value !== 'string') {

    throw new AppError(400, 'Description must be a string');

  }

  return value.trim();

}



function parseOptionalBoolean(value: unknown, fieldName: string): boolean | undefined {

  if (value === undefined) {

    return undefined;

  }



  if (typeof value !== 'boolean') {

    throw new AppError(400, `${fieldName} must be a boolean`);

  }



  return value;

}



const SORT_OPTIONS: ProductSortOption[] = [

  'newest',

  'price_asc',

  'price_desc',

  'most_changed',

];



export function parseProductId(param: string | string[]): number {

  const value = Array.isArray(param) ? param[0] : param;

  return parsePositiveInteger(value, 'Product id');

}



export function parseProductListQuery(query: Record<string, unknown>): ProductListQuery {

  const result: ProductListQuery = {};



  if (query.search && typeof query.search === 'string' && query.search.trim()) {

    result.search = query.search.trim();

  }



  if (query.categoryId) {

    result.categoryId = parsePositiveInteger(query.categoryId, 'Category id');

  }



  if (query.minPrice !== undefined) {

    result.minPrice = parsePrice(query.minPrice);

  }



  if (query.maxPrice !== undefined) {

    result.maxPrice = parsePrice(query.maxPrice);

  }



  if (query.sort && typeof query.sort === 'string') {

    if (!SORT_OPTIONS.includes(query.sort as ProductSortOption)) {

      throw new AppError(400, `Invalid sort option: ${query.sort}`);

    }

    result.sort = query.sort as ProductSortOption;

  }



  return result;

}



export function validateCreateProductInput(body: unknown): CreateProductInput {

  if (!body || typeof body !== 'object') {

    throw new AppError(400, 'Invalid request body');

  }



  const input = body as Record<string, unknown>;



  return {

    name: parseNonEmptyString(input.name, 'Name'),

    price: parsePrice(input.price),

    stock: input.stock !== undefined ? parseNonNegativeInteger(input.stock, 'Stock') : undefined,

    description: parseOptionalString(input.description),

    unit: parseNonEmptyString(input.unit, 'Unit'),

    categoryId: parsePositiveInteger(input.categoryId, 'Category id'),

    isActive: parseOptionalBoolean(input.isActive, 'isActive'),

  };

}



export function validateUpdateProductInput(body: unknown): UpdateProductInput {

  if (!body || typeof body !== 'object') {

    throw new AppError(400, 'Invalid request body');

  }



  const input = body as Record<string, unknown>;

  const update: UpdateProductInput = {};



  if ('name' in input) {

    update.name = parseNonEmptyString(input.name, 'Name');

  }



  if ('price' in input) {

    update.price = parsePrice(input.price);

  }



  if ('stock' in input) {

    update.stock = parseNonNegativeInteger(input.stock, 'Stock');

  }



  if ('description' in input) {

    update.description =

      input.description === null ? null : parseOptionalString(input.description) ?? '';

  }



  if ('unit' in input) {

    update.unit = parseNonEmptyString(input.unit, 'Unit');

  }



  if ('categoryId' in input) {

    update.categoryId = parsePositiveInteger(input.categoryId, 'Category id');

  }



  if ('isActive' in input) {

    update.isActive = parseOptionalBoolean(input.isActive, 'isActive');

  }



  if (Object.keys(update).length === 0) {

    throw new AppError(400, 'At least one field is required to update');

  }



  return update;

}



export function validateBulkPriceUpdateInput(body: unknown): BulkPriceUpdateInput {

  if (!body || typeof body !== 'object') {

    throw new AppError(400, 'Invalid request body');

  }



  const input = body as Record<string, unknown>;



  if (!Array.isArray(input.updates) || input.updates.length === 0) {

    throw new AppError(400, 'Updates array is required and must not be empty');

  }



  const seenIds = new Set<number>();

  const updates: BulkPriceUpdateItem[] = input.updates.map((item, index) => {

    if (!item || typeof item !== 'object') {

      throw new AppError(400, `Update at index ${index} is invalid`);

    }



    const update = item as Record<string, unknown>;

    const id = parsePositiveInteger(update.id, 'Product id');

    const price = parsePrice(update.price);



    if (seenIds.has(id)) {

      throw new AppError(400, `Duplicate product id: ${id}`);

    }



    seenIds.add(id);



    return { id, price };

  });



  return { updates };

}


