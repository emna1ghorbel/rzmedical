require('dotenv').config();
const { Client } = require('pg');

const TYPES = {
  FACTURE_VENTE: 'FV',
};

async function nextNumber(client, exerciseId, documentType = 'FACTURE_VENTE') {
  const result = await client.query(
    `INSERT INTO "document_sequences" ("exerciseId", "documentType", "lastNumber", "createdAt", "updatedAt")
     VALUES ($1, $2::"DocumentSequenceType", 1, NOW(), NOW())
     ON CONFLICT ("exerciseId", "documentType")
     DO UPDATE SET "lastNumber" = "document_sequences"."lastNumber" + 1, "updatedAt" = NOW()
     RETURNING "lastNumber"`,
    [exerciseId, documentType],
  );
  return result.rows[0].lastNumber;
}

async function withClient(callback) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function main() {
  const exercises = await withClient((client) => client.query('SELECT id, annee FROM exercices WHERE annee IN (2026, 2027) ORDER BY annee'));
  if (exercises.rows.length !== 2) throw new Error('Les exercices 2026 et 2027 sont requis pour ce test.');

  const formatted = [];
  for (const exercise of exercises.rows) {
    await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const number = await nextNumber(client, exercise.id);
        formatted.push(`${TYPES.FACTURE_VENTE}-${exercise.annee}-${String(number).padStart(4, '0')}`);
      } finally {
        await client.query('ROLLBACK');
      }
    });
  }

  const testYear = 2099;
  const temporaryExerciseId = await withClient(async (client) => {
    const created = await client.query(
      'INSERT INTO exercices (annee, label, "dateDebut", "dateFin", "isActif", "misAJourLe") VALUES ($1, $2, $3, $4, false, NOW()) RETURNING id',
      [testYear, 'Test numérotation temporaire', `${testYear}-01-01T00:00:00.000Z`, `${testYear}-12-31T23:59:59.999Z`],
    );
    return created.rows[0].id;
  });

  try {
    const values = await Promise.all(Array.from({ length: 20 }, () => withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const number = await nextNumber(client, temporaryExerciseId);
        await client.query('COMMIT');
        return number;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    })));
    const unique = new Set(values);
    if (unique.size !== 20 || Math.min(...values) !== 1 || Math.max(...values) !== 20) {
      throw new Error(`Concurrence invalide : ${values.join(', ')}`);
    }
    console.log(JSON.stringify({ formatChecks: formatted, concurrentNumbers: [...unique].sort((a, b) => a - b) }));
  } finally {
    await withClient(async (client) => {
      await client.query('DELETE FROM document_sequences WHERE "exerciseId" = $1', [temporaryExerciseId]);
      await client.query('DELETE FROM exercices WHERE id = $1', [temporaryExerciseId]);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
