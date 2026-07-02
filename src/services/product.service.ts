import { productRepository, ProductListFilters } from '../repositories/product.repository';
import { prisma } from '../prisma/client';
import { AppError } from '../utils/AppError';
import { auditService } from './audit.service';
import {
  BulkPriceUpdateInput,
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput,
} from '../validators/product.validator';
import { emitBoardUpdated, emitRealtime } from '../socket';

async function ensureCategoryExists(categoryId: number): Promise<void> {
  const category = await productRepository.categoryExists(categoryId);
  if (!category) {
    throw new AppError(404, 'Category not found');
  }
}

function pickProductSnapshot(product: {
  name: string;
  price: number;
  stock: number;
  description: string | null;
  unit: string;
  isActive: boolean;
  categoryId: number;
}) {
  return {
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description,
    unit: product.unit,
    isActive: product.isActive,
    categoryId: product.categoryId,
  };
}

export const productService = {
  async list(query: ProductListQuery = {}) {
    const filters: ProductListFilters = {
      search: query.search,
      categoryId: query.categoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
    };
    return productRepository.findMany(filters);
  },

  async getById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return product;
  },

  async create(input: CreateProductInput, userId?: number) {
    await ensureCategoryExists(input.categoryId);

    const product = await productRepository.create({
      name: input.name,
      price: input.price,
      stock: input.stock ?? 0,
      description: input.description ?? null,
      unit: input.unit,
      isActive: input.isActive ?? true,
      priceUpdatedAt: new Date(),
      category: { connect: { id: input.categoryId } },
    });

    await auditService.log({
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: product.id,
      userId,
      newValues: pickProductSnapshot(product),
    });

    emitRealtime('product:created', product);
    emitBoardUpdated();
    return product;
  },

  async update(id: number, input: UpdateProductInput, userId?: number) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError(404, 'Product not found');
    }

    if (input.categoryId !== undefined) {
      await ensureCategoryExists(input.categoryId);
    }

    const priceChanged =
      input.price !== undefined && input.price !== existing.price;

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.price !== undefined && { price: input.price }),
          ...(input.stock !== undefined && { stock: input.stock }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.unit !== undefined && { unit: input.unit }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.categoryId !== undefined && {
            category: { connect: { id: input.categoryId } },
          }),
          ...(priceChanged && { priceUpdatedAt: new Date() }),
        },
        include: { category: true },
      });

      if (priceChanged) {
        await tx.priceHistory.create({
          data: {
            productId: id,
            oldPrice: existing.price,
            newPrice: input.price!,
            userId: userId ?? null,
          },
        });
      }

      return updated;
    });

    if (priceChanged) {
      await auditService.log({
        action: 'PRICE_CHANGED',
        entityType: 'price',
        entityId: id,
        userId,
        oldValues: { price: existing.price },
        newValues: { price: input.price },
      });
    }

    await auditService.log({
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: id,
      userId,
      oldValues: pickProductSnapshot(existing),
      newValues: pickProductSnapshot(product),
    });

    emitRealtime('product:updated', product);
    emitBoardUpdated();
    return product;
  },

  async remove(id: number, userId?: number) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError(404, 'Product not found');
    }

    await productRepository.delete(id);

    await auditService.log({
      action: 'PRODUCT_DELETED',
      entityType: 'product',
      entityId: id,
      userId,
      oldValues: pickProductSnapshot(existing),
    });

    emitRealtime('product:deleted', { id });
    emitBoardUpdated();
  },

  async getPriceHistory(productId: number) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError(404, 'Product not found');
    }
    return productRepository.findPriceHistoryByProductId(productId);
  },

  async bulkUpdate(input: BulkPriceUpdateInput, userId?: number) {
    const ids = input.updates.map((update) => update.id);
    const products = await productRepository.findByIds(ids);

    if (products.length !== ids.length) {
      throw new AppError(404, 'One or more products not found');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const now = new Date();

    const updatedProducts = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const update of input.updates) {
        const existing = productMap.get(update.id)!;
        const priceChanged = update.price !== existing.price;

        const product = await tx.product.update({
          where: { id: update.id },
          data: {
            price: update.price,
            ...(priceChanged && { priceUpdatedAt: now }),
          },
          include: { category: true },
        });

        if (priceChanged) {
          await tx.priceHistory.create({
            data: {
              productId: update.id,
              oldPrice: existing.price,
              newPrice: update.price,
              userId: userId ?? null,
            },
          });
        }

        results.push(product);
      }

      return results;
    });

    await auditService.log({
      action: 'PRODUCTS_BULK_UPDATED',
      entityType: 'price',
      userId,
      newValues: { updates: input.updates },
    });

    emitRealtime('products:bulk-updated', updatedProducts);
    emitBoardUpdated();
    return updatedProducts;
  },
};
