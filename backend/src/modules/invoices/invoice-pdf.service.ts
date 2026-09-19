import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import prisma from '../../config/prisma';

// ─── Number to French Words (Dinars & Millimes) ──────────────────────────────

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
    if (t === 7) {
      if (u === 1) return 'soixante et onze';
      return 'soixante-' + units[10 + u];
    }
    if (t === 9) {
      return 'quatre-vingt-' + units[10 + u];
    }
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

export function amountToWordsTND(amount: number): string {
  const rounded = Math.round(amount * 1000) / 1000;
  const dinars = Math.floor(rounded);
  const millimes = Math.round((rounded - dinars) * 1000);

  const parts: string[] = [];
  if (dinars > 0) {
    const dStr = numberToFrench(dinars);
    parts.push(capitalize(dStr) + (dinars > 1 ? ' Dinars Tunisiens' : ' Dinar Tunisien'));
  } else {
    parts.push('Zéro Dinar Tunisien');
  }

  if (millimes > 0) {
    const mStr = numberToFrench(millimes);
    parts.push('et ' + capitalize(mStr) + (millimes > 1 ? ' Millimes' : ' Millime'));
  }

  return parts.join(' ');
}

const fmt3 = (val: any): string => {
  const num = Number(val || 0);
  return num.toFixed(3).replace('.', ',');
};

// ─── Fetch facture with all needed data ──────────────────────────────────────

export const getFactureForPdf = async (factureId: number, userId?: number) => {
  const where: any = { id: factureId };
  if (userId !== undefined) {
    where.OR = [
      { utilisateurId: userId },
      { commande: { utilisateurId: userId } },
    ];
  }

  const facture = await prisma.facture.findFirst({
    where,
    include: {
      lignes: true,
      commande: {
        include: {
          utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, adresse: true, matriculeFiscale: true } },
        },
      },
      utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, adresse: true, matriculeFiscale: true } },
    },
  });

  return facture;
};

// ─── Company Info (dynamique depuis la DB) ──────────────────────────────────

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
  } catch (e) {
    console.warn('Could not fetch infoSociete for PDF:', e);
  }

  // Fallback neutre — aucune donnée réelle codée en dur
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

/**
 * Résout le chemin absolu vers le logo depuis logoUrl stocké en DB.
 * logoUrl peut être une URL relative (/uploads/logo.png) ou un chemin absolu.
 * Retourne null si aucun logo n'est configuré ou si le fichier n'existe pas.
 */
function resolveLogoPath(logoUrl: string | null): string | null {
  if (!logoUrl) return null;

  // Si c'est déjà un chemin absolu existant
  if (path.isAbsolute(logoUrl) && fs.existsSync(logoUrl)) return logoUrl;

  // Si c'est une URL relative /uploads/..., la résoudre depuis le dossier uploads
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const relativePath = logoUrl.startsWith('/') ? logoUrl.slice(1) : logoUrl;
  const resolvedFromUploads = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(resolvedFromUploads)) return resolvedFromUploads;

  // Essai depuis uploadDir configuré
  const resolvedFromUploadDir = path.resolve(process.cwd(), uploadDir, path.basename(logoUrl));
  if (fs.existsSync(resolvedFromUploadDir)) return resolvedFromUploadDir;

  return null;
}

// ─── Generate PDF Buffer Matching FACTURE58 - Copie.pdf ──────────────────────

