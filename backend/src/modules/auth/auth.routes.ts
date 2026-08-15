import { Router, Request, Response } from 'express';
import * as authService from './auth.service';
import { requireAuth } from './auth.middleware';

const router = Router();

// POST /api/auth/login — Étape 1 : email + mot de passe → envoi OTP
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de connexion';
    res.status(401).json({ error: msg });
  }
});

// POST /api/auth/verify-otp — Étape 2 : vérification code OTP → JWT
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email et code OTP requis' });
    }
    const result = await authService.verifyOtp(email, otp);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de vérification';
    res.status(401).json({ error: msg });
  }
});

// POST /api/auth/logout — Déconnexion (côté client, supprime le token)
router.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Déconnecté avec succès' });
});

// GET /api/auth/me — Vérifier la session actuelle
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

// GET /api/auth/profile — Obtenir son profil
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    const profile = await authService.getUserProfile(userPayload.id, userPayload.email);
    res.json(profile);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de profil';
    res.status(400).json({ error: msg });
  }
});

// PUT /api/auth/profile — Mettre à jour son profil (photo, nom, téléphone, mot de passe)
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userPayload = (req as any).user;
    const updated = await authService.updateProfile(userPayload.id, userPayload.email, req.body);
    res.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de mise à jour du profil';
    res.status(400).json({ error: msg });
  }
});

// ---- Routes Admin (protégées) ----

// GET /api/auth/admins — Lister les admins
router.get('/admins', requireAuth, async (req: Request, res: Response) => {
  try {
    const admins = await authService.listAdmins();
    res.json(admins);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/admins — Créer un nouvel admin
router.post('/admins', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email, password, prenom, nom } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    const admin = await authService.createAdmin(email, password, prenom, nom);
    res.status(201).json(admin);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur création admin';
    res.status(400).json({ error: msg });
  }
});

// DELETE /api/auth/admins/:id — Supprimer un admin
router.delete('/admins/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const targetId = Number(req.params.id);
    if (currentUser.id === targetId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    await authService.deleteAdmin(targetId);
    res.json({ message: 'Admin supprimé' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
