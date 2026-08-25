CREATE TYPE "AuteurSupport" AS ENUM ('CLIENT', 'ADMIN');

CREATE TABLE "messages_support" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "auteur" "AuteurSupport" NOT NULL,
    "contenu" TEXT NOT NULL,
    "canal" "CanalSupport" NOT NULL DEFAULT 'SUPPORT',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_support_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_support_ticketId_creeLe_idx" ON "messages_support"("ticketId", "creeLe");

ALTER TABLE "messages_support" ADD CONSTRAINT "messages_support_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "tickets_support"("id") ON DELETE CASCADE ON UPDATE CASCADE;
