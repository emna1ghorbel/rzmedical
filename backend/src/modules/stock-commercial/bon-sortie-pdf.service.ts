import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import prisma from '../../config/prisma';

const TEAL = '#539dba';
const BLACK = '#111827';
const GRAY = '#374151';
const WHITE = '#ffffff';

function logoPath(logoUrl: string | null) {
  const candidates = [
    logoUrl && path.resolve(process.cwd(), logoUrl.replace(/^\//, '')),
    path.resolve(process.cwd(), 'assets/logo-rzmedical.png'),
    path.resolve(process.cwd(), '../web/public/images/logo/logo-rzmedical.png'),
    path.resolve('E:/rzmedical/backend/assets/logo-rzmedical.png'),
  ].filter(Boolean) as string[];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

export async function generateBonSortiePdf(id: number): Promise<Buffer> {
  const bon = await prisma.bonSortie.findUnique({
    where: { id },
    include: {
      commercial: { select: { nom: true, prenom: true, email: true, telephone: true } },
      lignes: { include: { produit: { select: { nom: true, reference: true } } } },
    },
  });
  if (!bon) throw new Error('Bon de sortie introuvable');

  const company = await prisma.infoSociete.findUnique({ where: { id: 1 } }).catch(() => null);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 15, bottom: 20, left: 15, right: 15 } });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const logo = logoPath(company?.logoUrl ?? null);
    if (logo) {
      try { doc.image(logo, 20, 16, { fit: [75, 85] }); } catch { /* Logo optional */ }
    }

    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(14).text(company?.nomSociete || 'R and Z Medical', 16, 115);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
      .text(company?.adresse || '', 16, 132, { width: 250 })
      .text(`Tél : ${company?.telephone || '—'}  |  Email : ${company?.email || '—'}`, 16, 158)
      .text(`MF : ${(company as any)?.matriculeFiscale || '—'}`, 16, 172);

    doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(15).text('BON DE SORTIE', 16, 195);
    doc.fillColor(BLACK).fontSize(12).text(`N° ${bon.code}`, 16, 215);
    if (bon.commentaire) doc.font('Helvetica').fontSize(9).fillColor(GRAY).text(`Observation : ${bon.commentaire}`, 16, 232, { width: 255 });

    const boxX = 293, boxW = 287, headerH = 20;
    doc.rect(boxX, 16, boxW, 110).lineWidth(.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, 16, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5).text('Informations du bon', boxX, 21, { width: boxW, align: 'center' });
    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`N° Bon : ${bon.code}`, boxX + 10, 44)
      .text(`Date : ${new Date(bon.creeLe).toLocaleDateString('fr-FR')}`, boxX + 10, 60)
      .text(`Statut : ${bon.statut}`, boxX + 10, 76)
      .text(`Validé le : ${bon.valideLe ? new Date(bon.valideLe).toLocaleDateString('fr-FR') : '—'}`, boxX + 10, 92);

    doc.rect(boxX, 135, boxW, 100).lineWidth(.75).strokeColor(TEAL).stroke();
    doc.rect(boxX, 135, boxW, headerH).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5).text('Commercial destinataire', boxX, 140, { width: boxW, align: 'center' });
    doc.fillColor(BLACK).font('Helvetica').fontSize(9)
      .text(`Nom : ${bon.commercial.prenom} ${bon.commercial.nom}`, boxX + 10, 163, { width: boxW - 20 })
      .text(`Email : ${bon.commercial.email || '—'}`, boxX + 10, 181, { width: boxW - 20 })
      .text(`Téléphone : ${bon.commercial.telephone || '—'}`, boxX + 10, 199, { width: boxW - 20 });

    const tableX = 15, tableY = 255, tableW = 565, headerHeight = 20;
    const columns = [
      { label: 'Référence', x: 15, width: 130, align: 'left' },
      { label: 'Désignation', x: 145, width: 330, align: 'left' },
      { label: 'Qté sortie', x: 475, width: 105, align: 'right' },
    ];
    doc.rect(tableX, tableY, tableW, headerHeight).fillColor(TEAL).fill();
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9);
    columns.forEach((column) => doc.text(column.label, column.x + 4, tableY + 5, { width: column.width - 8, align: column.align as any }));

    let y = tableY + headerHeight;
    doc.fillColor(BLACK).font('Helvetica').fontSize(8.5);
    for (const ligne of bon.lignes) {
      doc.text(ligne.produit.reference || '—', 19, y + 5, { width: 122, lineBreak: false });
      doc.text(ligne.produit.nom, 149, y + 5, { width: 322, lineBreak: false });
      doc.text(String(ligne.quantite), 479, y + 5, { width: 97, align: 'right', lineBreak: false });
      y += 20;
    }
    const bottom = Math.max(y, 420);
    doc.rect(tableX, tableY, tableW, bottom - tableY).lineWidth(.75).strokeColor(TEAL).stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK).text(`Nombre total d'articles : ${bon.lignes.reduce((total, ligne) => total + ligne.quantite, 0)}`, 350, bottom + 18, { width: 230, align: 'right' });
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY).text('Bon de sortie : dépôt → commercial', 15, bottom + 45);
    doc.text('Signature du responsable', 50, bottom + 100).text('Signature du commercial', 390, bottom + 100);
    doc.rect(30, bottom + 62, 180, 50).strokeColor('#9ca3af').lineWidth(.5).stroke();
    doc.rect(360, bottom + 62, 180, 50).strokeColor('#9ca3af').lineWidth(.5).stroke();
    doc.end();
  });
}
