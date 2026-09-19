import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import prisma from '../../config/prisma';

// ─── Helpers ────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.split(' ').map(w => {
    if (w.toLowerCase() === 'et') return 'et';
    if (!w) return '';
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

function numberToFrench(n: number): string {
  if (n === 0) return 'zéro';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function convertBelow100(num: number): string {
    if (num < 20) return units[num];
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (t === 7) return 'soixante et onze';
    if (t === 9) return 'quatre-vingt-' + units[10 + u];
    if (u === 0) return t === 8 ? 'quatre-vingts' : tens[t];
    if (u === 1 && t !== 8) return tens[t] + ' et un';
    return tens[t] + '-' + units[u];
  }

  function convertBelow1000(num: number): string {
    if (num < 100) return convertBelow100(num);
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let prefix = h === 1 ? 'cent' : units[h] + ' cent';
    if (h > 1 && rest === 0) prefix += 's';
    if (rest === 0) return prefix;
    return prefix + ' ' + convertBelow100(rest);
  }

  function convertBelowMillion(num: number): string {
    if (num < 1000) return convertBelow1000(num);
    const k = Math.floor(num / 1000);
    const rest = num % 1000;
    let prefix = k === 1 ? 'mille' : convertBelow1000(k) + ' mille';
    if (rest === 0) return prefix;
    return prefix + ' ' + convertBelow1000(rest);
  }

  if (n < 1000000) return convertBelowMillion(n);
  const m = Math.floor(n / 1000000);
  const rest = n % 1000000;
  let prefix = m === 1 ? 'un million' : convertBelowMillion(m) + ' millions';
  if (rest === 0) return prefix;
  return prefix + ' ' + convertBelowMillion(rest);
}

export function amountToWordsTND(amount: number, devise = 'TND'): string {
  const rounded = Math.round(amount * 1000) / 1000;
  const dinars = Math.floor(rounded);
  const millimes = Math.round((rounded - dinars) * 1000);

  const isTND = devise === 'TND';
  const unit = isTND ? (dinars > 1 ? ' Dinars Tunisiens' : ' Dinar Tunisien') : ` ${devise}`;
  const subUnit = isTND ? (millimes > 1 ? ' Millimes' : ' Millime') : ' Centimes';

  const parts: string[] = [];
  if (dinars > 0) {
    parts.push(capitalize(numberToFrench(dinars)) + unit);
  } else {
    parts.push(`Zéro${unit}`);
  }

  if (millimes > 0) {
    parts.push('et ' + capitalize(numberToFrench(millimes)) + subUnit);
  }

  return parts.join(' ');
}

interface CompanyConfig {
  nomSociete: string;
  matriculeFiscale: string;
  adresse: string;
  telephone: string;
  fax: string;
  email: string;
  banque: string;
  rib: string;
  logoUrl: string | null;
}

