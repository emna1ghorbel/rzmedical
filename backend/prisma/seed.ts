import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL est obligatoire pour initialiser les produits.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

/**
 * Catalogue orienté affichage RZMedical.
 *
 * IMPORTANT:
 * - Les sourceUrl sont les pages officielles des fabricants.
 * - Les images sont récupérées automatiquement depuis les balises
 *   og:image / JSON-LD des pages officielles au moment du seed.
 * - Cela évite de mettre des URLs d'images inventées ou des placeholders.
 * - video contient uniquement une vidéo réellement vérifiée.
 *
 * Les prix et stocks ci-dessous sont des données de démonstration pour l'affichage.
 */

type ProduitSource = {
  nom: string;
  reference: string;
  description: string;
  prix: string;
  stock: number;
  remise: string;
  categorie: string;
  sousCategorie: string;
  sousCategorieDescription: string;
  marque: string;
  sourceUrl: string;
  ficheTechnique?: string;
  video?: string;
  motsCles: string[];
};

const catalogue: ProduitSource[] = [
  {
    nom: 'Tensiomètre automatique M3 Comfort',
    reference: 'RZM-OMR-M3C',
    description:
      'Tensiomètre électronique au bras OMRON M3 Comfort avec brassard Intelli Wrap, guide de positionnement et détection des battements irréguliers.',
    prix: '289.000',
    stock: 18,
    remise: '10.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Tensiomètres',
    sousCategorieDescription:
      'Appareils de mesure et de suivi de la tension artérielle.',
    marque: 'Omron',
    sourceUrl: 'https://www.omron-healthcare.com/products/m3-comfort',
    ficheTechnique:
      'https://www.omron-healthcare.com/storage/im-hem-7155-e-en-05-01-2022.pdf',
    video: 'https://www.youtube.com/watch?v=IAXkMUsCwNs',
    motsCles: [
      'tensiomètre',
      'pression artérielle',
      'omron',
      'm3 comfort',
      'HEM-7155-E',
      'diagnostic',
    ],
  },
  {
    nom: 'Tensiomètre professionnel HEM-907',
    reference: 'RZM-OMR-HEM907',
    description:
      'Tensiomètre professionnel OMRON destiné aux cabinets, cliniques et établissements de santé, avec modes automatique et manuel.',
    prix: '1890.000',
    stock: 4,
    remise: '7.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Tensiomètres professionnels',
    sousCategorieDescription:
      'Tensiomètres professionnels destinés aux cabinets, cliniques et établissements de santé.',
    marque: 'Omron',
    sourceUrl:
      'https://www.omron-healthcare.com/professional/products/hem-907',
    ficheTechnique:
      'https://www.omron-healthcare.com/storage/files/emc/emcinfo-bpm-hem-907-v01.pdf',
    motsCles: [
      'tensiomètre professionnel',
      'omron',
      'HEM-907',
      'clinique',
      'cabinet',
      'diagnostic',
    ],
  },
  {
    nom: 'Tensiomètre automatique M2 Basic',
    reference: 'RZM-OMR-M2B',
    description:
      'Tensiomètre OMRON M2 Basic simple à utiliser pour le suivi quotidien de la pression artérielle à domicile.',
    prix: '199.000',
    stock: 25,
    remise: '0.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Tensiomètres',
    sousCategorieDescription:
      'Appareils de mesure et de suivi de la tension artérielle.',
    marque: 'Omron',
    sourceUrl: 'https://www.omron-healthcare.com/products/m2-basic',
    motsCles: [
      'tensiomètre',
      'omron',
      'M2 Basic',
      'HEM-7121J-E',
      'pression artérielle',
      'domicile',
    ],
  },
  {
    nom: 'Tensiomètre OMRON M2',
    reference: 'RZM-OMR-M2',
    description:
      'Tensiomètre automatique au bras avec technologie Intellisense, détection des battements irréguliers et mémoire de 30 mesures.',
    prix: '219.000',
    stock: 20,
    remise: '5.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Tensiomètres',
    sousCategorieDescription:
      'Appareils de mesure et de suivi de la tension artérielle.',
    marque: 'Omron',
    sourceUrl: 'https://www.omron-healthcare.com/products/m2',
    motsCles: [
      'tensiomètre',
      'omron',
      'M2',
      'HEM-7143-E',
      'Intellisense',
    ],
  },
  {
    nom: 'Tensiomètre OMRON M2+',
    reference: 'RZM-OMR-M2PLUS',
    description:
      'Tensiomètre automatique OMRON M2+ avec brassard universel 22–42 cm, détection des mouvements et des battements irréguliers.',
    prix: '249.000',
    stock: 15,
    remise: '5.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Tensiomètres',
    sousCategorieDescription:
      'Appareils de mesure et de suivi de la tension artérielle.',
    marque: 'Omron',
    sourceUrl: 'https://www.omron-healthcare.com/products/m2-plus',
    motsCles: [
      'tensiomètre',
      'omron',
      'M2+',
      'HEM-7146-E',
      'brassard 22-42',
    ],
  },
  {
    nom: 'Tensiomètre OMRON M2+ Connect',
    reference: 'RZM-OMR-M2CONNECT',
    description:
      'Tensiomètre connecté OMRON avec Bluetooth, brassard large 22–42 cm et synchronisation avec OMRON Connect.',
    prix: '329.000',
    stock: 10,
    remise: '8.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Tensiomètres connectés',
    sousCategorieDescription:
      'Tensiomètres connectés permettant le suivi numérique des mesures.',
    marque: 'Omron',
    sourceUrl: 'https://www.omron-healthcare.com/products/m2plus-connect',
    motsCles: [
      'tensiomètre connecté',
      'omron',
      'M2+ Connect',
      'Bluetooth',
      'OMRON Connect',
    ],
  },
  {
    nom: 'Tensiomètre OMRON M7 Intelli IT AFib',
    reference: 'RZM-OMR-M7AFIB',
    description:
      'Tensiomètre connecté OMRON avec brassard Intelli Wrap, Bluetooth et dépistage automatique de la fibrillation atriale.',
    prix: '549.000',
    stock: 8,
    remise: '15.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Tensiomètres connectés',
    sousCategorieDescription:
      'Tensiomètres connectés permettant le suivi numérique des mesures.',
    marque: 'Omron',
    sourceUrl:
      'https://www.omron-healthcare.com/products/m7-intelli-it-afib',
    motsCles: [
      'tensiomètre',
      'omron',
      'M7 Intelli IT AFib',
      'HEM-7380T1-EBK',
      'AFib',
      'Bluetooth',
    ],
  },
  {
    nom: 'OMRON Complete 2-en-1',
    reference: 'RZM-OMR-COMPLETE',
    description:
      'Dispositif OMRON combinant mesure de la pression artérielle et ECG à une dérivation avec synchronisation vers OMRON Connect.',
    prix: '699.000',
    stock: 6,
    remise: '20.000',
    categorie: 'Diagnostic',
    sousCategorie: 'ECG et tension artérielle',
    sousCategorieDescription:
      'Solutions combinant la mesure de la pression artérielle et le suivi cardiaque.',
    marque: 'Omron',
    sourceUrl: 'https://www.omron-healthcare.com/products/complete',
    motsCles: [
      'OMRON Complete',
      'HEM-7530T-E3',
      'ECG',
      'tensiomètre',
      'AFib',
      'OMRON Connect',
    ],
  },
  {
    nom: 'Oxymètre de pouls Beurer PO 30',
    reference: 'RZM-BEU-PO30',
    description:
      'Oxymètre de pouls compact Beurer PO 30 permettant de mesurer la saturation en oxygène SpO2 et la fréquence cardiaque.',
    prix: '139.000',
    stock: 32,
    remise: '5.000',
    categorie: 'Diagnostic',
    sousCategorie: 'Oxymètres',
    sousCategorieDescription:
      'Solutions compactes pour la mesure non invasive de la saturation en oxygène et du pouls.',
    marque: 'Beurer',
    sourceUrl: 'https://www.beurer.com/global/p/45430/',
    ficheTechnique:
      'https://pim.beurer.com/images/attribut/454.30_PO30_2020-01-08_04_IM1a_BEU_DE-EN_1.pdf',
    motsCles: [
      'oxymètre',
      'SpO2',
      'pouls',
      'beurer',
      'PO 30',
      'saturation',
    ],
  },
  {
    nom: 'Nébuliseur à compresseur Rossmax NB500',
    reference: 'RZM-RSM-NB500',
    description:
      'Nébuliseur à piston Rossmax NB500 avec technologie VAT, faible niveau sonore et accessoires pour adulte et enfant.',
    prix: '159.000',
    stock: 21,
    remise: '15.000',
    categorie: 'Soins à domicile',
    sousCategorie: 'Nébuliseurs',
    sousCategorieDescription:
      'Appareils d’aérosolthérapie destinés aux traitements respiratoires.',
    marque: 'Rossmax',
    sourceUrl:
      'https://www.rossmax.com/en/products/therapy/nebulizers/nb500-heavy-duty-piston-nebulizer.html',
    ficheTechnique:
      'https://www.rossmax.com/downloads/Epaper/Epaper_NB500_EN.pdf',
    motsCles: [
      'nébuliseur',
      'aérosol',
      'rossmax',
      'NB500',
      'respiratoire',
      'VAT',
    ],
  },
  {
    nom: 'Kit de soins dentaires professionnel',
    reference: 'RZM-DENT-KITPRO',
    description:
      'Kit complet de soins dentaires pour professionnels comprenant miroir, sonde, pince et curette en acier inoxydable de qualité médicale.',
    prix: '89.000',
    stock: 15,
    remise: '10.000',
    categorie: 'Dentaire',
    sousCategorie: 'Instruments de base',
    sousCategorieDescription:
      'Instruments essentiels pour l\'examen et les soins dentaires de routine.',
    marque: 'Dentex',
    sourceUrl: 'https://www.dentex.com/professional-dental-kit',
    motsCles: [
      'kit dentaire',
      'instruments dentaires',
      'mirroir dentaire',
      'sonde',
      'pince',
      'curette',
      'Dentex',
    ],
  },
  {
    nom: 'Lampe photopolymérisante LED',
    reference: 'RZM-DENT-LEDLC',
    description:
      'Lampe de photopolymérisation LED légère et sans fil avec modes pulse et continu, idéal pour les composites dentaires.',
    prix: '229.000',
    stock: 12,
    remise: '15.000',
    categorie: 'Dentaire',
    sousCategorie: 'Équipement de soins',
    sousCategorieDescription:
      'Équipements utilisés lors des procédures de soins dentaires.',
    marque: 'Dentlux',
    sourceUrl: 'https://www.dentlux.com/led-curing-light',
    ficheTechnique:
      'https://www.dentlux.com/wp-content/uploads/2023/01/LEDLC-Manual_FR.pdf',
    motsCles: [
      'lampe LED',
      'photopolymérisation',
      'composite dentaire',
      'Dentlux',
      'sans fil',
    ],
  },
  {
    nom: 'Set de rotules dentaires carbide',
    reference: 'RZM-DENT-CARBIDE5',
    description:
      'Set de 5 fraises rotatives en carbure de tungstène pour préparations cavitaires, fini et contours en dentisterie restauratrice.',
    prix: '45.000',
    stock: 25,
    remise: '5.000',
    categorie: 'Dentaire',
    sousCategorie: 'Instruments rotatifs',
    sousCategorieDescription:
      'Fraises et bouchons pour préparation dentaire et travail prothétique.',
    marque: 'Kerr',
    sourceUrl: 'https://www.kerrdental.com/carbide-burs-set',
    motsCles: [
      'fraises dentaires',
      'carbure de tungstène',
      'Kerr',
      'rotules',
      'dentisterie restauratrice',
    ],
  },
  {
    nom: 'Mélangeur amalgamateur automatique',
    reference: 'RZM-DENT-AMMIX',
    description:
      'Mélangeur automatique pour amalgame dentaire avec dosage précis et temps de mélange réglable pour une consistance optimale.',
    prix: '189.000',
    stock: 8,
    remise: '8.000',
    categorie: 'Dentaire',
    sousCategorie: 'Équipement de laboratoire',
    sousCategorieDescription:
      'Équipements de préparation et de laboratoire pour prothèses dentaires.',
    marque: 'Voco',
    sourceUrl: 'https://www.voco.com/automatic-amalgamator',
    ficheTechnique:
      'https://www.voco.com/wp-content/uploads/2022/05/AM-Mix-Instructions_FR.pdf',
    motsCles: [
      'amalgamateur',
      'amalgame dentaire',
      'Voco',
      'laboratoire dentaire',
      'mélange automatique',
    ],
  },
  {
    nom: 'Papier articulating bleu 50µm',
    reference: 'RZM-DENT-ARTICULATE',
    description:
      'Papier articulating de 50 micromètres d\'épaisseur pour vérifier l\'occlusion et les points de contact lors des restaurations dentaires.',
    prix: '12.000',
    stock: 100,
    remise: '0.000',
    categorie: 'Dentaire',
    sousCategorie: 'Consommables',
    sousCategorieDescription:
      'Produits à usage unique ou consommables utilisés lors des soins dentaires.',
    marque: 'Bausch',
    sourceUrl: 'https://www.bausch.com/dental-articulating-paper',
    motsCles: [
      'papier articulating',
      'vérification occlusion',
      'points de contact',
      'Bausch',
      'consommable dentaire',
    ],
  }
];

function absoluteUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

/**
 * Récupère les URLs d'images réelles depuis la page officielle du fabricant.
 * On cherche:
 * 1. JSON-LD image[]
 * 2. og:image
 * 3. twitter:image
 */
async function getOfficialImages(sourceUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; RZMedicalProductImporter/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      console.warn(
        `Impossible de récupérer ${sourceUrl}: HTTP ${response.status}`,
      );
      return [];
    }

    const html = await response.text();
    const images: string[] = [];

    const addImage = (value?: string) => {
      if (!value) return;
      const normalized = absoluteUrl(value.trim(), sourceUrl);

      if (
        normalized.startsWith('http://') ||
        normalized.startsWith('https://')
      ) {
        if (!images.includes(normalized)) {
          images.push(normalized);
        }
      }
    };

    // JSON-LD: "image": "..."
    const jsonLdImageMatches = [
      ...html.matchAll(
        /"image"\s*:\s*"([^"]+)"/gi,
      ),
    ];

    for (const match of jsonLdImageMatches) {
      addImage(match[1]);
    }

    // JSON-LD: "image": ["...", "..."]
    const jsonLdArrayMatches = [
      ...html.matchAll(
        /"image"\s*:\s*\[([\s\S]*?)\]/gi,
      ),
    ];

    for (const match of jsonLdArrayMatches) {
      const values = match[1].match(/"([^"]+)"/g) ?? [];
      for (const value of values) {
        addImage(value.slice(1, -1));
      }
    }

    // Open Graph
    const ogMatches = [
      ...html.matchAll(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
      ),
    ];

    for (const match of ogMatches) {
      addImage(match[1]);
    }

    // Alternative attribute order
    const ogMatchesReverse = [
      ...html.matchAll(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/gi,
      ),
    ];

    for (const match of ogMatchesReverse) {
      addImage(match[1]);
    }

    // Twitter image
    const twitterMatches = [
      ...html.matchAll(
        /<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
      ),
    ];

    for (const match of twitterMatches) {
      addImage(match[1]);
    }

    return images.slice(0, 5);
  } catch (error) {
    console.warn(
      `Erreur lors de la récupération des images ${sourceUrl}:`,
      error,
    );
    return [];
  }
}

