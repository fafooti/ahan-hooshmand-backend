import { Category, PrismaClient, Product } from '@prisma/client';

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();



const UNIT = 'کیلو';



const seedData: {
  category: string;
  products: { name: string; buyPrice: number; factoryPrice: number; price: number; stock?: number }[];
}[] = [

  {

    category: 'قوطی',

    products: [

      { name: 'قوطی 2×2', buyPrice: 60000, factoryPrice: 60000, price: 60000, stock: 500 },

      { name: 'قوطی 3×3', buyPrice: 70000, factoryPrice: 70000, price: 70000, stock: 400 },

      { name: 'قوطی 4×4', buyPrice: 90000, factoryPrice: 90000, price: 90000, stock: 300 },

    ],

  },

  {

    category: 'نبشی',

    products: [

      { name: 'نبشی 3', buyPrice: 85000, factoryPrice: 85000, price: 85000, stock: 600 },

      { name: 'نبشی 5', buyPrice: 120000, factoryPrice: 120000, price: 120000, stock: 350 },

    ],

  },

  {

    category: 'ناودانی',

    products: [

      { name: 'ناودانی 6', buyPrice: 80000, factoryPrice: 80000, price: 80000, stock: 450 },

      { name: 'ناودانی 8', buyPrice: 95000, factoryPrice: 95000, price: 95000, stock: 280 },

    ],

  },

  {

    category: 'میلگرد',

    products: [

      { name: 'میلگرد 12', buyPrice: 98000, factoryPrice: 98000, price: 98000, stock: 800 },

      { name: 'میلگرد 14', buyPrice: 110000, factoryPrice: 110000, price: 110000, stock: 700 },

      { name: 'میلگرد 16', buyPrice: 125000, factoryPrice: 125000, price: 125000, stock: 550 },

    ],

  },

  {

    category: 'تیرآهن',

    products: [

      { name: 'تیرآهن 14', buyPrice: 135000, factoryPrice: 135000, price: 135000, stock: 200 },

      { name: 'تیرآهن 16', buyPrice: 150000, factoryPrice: 150000, price: 150000, stock: 180 },

    ],

  },

  {

    category: 'ورق',

    products: [

      { name: 'ورق سیاه 2 میل', buyPrice: 145000, factoryPrice: 145000, price: 145000, stock: 150 },

      { name: 'ورق سیاه 3 میل', buyPrice: 160000, factoryPrice: 160000, price: 160000, stock: 120 },

    ],

  },

  {

    category: 'لوله',

    products: [

      { name: 'لوله 2 اینچ', buyPrice: 140000, factoryPrice: 140000, price: 140000, stock: 220 },

      { name: 'لوله 3 اینچ', buyPrice: 165000, factoryPrice: 165000, price: 165000, stock: 190 },

    ],

  },

  {

    category: 'سپری',

    products: [

      { name: 'سپری 3', buyPrice: 80000, factoryPrice: 80000, price: 80000, stock: 320 },

      { name: 'سپری 4', buyPrice: 90000, factoryPrice: 90000, price: 90000, stock: 290 },

    ],

  },

];



async function upsertCategory(name: string, sortOrder: number): Promise<{ record: Category; created: boolean }> {

  const existing = await prisma.category.findFirst({ where: { name } });



  if (existing) {

    const record = await prisma.category.update({

      where: { id: existing.id },

      data: { name, sortOrder },

    });

    return { record, created: false };

  }



  const record = await prisma.category.create({ data: { name, sortOrder } });

  return { record, created: true };

}



async function upsertProduct(

  categoryId: number,

  name: string,

  buyPrice: number,

  factoryPrice: number,

  price: number,

  stock: number,

): Promise<{ record: Product; created: boolean }> {

  const existing = await prisma.product.findFirst({

    where: { categoryId, name },

  });



  const data = {

    name,

    buyPrice,

    factoryPrice,

    price,

    stock,

    unit: UNIT,

    isActive: true,

    priceUpdatedAt: new Date(),

    categoryId,

  };



  if (existing) {

    const record = await prisma.product.update({

      where: { id: existing.id },

      data,

    });

    return { record, created: false };

  }



  const record = await prisma.product.create({ data });

  return { record, created: true };

}



async function main() {
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!seedAdminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD environment variable is required to run seed');
  }

  const password = await bcrypt.hash(seedAdminPassword, 10);



  await prisma.user.upsert({

    where: { username: 'admin' },

    update: {},

    create: {

      username: 'admin',

      password,

      name: 'Administrator',

    },

  });



  let categoriesInserted = 0;

  let categoriesUpdated = 0;

  let productsInserted = 0;

  let productsUpdated = 0;



  for (let i = 0; i < seedData.length; i++) {

    const group = seedData[i];

    const { record: category, created: categoryCreated } = await upsertCategory(

      group.category,

      i,

    );



    if (categoryCreated) {

      categoriesInserted += 1;

    } else {

      categoriesUpdated += 1;

    }



    for (const item of group.products) {

      const { created: productCreated } = await upsertProduct(

        category.id,

        item.name,

        item.buyPrice,

        item.factoryPrice,

        item.price,

        item.stock ?? 0,

      );



      if (productCreated) {

        productsInserted += 1;

      } else {

        productsUpdated += 1;

      }

    }

  }



  console.log(`Categories inserted: ${categoriesInserted}`);

  console.log(`Categories updated: ${categoriesUpdated}`);

  console.log(`Products inserted: ${productsInserted}`);

  console.log(`Products updated: ${productsUpdated}`);

}



main()

  .catch((error) => {

    console.error(error);

    process.exit(1);

  })

  .finally(async () => {

    await prisma.$disconnect();

  });


