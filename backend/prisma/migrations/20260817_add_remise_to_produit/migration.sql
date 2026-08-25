-- AlterTable: Add remise column to produits
ALTER TABLE "produits" ADD COLUMN IF NOT EXISTS "remise" DECIMAL(5,2) NOT NULL DEFAULT 0;
