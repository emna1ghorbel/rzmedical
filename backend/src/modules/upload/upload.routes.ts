import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer storage
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '200', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.isAbsolute(uploadDir)
      ? uploadDir
      : path.join(process.cwd(), uploadDir);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
});

const router = Router();

// Route pour un seul fichier (ex: logo, PDF)
router.post('/single', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier uploadé' });
  }
  // Retourne le chemin d'accès public
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Route pour plusieurs fichiers (ex: images de produit)
router.post('/multiple', upload.array('files', 10), (req: Request, res: Response) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({ error: 'Aucun fichier uploadé' });
  }
  
  const urls = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
  res.json({ urls });
});

export default router;
