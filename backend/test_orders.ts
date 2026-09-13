import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.commande.findMany({
    take: 5,
    orderBy: { creeLe: 'desc' },
    select: { numero: true }
  });
  console.log('Recent orders:', orders.map(o => o.numero));
}

main().catch(console.error).finally(() => prisma.$disconnect());
