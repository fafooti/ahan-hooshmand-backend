import { prisma } from '../prisma/client';



const activeProductSelect = {

  id: true,

  name: true,

  price: true,

  unit: true,

  stock: true,

  priceUpdatedAt: true,

} as const;



export const boardRepository = {

  async findBoardData() {

    const categories = await prisma.category.findMany({

      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],

      select: {

        id: true,

        name: true,

        sortOrder: true,

        products: {

          where: { isActive: true },

          select: activeProductSelect,

          orderBy: { id: 'asc' },

        },

      },

    });



    const productIds = categories.flatMap((c) => c.products.map((p) => p.id));



    const latestChanges = await prisma.priceHistory.findMany({

      where: { productId: { in: productIds } },

      orderBy: { createdAt: 'desc' },

      distinct: ['productId'],

      select: {

        productId: true,

        oldPrice: true,

        newPrice: true,

        createdAt: true,

      },

    });



    const changeMap = new Map(latestChanges.map((c) => [c.productId, c]));



    return categories.map((category) => ({

      ...category,

      products: category.products.map((product) => {

        const change = changeMap.get(product.id);

        return {

          ...product,

          priceDirection:

            change && change.oldPrice !== null

              ? change.newPrice > change.oldPrice

                ? ('up' as const)

                : change.newPrice < change.oldPrice

                  ? ('down' as const)

                  : ('same' as const)

              : ('same' as const),

          previousPrice: change?.oldPrice ?? null,

        };

      }),

    }));

  },

};


