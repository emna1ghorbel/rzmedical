import prisma from './src/config/prisma';

async function test() {
  const inv = await prisma.inventaireCommercial.findFirst({
    include: { lignes: true }
  });
  if (inv && inv.lignes.length > 0) {
    const ligne = inv.lignes[0];
    console.log("Before:", ligne.ecart);
    ligne.ecart = 999;
    console.log("After:", ligne.ecart);
    console.log("Serialized:", JSON.stringify(ligne));
  } else {
    console.log("No inventaire found");
  }
}

test().catch(console.error);
