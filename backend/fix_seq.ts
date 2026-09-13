import prisma from './src/config/prisma';

async function main() {
    const ex = await prisma.exercice.findFirst({ where: { isActif: true }, orderBy: { id: 'desc' } });
    if (!ex) return;
    
    // Pour BonLivraison
    const bls = await prisma.bonLivraison.findFirst({
        where: { code: { startsWith: 'BL-' + ex.annee + '-' } },
        orderBy: { code: 'desc' }
    });
    
    if (bls) {
        const parts = bls.code.split('-');
        const lastNum = parseInt(parts[2], 10);
        console.log("Setting BON_LIVRAISON sequence to", lastNum);
        
        await prisma.$executeRawUnsafe(`
            INSERT INTO "document_sequences" ("exerciseId", "documentType", "lastNumber", "createdAt", "updatedAt")
            VALUES (${ex.id}, 'BON_LIVRAISON', ${lastNum}, NOW(), NOW())
            ON CONFLICT ("exerciseId", "documentType")
            DO UPDATE SET "lastNumber" = GREATEST("document_sequences"."lastNumber", ${lastNum}), "updatedAt" = NOW()
        `);
    }

    console.log("Done fixing sequences");
}
main().catch(console.error).finally(() => prisma.$disconnect());
