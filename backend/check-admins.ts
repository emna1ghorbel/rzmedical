import prisma from './src/config/prisma';
prisma.utilisateur.findMany({ where: { type: 'ADMIN' } })
  .then(console.log)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
