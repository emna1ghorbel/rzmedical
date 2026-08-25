-- AlterTable: Add visible column to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true;
