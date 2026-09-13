-- A number is nullable so existing historical orders remain valid.
ALTER TABLE "commandes" ADD COLUMN "numero" TEXT;

CREATE UNIQUE INDEX "commandes_numero_key" ON "commandes"("numero");
