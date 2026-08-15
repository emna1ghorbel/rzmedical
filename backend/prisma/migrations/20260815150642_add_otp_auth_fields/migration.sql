-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "dernierLogin" TIMESTAMP(3),
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpire" TIMESTAMP(3);
