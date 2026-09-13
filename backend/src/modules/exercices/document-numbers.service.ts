import { Prisma, PrismaClient } from '../../../generated/prisma/client';

export type DocumentType =
  | 'FACTURE_VENTE'
  | 'FACTURE_ACHAT'
  | 'COMMANDE'
  | 'DEVIS'
  | 'BON_LIVRAISON'
  | 'BON_RECEPTION'
  | 'AVOIR_VENTE'
  | 'AVOIR_ACHAT';

const PREFIXES: Record<DocumentType, string> = {
  FACTURE_VENTE: 'FV',
  FACTURE_ACHAT: 'FF',
  COMMANDE: 'CMD',
  DEVIS: 'DEV',
  BON_LIVRAISON: 'BL',
  BON_RECEPTION: 'BR',
  AVOIR_VENTE: 'AV',
  AVOIR_ACHAT: 'AA',
};

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export class DocumentNumberError extends Error {
  statusCode = 409;
}

/**
 * Atomically reserves a number for a document in the active fiscal exercise.
 *
 * This function must be called with the transaction that creates the document:
 * if that creation fails, PostgreSQL rolls the counter increment back as well.
 */
export async function generateDocumentNumber(
  tx: DatabaseClient,
  documentType: DocumentType,
): Promise<string> {
  const exercice = await tx.exercice.findFirst({
    where: { isActif: true },
    orderBy: { id: 'desc' },
  });

  if (!exercice) {
    throw new DocumentNumberError('Aucun exercice comptable actif. Activez un exercice avant de créer un document.');
  }

  const rows = await tx.$queryRaw<{ lastNumber: number }[]>(Prisma.sql`
    INSERT INTO "document_sequences" ("exerciseId", "documentType", "lastNumber", "createdAt", "updatedAt")
    VALUES (${exercice.id}, ${documentType}::"DocumentSequenceType", 1, NOW(), NOW())
    ON CONFLICT ("exerciseId", "documentType")
    DO UPDATE SET
      "lastNumber" = "document_sequences"."lastNumber" + 1,
      "updatedAt" = NOW()
    RETURNING "lastNumber"
  `);

  const lastNumber = rows[0]?.lastNumber;
  if (!lastNumber) throw new DocumentNumberError('Impossible de générer le numéro du document.');

  return `${PREFIXES[documentType]}-${exercice.annee}-${String(lastNumber).padStart(4, '0')}`;
}
