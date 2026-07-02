import { categoryRepository } from '../repositories/category.repository';

import { AppError } from '../utils/AppError';

import {

  CreateCategoryInput,

  ReorderCategoriesInput,

  UpdateCategoryInput,

} from '../validators/category.validator';

import { auditService } from './audit.service';

import { emitBoardUpdated, emitRealtime } from '../socket';



export const categoryService = {

  async list() {

    return categoryRepository.findMany();

  },



  async getById(id: number) {

    const category = await categoryRepository.findById(id);



    if (!category) {

      throw new AppError(404, 'Category not found');

    }



    return category;

  },



  async create(input: CreateCategoryInput, userId?: number) {

    const maxOrder = await categoryRepository.getMaxSortOrder();

    const category = await categoryRepository.create({

      name: input.name,

      sortOrder: input.sortOrder ?? maxOrder + 1,

    });



    await auditService.log({

      action: 'CATEGORY_CREATED',

      entityType: 'category',

      entityId: category.id,

      userId,

      newValues: { name: category.name, sortOrder: category.sortOrder },

    });



    emitRealtime('category:created', category);

    emitBoardUpdated();



    return category;

  },



  async update(id: number, input: UpdateCategoryInput, userId?: number) {

    const existing = await categoryRepository.findById(id);



    if (!existing) {

      throw new AppError(404, 'Category not found');

    }



    const category = await categoryRepository.update(id, {

      ...(input.name !== undefined && { name: input.name }),

      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),

    });



    await auditService.log({

      action: 'CATEGORY_UPDATED',

      entityType: 'category',

      entityId: id,

      userId,

      oldValues: { name: existing.name, sortOrder: existing.sortOrder },

      newValues: { name: category.name, sortOrder: category.sortOrder },

    });



    emitRealtime('category:updated', category);

    emitBoardUpdated();



    return category;

  },



  async remove(id: number, userId?: number) {

    const existing = await categoryRepository.findByIdWithProductCount(id);



    if (!existing) {

      throw new AppError(404, 'Category not found');

    }



    if (existing._count.products > 0) {

      throw new AppError(409, 'Cannot delete category with products');

    }



    await categoryRepository.delete(id);



    await auditService.log({

      action: 'CATEGORY_DELETED',

      entityType: 'category',

      entityId: id,

      userId,

      oldValues: { name: existing.name, sortOrder: existing.sortOrder },

    });



    emitRealtime('category:deleted', { id });

    emitBoardUpdated();

  },



  async reorder(input: ReorderCategoriesInput, userId?: number) {

    await categoryRepository.reorder(input.orders);



    await auditService.log({

      action: 'CATEGORIES_REORDERED',

      entityType: 'category',

      userId,

      newValues: { orders: input.orders },

    });



    emitRealtime('categories:reordered', input.orders);

    emitBoardUpdated();



    return categoryRepository.findMany();

  },

};


