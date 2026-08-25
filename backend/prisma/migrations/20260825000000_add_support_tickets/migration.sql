CREATE TYPE "StatutSupport" AS ENUM ('NOUVEAU', 'EN_COURS', 'REPONDU', 'FERME');

CREATE TYPE "CanalSupport" AS ENUM ('SUPPORT', 'EMAIL', 'TELEPHONE');

CREATE TABLE "tickets_support" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "sujet" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statut" "StatutSupport" NOT NULL DEFAULT 'NOUVEAU',
    "canalReponse" "CanalSupport" NOT NULL DEFAULT 'SUPPORT',
    "reponse" TEXT,
    "reponduLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "misAJourLe" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tickets_support_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tickets_support_utilisateurId_idx" ON "tickets_support"("utilisateurId");
CREATE INDEX "tickets_support_statut_idx" ON "tickets_support"("statut");

ALTER TABLE "tickets_support" ADD CONSTRAINT "tickets_support_utilisateurId_fkey"
    FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