function resolveLogoPath(logoUrl: string | null): string | null {
  if (logoUrl) {
    if (path.isAbsolute(logoUrl) && fs.existsSync(logoUrl)) return logoUrl;
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const relativePath = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
    const resolvedFromUploads = path.resolve(process.cwd(), relativePath);
    if (fs.existsSync(resolvedFromUploads)) return resolvedFromUploads;

    const resolvedFromUploadDir = path.resolve(process.cwd(), uploadDir, path.basename(logoUrl));
    if (fs.existsSync(resolvedFromUploadDir)) return resolvedFromUploadDir;
  }

  const candidates = [
    path.resolve(__dirname, '../../../assets/logo-rzmedical.png'),
    path.resolve(process.cwd(), 'assets/logo-rzmedical.png'),
    path.resolve(process.cwd(), '../web/public/images/logo/logo-rzmedical.png'),
    path.resolve(__dirname, '../../../../web/public/images/logo/logo-rzmedical.png'),
    path.resolve('E:/rzmedical/backend/assets/logo-rzmedical.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const getCompanyInfo = async (): Promise<CompanyConfig> => {
  try {
    const info = await prisma.infoSociete.findUnique({ where: { id: 1 } });
    if (info) {
      return {
        nomSociete: info.nomSociete || '',
        matriculeFiscale: (info as any).matriculeFiscale || '',
        adresse: info.adresse || '',
        telephone: info.telephone || '',
        fax: (info as any).fax || '',
        email: info.email || '',
        banque: (info as any).banque || '',
        rib: (info as any).rib || '',
        logoUrl: info.logoUrl || null,
      };
    }
  } catch {}
  return {
    nomSociete: '',
    matriculeFiscale: '',
    adresse: '',
    telephone: '',
    fax: '',
    email: '',
    banque: '',
    rib: '',
    logoUrl: null,
  };
};

const TEAL = '#539dba';
const BLACK = '#111827';
const GRAY_DARK = '#374151';
const GRAY_LIGHT = '#9ca3af';
const WHITE = '#ffffff';

// ─────────────────────────────────────────────────────────────────────────────
// 1. BON DE COMMANDE PDF
// ─────────────────────────────────────────────────────────────────────────────

export async function generateBonCommandePdf(bcId: number): Promise<Buffer> {
  const bc = await prisma.bonCommande.findUnique({
    where: { id: bcId },
    include: {
      lignes: true,
      fournisseur: true,
    },
  });
  if (!bc) throw new Error('Bon de commande introuvable');

  const company = await getCompanyInfo();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 15, bottom: 20, left: 15, right: 15 },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header Logo & Company
    const logoPath = resolveLogoPath(company.logoUrl);
    if (logoPath) {
      try {
        doc.image(logoPath, 20, 16, { width: 75, height: 85, fit: [75, 85] });
      } catch {}
    }

    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(14)
      .text(company.nomSociete, 16, 115);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_DARK)
      .text(company.adresse, 16, 132, { width: 250 })
      .text(`Tél : ${company.telephone}  |  Email : ${company.email}`, 16, 158)
      .text(`MF : ${company.matriculeFiscale}`, 16, 172);

    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(15)
      .text(`BON DE COMMANDE`, 16, 200)
      .fillColor(BLACK).fontSize(12)
      .text(`N° ${bc.code}`, 16, 220);

    // Box Top Right: Infos Commande
    const boxX = 293;
    const boxW = 287;
    const headerH = 20;

    const box1Y = 16;
    const box1H = 95;
    doc.rect(boxX, box1Y, boxW, box1H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box1Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text('Informations Commande', boxX, box1Y + 5, { width: boxW, align: 'center' });

    const dateCmd = new Date(bc.dateCommande).toLocaleDateString('fr-FR');
    const dateLivr = bc.dateLivraisonPrevue ? new Date(bc.dateLivraisonPrevue).toLocaleDateString('fr-FR') : '—';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`Code : ${bc.code}`, boxX + 10, box1Y + 28)
      .text(`Date commande : ${dateCmd}`, boxX + 10, box1Y + 44)
      .text(`Livraison prévue : ${dateLivr}`, boxX + 10, box1Y + 60)
      .text(`Statut : ${bc.statut}`, boxX + 10, box1Y + 76);

    // Box 2: Fournisseur
    const box2Y = 125;
    const box2H = 110;
    doc.rect(boxX, box2Y, boxW, box2H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box2Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text('Fournisseur', boxX, box2Y + 5, { width: boxW, align: 'center' });

    const fNom = bc.fournisseurNom || bc.fournisseur?.nom || '—';
    const fMF = bc.fournisseurMF || bc.fournisseur?.matriculeFiscale || '—';
    const fAdr = bc.fournisseurAdresse || bc.fournisseur?.adresse || '—';
    const fTel = bc.fournisseurTel || bc.fournisseur?.telephone || '—';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`Raison sociale : ${fNom}`, boxX + 10, box2Y + 28, { width: boxW - 20 })
      .text(`Matricule Fiscal : ${fMF}`, boxX + 10, box2Y + 48)
      .text(`Adresse : ${fAdr}`, boxX + 10, box2Y + 64, { width: boxW - 20 })
      .text(`Téléphone : ${fTel}`, boxX + 10, box2Y + 90);

    // Table des articles
    const tableX = 15;
    const tableW = 565;
    const tableY = 255;
    const tableHeaderH = 20;

    const cols = [
      { title: 'Désignation', x: 15, w: 260, align: 'left' },
      { title: 'Quantité', x: 275, w: 55, align: 'right' },
      { title: 'P.U. HT', x: 330, w: 75, align: 'right' },
      { title: 'Rem %', x: 405, w: 40, align: 'right' },
      { title: 'TVA', x: 445, w: 45, align: 'right' },
      { title: 'Total HT', x: 490, w: 90, align: 'right' },
    ];

    doc.rect(tableX, tableY, tableW, tableHeaderH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
    for (const c of cols) {
      doc.text(c.title, c.x + 3, tableY + 5, { width: c.w - 6, align: c.align as any });
    }

    let curY = tableY + tableHeaderH;
    const rowH = 18;
    const lignes = bc.lignes || [];

    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK);
    for (const l of lignes) {
      const qte = Number(l.quantite).toString();
      const pu = Number(l.prixUnitaireHT).toFixed(3);
      const rem = Number(l.remise) > 0 ? `${Number(l.remise)}%` : '0%';
      const tva = `${Number(l.tauxTVA)}%`;
      const tot = Number(l.totalHT).toFixed(3);

      doc.text(l.designation, cols[0].x + 3, curY + 4, { width: cols[0].w - 6, align: 'left', lineBreak: false });
      doc.text(qte, cols[1].x + 3, curY + 4, { width: cols[1].w - 6, align: 'right', lineBreak: false });
      doc.text(pu, cols[2].x + 3, curY + 4, { width: cols[2].w - 6, align: 'right', lineBreak: false });
      doc.text(rem, cols[3].x + 3, curY + 4, { width: cols[3].w - 6, align: 'right', lineBreak: false });
      doc.text(tva, cols[4].x + 3, curY + 4, { width: cols[4].w - 6, align: 'right', lineBreak: false });
      doc.text(tot, cols[5].x + 3, curY + 4, { width: cols[5].w - 6, align: 'right', lineBreak: false });

      curY += rowH;
    }

    const tableBottom = Math.max(curY, 440);
    doc.rect(tableX, tableY, tableW, tableBottom - tableY).lineWidth(0.75).strokeColor(TEAL).stroke();

    // Totals Block
    const totalsY = tableBottom + 15;
    const totalsBoxW = 230;
    const totalsX = tableX + tableW - totalsBoxW;

    doc.rect(totalsX, totalsY, totalsBoxW, 90).lineWidth(0.75).strokeColor(TEAL).stroke();
    const row = (label: string, val: string, yPos: number, isBold = false) => {
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(BLACK);
      doc.text(label, totalsX + 8, yPos);
      doc.text(val, totalsX + 90, yPos, { width: totalsBoxW - 98, align: 'right' });
    };

    row('Total HT :', `${Number(bc.montantHT).toFixed(3)} ${bc.devise}`, totalsY + 8);
    row('Remise :', `${Number(bc.montantRemise).toFixed(3)} ${bc.devise}`, totalsY + 24);
    row('Total TVA :', `${Number(bc.montantTVA).toFixed(3)} ${bc.devise}`, totalsY + 40);
    row('Timbre Fiscal :', `${Number(bc.timbreFiscal).toFixed(3)} ${bc.devise}`, totalsY + 56);
    doc.rect(totalsX, totalsY + 70, totalsBoxW, 20).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text('TOTAL TTC :', totalsX + 8, totalsY + 75)
      .text(`${Number(bc.montantTTC).toFixed(3)} ${bc.devise}`, totalsX + 90, totalsY + 75, { width: totalsBoxW - 98, align: 'right' });

    // In Words
    const wordsY = totalsY + 10;
    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK)
      .text('Arrêté le présent bon de commande à la somme de :', tableX, wordsY)
      .font('Helvetica-BoldOblique').fontSize(9)
      .text(amountToWordsTND(Number(bc.montantTTC), bc.devise), tableX, wordsY + 15, { width: 310 });

    if (bc.commentaire) {
      doc.font('Helvetica-Oblique').fontSize(8).fillColor(GRAY_DARK)
        .text(`Note / Commentaire : ${bc.commentaire}`, tableX, wordsY + 45, { width: 310 });
    }

    // Signatures
    const sigY = totalsY + 115;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
      .text('Signature & Cachet Fournisseur', tableX + 30, sigY)
      .text('Pour RZMedical (Direction)', tableX + 370, sigY);

    doc.rect(tableX + 20, sigY + 15, 170, 50).lineWidth(0.5).strokeColor(GRAY_LIGHT).stroke();
    doc.rect(tableX + 360, sigY + 15, 170, 50).lineWidth(0.5).strokeColor(GRAY_LIGHT).stroke();

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BON DE RÉCEPTION PDF
// ─────────────────────────────────────────────────────────────────────────────

