import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Derniers utilisateurs inscrits / modifiés
    const recentUsers = await prisma.utilisateur.findMany({
      take: 5,
      orderBy: { creeLe: 'desc' },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        photo: true,
        creeLe: true,
        typeUtilisateur: true
      }
    });

    // Dernières commandes
    const recentOrders = await prisma.commande.findMany({
      take: 5,
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
    });

    // Formatage unifié
    const notifications = [];

    for (const user of recentUsers) {
      notifications.push({
        id: `user_${user.id}`,
        type: 'user',
        title: 'Nouvel Utilisateur',
        message: `${user.prenom || ''} ${user.nom || ''} (${user.email}) s'est inscrit.`,
        photo: user.photo,
        date: user.creeLe,
        link: '/customers'
      });
    }

    for (const order of recentOrders) {
      notifications.push({
        id: `order_${order.id}`,
        type: 'order',
        title: 'Nouvelle Commande',
        message: `Commande #${order.id} passée par ${order.utilisateur.prenom || ''} ${order.utilisateur.nom || ''}.`,
        photo: order.utilisateur.photo,
        date: order.creeLe,
        link: '/orders'
      });
    }

    // Trier par date la plus récente
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Ne garder que les 10 plus récentes
    res.json(notifications.slice(0, 10));

  } catch (err) {
    console.error("GET /api/notifications error:", err);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
});

export default router;