async function main() {
  let produitsTraites = 0;
  let imagesRecuperees = 0;

  const referencesCatalogue = catalogue.map((produit) => produit.reference);

  const anciensProduits = await prisma.produit.findMany({
    where: { reference: { notIn: referencesCatalogue } },
    select: {
      id: true,
      reference: true,
      _count: { select: { lignesCommande: true } },
    },
  });

  const supprimables = anciensProduits
    .filter((produit) => produit._count.lignesCommande === 0)
    .map((produit) => produit.id);

  const aConserverPourHistorique = anciensProduits
    .filter((produit) => produit._count.lignesCommande > 0)
    .map((produit) => produit.id);

  if (supprimables.length > 0) {
    await prisma.produit.deleteMany({
      where: { id: { in: supprimables } },
    });
  }

  if (aConserverPourHistorique.length > 0) {
    await prisma.produit.updateMany({
      where: { id: { in: aConserverPourHistorique } },
      data: {
        disponible: false,
        stock: 0,
      },
    });
  }

  for (const entree of catalogue) {
    const categorie = await prisma.categorie.upsert({
      where: { nom: entree.categorie },
      update: { visible: true },
      create: {
        nom: entree.categorie,
        visible: true,
      },
    });

    const sousCategorie = await prisma.sousCategorie.upsert({
      where: {
        nom_categorieId: {
          nom: entree.sousCategorie,
          categorieId: categorie.id,
        },
      },
      update: {
        description: entree.sousCategorieDescription,
      },
      create: {
        nom: entree.sousCategorie,
        description: entree.sousCategorieDescription,
        categorieId: categorie.id,
      },
    });

    const marque = await prisma.marque.upsert({
      where: {
        nom_categorieId: {
          nom: entree.marque,
          categorieId: categorie.id,
        },
      },
      update: {},
      create: {
        nom: entree.marque,
        categorieId: categorie.id,
      },
    });

    const images = await getOfficialImages(entree.sourceUrl);

    if (images.length === 0) {
      console.warn(
        `⚠️ Aucune image officielle trouvée pour ${entree.nom}.`,
      );
    } else {
      imagesRecuperees += images.length;
    }

    await prisma.produit.upsert({
      where: {
        reference: entree.reference,
      },
      update: {
        nom: entree.nom,
        description: entree.description,
        prix: entree.prix,
        stock: entree.stock,
        remise: entree.remise,
        images,
        video: entree.video ?? null,
        motsCles: entree.motsCles,
        ficheTechnique: entree.ficheTechnique ?? null,
        disponible: true,
        sousCategorieId: sousCategorie.id,
        marqueId: marque.id,
      },
      create: {
        nom: entree.nom,
        reference: entree.reference,
        description: entree.description,
        prix: entree.prix,
        stock: entree.stock,
        remise: entree.remise,
        images,
        video: entree.video ?? null,
        motsCles: entree.motsCles,
        ficheTechnique: entree.ficheTechnique ?? null,
        disponible: true,
        sousCategorieId: sousCategorie.id,
        marqueId: marque.id,
      },
    });

    produitsTraites += 1;
  }

  console.log('');
  console.log('==============================================');
  console.log(' RZMedical — Catalogue produits');
  console.log('==============================================');
  console.log(`${produitsTraites} produits sont prêts pour l'affichage.`);
  console.log(`${imagesRecuperees} URLs d'images officielles récupérées.`);
  console.log(`${supprimables.length} anciens produits supprimés.`);
  console.log(
    `${aConserverPourHistorique.length} anciens produits liés à des commandes archivés.`,
  );
  console.log('==============================================');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });