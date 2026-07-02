import { Prisma } from '@prisma/client';

import { prisma } from '../prisma/client';



export const categoryRepository = {

  findMany() {

    return prisma.category.findMany({

      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],

      include: {

        _count: { select: { products: true } },

      },

    });

  },



  findById(id: number) {

    return prisma.category.findUnique({

      where: { id },

    });

  },



  findByIdWithProductCount(id: number) {

    return prisma.category.findUnique({

      where: { id },

      include: {

        _count: {

          select: { products: true },

        },

      },

    });

  },



  getMaxSortOrder() {

    return prisma.category

      .aggregate({ _max: { sortOrder: true } })

      .then((result) => result._max.sortOrder ?? 0);

  },



  create(data: Prisma.CategoryCreateInput) {

    return prisma.category.create({ data });

  },



  update(id: number, data: Prisma.CategoryUpdateInput) {

    return prisma.category.update({

      where: { id },

      data,

    });

  },



  delete(id: number) {

    return prisma.category.delete({

      where: { id },

    });

  },



  async reorder(orders: { id: number; sortOrder: number }[]) {

    await prisma.$transaction(

      orders.map((item) =>

        prisma.category.update({

          where: { id: item.id },

          data: { sortOrder: item.sortOrder },

        }),

      ),

    );

  },

};


