import prisma from './src/config/prisma';

async function fix() {
  const invs = await prisma.inventaireCommercial.findMany();
  for (const inv of invs) {
    if (inv.code && inv.code.startsWith('undefined-')) {
      const newCode = inv.code.replace('undefined-', 'INV-');
      await prisma.inventaireCommercial.update({
        where: { id: inv.id },
        data: { code: newCode }
      });
      console.log(`Updated ${inv.code} to ${newCode}`);
    }
  }
  await prisma.$disconnect();
}

fix().catch(e => { console.error(e); prisma.$disconnect(); });
