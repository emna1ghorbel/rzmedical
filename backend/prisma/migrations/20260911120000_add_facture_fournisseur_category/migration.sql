CREATE TYPE "CategorieFactureFournisseur" AS ENUM ('FOURNISSEUR', 'CHARGES', 'CNSS', 'NEUF_BA4A');

ALTER TABLE "factures_fournisseurs"
  ADD COLUMN "categorie" "CategorieFactureFournisseur" NOT NULL DEFAULT 'FOURNISSEUR';
