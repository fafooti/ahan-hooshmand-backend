-- AlterTable
ALTER TABLE "PriceHistory" RENAME CONSTRAINT "new_PriceHistory_pkey" TO "PriceHistory_pkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "buyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "factoryPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "unit" SET DEFAULT 'کیلو';
