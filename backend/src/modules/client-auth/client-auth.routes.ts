import { Router, Request, Response } from 'express';
import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../auth/auth.service';
import { requireClient, AuthRequest } from '../auth/auth.middleware';
import {
  sendPasswordResetEmail,
} from './client-auth.service';

const router = Router();

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
  activiteCategoryId: true,
  typeUtilisateur: true,
  creeLe: true,
  dernierLogin: true,
} as const;

type SelectedUser = {
  remise: unknown;
  [key: string]: unknown;
};

function serializeUser(user: SelectedUser) {
  return { ...user, remise: Number(user.remise) };
}

function signToken(user: { id: number; email: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, type: 'CLIENT' },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as string } as any
  );
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/client-auth/register — Inscription directe sans validation email
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, motDePasse, prenom, nom, telephone, adresse, matriculeFiscale, activiteCategoryId } = req.body;

    if (!email || !motDePasse || !prenom || !nom || !matriculeFiscale || !activiteCategoryId) {
      return res.status(400).json({ error: 'Email, mot de passe, prénom, nom, matricule fiscale et activité sont requis' });
    }
    if (String(motDePasse).length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await prisma.utilisateur.findFirst({ where: { email: normalizedEmail, typeUtilisateur: 'CLIENT' } });
    if (existing) {
      return res.status(409).json({ error: 'Un compte avec cet email existe deja' });
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
        matriculeFiscale: matriculeFiscale?.trim(),
        activiteCategoryId: parseInt(activiteCategoryId, 10),
        typeUtilisateur: 'CLIENT',
        dernierLogin: new Date(),
      },
      select: clientSelect,
    });

    // Inscription automatique à la newsletter lors de la création de compte
    try {
      await prisma.newsletterAbonne.upsert({
        where: { email: normalizedEmail },
        update: { actif: true },
        create: { email: normalizedEmail },
      });
    } catch (newsErr) {
      console.error('[Newsletter] Erreur inscription auto:', newsErr);
      // On ne bloque pas la création de compte si l'inscription newsletter échoue
    }

    const jwtToken = signToken(user);
    res.status(201).json({ token: jwtToken, user: serializeUser(user) });
  } catch (err: unknown) {
    console.error('POST /api/client-auth/register error:', err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});



// POST /api/client-auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.utilisateur.findFirst({ where: { email: normalizedEmail, typeUtilisateur: 'CLIENT' } });

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(String(motDePasse), user.motDePasseHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    await prisma.utilisateur.update({ where: { id: user.id }, data: { dernierLogin: new Date() } });

    const token = signToken(user);
    const { motDePasseHash, otpCode, otpExpire, misAJourLe, ...safe } = user;
    res.json({ token, user: serializeUser(safe) });
  } catch (err: unknown) {
    console.error('POST /api/client-auth/login error:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// POST /api/client-auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const genericResponse = { message: "Si ce compte existe, un email de reinitialisation a ete envoye." };

    const user = await prisma.utilisateur.findFirst({ where: { email: normalizedEmail, typeUtilisateur: 'CLIENT' } });
    if (!user) {
      return res.json(genericResponse);
    }

    const token = generateSecureToken();
    const expireA = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.tokenReset.upsert({
      where: { utilisateurId: user.id },
      update: { token, expireA },
      create: { utilisateurId: user.id, token, expireA },
    });

    try {
      await sendPasswordResetEmail(normalizedEmail, token, user.prenom || 'Client');
    } catch (mailErr) {
      console.error('POST /api/client-auth/forgot-password — échec envoi email:', mailErr);
    }

    res.json(genericResponse);
  } catch (err: unknown) {
    console.error('POST /api/client-auth/forgot-password error:', err);
    res.status(500).json({ error: 'Erreur lors de la demande de reinitialisation' });
  }
});

// POST /api/client-auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caracteres' });
    }

    const tokenRecord = await prisma.tokenReset.findUnique({ where: { token } });

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Lien de reinitialisation invalide ou deja utilise.' });
    }
    if (new Date() > tokenRecord.expireA) {
      await prisma.tokenReset.delete({ where: { token } });
      return res.status(400).json({
        error: 'Ce lien a expire (1h). Veuillez faire une nouvelle demande.',
        expired: true,
      });
    }

    const hash = await bcrypt.hash(String(newPassword), 12);

    await prisma.$transaction([
      prisma.utilisateur.update({
        where: { id: tokenRecord.utilisateurId },
        data: { motDePasseHash: hash },
      }),
      prisma.tokenReset.delete({ where: { token } }),
    ]);

    res.json({ message: 'Mot de passe reinitialise avec succes. Vous pouvez maintenant vous connecter.' });
  } catch (err: unknown) {
    console.error('POST /api/client-auth/reset-password error:', err);
    res.status(500).json({ error: 'Erreur lors de la reinitialisation' });
  }
});

// GET /api/client-auth/me
router.get('/me', requireClient, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.utilisateur.findUnique({
      where: { id: req.user!.id },
      select: clientSelect,
    });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouve' });
    }
    res.json(serializeUser(user));
  } catch (err: unknown) {
    console.error('GET /api/client-auth/me error:', err);
    res.status(500).json({ error: 'Erreur lors de la recuperation du profil' });
  }
});

// PATCH /api/client-auth/me
router.patch('/me', requireClient, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { prenom, nom, telephone, adresse, dateNaissance, matriculeFiscale, activiteCategoryId, email, currentPassword, newPassword } = req.body;

    const data: Record<string, unknown> = {};
    if (prenom !== undefined) data.prenom = prenom?.trim() || null;
    if (nom !== undefined) data.nom = nom?.trim() || null;
    if (telephone !== undefined) data.telephone = telephone?.trim() || null;
    if (adresse !== undefined) data.adresse = adresse?.trim() || null;
    if (matriculeFiscale !== undefined) data.matriculeFiscale = matriculeFiscale?.trim() || null;
    if (activiteCategoryId !== undefined) data.activiteCategoryId = activiteCategoryId ? parseInt(activiteCategoryId, 10) : null;
    if (dateNaissance !== undefined) data.dateNaissance = dateNaissance ? new Date(dateNaissance) : null;

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await prisma.utilisateur.findFirst({ where: { email: normalizedEmail, typeUtilisateur: 'CLIENT' } });
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Cet email est deja utilise' });
      }
      data.email = normalizedEmail;
    }

    if (newPassword) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caracteres' });
      }
      const current = await prisma.utilisateur.findUnique({ where: { id: userId } });
      if (!current) {
        return res.status(404).json({ error: 'Utilisateur non trouve' });
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
    res.status(500).json({ error: 'Erreur lors de la mise a jour du profil' });
  }
});

export default router;
