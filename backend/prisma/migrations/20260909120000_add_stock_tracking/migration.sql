CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'SALE', 'RETURN_CLIENT', 'RETURN_SUPPLIER', 'ADJUSTMENT', 'TRANSFER', 'INVENTORY');

ALTER TABLE "produits"
  ADD COLUMN "qteAchat" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "qteVente" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "disponibleALaVente" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "bons_livraison"
  ADD COLUMN "stockMisAJour" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "factures_fournisseurs"
  ADD COLUMN "stockMisAJour" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "stock_movements" (
  "id" SERIAL NOT NULL,
  "type" "StockMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "reference" TEXT,
  "sourceType" TEXT,
  "sourceId" INTEGER,
  "userId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");
CREATE INDEX "stock_movements_sourceType_sourceId_idx" ON "stock_movements"("sourceType", "sourceId");

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
