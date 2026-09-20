const { PrismaClient } = require('./generated/prisma/client.ts');
const prisma = new PrismaClient();
prisma.inventaireCommercial.findMany({ select: { id: true, code: true, bonSortieId: true } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); return prisma.$disconnect(); })
  .catch(e => { console.error(e.message); return prisma.$disconnect(); });
