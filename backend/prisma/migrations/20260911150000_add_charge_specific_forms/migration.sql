CREATE TABLE "charges_generales" (
  "id" SERIAL NOT NULL,
  "factureFournisseurId" INTEGER NOT NULL,
  "numeroCharge" TEXT NOT NULL,
  "nature" TEXT NOT NULL,
  "description" TEXT,
  "periodeConcernee" TEXT,
  "beneficiaire" TEXT NOT NULL,
  "modePaiement" TEXT,
  "datePaiement" TIMESTAMP(3),
  "referenceFacture" TEXT,
  "pieceJustificativeUrl" TEXT,
  "notes" TEXT,
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "misAJourLe" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "charges_generales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "charges_cnss" (
  "id" SERIAL NOT NULL,
  "factureFournisseurId" INTEGER NOT NULL,
  "numeroDeclaration" TEXT NOT NULL,
  "periodeDeclaration" TEXT NOT NULL,
  "matriculeEmployeur" TEXT NOT NULL,
  "nombreSalaries" INTEGER NOT NULL,
  "masseSalariale" DECIMAL(12,3) NOT NULL,
  "partPatronale" DECIMAL(12,3) NOT NULL,
  "partSalariale" DECIMAL(12,3) NOT NULL,
  "dateLimitePaiement" TIMESTAMP(3),
  "datePaiement" TIMESTAMP(3),
  "modePaiement" TEXT,
  "referencePaiement" TEXT,
  "pieceJustificativeUrl" TEXT,
  "notes" TEXT,
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "misAJourLe" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "charges_cnss_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "charges_9ba4a" (
  "id" SERIAL NOT NULL,
  "factureFournisseurId" INTEGER NOT NULL,
  "numero" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "beneficiaire" TEXT NOT NULL,
  "modePaiement" TEXT,
  "pieceJustificativeUrl" TEXT,
  "notes" TEXT,
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "misAJourLe" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "charges_9ba4a_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "charges_generales_factureFournisseurId_key" ON "charges_generales"("factureFournisseurId");
CREATE UNIQUE INDEX "charges_cnss_factureFournisseurId_key" ON "charges_cnss"("factureFournisseurId");
CREATE UNIQUE INDEX "charges_9ba4a_factureFournisseurId_key" ON "charges_9ba4a"("factureFournisseurId");

ALTER TABLE "charges_generales" ADD CONSTRAINT "charges_generales_factureFournisseurId_fkey" FOREIGN KEY ("factureFournisseurId") REFERENCES "factures_fournisseurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "charges_cnss" ADD CONSTRAINT "charges_cnss_factureFournisseurId_fkey" FOREIGN KEY ("factureFournisseurId") REFERENCES "factures_fournisseurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "charges_9ba4a" ADD CONSTRAINT "charges_9ba4a_factureFournisseurId_fkey" FOREIGN KEY ("factureFournisseurId") REFERENCES "factures_fournisseurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
