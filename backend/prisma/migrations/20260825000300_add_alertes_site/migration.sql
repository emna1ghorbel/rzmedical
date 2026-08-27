DO $$ BEGIN
  CREATE TYPE "TypeAlerte" AS ENUM ('INFO', 'PROMO', 'WARNING', 'SUCCESS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AffichageAlerte" AS ENUM ('POPUP', 'BANNER', 'TOAST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "alertes_site" (
  "id" SERIAL PRIMARY KEY,
  "type" "TypeAlerte" NOT NULL DEFAULT 'INFO',
  "affichage" "AffichageAlerte" NOT NULL DEFAULT 'POPUP',
  "titre" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "lien" TEXT,
  "texteBouton" TEXT,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "dateDebut" TIMESTAMP(3),
  "dateFin" TIMESTAMP(3),
  "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "misAJourLe" TIMESTAMP(3) NOT NULL
);
