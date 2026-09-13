CREATE TYPE "DocumentSequenceType" AS ENUM (
  'FACTURE_VENTE',
  'FACTURE_ACHAT',
  'COMMANDE',
  'DEVIS',
  'BON_LIVRAISON',
  'BON_RECEPTION',
  'AVOIR_VENTE',
  'AVOIR_ACHAT'
);

CREATE TABLE "document_sequences" (
  "id" SERIAL NOT NULL,
  "exerciseId" INTEGER NOT NULL,
  "documentType" "DocumentSequenceType" NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_sequences_exerciseId_documentType_key"
  ON "document_sequences"("exerciseId", "documentType");

ALTER TABLE "document_sequences"
  ADD CONSTRAINT "document_sequences_exerciseId_fkey"
  FOREIGN KEY ("exerciseId") REFERENCES "exercices"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- At most one fiscal exercise can be active at a time.
CREATE UNIQUE INDEX "exercices_single_active_key"
  ON "exercices"("isActif") WHERE "isActif";
