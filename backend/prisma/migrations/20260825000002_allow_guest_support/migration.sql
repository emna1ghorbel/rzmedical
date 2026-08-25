ALTER TABLE "tickets_support" ALTER COLUMN "utilisateurId" DROP NOT NULL;
ALTER TABLE "tickets_support" ADD COLUMN "nomContact" TEXT;
ALTER TABLE "tickets_support" ADD COLUMN "emailContact" TEXT;
ALTER TABLE "tickets_support" ADD COLUMN "telephoneContact" TEXT;
