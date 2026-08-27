CREATE TABLE "inscriptions_temporaires" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "matriculeFiscale" TEXT,
    "activite" TEXT,
    "token" TEXT NOT NULL,
    "expireA" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscriptions_temporaires_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tokens_reset" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expireA" TIMESTAMP(3) NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_reset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inscriptions_temporaires_email_key" ON "inscriptions_temporaires"("email");
CREATE UNIQUE INDEX "inscriptions_temporaires_token_key" ON "inscriptions_temporaires"("token");
CREATE UNIQUE INDEX "tokens_reset_utilisateurId_key" ON "tokens_reset"("utilisateurId");
CREATE UNIQUE INDEX "tokens_reset_token_key" ON "tokens_reset"("token");

ALTER TABLE "tokens_reset"
ADD CONSTRAINT "tokens_reset_utilisateurId_fkey"
FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
