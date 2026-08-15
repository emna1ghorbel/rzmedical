import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';

const router = Router();

// GET /api/stats/overview - Métriques générales du tableau de bord
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const [
      totalProduits,
      totalCategories,
      totalMarques,
      totalSousCategories,
      produitsDisponibles,
      produitsRupture,
    ] = await Promise.all([
      prisma.produit.count(),
      prisma.categorie.count(),
      prisma.marque.count(),
      prisma.sousCategorie.count(),
      prisma.produit.count({ where: { disponible: true } }),
      prisma.produit.count({ where: { stock: 0 } }),
    ]);

    res.json({
      totalProduits,
      totalCategories,
      totalMarques,
      totalSousCategories,
      produitsDisponibles,
      produitsRupture,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/stats/products-recent - 5 derniers produits ajoutés
router.get('/products-recent', async (req: Request, res: Response) => {
  try {
    const produits = await prisma.produit.findMany({
      take: 5,
      orderBy: { creeLe: 'desc' },
      include: {
        sousCategorie: { include: { categorie: true } },
        marque: true,
      },
    });
    res.json(produits);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/stats/stock-alert - Produits avec stock faible (<= 5)
router.get('/stock-alert', async (req: Request, res: Response) => {
  try {
    const produits = await prisma.produit.findMany({
      where: { stock: { lte: 5 } },
      take: 10,
      orderBy: { stock: 'asc' },
      include: {
        sousCategorie: { include: { categorie: true } },
        marque: true,
      },
    });
    res.json(produits);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/stats/by-category - Répartition des produits par catégorie
router.get('/by-category', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.categorie.findMany({
      include: {
        _count: {
          select: { sousCategories: true, marques: true },
        },
        sousCategories: {
          include: { _count: { select: { produits: true } } },
        },
      },
    });

    const result = categories.map(cat => ({
      id: cat.id,
      nom: cat.nom,
      nbSousCategories: cat._count.sousCategories,
      nbMarques: cat._count.marques,
      nbProduits: cat.sousCategories.reduce((sum, sc) => sum + sc._count.produits, 0),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