export async function generateBonReceptionPdf(brId: number): Promise<Buffer> {
  const br = await prisma.bonReception.findUnique({
    where: { id: brId },
    include: {
      lignes: true,
      fournisseur: true,
      bonCommande: true,
    },
  });
  if (!br) throw new Error('Bon de réception introuvable');

  const company = await getCompanyInfo();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 15, bottom: 20, left: 15, right: 15 },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const logoPath = resolveLogoPath(company.logoUrl);
    if (logoPath) {
      try {
        doc.image(logoPath, 20, 16, { width: 75, height: 85, fit: [75, 85] });
      } catch {}
    }

    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(14)
      .text(company.nomSociete, 16, 115);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_DARK)
      .text(company.adresse, 16, 132, { width: 250 })
      .text(`Tél : ${company.telephone}  |  Email : ${company.email}`, 16, 158);

    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(15)
      .text(`BON DE RÉCEPTION`, 16, 190)
      .fillColor(BLACK).fontSize(12)
      .text(`N° ${br.code}`, 16, 210);

    // Box Top Right: Infos Réception
    const boxX = 293;
    const boxW = 287;
    const headerH = 20;

    const box1Y = 16;
    const box1H = 95;
    doc.rect(boxX, box1Y, boxW, box1H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box1Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text('Informations Réception', boxX, box1Y + 5, { width: boxW, align: 'center' });

    const dateRec = new Date(br.dateReception).toLocaleDateString('fr-FR');
    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`N° BR : ${br.code}`, boxX + 10, box1Y + 28)
      .text(`Date réception : ${dateRec}`, boxX + 10, box1Y + 44)
      .text(`Bon de commande lié : ${br.bonCommande?.code ?? 'Aucun'}`, boxX + 10, box1Y + 60)
      .text(`Statut : ${br.statut}`, boxX + 10, box1Y + 76);

    // Box 2: Fournisseur
    const box2Y = 125;
    const box2H = 85;
    doc.rect(boxX, box2Y, boxW, box2H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box2Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text('Fournisseur', boxX, box2Y + 5, { width: boxW, align: 'center' });

    const fNom = br.fournisseurNom || br.fournisseur?.nom || '—';
    const fTel = br.fournisseur?.telephone || '—';
    const fMF = br.fournisseur?.matriculeFiscale || '—';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`Raison sociale : ${fNom}`, boxX + 10, box2Y + 28, { width: boxW - 20 })
      .text(`Matricule Fiscal : ${fMF}`, boxX + 10, box2Y + 46)
      .text(`Téléphone : ${fTel}`, boxX + 10, box2Y + 64);

    // Table
    const tableX = 15;
    const tableW = 565;
    const tableY = 240;
    const tableHeaderH = 20;

    const cols = [
      { title: 'Désignation article', x: 15, w: 250, align: 'left' },
      { title: 'Qté Cmd', x: 265, w: 60, align: 'right' },
      { title: 'Qté Reçue', x: 325, w: 65, align: 'right' },
      { title: 'P.U. HT', x: 390, w: 75, align: 'right' },
      { title: 'TVA', x: 465, w: 40, align: 'right' },
      { title: 'Total HT', x: 505, w: 75, align: 'right' },
    ];

    doc.rect(tableX, tableY, tableW, tableHeaderH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
    for (const c of cols) {
      doc.text(c.title, c.x + 3, tableY + 5, { width: c.w - 6, align: c.align as any });
    }

    let curY = tableY + tableHeaderH;
    const rowH = 18;
    const lignes = br.lignes || [];

    let totalRecuHT = 0;
    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK);
    for (const l of lignes) {
      const qCmd = Number(l.quantiteCmd).toString();
      const qRec = Number(l.quantiteRecue).toString();
      const pu = Number(l.prixUnitaireHT).toFixed(3);
      const tva = `${Number(l.tauxTVA)}%`;
      const tot = (Number(l.quantiteRecue) * Number(l.prixUnitaireHT)).toFixed(3);
      totalRecuHT += Number(tot);

      doc.text(l.designation, cols[0].x + 3, curY + 4, { width: cols[0].w - 6, align: 'left', lineBreak: false });
      doc.text(qCmd, cols[1].x + 3, curY + 4, { width: cols[1].w - 6, align: 'right', lineBreak: false });
      doc.font('Helvetica-Bold').text(qRec, cols[2].x + 3, curY + 4, { width: cols[2].w - 6, align: 'right', lineBreak: false }).font('Helvetica');
      doc.text(pu, cols[3].x + 3, curY + 4, { width: cols[3].w - 6, align: 'right', lineBreak: false });
      doc.text(tva, cols[4].x + 3, curY + 4, { width: cols[4].w - 6, align: 'right', lineBreak: false });
      doc.text(tot, cols[5].x + 3, curY + 4, { width: cols[5].w - 6, align: 'right', lineBreak: false });

      curY += rowH;
    }

    const tableBottom = Math.max(curY, 440);
    doc.rect(tableX, tableY, tableW, tableBottom - tableY).lineWidth(0.75).strokeColor(TEAL).stroke();

    // Conformité / Notes
    const notesY = tableBottom + 15;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
      .text('Contrôle qualité et conformité des réceptions :', tableX, notesY);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_DARK)
      .text('Tous les articles ont été vérifiés au déchargement (emballage, étiquetage, dates de péremption, quantités conformes au bon de livraison transporteur).', tableX, notesY + 15, { width: 340 });

    if (br.stockMisAJour) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#059669')
        .text('✓ Le stock des articles a été incrémenté et synchronisé en magasin.', tableX, notesY + 45);
    }

    // Totals Box
    const totalsBoxW = 200;
    const totalsX = tableX + tableW - totalsBoxW;
    doc.rect(totalsX, notesY, totalsBoxW, 40).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
      .text('VALEUR HT REÇUE :', totalsX + 8, notesY + 14)
      .text(`${totalRecuHT.toFixed(3)} TND`, totalsX + 100, notesY + 14, { width: totalsBoxW - 108, align: 'right' });

    // Visas
    const sigY = notesY + 90;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK)
      .text('Visa & Signature Magasinier', tableX + 30, sigY)
      .text('Visa Contrôle Qualité / Responsable', tableX + 350, sigY);

    doc.rect(tableX + 20, sigY + 15, 180, 50).lineWidth(0.5).strokeColor(GRAY_LIGHT).stroke();
    doc.rect(tableX + 340, sigY + 15, 180, 50).lineWidth(0.5).strokeColor(GRAY_LIGHT).stroke();

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FACTURE FOURNISSEUR PDF
// ─────────────────────────────────────────────────────────────────────────────

