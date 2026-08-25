import { Router } from 'express';
import nodemailer from 'nodemailer';
import { requireClient, requireAuth, AuthRequest } from '../auth/auth.middleware';
import prisma from '../../config/prisma';

const router = Router();

router.post('/', async (req: AuthRequest, res) => {
  const { sujet, message, nom, email, telephone } = req.body;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  let utilisateurId: number | undefined;
  if (token) {
    try {
      const decoded = (await import('jsonwebtoken')).default.verify(token, (await import('../auth/auth.service')).JWT_SECRET) as { id: number; type: string };
      if (decoded.type === 'CLIENT') utilisateurId = decoded.id;
    } catch { /* formulaire public */ }
  }
  if (!sujet?.trim() || !message?.trim() || (!utilisateurId && (!nom?.trim() || !email?.trim()))) {
    return res.status(400).json({ error: 'Sujet, message, nom et email requis' });
  }
  const ticket = await prisma.ticketSupport.create({
    data: {
      utilisateurId,
      nomContact: utilisateurId ? undefined : nom.trim(),
      emailContact: utilisateurId ? undefined : email.trim(),
      telephoneContact: utilisateurId ? undefined : telephone?.trim(),
      sujet: sujet.trim(),
      message: message.trim(),
      messages: { create: { auteur: 'CLIENT', contenu: message.trim() } },
    },
  });
  res.status(201).json(ticket);
});

router.get('/my', requireClient, async (req: AuthRequest, res) => {
  const tickets = await prisma.ticketSupport.findMany({
    where: { utilisateurId: req.user!.id },
    orderBy: { creeLe: 'desc' },
    include: { messages: { orderBy: { creeLe: 'asc' } } },
  });
  res.json(tickets);
});

router.post('/my/:id/messages', requireClient, async (req: AuthRequest, res) => {
  const ticketId = Number(req.params.id);
  const { contenu } = req.body;
  if (!Number.isInteger(ticketId) || !contenu?.trim()) return res.status(400).json({ error: 'Message requis' });
  const ticket = await prisma.ticketSupport.findFirst({ where: { id: ticketId, utilisateurId: req.user!.id } });
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' });
  const message = await prisma.messageSupport.create({ data: { ticketId, auteur: 'CLIENT', contenu: contenu.trim() } });
  await prisma.ticketSupport.update({ where: { id: ticketId }, data: { statut: 'EN_COURS' } });
  res.status(201).json(message);
});

router.get('/admin', requireAuth, async (_req, res) => {
  const tickets = await prisma.ticketSupport.findMany({
    include: { utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } }, messages: { orderBy: { creeLe: 'asc' } } },
    orderBy: { creeLe: 'desc' },
  });
  res.json(tickets);
});

router.patch('/admin/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { reponse, statut, canalReponse } = req.body;
  if (!Number.isInteger(id) || !reponse?.trim()) {
    return res.status(400).json({ error: 'Réponse requise' });
  }
  const existingTicket = await prisma.ticketSupport.findUnique({
    where: { id },
    select: { utilisateurId: true },
  });
  if (!existingTicket) return res.status(404).json({ error: 'Ticket introuvable' });
  if (!existingTicket.utilisateurId && canalReponse === 'SUPPORT') {
    return res.status(400).json({ error: 'Un visiteur sans compte peut être contacté uniquement par email ou téléphone' });
  }
  const ticket = await prisma.ticketSupport.update({
    where: { id },
    data: {
      reponse: reponse.trim(),
      statut: statut || 'REPONDU',
      canalReponse: canalReponse || 'SUPPORT',
      reponduLe: new Date(),
      messages: { create: { auteur: 'ADMIN', contenu: reponse.trim(), canal: canalReponse || 'SUPPORT' } },
    },
    include: { utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } }, messages: { orderBy: { creeLe: 'asc' } } },
  });
  if (canalReponse === 'EMAIL') {
    const recipient = ticket.utilisateur?.email || ticket.emailContact;
    let emailErreur: string | undefined;
    try {
      if (!recipient) throw new Error('Email client introuvable');
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) throw new Error('Configuration email manquante');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
      });
      await transporter.sendMail({
        from: `RZMedical Support <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: `Re: ${ticket.sujet}`,
        text: reponse.trim(),
      });
    } catch (error) {
      emailErreur = error instanceof Error ? error.message : 'Échec de l’envoi email';
    }
    return res.json({ ...ticket, emailErreur });
  }
  res.json(ticket);
});

export default router;
