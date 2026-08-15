import 'dotenv/config';
import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

const router = Router();

const getClient = () => {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  
  if (!user || !pass) {
    console.error(`[INBOX] Credentials manquants: EMAIL_USER=${user ? 'OK' : 'MANQUANT'}, EMAIL_PASS=${pass ? 'OK' : 'MANQUANT'}`);
  }
  
  return new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false
  });
};

const getMailboxPath = async (client: ImapFlow, folderType: string): Promise<string> => {
  if (folderType === 'Inbox') return 'INBOX';
  
  const mailboxes = await client.list();
  for (let mb of mailboxes) {
    if (folderType === 'Sent' && mb.specialUse === '\\Sent') return mb.path;
    if (folderType === 'Trash' && mb.specialUse === '\\Trash') return mb.path;
    if (folderType === 'Spam' && mb.specialUse === '\\Junk') return mb.path;
    if (folderType === 'Drafts' && mb.specialUse === '\\Drafts') return mb.path;
    if (folderType === 'Archive' && mb.specialUse === '\\Archive') return mb.path;
  }
  
  // Fallbacks for French Gmail
  if (folderType === 'Sent') return '[Gmail]/Messages envoy&AOk-s'; // IMAP encoding for Envoyés
  if (folderType === 'Trash') return '[Gmail]/Corbeille';
  if (folderType === 'Spam') return '[Gmail]/Spam';
  if (folderType === 'Drafts') return '[Gmail]/Brouillons';
  
  return 'INBOX';
};

// 1. GET EMAILS BY FOLDER
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const folder = (req.query.folder as string) || 'Inbox';
  const client = getClient();

  try {
    await client.connect();
    const mbPath = await getMailboxPath(client, folder);
    
    let lock;
    try {
      lock = await client.getMailboxLock(mbPath);
    } catch (e) {
      return res.json([]); // Dossier vide ou inexistant
    }

    try {
      const latestMessageSeq = client.mailbox.exists;
      if (latestMessageSeq === 0) return res.json([]); // Pas d'emails

      const startSeq = Math.max(1, latestMessageSeq - 19); // 20 derniers
      const messages = [];

      for await (let message of client.fetch(`${startSeq}:${latestMessageSeq}`, { envelope: true, flags: true, source: true })) {
        let parsed = await simpleParser(message.source);
        let textSnippet = parsed.text ? parsed.text.substring(0, 100).replace(/\n/g, ' ') + '...' : '(Pas de contenu texte)';

        messages.push({
          id: message.uid,
          seq: message.seq,
          sender: message.envelope.from?.[0]?.name || message.envelope.from?.[0]?.address || 'Inconnu',
          senderEmail: message.envelope.from?.[0]?.address || '',
          subject: message.envelope.subject || '(Aucun sujet)',
          snippet: textSnippet,
          date: message.envelope.date.toISOString(),
          isStarred: message.flags.has('\\Flagged'),
          isUnread: !message.flags.has('\\Seen'),
        });
      }

      res.json(messages.reverse());
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("IMAP Fetch Error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des emails" });
  } finally {
    await client.logout();
  }
});

// 2. GET SINGLE EMAIL DETAILS
router.get('/:uid', requireAuth, async (req: Request, res: Response) => {
  const uid = req.params.uid;
  const folder = (req.query.folder as string) || 'Inbox';
  const client = getClient();

  try {
    await client.connect();
    const mbPath = await getMailboxPath(client, folder);
    
    let lock = await client.getMailboxLock(mbPath);
    try {
      const message = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
      if (!message) return res.status(404).json({ error: "Email non trouvé" });

      const parsed = await simpleParser(message.source);
      
      res.json({
        id: message.uid,
        subject: parsed.subject,
        from: parsed.from?.text,
        to: parsed.to?.text,
        date: parsed.date?.toISOString(),
        html: parsed.html || parsed.textAsHtml || parsed.text,
      });
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("IMAP Fetch One Error:", err);
    res.status(500).json({ error: "Erreur lors de la récupération du message" });
  } finally {
    await client.logout();
  }
});

// 3. POST ACTIONS (Read, Star, Trash)
router.post('/action', requireAuth, async (req: Request, res: Response) => {
  const { uids, action, folder } = req.body; // uids: number[], action: 'read' | 'unread' | 'star' | 'unstar' | 'trash'
  if (!uids || !uids.length || !action) return res.status(400).json({ error: "Paramètres invalides" });
  
  const client = getClient();
  try {
    await client.connect();
    const mbPath = await getMailboxPath(client, folder || 'Inbox');
    let lock = await client.getMailboxLock(mbPath);
    
    try {
      const uidString = uids.join(',');
      if (action === 'read') await client.messageFlagsAdd(uidString, ['\\Seen'], { uid: true });
      if (action === 'unread') await client.messageFlagsRemove(uidString, ['\\Seen'], { uid: true });
      if (action === 'star') await client.messageFlagsAdd(uidString, ['\\Flagged'], { uid: true });
      if (action === 'unstar') await client.messageFlagsRemove(uidString, ['\\Flagged'], { uid: true });
      
      if (action === 'trash') {
        const trashPath = await getMailboxPath(client, 'Trash');
        await client.messageMove(uidString, trashPath, { uid: true });
      }
      
      res.json({ success: true });
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("IMAP Action Error:", err);
    res.status(500).json({ error: "Erreur lors de l'action" });
  } finally {
    await client.logout();
  }
});

// 4. POST SEND EMAIL
router.post('/send', requireAuth, async (req: Request, res: Response) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || !text) return res.status(400).json({ error: "Paramètres manquants" });

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MediSupply Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br/>'),
    });

    res.json({ success: true, message: "Email envoyé avec succès" });
  } catch (err) {
    console.error("SMTP Send Error:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
  }
});

export default router;
