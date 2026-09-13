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

// ─── Company Info Fallback ──────────────────────────────────────────────────

interface CompanyConfig {
  nomSociete: string;
  matriculeFiscale: string;
  adresse: string;
  telephone: string;
  fax: string;
  email: string;
  banque: string;
  rib: string;
}

const getCompanyInfo = async (): Promise<CompanyConfig> => {
  try {
    const info = await (prisma as any).infoSociete?.findUnique({ where: { id: 1 } });
    if (info) {
      return {
        nomSociete: info.nomSociete || 'R and Z Medical',
        matriculeFiscale: (info as any).matriculeFiscale || '1742623LAM000',
        adresse: info.adresse || '23 Rue Salem harzallah\nimm echafai 2 eme\netage 3000, sfax Tunisie',
        telephone: info.telephone || '28113131',
        fax: (info as any).fax || '-',
        email: info.email || 'randzmedical@outlook.com',
        banque: (info as any).banque || 'UIB BANK',
        rib: (info as any).rib || '12023000003303530971',
      };
    }
  } catch (e) {
    console.warn('Could not fetch infoSociete, using fallback:', e);
  }
  return {
    nomSociete: 'R and Z Medical',
    matriculeFiscale: '1742623LAM000',
    adresse: '23 Rue Salem harzallah\nimm echafai 2 eme\netage 3000, sfax Tunisie',
    telephone: '28113131',
    fax: '-',
    email: 'randzmedical@outlook.com',
    banque: 'UIB BANK',
    rib: '12023000003303530971',
  };
};

