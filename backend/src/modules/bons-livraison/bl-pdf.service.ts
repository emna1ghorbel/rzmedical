import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import prisma from '../../config/prisma';

const round3 = (x: number) => Math.round(x * 1000) / 1000;

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

const getCompanyInfo = async () => {
  try {
    return await prisma.infoSociete.findUnique({ where: { id: 1 } });
  } catch {
    return null;
  }
};

export const generateBLPdf = async (blId: number): Promise<Buffer> => {
  const bl = await prisma.bonLivraison.findUnique({
    where: { id: blId },
    include: {
      lignes: { include: { produit: { select: { id: true, nom: true, reference: true } } } },
      utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, adresse: true, matriculeFiscale: true } },
      commande: { select: { id: true, numero: true, statut: true } },
    },
  });

  if (!bl) throw new Error('Bon de livraison introuvable');

  const company = await getCompanyInfo();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const COLORS = {
      primary: '#0f766e',  // teal-700 (different from invoice blue)
      dark: '#1e293b',
      muted: '#64748b',
      light: '#f1f5f9',
      border: '#e2e8f0',
      white: '#ffffff',
    };

    const pageW = doc.page.width - 100;

    // ── HEADER ────────────────────────────────────────────────────────────────
    let headerTextX = 50;
    const logoPath = resolveLogoPath(company?.logoUrl ?? null);
    if (logoPath) {
      try {
        doc.image(logoPath, 50, 45, { width: 55, height: 55, fit: [55, 55] });
        headerTextX = 115;
      } catch {}
    }

    doc.fontSize(16).fillColor(COLORS.primary).font('Helvetica-Bold')
       .text(company?.nomSociete || '', headerTextX, 48);

    let compY = 68;
    if ((company as any)?.matriculeFiscale) {
      doc.fontSize(8.5).fillColor(COLORS.muted).font('Helvetica').text(`MF: ${(company as any).matriculeFiscale}`, headerTextX, compY);
      compY += 11;
    }
    if (company?.adresse) {
      doc.fontSize(8.5).fillColor(COLORS.muted).font('Helvetica').text(company.adresse, headerTextX, compY);
      compY += 11;
    }
    if (company?.telephone) {
      doc.fontSize(8.5).fillColor(COLORS.muted).text(`Tél: ${company.telephone}`, headerTextX, compY);
    }

    // Right: BON DE LIVRAISON title box
    const titleBoxX = 330;
    doc.rect(titleBoxX, 50, 215, 50).fill(COLORS.primary);
    doc.fontSize(14).fillColor(COLORS.white).font('Helvetica-Bold')
       .text('BON DE LIVRAISON', titleBoxX, 62, { width: 215, align: 'center' });

    doc.fontSize(10).fillColor(COLORS.dark).font('Helvetica-Bold')
       .text(bl.code, titleBoxX, 108, { width: 215, align: 'right' });

    const dateStr = new Date(bl.creeLe).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica')
       .text(`Date: ${dateStr}`, titleBoxX, 120, { width: 215, align: 'right' });

    // ── DIVIDER ───────────────────────────────────────────────────────────────
    doc.moveTo(50, 148).lineTo(545, 148).strokeColor(COLORS.border).lineWidth(1).stroke();

    // ── CLIENT & META ─────────────────────────────────────────────────────────
    const infoY = 160;
    // Client box
    doc.rect(50, infoY, 240, 90).fill(COLORS.light).stroke();
    doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold').text('LIVRÉ À', 60, infoY + 10);

    const clientName = bl.clientNom ||
      (bl.utilisateur ? `${bl.utilisateur.nom || ''} ${bl.utilisateur.prenom || ''}`.trim() : 'Client');

    doc.fontSize(11).fillColor(COLORS.dark).font('Helvetica-Bold')
       .text(clientName, 60, infoY + 22, { width: 220 });

    let cy = infoY + 36;
    const clientMF = (bl as any).clientMF || bl.utilisateur?.matriculeFiscale;
    const clientTel = (bl as any).clientTel || bl.utilisateur?.telephone;
    const clientAdresse = (bl as any).clientAdresse || bl.utilisateur?.adresse;

    if (clientMF) {
      doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text(`MF: ${clientMF}`, 60, cy, { width: 220 }); cy += 12;
    }
    if (clientAdresse) {
      doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text(clientAdresse, 60, cy, { width: 220 }); cy += 12;
    }
    if (clientTel) {
      doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica').text(`Tél: ${clientTel}`, 60, cy, { width: 220 });
    }

    // Right meta
    const metaX = 310;
    const metaItems: [string, string][] = [
      ['Statut', bl.statut],
    ];