export async function generateFactureFournisseurPdf(ffId: number): Promise<Buffer> {
  const ff = await prisma.factureFournisseur.findUnique({
    where: { id: ffId },
    include: {
      lignes: true,
      fournisseur: true,
      bonCommande: true,
      bonReception: true,
      paiements: { orderBy: { datePaiement: 'desc' } },
    },
  });
  if (!ff) throw new Error('Facture fournisseur introuvable');

  const company = await getCompanyInfo();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 15, bottom: 20, left: 15, right: 15 },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const logoPath = resolveLogoPath(company.logoUrl);
    if (logoPath) {
      try {
        doc.image(logoPath, 20, 16, { width: 75, height: 85, fit: [75, 85] });
      } catch {}
    }

    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(14)
      .text(company.nomSociete, 16, 115);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_DARK)
      .text(company.adresse, 16, 132, { width: 250 })
      .text(`Tél : ${company.telephone}  |  Email : ${company.email}`, 16, 158)
      .text(`MF : ${company.matriculeFiscale}`, 16, 172);

    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(15)
      .text(`FACTURE FOURNISSEUR`, 16, 195)
      .fillColor(BLACK).fontSize(12)
      .text(`N° ${ff.numero}`, 16, 215);

    if (ff.numeroFactureFournisseur) {
      doc.font('Helvetica').fontSize(9).fillColor(GRAY_DARK)
        .text(`Réf Facture Fournisseur : ${ff.numeroFactureFournisseur}`, 16, 232);
    }

    // Box Top Right: Infos Facture
    const boxX = 293;
    const boxW = 287;
    const headerH = 20;

    const box1Y = 16;
    const box1H = 110;
    doc.rect(boxX, box1Y, boxW, box1H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box1Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text('Informations Facture', boxX, box1Y + 5, { width: boxW, align: 'center' });

    const dateFact = new Date(ff.dateFacture).toLocaleDateString('fr-FR');
    const dateEch = ff.dateEcheance ? new Date(ff.dateEcheance).toLocaleDateString('fr-FR') : '—';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`N° Interne : ${ff.numero}`, boxX + 10, box1Y + 28)
      .text(`Date Facture : ${dateFact}`, boxX + 10, box1Y + 44)
      .text(`Échéance : ${dateEch}`, boxX + 10, box1Y + 60)
      .text(`BC associé : ${ff.bonCommande?.code ?? '—'}  |  BR : ${ff.bonReception?.code ?? '—'}`, boxX + 10, box1Y + 76)
      .text(`État : ${ff.statut}  |  Paiement : ${ff.statutPaiement}`, boxX + 10, box1Y + 92);

    // Box 2: Fournisseur
    const box2Y = 135;
    const box2H = 100;
    doc.rect(boxX, box2Y, boxW, box2H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box2Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5)
      .text('Fournisseur', boxX, box2Y + 5, { width: boxW, align: 'center' });

    const fNom = ff.fournisseurNom || ff.fournisseur?.nom || '—';
    const fMF = ff.fournisseurMF || ff.fournisseur?.matriculeFiscale || '—';
    const fAdr = ff.fournisseurAdresse || ff.fournisseur?.adresse || '—';
    const fTel = ff.fournisseurTel || ff.fournisseur?.telephone || '—';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`Nom : ${fNom}`, boxX + 10, box2Y + 28, { width: boxW - 20 })
      .text(`Matricule Fiscal : ${fMF}`, boxX + 10, box2Y + 46)
      .text(`Adresse : ${fAdr}`, boxX + 10, box2Y + 62, { width: boxW - 20 })
      .text(`Téléphone : ${fTel}`, boxX + 10, box2Y + 82);

    // Table
    const tableX = 15;
    const tableW = 565;
    const tableY = 255;
    const tableHeaderH = 20;

    const cols = [
      { title: 'Désignation', x: 15, w: 230, align: 'left' },
      { title: 'Qté', x: 245, w: 50, align: 'right' },
      { title: 'P.U. HT', x: 295, w: 65, align: 'right' },
      { title: 'Rem %', x: 360, w: 40, align: 'right' },
      { title: 'TVA', x: 400, w: 40, align: 'right' },
      { title: 'Total HT', x: 440, w: 65, align: 'right' },
      { title: 'Total TTC', x: 505, w: 75, align: 'right' },
    ];

    doc.rect(tableX, tableY, tableW, tableHeaderH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
    for (const c of cols) {
      doc.text(c.title, c.x + 3, tableY + 5, { width: c.w - 6, align: c.align as any });
    }

    let curY = tableY + tableHeaderH;
    const rowH = 18;
    const lignes = ff.lignes || [];

    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK);
    for (const l of lignes) {
      const qte = Number(l.quantite).toString();
      const pu = Number(l.prixUnitaireHT).toFixed(3);
      const rem = Number(l.remise) > 0 ? `${Number(l.remise)}%` : '0%';
      const tva = `${Number(l.tauxTVA)}%`;
      const totHT = Number(l.totalHT).toFixed(3);
      const totTTC = Number(l.totalTTC).toFixed(3);

      doc.text(l.designation, cols[0].x + 3, curY + 4, { width: cols[0].w - 6, align: 'left', lineBreak: false });
      doc.text(qte, cols[1].x + 3, curY + 4, { width: cols[1].w - 6, align: 'right', lineBreak: false });
      doc.text(pu, cols[2].x + 3, curY + 4, { width: cols[2].w - 6, align: 'right', lineBreak: false });
      doc.text(rem, cols[3].x + 3, curY + 4, { width: cols[3].w - 6, align: 'right', lineBreak: false });
      doc.text(tva, cols[4].x + 3, curY + 4, { width: cols[4].w - 6, align: 'right', lineBreak: false });
      doc.text(totHT, cols[5].x + 3, curY + 4, { width: cols[5].w - 6, align: 'right', lineBreak: false });
      doc.text(totTTC, cols[6].x + 3, curY + 4, { width: cols[6].w - 6, align: 'right', lineBreak: false });

      curY += rowH;
    }

    const tableBottom = Math.max(curY, 430);
    doc.rect(tableX, tableY, tableW, tableBottom - tableY).lineWidth(0.75).strokeColor(TEAL).stroke();

    // Totals Block
    const totalsY = tableBottom + 12;
    const totalsBoxW = 240;
    const totalsX = tableX + tableW - totalsBoxW;

    doc.rect(totalsX, totalsY, totalsBoxW, 125).lineWidth(0.75).strokeColor(TEAL).stroke();
    const row = (label: string, val: string, yPos: number, isBold = false) => {
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).fillColor(BLACK);
      doc.text(label, totalsX + 8, yPos);
      doc.text(val, totalsX + 100, yPos, { width: totalsBoxW - 108, align: 'right' });
    };

    row('Total Brut HT :', `${Number(ff.montantHT).toFixed(3)} ${ff.devise}`, totalsY + 6);
    row('Remise globale :', `${Number(ff.montantRemise).toFixed(3)} ${ff.devise}`, totalsY + 20);
    row('Total TVA :', `${Number(ff.montantTVA).toFixed(3)} ${ff.devise}`, totalsY + 34);
    row('Timbre Fiscal :', `${Number(ff.timbreFiscal).toFixed(3)} ${ff.devise}`, totalsY + 48);
    if (Number(ff.equilibre) !== 0) {
      row('Équilibrage :', `${Number(ff.equilibre).toFixed(3)} ${ff.devise}`, totalsY + 62);
    }

    doc.rect(totalsX, totalsY + 76, totalsBoxW, 18).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9)
      .text('TOTAL TTC :', totalsX + 8, totalsY + 80)
      .text(`${Number(ff.montantTTC).toFixed(3)} ${ff.devise}`, totalsX + 100, totalsY + 80, { width: totalsBoxW - 108, align: 'right' });

    doc.fillColor(BLACK).font('Helvetica').fontSize(8.5)
      .text('Montant Payé :', totalsX + 8, totalsY + 98)
      .text(`${Number(ff.montantPaye).toFixed(3)} ${ff.devise}`, totalsX + 100, totalsY + 98, { width: totalsBoxW - 108, align: 'right' })
      .font('Helvetica-Bold').fillColor(Number(ff.solde) > 0 ? '#dc2626' : '#059669')
      .text('Solde dû :', totalsX + 8, totalsY + 112)
      .text(`${Number(ff.solde).toFixed(3)} ${ff.devise}`, totalsX + 100, totalsY + 112, { width: totalsBoxW - 108, align: 'right' });

    // Words & Payments
    const leftY = totalsY + 6;
    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK)
      .text('Arrêtée la présente facture à la somme TTC de :', tableX, leftY)
      .font('Helvetica-BoldOblique').fontSize(9)
      .text(amountToWordsTND(Number(ff.montantTTC), ff.devise), tableX, leftY + 15, { width: 310 });

    // Payments summary if any
    const pmtY = leftY + 45;
    if (ff.paiements && ff.paiements.length > 0) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BLACK)
        .text('Historique des paiements enregistrés :', tableX, pmtY);
      let pY = pmtY + 14;
      for (const p of ff.paiements.slice(0, 3)) {
        const pDate = new Date(p.datePaiement).toLocaleDateString('fr-FR');
        doc.font('Helvetica').fontSize(8).fillColor(GRAY_DARK)
          .text(`• ${pDate} : ${Number(p.montant).toFixed(3)} ${ff.devise} (${p.modePaiement}${p.reference ? ' - ' + p.reference : ''})`, tableX + 5, pY);
        pY += 12;
      }
    }

    doc.end();
  });
}
