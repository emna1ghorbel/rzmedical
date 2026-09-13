CREATE TYPE "StatutBonReception" AS ENUM ('BROUILLON', 'CONTROLE', 'VALIDE', 'FACTURE', 'ANNULE');

CREATE TABLE "bons_reception" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "dateReception" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutBonReception" NOT NULL DEFAULT 'BROUILLON',
    "stockMisAJour" BOOLEAN NOT NULL DEFAULT false,
    "bonCommandeId" INTEGER,
    "fournisseurId" INTEGER,
    "fournisseurNom" TEXT,
    "commentaire" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bons_reception_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bons_reception_code_key" UNIQUE ("code"),
    CONSTRAINT "bons_reception_bonCommandeId_fkey" FOREIGN KEY ("bonCommandeId") REFERENCES "bons_commande"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bons_reception_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "fournisseurs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "lignes_bons_reception" (
    "id" SERIAL NOT NULL,
    "bonReceptionId" INTEGER NOT NULL,
    "produitId" INTEGER,
    "designation" TEXT NOT NULL,
    "quantiteCmd" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "quantiteRecue" DECIMAL(12,3) NOT NULL,
    "prixUnitaireHT" DECIMAL(12,3) NOT NULL,
    "tauxTVA" DECIMAL(5,2) NOT NULL DEFAULT 19,
    CONSTRAINT "lignes_bons_reception_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lignes_bons_reception_bonReceptionId_fkey" FOREIGN KEY ("bonReceptionId") REFERENCES "bons_reception"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "bons_reception_bons_commande" (
    "bonReceptionId" INTEGER NOT NULL,
    "bonCommandeId" INTEGER NOT NULL,
    CONSTRAINT "bons_reception_bons_commande_pkey" PRIMARY KEY ("bonReceptionId", "bonCommandeId"),
    CONSTRAINT "bons_reception_bons_commande_bonReceptionId_fkey" FOREIGN KEY ("bonReceptionId") REFERENCES "bons_reception"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bons_reception_bons_commande_bonCommandeId_fkey" FOREIGN KEY ("bonCommandeId") REFERENCES "bons_commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "bons_reception_bons_commande_bonCommandeId_idx" ON "bons_reception_bons_commande"("bonCommandeId");
