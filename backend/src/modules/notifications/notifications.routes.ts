import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const [recentUsers, recentOrders, lowStockProducts] = await Promise.all([
      // Derniers clients inscrits
      prisma.utilisateur.findMany({
        where: { typeUtilisateur: 'CLIENT' },
        take: 5,
        orderBy: { creeLe: 'desc' },
        select: {
          id: true,
          email: true,
          prenom: true,
          nom: true,
          photo: true,
          creeLe: true,
        }
      }),

      // Dernières commandes avec total et utilisateur
      prisma.commande.findMany({
        take: 8,
        orderBy: { creeLe: 'desc' },
        include: {
          utilisateur: {
            select: {
              prenom: true,
              nom: true,
              email: true,
              photo: true
            }
          }
        }
      }),

      // Produits en rupture ou stock faible (<= 5)
      prisma.produit.findMany({
        where: {
          stock: { lte: 5 },
          disponible: true
        },
        take: 5,
        orderBy: { stock: 'asc' },
        select: {
          id: true,
          nom: true,
          reference: true,
          stock: true,
          images: true,
          misAJourLe: true
        }
      })
    ]);

    // Formatage unifié
    const notifications: Array<{
      id: string;
      type: 'user' | 'order' | 'stock';
      title: string;
      message: string;
      photo: string | null;
      date: Date | string;
      link: string;
      severity?: 'info' | 'warning' | 'error' | 'success';
      extra?: string;
    }> = [];

    // Notifications Clients
    for (const user of recentUsers) {
      notifications.push({
        id: `user_${user.id}`,
        type: 'user',
        title: 'Nouveau Client',
        message: `${[user.prenom, user.nom].filter(Boolean).join(' ') || user.email} s'est inscrit.`,
        photo: user.photo,
        date: user.creeLe,
        link: '/customers',
        severity: 'info'
      });
    }

    // Notifications Commandes
    for (const order of recentOrders) {
      const clientName = [order.utilisateur.prenom, order.utilisateur.nom].filter(Boolean).join(' ') || order.utilisateur.email;
      notifications.push({
        id: `order_${order.id}`,
        type: 'order',
        title: `Commande #${order.id}`,
        message: `Passée par ${clientName} • Total : ${Number(order.total).toFixed(2)} TND`,
        photo: order.utilisateur.photo,
        date: order.creeLe,
        link: '/orders',
        severity: order.statut === 'PAYEE' ? 'success' : order.statut === 'ANNULEE' ? 'error' : 'warning',
        extra: order.statut
      });
    }

    // Notifications Stock
    for (const prod of lowStockProducts) {
      const isRupture = prod.stock === 0;
      notifications.push({
        id: `stock_${prod.id}`,
        type: 'stock',
        title: isRupture ? '⚠️ Rupture de Stock' : '⚡ Stock Faible',
        message: `${prod.nom} (Réf: ${prod.reference}) — ${prod.stock === 0 ? 'Stock épuisé' : `Plus que ${prod.stock} restant(s)`}`,
        photo: prod.images && prod.images.length > 0 ? prod.images[0] : null,
        date: prod.misAJourLe,
        link: '/products',
        severity: isRupture ? 'error' : 'warning',
        extra: `${prod.stock} en stock`
      });
    }

    // Trier par date la plus récente
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Renvoyer les 15 plus récentes
    res.json(notifications.slice(0, 15));

  } catch (err) {
    console.error("GET /api/notifications error:", err);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

export default router;