export const generateInvoicePdf = async (factureId: number, userId?: number): Promise<Buffer> => {
  const facture = await getFactureForPdf(factureId, userId);
  if (!facture) throw new Error('Facture introuvable ou accès refusé');
  const isAvoir = facture.statut === 'ANNULEE' && Boolean(facture.numeroAvoir);
  const documentLabel = isAvoir ? 'Avoir' : 'Facture';
  const documentNumber = isAvoir ? facture.numeroAvoir! : facture.numero;

  const company = await getCompanyInfo();

  return new Promise((resolve, reject) => {
    // Page: A4 (595.28 x 841.88 pt)
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 15, bottom: 0, left: 15, right: 15 },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const TEAL = '#539dba';
    const BLACK = '#000000';
    const WHITE = '#ffffff';

    // ── 1. Top Left: Logo & Company / Invoice Title ──────────────────────────
    const logoPath = resolveLogoPath(company.logoUrl);
    if (logoPath) {
      try {
        doc.image(logoPath, 20, 16, { width: 75, height: 95, fit: [75, 95] });
      } catch (e) {
        console.warn('Could not render logo in PDF:', e);
      }
    }

    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(14)
       .text(company.nomSociete, 16, 132);

    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(12)
       .text(`${documentLabel} N° ${documentNumber}`, 16, 215);

    // ── 2. Top Right: Boxes ──────────────────────────────────────────────────
    const boxX = 293;
    const boxW = 287;
    const headerH = 20;

    // Box 1: Informations de facturation
    const box1Y = 16;
    const box1H = 115;
    doc.rect(boxX, box1Y, boxW, box1H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box1Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
       .text('Informations de facturation', boxX, box1Y + 5, { width: boxW, align: 'center', lineBreak: false });

    const emissionDate = facture.dateEmission ? new Date(facture.dateEmission) : new Date();
    const dateFormatted = emissionDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
       .text(`${documentLabel} N° ${documentNumber}`, boxX + 10, box1Y + 30, { lineBreak: false })
       .text(`Date : ${dateFormatted}`, boxX + 10, box1Y + 58, { lineBreak: false });
    if (isAvoir) {
      doc.text(`Facture d'origine N° ${facture.numero}`, boxX + 10, box1Y + 84, { lineBreak: false });
    }

    // Box 2: Informations du client
    const box2Y = 158;
    const box2H = 115;
    doc.rect(boxX, box2Y, boxW, box2H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box2Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
       .text('Informations du client', boxX, box2Y + 5, { width: boxW, align: 'center', lineBreak: false });

    const clientName = facture.clientNom ||
      (facture.utilisateur ? `${facture.utilisateur.nom || ''} ${facture.utilisateur.prenom || ''}`.trim() : '') ||
      (facture.commande?.utilisateur ? `${facture.commande.utilisateur.nom || ''} ${facture.commande.utilisateur.prenom || ''}`.trim() : 'Client');

    const clientMF = facture.clientMF ||
      facture.utilisateur?.matriculeFiscale ||
      facture.commande?.utilisateur?.matriculeFiscale ||
      '';

    const clientAdresse = facture.clientAdresse ||
      facture.utilisateur?.adresse ||
      facture.commande?.utilisateur?.adresse ||
      '';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9);
    doc.text(`Client: ${clientName}`, boxX + 10, box2Y + 30, { width: boxW - 20, lineBreak: false });
    doc.text(`M.F: ${clientMF || '-'}`, boxX + 10, box2Y + 56, { width: boxW - 20, lineBreak: false });
    doc.text(`Adresse: ${clientAdresse || '-'}`, boxX + 10, box2Y + 82, { width: boxW - 20 });

    // ── 3. Table of Items ────────────────────────────────────────────────────
    const tableY = 290;
    const colW = [251, 70, 81.5, 75.5, 87.28];
    const colX = [15];
    for (let i = 0; i < colW.length - 1; i++) {
      colX.push(colX[i] + colW[i]);
    }
    const tableW = colW.reduce((a, b) => a + b, 0);

    // Table Header
    const thHeight = 26;
    doc.rect(15, tableY, tableW, thHeight).fillColor(TEAL).fill();
    for (let i = 0; i < colW.length; i++) {
      doc.rect(colX[i], tableY, colW[i], thHeight).lineWidth(0.75).strokeColor(TEAL).stroke();
    }

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10);
    doc.text('Désignation', colX[0] + 8, tableY + 8, { width: colW[0] - 16, align: 'left', lineBreak: false });
    doc.text('Quantité', colX[1], tableY + 8, { width: colW[1], align: 'center', lineBreak: false });
    doc.text('P.U.HT', colX[2], tableY + 8, { width: colW[2], align: 'center', lineBreak: false });
    doc.text('T.TVA', colX[3], tableY + 8, { width: colW[3], align: 'center', lineBreak: false });
    doc.text('P.T.HT', colX[4], tableY + 8, { width: colW[4], align: 'center', lineBreak: false });

    // Rows
    let currentY = tableY + thHeight;
    const rowHeight = 27;
    const lignes = Array.isArray(facture.lignes) ? facture.lignes : [];

    lignes.forEach((item: any) => {
      for (let i = 0; i < colW.length; i++) {
        doc.rect(colX[i], currentY, colW[i], rowHeight).lineWidth(0.75).strokeColor(TEAL).stroke();
      }

      doc.fillColor(BLACK).font('Helvetica').fontSize(9);
      doc.text(item.designation || '', colX[0] + 8, currentY + 8, { width: colW[0] - 16, align: 'left', lineBreak: false });
      doc.text(String(Math.round(Number(item.quantite))), colX[1], currentY + 8, { width: colW[1], align: 'center', lineBreak: false });
      doc.text(fmt3(item.prixUnitaireHT), colX[2], currentY + 8, { width: colW[2], align: 'center', lineBreak: false });
      doc.text(`${Math.round(Number(item.tauxTVA))} %`, colX[3], currentY + 8, { width: colW[3], align: 'center', lineBreak: false });
      doc.text(fmt3(item.totalHT), colX[4], currentY + 8, { width: colW[4], align: 'center', lineBreak: false });

      currentY += rowHeight;
    });

    // ── 4. Totals Block ──────────────────────────────────────────────────────
    const totalLabelX = 431;
    const totalValRight = 580;
    let totY = currentY + 15;

    const montantHT = Number(facture.montantHT);
    const montantTVA = Number(facture.montantTVA);
    const timbreFiscal = Number(facture.timbreFiscal || 0);
    const montantTTC = Number(facture.montantTTC);

    const totals = [
      { label: 'Total HT', val: `${fmt3(montantHT)} TND` },
      { label: 'TVA', val: `${fmt3(montantTVA)} TND` },
      { label: 'Timbre Fiscal', val: `${fmt3(timbreFiscal)} TND` },
      { label: 'Total TTC', val: `${fmt3(montantTTC)} TND` },
    ];

    totals.forEach(t => {
      doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(10);
      doc.text(t.label, totalLabelX, totY, { lineBreak: false });
      doc.text(t.val, totalLabelX, totY, { width: totalValRight - totalLabelX, align: 'right', lineBreak: false });
      totY += 15;
    });

    // ── 5. Amount in Words ───────────────────────────────────────────────────
    const wordsY = totY + 25;
    const wordsStr = (facture as any).montantEnLettres || amountToWordsTND(montantTTC);
    const wordsText = `Arrêtée la présente facture à la somme de, ${wordsStr}`;

    doc.fillColor(BLACK).font('Helvetica-Oblique').fontSize(10.5)
       .text(wordsText, 15, wordsY, { width: tableW });

    // ── 6. Bottom Footer (3 Rounded Columns with Banners) ────────────────────
    const footerLineY = 745;
    doc.moveTo(15, footerLineY).lineTo(580.28, footerLineY).lineWidth(0.75).strokeColor(TEAL).stroke();

    const fCols = [
      { x: 15.75, w: 173.74, title: company.nomSociete },
      { x: 190.99, w: 173.74, title: 'Contact' },
      { x: 366.23, w: 213.3, title: 'Détails bancaires' },
    ];

    const fBannerY = 754;
    const fBannerH = 17;

    fCols.forEach(fc => {
      doc.roundedRect(fc.x, fBannerY, fc.w, fBannerH, 3).fillColor(TEAL).fill();
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(8)
         .text(fc.title, fc.x, fBannerY + 4, { width: fc.w, align: 'center', lineBreak: false });
    });

    // Footer Col 1: Societe & Adresse
    const c1Y = 776;
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(8).text('M.F', 18.75, c1Y, { lineBreak: false });
    doc.font('Helvetica').text(company.matriculeFiscale, 88, c1Y, { lineBreak: false });

    doc.font('Helvetica-Bold').text('Adresse', 18.75, c1Y + 14, { lineBreak: false });
    const adrLines = company.adresse.split('\n');
    adrLines.forEach((line, idx) => {
      doc.font('Helvetica').text(line.trim(), 88, c1Y + 14 + idx * 11, { lineBreak: false });
    });

    // Footer Col 2: Contact
    doc.font('Helvetica-Bold').text('Téléphone', 194, c1Y, { lineBreak: false });
    doc.font('Helvetica').text(company.telephone, 263, c1Y, { lineBreak: false });

    doc.font('Helvetica-Bold').text('Fax', 194, c1Y + 14, { lineBreak: false });
    doc.font('Helvetica').text(company.fax, 263, c1Y + 14, { lineBreak: false });

    doc.font('Helvetica-Bold').text('Email', 194, c1Y + 28, { lineBreak: false });
    if (company.email.length > 20) {
      const atIdx = company.email.indexOf('@');
      const emailP1 = company.email.slice(0, atIdx + 1);
      const emailP2 = company.email.slice(atIdx + 1);
      doc.font('Helvetica').text(emailP1, 263, c1Y + 28, { lineBreak: false });
      doc.font('Helvetica').text(emailP2, 263, c1Y + 39, { lineBreak: false });
    } else {
      doc.font('Helvetica').text(company.email, 263, c1Y + 28, { lineBreak: false });
    }

    // Footer Col 3: Détails bancaires
    doc.font('Helvetica-Bold').text('Banque', 369, c1Y, { lineBreak: false });
    doc.font('Helvetica').text(company.banque, 454, c1Y, { lineBreak: false });

    doc.font('Helvetica-Bold').text('N° de compte', 369, c1Y + 14, { lineBreak: false });
    doc.font('Helvetica').text(company.rib, 454, c1Y + 14, { lineBreak: false });

    doc.end();
  });
};
