import { Prisma } from '@prisma/client';

import { prisma } from '../prisma/client';



const productInclude = {

  category: true,

} satisfies Prisma.ProductInclude;



export type ProductSortOption =

  | 'newest'

  | 'price_asc'

  | 'price_desc'

  | 'most_changed';



export type ProductListFilters = {

  search?: string;

  categoryId?: number;

  minPrice?: number;

  maxPrice?: number;

  sort?: ProductSortOption;

};



function buildOrderBy(

  sort?: ProductSortOption,

): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {

  switch (sort) {

    case 'price_asc':

      return { price: 'asc' };

    case 'price_desc':

      return { price: 'desc' };

    case 'newest':

      return { createdAt: 'desc' };

  }

  return { id: 'asc' };

}



function buildWhere(filters: ProductListFilters): Prisma.ProductWhereInput {

  return {

    ...(filters.search && {

      name: { contains: filters.search },

    }),

    ...(filters.categoryId && { categoryId: filters.categoryId }),

    ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {

      price: {

        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),

        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),

      },

    }),

  };

}



export const productRepository = {

  async findMany(filters: ProductListFilters = {}) {

    if (filters.sort === 'most_changed') {

      const grouped = await prisma.priceHistory.groupBy({

        by: ['productId'],

        _count: { productId: true },

        orderBy: { _count: { productId: 'desc' } },

      });



      const productIds = grouped.map((g) => g.productId);

      if (productIds.length === 0) {

        return prisma.product.findMany({

          where: buildWhere(filters),

          include: productInclude,

          orderBy: { id: 'asc' },

        });

      }



      const products = await prisma.product.findMany({

        where: {

          ...buildWhere(filters),

          id: { in: productIds },

        },

        include: productInclude,

      });



      const productMap = new Map(products.map((p) => [p.id, p]));

      return productIds

        .map((id) => productMap.get(id))

        .filter((p): p is NonNullable<typeof p> => p !== undefined);

    }



    return prisma.product.findMany({

      where: buildWhere(filters),

      include: productInclude,

      orderBy: buildOrderBy(filters.sort),

    });

  },



  findById(id: number) {

    return prisma.product.findUnique({

      where: { id },

      include: productInclude,

    });

  },



  create(data: Prisma.ProductCreateInput) {

    return prisma.product.create({

      data,

      include: productInclude,

    });

  },



  update(id: number, data: Prisma.ProductUpdateInput) {

    return prisma.product.update({

      where: { id },

      data,

      include: productInclude,

    });

  },



  delete(id: number) {

    return prisma.product.delete({

      where: { id },

    });

  },



  categoryExists(categoryId: number) {

    return prisma.category.findUnique({

      where: { id: categoryId },

      select: { id: true },

    });

  },



  findByIds(ids: number[]) {

    return prisma.product.findMany({

      where: { id: { in: ids } },

      include: productInclude,

    });

  },



  findPriceHistoryByProductId(productId: number) {

    return prisma.priceHistory.findMany({

      where: { productId },

      orderBy: { createdAt: 'desc' },

      include: {

        user: { select: { id: true, username: true, name: true } },

      },

    });

  },

};