if (bl.commande) {
  metaItems.push(['Commande', bl.commande.numero || `#${String(bl.commande.id).padStart(5, '0')}`]);
    }
    if (bl.dateLivraison) {
      metaItems.push(['Date livraison', new Date(bl.dateLivraison).toLocaleDateString('fr-FR')]);
    }

    metaItems.forEach(([label, value], i) => {
      const iy = infoY + 10 + i * 18;
      doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica').text(label + ':', metaX, iy);
      doc.fontSize(9).fillColor(COLORS.dark).font('Helvetica-Bold').text(value, metaX + 80, iy);
    });

    // ── LINES TABLE ───────────────────────────────────────────────────────────
    const tableY = infoY + 110;
    const cols = { designation: 50, qtyCmd: 290, qtyLiv: 350, pu: 400, tva: 465 };
    const colWidths = { designation: 240, qtyCmd: 60, qtyLiv: 50, pu: 65, tva: 60 };

    doc.rect(50, tableY, pageW, 22).fill(COLORS.primary);
    doc.fontSize(8).fillColor(COLORS.white).font('Helvetica-Bold');
    doc.text('Désignation', cols.designation, tableY + 7, { width: colWidths.designation });
    doc.text('Qté Cmd', cols.qtyCmd, tableY + 7, { width: colWidths.qtyCmd, align: 'center' });
    doc.text('Qté Liv.', cols.qtyLiv, tableY + 7, { width: colWidths.qtyLiv, align: 'center' });
    doc.text('P.U HT', cols.pu, tableY + 7, { width: colWidths.pu, align: 'right' });
    doc.text('TVA %', cols.tva, tableY + 7, { width: colWidths.tva, align: 'center' });

    let rowY = tableY + 22;
    let totalHT = 0;
    let totalTVA = 0;

    bl.lignes.forEach((ligne: any, i: number) => {
      const bg = i % 2 === 0 ? COLORS.white : COLORS.light;
      doc.rect(50, rowY, pageW, 20).fill(bg);

      const lineHT = round3(Number(ligne.quantiteLivree) * Number(ligne.prixUnitaireHT));
      const lineTVA = round3(lineHT * (Number(ligne.tauxTVA) / 100));
      totalHT += lineHT;
      totalTVA += lineTVA;

      doc.fontSize(8).fillColor(COLORS.dark).font('Helvetica');
      doc.text(ligne.designation || '', cols.designation, rowY + 6, { width: colWidths.designation });
      doc.text(String(ligne.quantiteCmd), cols.qtyCmd, rowY + 6, { width: colWidths.qtyCmd, align: 'center' });
      doc.text(String(ligne.quantiteLivree), cols.qtyLiv, rowY + 6, { width: colWidths.qtyLiv, align: 'center' });
      doc.text(`${Number(ligne.prixUnitaireHT).toFixed(3)}`, cols.pu, rowY + 6, { width: colWidths.pu, align: 'right' });
      doc.text(`${Number(ligne.tauxTVA).toFixed(0)}%`, cols.tva, rowY + 6, { width: colWidths.tva, align: 'center' });
      rowY += 20;
    });

    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(COLORS.border).lineWidth(0.5).stroke();

    // ── TOTALS ────────────────────────────────────────────────────────────────
    totalHT = round3(totalHT);
    totalTVA = round3(totalTVA);
    const totalTTC = round3(totalHT + totalTVA);

    const totalsX = 360;
    let totY = rowY + 15;

    const addRow = (label: string, value: string, highlight = false) => {
      if (highlight) {
        doc.rect(totalsX - 5, totY - 3, 185, 18).fill(COLORS.primary);
        doc.fontSize(10).fillColor(COLORS.white).font('Helvetica-Bold');
      } else {
        doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica');
      }
      doc.text(label, totalsX, totY, { width: 100 });
      doc.text(value, totalsX + 100, totY, { width: 80, align: 'right' });
      totY += 20;
    };

    addRow('Total HT:', `${totalHT.toFixed(3)} TND`);
    addRow('TVA:', `${totalTVA.toFixed(3)} TND`);
    addRow('TOTAL TTC', `${totalTTC.toFixed(3)} TND`, true);

    // Commentaire
    if (bl.commentaire) {
      const noteY = totY + 10;
      doc.rect(50, noteY, pageW, 30).fill(COLORS.light);
      doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica-Bold').text('Note:', 58, noteY + 6);
      doc.fontSize(8).fillColor(COLORS.dark).font('Helvetica').text(bl.commentaire, 80, noteY + 6, { width: pageW - 40 });
    }

    // ── SIGNATURE ZONE ────────────────────────────────────────────────────────
    const sigY = doc.page.height - 120;
    doc.moveTo(50, sigY).lineTo(545, sigY).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica-Bold')
       .text('Signature Client', 60, sigY + 10);
    doc.rect(60, sigY + 22, 180, 50).stroke();

    doc.fontSize(9).fillColor(COLORS.muted).font('Helvetica-Bold')
       .text('Cachet & Signature Société', 310, sigY + 10);
    doc.rect(310, sigY + 22, 180, 50).stroke();

    // Footer
    const footerY = doc.page.height - 55;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    const footerParts = [
      company?.nomSociete,
      (company as any)?.matriculeFiscale ? `MF: ${(company as any).matriculeFiscale}` : null,
      company?.adresse,
      company?.telephone ? `Tél: ${company.telephone}` : null,
      company?.email,
    ].filter(Boolean);
    doc.fontSize(8).fillColor(COLORS.muted).font('Helvetica')
       .text(footerParts.join(' — '), 50, footerY + 8, { width: pageW, align: 'center' });

    doc.end();
  });
};
