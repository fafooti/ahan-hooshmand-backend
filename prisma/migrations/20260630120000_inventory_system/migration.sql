-- Category: add sortOrder
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- Product: add stock, description
ALTER TABLE "Product" ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "description" TEXT;
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- PriceHistory: migrate to new schema
CREATE TABLE "new_PriceHistory" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "oldPrice" DOUBLE PRECISION,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "new_PriceHistory_pkey" PRIMARY KEY ("id")
);

INSERT INTO "new_PriceHistory" ("id", "productId", "oldPrice", "newPrice", "userId", "createdAt")
SELECT "id", "productId", NULL, "price", NULL, "createdAt" FROM "PriceHistory";

DROP TABLE "PriceHistory";
ALTER TABLE "new_PriceHistory" RENAME TO "PriceHistory";

SELECT setval(
    pg_get_serial_sequence('"PriceHistory"', 'id'),
    COALESCE((SELECT MAX("id") FROM "PriceHistory"), 1)
);

CREATE INDEX "PriceHistory_productId_idx" ON "PriceHistory"("productId");
CREATE INDEX "PriceHistory_createdAt_idx" ON "PriceHistory"("createdAt");
CREATE INDEX "PriceHistory_userId_idx" ON "PriceHistory"("userId");

ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AuditLog
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "userId" INTEGER,
    "oldValues" TEXT,
    "newValues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
