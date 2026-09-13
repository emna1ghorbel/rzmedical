const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
async function main() {
    const ex = await prisma.exercice.findFirst({ where: { isActif: true }, orderBy: { id: 'desc' } });
    console.log("Active exercice:", ex);
    const seq = await prisma.$queryRawUnsafe(`SELECT * FROM document_sequences WHERE "documentType"='BON_LIVRAISON' AND "exerciseId"=${ex.id}`);
    console.log("Sequence:", seq);
    const bls = await prisma.bonLivraison.findMany({ 
        where: { code: { startsWith: 'BL-' + ex.annee + '-' } },
        orderBy: { code: 'desc' },
        take: 5,
        select: { code: true }
    });
    console.log("Last BLs for this annee:", bls);
}
main().catch(console.error).finally(() => prisma.$disconnect());
