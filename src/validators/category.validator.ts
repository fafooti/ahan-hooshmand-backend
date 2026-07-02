import { AppError } from '../utils/AppError';



export interface CreateCategoryInput {

  name: string;

  sortOrder?: number;

}



export interface UpdateCategoryInput {

  name?: string;

  sortOrder?: number;

}



export interface ReorderCategoriesInput {

  orders: { id: number; sortOrder: number }[];

}



function parseNonEmptyString(value: unknown, fieldName: string): string {

  if (typeof value !== 'string' || value.trim().length === 0) {

    throw new AppError(400, `${fieldName} is required`);

  }



  return value.trim();

}



function parseNonNegativeInteger(value: unknown, fieldName: string): number {

  const parsed = typeof value === 'string' ? Number(value) : value;



  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 0) {

    throw new AppError(400, `${fieldName} must be a non-negative integer`);

  }



  return parsed;

}



export function parseCategoryId(param: string | string[]): number {

  const value = Array.isArray(param) ? param[0] : param;

  const id = Number(value);



  if (!Number.isInteger(id) || id <= 0) {

    throw new AppError(400, 'Invalid category id');

  }



  return id;

}



export function validateCreateCategoryInput(body: unknown): CreateCategoryInput {

  if (!body || typeof body !== 'object') {

    throw new AppError(400, 'Invalid request body');

  }



  const input = body as Record<string, unknown>;



  return {

    name: parseNonEmptyString(input.name, 'Name'),

    sortOrder:

      input.sortOrder !== undefined

        ? parseNonNegativeInteger(input.sortOrder, 'Sort order')

        : undefined,

  };

}



export function validateUpdateCategoryInput(body: unknown): UpdateCategoryInput {

  if (!body || typeof body !== 'object') {

    throw new AppError(400, 'Invalid request body');

  }



  const input = body as Record<string, unknown>;

  const update: UpdateCategoryInput = {};



  if ('name' in input) {

    update.name = parseNonEmptyString(input.name, 'Name');

  }



  if ('sortOrder' in input) {

    update.sortOrder = parseNonNegativeInteger(input.sortOrder, 'Sort order');

  }



  if (Object.keys(update).length === 0) {

    throw new AppError(400, 'At least one field is required to update');

  }



  return update;

}



export function validateReorderCategoriesInput(body: unknown): ReorderCategoriesInput {

  if (!body || typeof body !== 'object') {

    throw new AppError(400, 'Invalid request body');

  }



  const input = body as Record<string, unknown>;



  if (!Array.isArray(input.orders) || input.orders.length === 0) {

    throw new AppError(400, 'Orders array is required');

  }



  const orders = input.orders.map((item, index) => {

    if (!item || typeof item !== 'object') {

      throw new AppError(400, `Order at index ${index} is invalid`);

    }



    const order = item as Record<string, unknown>;

    return {

      id: parseNonNegativeInteger(order.id, 'Category id'),

      sortOrder: parseNonNegativeInteger(order.sortOrder, 'Sort order'),

    };

  });



  return { orders };

}


