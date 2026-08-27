import { Router } from 'express';
import prisma from '../../config/prisma';
import { requireAuth } from '../auth/auth.middleware';
import path from 'path';
import fs from 'fs';

const router = Router();
const dates = (body: any) => ({ ...body, dateDebut: body.dateDebut ? new Date(body.dateDebut) : null, dateFin: body.dateFin ? new Date(body.dateFin) : null, ordre: Number(body.ordre) || 0, categorieId: body.categorieId ? Number(body.categorieId) : null });

// ─── Public endpoint ─────────────────────────────────────────────────────────
router.get('/public', async (req, res) => {
  const now = new Date();
  const categorieId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined;

  const [annonces, bannieres, videoHero, alertes] = await Promise.all([
    prisma.annonceSite.findMany({ where: { actif: true }, orderBy: { ordre: 'asc' } }),
    prisma.banniereSite.findMany({ 
      where: { 
        actif: true, 
        AND: [
          { OR: [{ dateDebut: null }, { dateDebut: { lte: now } }] }, 
          { OR: [{ dateFin: null }, { dateFin: { gte: now } }] }
        ],
        OR: categorieId 
          ? [{ categorieId: null }, { categorieId }]
          : [{ categorieId: null }]
      }, 
      orderBy: { ordre: 'asc' } 
    }),
    prisma.videoHero.findFirst({ where: { actif: true } }),
    prisma.alerteSite.findMany({
      where: {
        actif: true,
        AND: [
          { OR: [{ dateDebut: null }, { dateDebut: { lte: now } }] },
          { OR: [{ dateFin: null }, { dateFin: { gte: now } }] },
        ],
      },
      orderBy: { creeLe: 'desc' },
    }),
  ]);
  res.json({ annonces, bannieres, videoHero: videoHero || null, alertes });
});

// ─── Admin: list all ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (_req, res) => {
  const [annonces, bannieres, videos, alertes] = await Promise.all([
    prisma.annonceSite.findMany({ orderBy: { ordre: 'asc' } }),
    prisma.banniereSite.findMany({ orderBy: { ordre: 'asc' } }),
    prisma.videoHero.findMany({ orderBy: { creeLe: 'desc' } }),
    prisma.alerteSite.findMany({ orderBy: { creeLe: 'desc' } }),
  ]);
  res.json({ annonces, bannieres, videos, alertes });
});

// ─── Alertes ──────────────────────────────────────────────────────────────────
router.post('/alertes', requireAuth, async (req, res) => {
  try {
    const { type, affichage, titre, message, lien, texteBouton, actif, dateDebut, dateFin } = req.body;
    if (!titre?.trim() || !message?.trim()) return res.status(400).json({ error: 'Le titre et le message sont requis' });
    const alerte = await prisma.alerteSite.create({
      data: {
        type: type || 'INFO',
        affichage: affichage || 'POPUP',
        titre: titre.trim(),
        message: message.trim(),
        lien: lien?.trim() || null,
        texteBouton: texteBouton?.trim() || null,
        actif: actif ?? true,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
      },
    });
    res.status(201).json(alerte);
  } catch (err: any) { res.status(500).json({ error: err.message || 'Erreur lors de la création de l\'alerte' }); }
});
router.put('/alertes/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { dateDebut, dateFin, ...rest } = req.body;
    const alerte = await prisma.alerteSite.update({
      where: { id },
      data: { ...rest, dateDebut: dateDebut ? new Date(dateDebut) : null, dateFin: dateFin ? new Date(dateFin) : null },
    });
    res.json(alerte);
  } catch (err: any) { res.status(500).json({ error: err.message || 'Erreur de modification' }); }
});
router.delete('/alertes/:id', requireAuth, async (req, res) => {
  try {
    await prisma.alerteSite.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err: any) { res.status(500).json({ error: err.message || 'Erreur de suppression' }); }
});

router.post('/annonces', requireAuth, async (req, res) => {
  try {
    const texte = typeof req.body.texte === 'string' ? req.body.texte.trim() : '';
    if (!texte) return res.status(400).json({ error: 'Le texte de la phrase est requis' });
    const annonce = await prisma.annonceSite.create({ data: { texte, actif: req.body.actif ?? true, ordre: Number(req.body.ordre) || 0, dureeSecondes: Number(req.body.dureeSecondes) || 5 } });
    res.status(201).json(annonce);
  } catch (error: any) { res.status(500).json({ error: error.message || 'Erreur lors de l\'ajout de la phrase' }); }
});
router.put('/annonces/:id', requireAuth, async (req, res) => res.json(await prisma.annonceSite.update({ where: { id: Number(req.params.id) }, data: { ...req.body, ordre: Number(req.body.ordre) || 0, dureeSecondes: Number(req.body.dureeSecondes) || 5 } })));
router.delete('/annonces/:id', requireAuth, async (req, res) => { await prisma.annonceSite.delete({ where: { id: Number(req.params.id) } }); res.status(204).send(); });

// ─── Bannières ────────────────────────────────────────────────────────────────
router.post('/bannieres', requireAuth, async (req, res) => res.status(201).json(await prisma.banniereSite.create({ data: dates(req.body) })));
router.put('/bannieres/:id', requireAuth, async (req, res) => res.json(await prisma.banniereSite.update({ where: { id: Number(req.params.id) }, data: dates(req.body) })));
router.delete('/bannieres/:id', requireAuth, async (req, res) => { await prisma.banniereSite.delete({ where: { id: Number(req.params.id) } }); res.status(204).send(); });

// ─── Hero Videos ──────────────────────────────────────────────────────────────

// POST /site-content/videos — create a new hero video
router.post('/videos', requireAuth, async (req, res) => {
  try {
    const { videoUrl, posterUrl, titre } = req.body;
    if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
      return res.status(400).json({ error: 'L\'URL de la vidéo est requise' });
    }
    const video = await prisma.videoHero.create({
      data: { videoUrl: videoUrl.trim(), posterUrl: posterUrl?.trim() || null, titre: titre?.trim() || null, actif: false },
    });
    res.status(201).json(video);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de la création de la vidéo' });
  }
});

// PATCH /site-content/videos/:id/activate — activate a video (deactivates all others)
router.patch('/videos/:id/activate', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });

    const video = await prisma.videoHero.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });

    // Use transaction: deactivate all, then activate the target
    await prisma.$transaction([
      prisma.videoHero.updateMany({ data: { actif: false } }),
      prisma.videoHero.update({ where: { id }, data: { actif: true } }),
    ]);

    const updated = await prisma.videoHero.findUnique({ where: { id } });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de l\'activation' });
  }
});

// PATCH /site-content/videos/:id/deactivate — deactivate a video
router.patch('/videos/:id/deactivate', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });

    const video = await prisma.videoHero.update({ where: { id }, data: { actif: false } });
    res.json(video);
  } catch (err: any) {
    if ((err as any).code === 'P2025') return res.status(404).json({ error: 'Vidéo introuvable' });
    res.status(500).json({ error: err.message || 'Erreur lors de la désactivation' });
  }
});

// DELETE /site-content/videos/:id — delete a video and its file
router.delete('/videos/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalide' });

    const video = await prisma.videoHero.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: 'Vidéo introuvable' });

    // Delete file from disk if it's a local upload
    const tryDeleteFile = (url: string | null) => {
      if (!url || url.startsWith('http://') || url.startsWith('https://')) return;
      const filePath = path.join(__dirname, '../../../uploads', path.basename(url));
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    };

    tryDeleteFile(video.videoUrl);
    tryDeleteFile(video.posterUrl);

    await prisma.videoHero.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de la suppression' });
  }
});

export default router;
