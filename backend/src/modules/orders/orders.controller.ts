import { Request, Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import * as service from './orders.service';
import { OrderError } from './orders.service';
import { notifyAdminNewOrder } from '../notifications/whatsapp.service';
import { sendOrderStatusEmail } from '../client-auth/client-auth.service';
import * as bonsLivraisonService from '../bons-livraison/bons-livraison.service';

// Sérialise les Decimal (total, prixUnitaire) en Number pour la réponse JSON
export const serializeOrder = (order: any) => ({
  ...order,
  total: Number(order.total),
  lignes: Array.isArray(order.lignes)
    ? order.lignes.map((l: any) => ({ ...l, prixUnitaire: Number(l.prixUnitaire) }))
    : order.lignes,
  facture:
    order.facture ||
    (Array.isArray(order.factures) && order.factures.length > 0 ? order.factures[0] : null),
});

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const { lignes } = req.body;
    const order = await service.createOrder(req.user!.id, lignes);

    // Send WhatsApp notification to admin (fire-and-forget — does NOT block the response)
    const user = req.user as any;
    const nbArticles = Array.isArray(order.lignes)
      ? order.lignes.reduce((sum: number, l: any) => sum + Number(l.quantite), 0)
      : 0;
    notifyAdminNewOrder(
      order.id,
      user.nom ?? '',
      user.prenom ?? '',
      user.telephone,
      Number(order.total),
      nbArticles
    ).catch(() => {}); // silently ignore errors

    res.status(201).json(serializeOrder(order));
  } catch (err: unknown) {
    if (err instanceof OrderError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
};

export const list = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await service.getMyOrders(req.user!.id);
    res.json(orders.map(serializeOrder));
  } catch (err: unknown) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
};

export const getOne = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide' });
    }
    const order = await service.getOrder(req.user!.id, id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json(serializeOrder(order));
  } catch (err: unknown) {
    console.error('GET /api/orders/:id error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
  }
};

// --- Admin methods ---

export const listAll = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const orders = await service.getAllOrders(status);
    res.json(orders.map(serializeOrder));
  } catch (err: unknown) {
    console.error('GET /api/orders/admin error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes' });
  }
};

export const getOneAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide' });
    }
    const order = await service.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }
    res.json(serializeOrder(order));
  } catch (err: unknown) {
    console.error('GET /api/orders/admin/:id error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide' });
    }
    if (!status) {
      return res.status(400).json({ error: 'Statut requis' });
    }
    const order = await service.updateOrderStatus(id, status);

    const hasActiveBL = Array.isArray((order as any).bonsLivraison)
      ? (order as any).bonsLivraison.some((bl: any) => bl?.statut && bl.statut !== 'ANNULE')
      : false;

    if (status === 'LIVREE' && !hasActiveBL) {
      await bonsLivraisonService.createBLFromOrder(id);
    }

    // Notify the client by email (fire-and-forget)
    const client = (order as any).utilisateur;
    if (client?.email) {
      sendOrderStatusEmail(
        client.email,
        client.prenom ?? client.nom ?? 'Client',
        order.id,
        status
      ).catch((e) => console.error('Email statut commande error:', e));
    }

    res.json(serializeOrder(order));
  } catch (err: unknown) {
    if (err instanceof OrderError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('PATCH /api/orders/admin/:id/status error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la commande' });
  }
};
export const updateItems = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { lignes } = req.body;
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Identifiant de commande invalide' });
    }
    if (!Array.isArray(lignes)) {
      return res.status(400).json({ error: 'Un tableau de lignes est requis' });
    }
    const order = await service.updateOrderItems(id, lignes);
    res.json(serializeOrder(order));
  } catch (err: unknown) {
    if (err instanceof OrderError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('PATCH /api/orders/admin/:id/items error:', err);
    res.status(500).json({ error: 'Erreur lors de la modification des lignes de la commande' });
  }
};

export const trackPublic = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const order = await service.trackOrderPublicly(code);
    res.json(order);
  } catch (err: unknown) {
    if (err instanceof OrderError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('GET /api/orders/public/track/:code error:', err);
    res.status(500).json({ error: 'Erreur lors du suivi de la commande' });
  }
};
