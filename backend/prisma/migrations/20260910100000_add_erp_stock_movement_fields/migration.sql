ALTER TABLE "produits"
  ADD COLUMN IF NOT EXISTS "cump" DECIMAL(12,3);

ALTER TABLE "stock_movements"
  ADD COLUMN IF NOT EXISTS "stockDelta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "cump" DECIMAL(12,3),
  ADD COLUMN IF NOT EXISTS "stockAfter" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "valuation" DECIMAL(14,3),
  ADD COLUMN IF NOT EXISTS "depot" TEXT NOT NULL DEFAULT 'DEPOT PRINCIPAL',
  ADD COLUMN IF NOT EXISTS "documentType" TEXT,
  ADD COLUMN IF NOT EXISTS "nature" TEXT;

UPDATE "stock_movements"
SET "stockDelta" = CASE WHEN "type" = 'PURCHASE' THEN "quantity" ELSE -"quantity" END,
    "nature" = CASE WHEN "type" = 'PURCHASE' THEN 'ENTREE' WHEN "type" = 'SALE' THEN 'SORTIE' ELSE 'AJUSTEMENT' END,
    "documentType" = "sourceType"
WHERE "stockDelta" = 0;

CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");
CREATE INDEX IF NOT EXISTS "stock_movements_type_idx" ON "stock_movements"("type");
