ALTER TABLE "factures" ADD COLUMN "numeroAvoir" TEXT;

CREATE UNIQUE INDEX "factures_numeroAvoir_key" ON "factures"("numeroAvoir");
