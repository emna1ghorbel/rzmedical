import prisma from './src/config/prisma';

async function main() {
    const ex = await prisma.exercice.findFirst({ where: { isActif: true }, orderBy: { id: 'desc' } });
    if (!ex) return;
    
    const types = [
        { type: 'FACTURE_VENTE', prefix: 'FV', model: prisma.facture, field: 'numero' },
        { type: 'FACTURE_ACHAT', prefix: 'FF', model: prisma.factureFournisseur, field: 'numero' },
        { type: 'COMMANDE', prefix: 'CMD', model: prisma.commande, field: 'numero' },
        { type: 'DEVIS', prefix: 'DEV', model: prisma.devis, field: 'numero' },
        { type: 'BON_LIVRAISON', prefix: 'BL', model: prisma.bonLivraison, field: 'code' },
        { type: 'BON_RECEPTION', prefix: 'BR', model: prisma.bonReception, field: 'code' },
        { type: 'AVOIR_VENTE', prefix: 'AV', model: prisma.facture, field: 'numeroAvoir' },
        // Add AVOIR_ACHAT if needed
    ];

    for (const t of types) {
        let maxNum = 0;
        
        // Custom logic for each type
        if (t.type === 'AVOIR_VENTE') {
            const doc = await prisma.facture.findFirst({
                where: { numeroAvoir: { startsWith: t.prefix + '-' + ex.annee + '-' } },
                orderBy: { numeroAvoir: 'desc' }
            });
            if (doc && doc.numeroAvoir) {
                const parts = doc.numeroAvoir.split('-');
                maxNum = parseInt(parts[2], 10);
            }
        } else {
            const doc = await (t.model as any).findFirst({
                where: { [t.field]: { startsWith: t.prefix + '-' + ex.annee + '-' } },
                orderBy: { [t.field]: 'desc' }
            });
            if (doc && doc[t.field]) {
                const parts = doc[t.field].split('-');
                maxNum = parseInt(parts[2], 10);
            }
        }
        
        if (maxNum > 0) {
            console.log(`Setting ${t.type} sequence to ${maxNum}`);
            await prisma.$executeRawUnsafe(`
                INSERT INTO "document_sequences" ("exerciseId", "documentType", "lastNumber", "createdAt", "updatedAt")
                VALUES (${ex.id}, '${t.type}', ${maxNum}, NOW(), NOW())
                ON CONFLICT ("exerciseId", "documentType")
                DO UPDATE SET "lastNumber" = GREATEST("document_sequences"."lastNumber", ${maxNum}), "updatedAt" = NOW()
            `);
        } else {
            console.log(`No documents found for ${t.type} in ${ex.annee}`);
        }
    }

    console.log("Done fixing all sequences");
}
main().catch(console.error).finally(() => prisma.$disconnect());