function getLogoPath(): string | null {
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

// ─── Generate Devis PDF Buffer ────────────────────────────────────────────────

export const generateDevisPdf = async (devisId: number): Promise<Buffer> => {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: {
      lignes: { include: { produit: true } },
      utilisateur: true,
    },
  });
  if (!devis) throw new Error('Devis introuvable');

  const company = await getCompanyInfo();

  return new Promise((resolve, reject) => {
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

    // ── 1. Top Left: Logo & Company / Devis Title ──────────────────────────
    const logoPath = getLogoPath();
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
       .text(`Devis N° ${devis.numero}`, 16, 215);

    // ── 2. Top Right: Boxes ──────────────────────────────────────────────────
    const boxX = 293;
    const boxW = 287;
    const headerH = 20;

    // Box 1: Informations du Devis
    const box1Y = 16;
    const box1H = 115;
    doc.rect(boxX, box1Y, boxW, box1H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box1Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
       .text('Informations du devis', boxX, box1Y + 5, { width: boxW, align: 'center', lineBreak: false });

    const emissionDate = devis.dateDevis ? new Date(devis.dateDevis) : new Date();
    const dateFormatted = emissionDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const validiteFormatted = devis.dateValidite
      ? new Date(devis.dateValidite).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '-';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
       .text(`Devis N° : ${devis.numero}`, boxX + 10, box1Y + 28, { lineBreak: false })
       .text(`Date : ${dateFormatted}`, boxX + 10, box1Y + 48, { lineBreak: false })
       .text(`Validité : ${validiteFormatted}`, boxX + 10, box1Y + 68, { lineBreak: false })
       .text(`Statut : ${devis.statut}`, boxX + 10, box1Y + 88, { lineBreak: false });

    // Box 2: Informations du client
    const box2Y = 158;
    const box2H = 115;
    doc.rect(boxX, box2Y, boxW, box2H).lineWidth(0.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, box2Y, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10)
       .text('Informations du client', boxX, box2Y + 5, { width: boxW, align: 'center', lineBreak: false });

    const clientName = devis.clientNom ||
      (devis.utilisateur ? `${devis.utilisateur.nom || ''} ${devis.utilisateur.prenom || ''}`.trim() : 'Client');
    const clientCode = devis.utilisateurId ? `CL-${devis.utilisateurId.toString().padStart(4, '0')}` : '-';
    const clientMf = devis.clientMF || devis.utilisateur?.matriculeFiscale || '-';
    const clientAddr = devis.clientAdresse || devis.utilisateur?.adresse || '-';
    const clientTel = devis.clientTelephone || devis.utilisateur?.telephone || '-';

    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
       .text(`Code : ${clientCode}`, boxX + 10, box2Y + 28, { lineBreak: false })
       .text(`Raison sociale : ${clientName}`, boxX + 10, box2Y + 44, { width: boxW - 20, lineBreak: false })
       .text(`Matricule fiscal : ${clientMf}`, boxX + 10, box2Y + 60, { lineBreak: false })
       .text(`Adresse : ${clientAddr}`, boxX + 10, box2Y + 76, { width: boxW - 20, lineBreak: false })
       .text(`Téléphone : ${clientTel}`, boxX + 10, box2Y + 96, { lineBreak: false });

    // ── 3. Articles Table ────────────────────────────────────────────────────
    const tableX = 15;
    const tableW = 565;
    const tableY = 285;
    const tableHeaderH = 20;

    const cols = [
      { key: 'ref', title: 'Réf.', x: 15, w: 70, align: 'left' },
      { key: 'desig', title: 'Désignation', x: 85, w: 200, align: 'left' },
      { key: 'qte', title: 'Quantité', x: 285, w: 50, align: 'right' },
      { key: 'pu', title: 'P.U.H.T', x: 335, w: 70, align: 'right' },
      { key: 'rem', title: 'REM', x: 405, w: 40, align: 'right' },
      { key: 'tva', title: 'TVA', x: 445, w: 45, align: 'right' },
      { key: 'total', title: 'Total H.T', x: 490, w: 90, align: 'right' },
    ];

    doc.rect(tableX, tableY, tableW, tableHeaderH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
    for (const c of cols) {
      doc.text(c.title, c.x + 3, tableY + 5, { width: c.w - 6, align: c.align as any, lineBreak: false });
    }

    let curY = tableY + tableHeaderH;
    const rowH = 18;
    const lignes = devis.lignes || [];

    doc.font('Helvetica').fontSize(8.5).fillColor(BLACK);
    for (let i = 0; i < Math.max(lignes.length, 1); i++) {
      const l = lignes[i];
      if (l) {
        const ref = l.produit?.reference || '-';
        const desig = l.designation || l.produit?.nom || '';
        const qte = Number(l.quantite).toString();
        const pu = Number(l.prixUnitaireHT).toFixed(3);
        const rem = Number(l.remise) > 0 ? `${Number(l.remise)}%` : '0%';
        const tva = `${Number(l.tauxTVA)}%`;
        const tot = Number(l.totalHT).toFixed(3);

        doc.text(ref, cols[0].x + 3, curY + 4, { width: cols[0].w - 6, align: 'left', lineBreak: false });
        doc.text(desig, cols[1].x + 3, curY + 4, { width: cols[1].w - 6, align: 'left', lineBreak: false });
        doc.text(qte, cols[2].x + 3, curY + 4, { width: cols[2].w - 6, align: 'right', lineBreak: false });
        doc.text(pu, cols[3].x + 3, curY + 4, { width: cols[3].w - 6, align: 'right', lineBreak: false });
        doc.text(rem, cols[4].x + 3, curY + 4, { width: cols[4].w - 6, align: 'right', lineBreak: false });
        doc.text(tva, cols[5].x + 3, curY + 4, { width: cols[5].w - 6, align: 'right', lineBreak: false });
        doc.text(tot, cols[6].x + 3, curY + 4, { width: cols[6].w - 6, align: 'right', lineBreak: false });
      }
      curY += rowH;
    }

    const tableBottom = Math.max(curY, 460);
    doc.rect(tableX, tableY, tableW, tableBottom - tableY).lineWidth(0.75).strokeColor(TEAL).stroke();

    // ── 4. Totals Block ──────────────────────────────────────────────────────
    const totalsY = tableBottom + 15;
    const totalsBoxW = 240;
    const totalsX = tableX + tableW - totalsBoxW;

    const row = (label: string, val: string, yPos: number, isBold = false) => {
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(BLACK);
      doc.text(label, totalsX + 10, yPos);
      doc.text(val, totalsX + 100, yPos, { width: totalsBoxW - 110, align: 'right' });
    };

    doc.rect(totalsX, totalsY, totalsBoxW, 110).lineWidth(0.75).strokeColor(TEAL).stroke();
    row('Total H.T Brut :', `${Number(devis.montantHT).toFixed(3)} TND`, totalsY + 8);
    row('Total Remise :', `${Number(devis.montantRemise).toFixed(3)} TND`, totalsY + 26);
    row('Total TVA :', `${Number(devis.montantTVA).toFixed(3)} TND`, totalsY + 44);
    row('Timbre Fiscal :', `${Number(devis.timbreFiscal).toFixed(3)} TND`, totalsY + 62);
    doc.rect(totalsX, totalsY + 82, totalsBoxW, 28).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11);
    doc.text('Total T.T.C :', totalsX + 10, totalsY + 90);
    doc.text(`${Number(devis.montantTTC).toFixed(3)} TND`, totalsX + 100, totalsY + 90, { width: totalsBoxW - 110, align: 'right' });

    // Amount in words
    const wordsY = totalsY + 125;
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9)
       .text(`Arrêté le présent devis à la somme de :`, tableX, wordsY);
    doc.font('Helvetica').fontSize(9)
       .text(amountToWordsTND(Number(devis.montantTTC)), tableX, wordsY + 15, { width: 550 });

    // Signature boxes
    const sigY = wordsY + 50;
    doc.rect(tableX, sigY, 200, 70).lineWidth(0.5).strokeColor(TEAL).stroke();
    doc.font('Helvetica-Bold').fontSize(8.5).text('Cachet et signature client (Bon pour accord)', tableX + 10, sigY + 8);

    doc.rect(tableX + tableW - 200, sigY, 200, 70).lineWidth(0.5).strokeColor(TEAL).stroke();
    doc.font('Helvetica-Bold').fontSize(8.5).text('Signature & Cachet Société', tableX + tableW - 190, sigY + 8);

    // Footer
    const footerY = 800;
    doc.font('Helvetica').fontSize(7.5).fillColor('#666666')
       .text(`${company.nomSociete} — MF : ${company.matriculeFiscale} — Tél : ${company.telephone} — Email : ${company.email}`, 15, footerY, { width: 565, align: 'center' });

    doc.end();
  });
};
