/*
  Warnings:

  - You are about to drop the column `image` on the `produits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "produits" DROP COLUMN "image",
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "motsCles" TEXT[],
ADD COLUMN     "video" TEXT;
