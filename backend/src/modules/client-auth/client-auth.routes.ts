import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../auth/auth.service';
import { requireClient, AuthRequest } from '../auth/auth.middleware';

const router = Router();

// Champs renvoyés au client (jamais motDePasseHash / otp*)
const clientSelect = {
  id: true,
  email: true,
  prenom: true,
  nom: true,
  telephone: true,
  photo: true,
  adresse: true,
  dateNaissance: true,
  remise: true,
  matriculeFiscale: true,
  activite: true,
  typeUtilisateur: true,
  creeLe: true,
  dernierLogin: true,
} as const;

type SelectedUser = {
  remise: unknown;
  [key: string]: unknown;
};

// Sérialise l'utilisateur pour la réponse JSON (remise Decimal -> Number)
function serializeUser(user: SelectedUser) {
  return { ...user, remise: Number(user.remise) };
}

function signToken(user: { id: number; email: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, type: 'CLIENT' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// POST /api/client-auth/register — Inscription d'un nouveau client
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, motDePasse, prenom, nom, telephone, adresse, matriculeFiscale, activite } = req.body;

    if (!email || !motDePasse || !prenom || !nom) {
      return res.status(400).json({ error: 'Email, mot de passe, prénom et nom sont requis' });
    }
    if (String(motDePasse).length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.utilisateur.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const hash = await bcrypt.hash(String(motDePasse), 12);
    const user = await prisma.utilisateur.create({
      data: {
        email: normalizedEmail,
        motDePasseHash: hash,
        prenom: String(prenom).trim(),
        nom: String(nom).trim(),
        telephone: telephone?.trim() || null,
        adresse: adresse?.trim() || null,
        matriculeFiscale: matriculeFiscale?.trim() || null,
        activite: activite?.trim() || null,
        typeUtilisateur: 'CLIENT',
        // remise reste 0 par défaut : elle est fixée uniquement par un administrateur
      },
      select: clientSelect,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: serializeUser(user) });
  } catch (err: unknown) {
    console.error('POST /api/client-auth/register error:', err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// POST /api/client-auth/login — Connexion d'un client (email + mot de passe, sans OTP)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.utilisateur.findUnique({ where: { email: normalizedEmail } });

    // Message volontairement générique + réservé aux comptes CLIENT
    if (!user || user.typeUtilisateur !== 'CLIENT') {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(String(motDePasse), user.motDePasseHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { dernierLogin: new Date() },
    });

    const token = signToken(user);
    const { motDePasseHash, otpCode, otpExpire, misAJourLe, ...safe } = user;
    res.json({ token, user: serializeUser(safe) });
  } catch (err: unknown) {
    console.error('POST /api/client-auth/login error:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// GET /api/client-auth/me — Profil du client connecté
router.get('/me', requireClient, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id: req.user!.id },
      select: clientSelect,
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(serializeUser(user));
  } catch (err: unknown) {
    console.error('GET /api/client-auth/me error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// PATCH /api/client-auth/me — Mise à jour du profil du client connecté
router.patch('/me', requireClient, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      prenom, nom, telephone, adresse, dateNaissance, matriculeFiscale, activite,
      email, currentPassword, newPassword,
    } = req.body;

    const data: Record<string, unknown> = {};
    if (prenom !== undefined) data.prenom = prenom?.trim() || null;
    if (nom !== undefined) data.nom = nom?.trim() || null;
    if (telephone !== undefined) data.telephone = telephone?.trim() || null;
    if (adresse !== undefined) data.adresse = adresse?.trim() || null;
    if (matriculeFiscale !== undefined) data.matriculeFiscale = matriculeFiscale?.trim() || null;
    if (activite !== undefined) data.activite = activite?.trim() || null;
    if (dateNaissance !== undefined) data.dateNaissance = dateNaissance ? new Date(dateNaissance) : null;
    // remise & typeUtilisateur ne sont JAMAIS modifiables par le client.

    // Changement d'email (avec garde d'unicité)
    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await prisma.utilisateur.findUnique({ where: { email: normalizedEmail } });
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }
      data.email = normalizedEmail;
    }

    // Changement de mot de passe (nécessite le mot de passe actuel)
    if (newPassword) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères' });
      }
      const current = await prisma.utilisateur.findUnique({ where: { id: userId } });
      if (!current) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
      const valid = await bcrypt.compare(String(currentPassword || ''), current.motDePasseHash);
      if (!valid) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }
      data.motDePasseHash = await bcrypt.hash(String(newPassword), 12);
    }

    const updated = await prisma.utilisateur.update({
      where: { id: userId },
      data,
      select: clientSelect,
    });

    res.json(serializeUser(updated));
  } catch (err: unknown) {
    console.error('PATCH /api/client-auth/me error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

export default router;
