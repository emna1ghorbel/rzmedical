ALTER TABLE "stock_movements"
  ADD COLUMN IF NOT EXISTS "quantityCosted" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "quantityPending" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "totalCost" DECIMAL(14,3),
  ADD COLUMN IF NOT EXISTS "totalValue" DECIMAL(14,3),
  ADD COLUMN IF NOT EXISTS "operationKey" TEXT;

UPDATE "stock_movements"
SET "operationKey" = COALESCE("sourceType", "type"::text) || ':' || COALESCE("sourceId"::text, 'legacy') || ':' || "productId" || ':' || "id"
WHERE "operationKey" IS NULL;

ALTER TABLE "stock_movements"
  ALTER COLUMN "operationKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "stock_movements_operationKey_key"
  ON "stock_movements"("operationKey");

CREATE TABLE IF NOT EXISTS "purchase_price_history" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPriceHT" DECIMAL(12,3) NOT NULL,
  "sourceType" TEXT,
  "sourceId" INTEGER,
  "bonReceptionId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_price_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "purchase_price_history_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "purchase_price_history_productId_createdAt_idx"
  ON "purchase_price_history"("productId", "createdAt");
