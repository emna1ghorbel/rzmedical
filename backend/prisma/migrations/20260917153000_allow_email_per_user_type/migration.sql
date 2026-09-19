-- Permit the same email address for different account roles while retaining
-- uniqueness within each role (CLIENT, COMMERCIAL, or ADMIN).
DROP INDEX "utilisateurs_email_key";

CREATE UNIQUE INDEX "utilisateurs_email_typeUtilisateur_key"
ON "utilisateurs"("email", "typeUtilisateur");
