const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const ExcelJS = require('exceljs');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { resoudreDocument } = require('./documentResolvers.service');
const { montantEnLettres } = require('./numberToWords.service');
const notificationService = require('./notification.service');

function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

async function enregistrerHistorique(db, type, id, action, details, userId) {
  try {
    await query(db,
      `INSERT INTO documents_historique (type_document, document_id, action, details, performed_by) VALUES (?,?,?,?,?)`,
      [type, id, action, JSON.stringify(details || {}), userId || null]
    );
  } catch (err) {
    console.error('[DocumentActions] Erreur historique:', err.message);
  }
}

// ============================================================
// Constantes visuelles partagées (charte identique à la maquette validée)
// ============================================================
const NAVY = '#0F172A';
const ORANGE = '#F97316';
const GRAY = '#64748B';
const LIGHT = '#F1F5F9';
const BORDER = '#E2E8F0';
const PAGE_W = 595.28;
const PAGE_H = 841.89;

const MENTION_LETTRES = {
  facture: 'ARRÊTÉE LA PRÉSENTE FACTURE À LA SOMME DE :',
  devis: 'ARRÊTÉ LE PRÉSENT DEVIS À LA SOMME DE :',
  achat: 'ARRÊTÉE LA PRÉSENTE COMMANDE À LA SOMME DE :',
  commande: 'ARRÊTÉE LA PRÉSENTE COMMANDE À LA SOMME DE :',
  documents_metier: 'ARRÊTÉ LE PRÉSENT DOCUMENT À LA SOMME DE :'
};

function fmt(n) {
  return Number(n || 0).toFixed(3).replace('.', ',');
}

function libelleMontantLettres(donnees) {
  try {
    const lettres = montantEnLettres(Number(donnees.montant_ttc || 0), { langue: 'fr', devise: 'TND' });
    return `${lettres} tunisiens (${fmt(donnees.montant_ttc)} DT) seulement`;
  } catch (e) {
    return `${fmt(donnees.montant_ttc)} DT seulement`;
  }
}

// ---------- PDF "pro" (facture / devis / commande / achat / document métier) ----------
async function genererPDF(donnees) {
  const entreprise = donnees.entreprise || {};

  // QR de vérification (généré avant l'ouverture du flux PDF car async)
  let qrBuffer = null;
  try {
    qrBuffer = await QRCode.toBuffer(JSON.stringify({
      numero: donnees.numero,
      entreprise: entreprise.nom,
      montant_ttc: donnees.montant_ttc,
      date: donnees.date
    }), { width: 200, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } });
  } catch (e) { /* pas bloquant */ }

  // Logo entreprise (optionnel)
  let logoPath = null;
  if (entreprise.logo) {
    const p = path.join(__dirname, '..', 'uploads', 'logos', entreprise.logo);
    if (fs.existsSync(p)) logoPath = p;
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ---------- EN-TÊTE ----------
      doc.moveTo(340, 0).lineTo(PAGE_W, 0).lineTo(PAGE_W, 165).lineTo(300, 165).closePath().fill(NAVY);

      if (logoPath) {
        try { doc.image(logoPath, 40, 28, { width: 58, height: 58 }); } catch (e) { logoPath = null; }
      }
      if (!logoPath) {
        doc.roundedRect(40, 28, 58, 58, 10).fill(NAVY);
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(24)
          .text((entreprise.nom || 'E').charAt(0).toUpperCase(), 40, 46, { width: 58, align: 'center' });
      }

      doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(9).text('SOCIÉTÉ', 108, 30);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16)
        .text((entreprise.nom || 'Mon Entreprise').toUpperCase(), 108, 42, { width: 210 });
      if (entreprise.raison_sociale && entreprise.raison_sociale !== entreprise.nom) {
        doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(entreprise.raison_sociale, 108, 66, { width: 210 });
      }
      if (entreprise.adresse) {
        doc.fillColor(GRAY).font('Helvetica').fontSize(8)
          .text(`${entreprise.adresse}${entreprise.ville ? ', ' + entreprise.ville : ''}${entreprise.pays ? ' - ' + entreprise.pays : ''}`, 40, 100, { width: 280 });
      }

      const titre = donnees.titre || 'DOCUMENT';
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(donnees.titre && donnees.titre.length > 20 ? 18 : 28)
        .text(titre, 350, 26, { width: 140 });
      doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10)
        .text(`N° ${donnees.numero || ''}`, 350, donnees.titre && donnees.titre.length > 20 ? 58 : 64, { width: 140 });
      doc.fillColor('#CBD5E1').font('Helvetica').fontSize(8)
        .text(`Date : ${donnees.date ? new Date(donnees.date).toLocaleString('fr-FR') : ''}`, 350, 80, { width: 140 });

      if (qrBuffer) {
        try {
          doc.image(qrBuffer, 495, 25, { width: 68, height: 68 });
          doc.fillColor('#CBD5E1').font('Helvetica').fontSize(6)
            .text('Scannez pour vérifier', 485, 96, { width: 90, align: 'center' });
        } catch (e) { /* ignore */ }
      }

      // ---------- ÉMETTEUR / DESTINATAIRE ----------
      let y = 190;
      const boxW = 250, boxH = 128, gap = 15;

      const drawInfoBox = (x, label, color, nom, lignesTxt) => {
        doc.roundedRect(x, y, boxW, 24, 6).fill(color);
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9.5).text(label, x + 12, y + 7);
        doc.roundedRect(x, y + 24, boxW, boxH - 24, 6).fillAndStroke('#FFFFFF', BORDER);
        doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11.5).text(nom || '—', x + 12, y + 36, { width: boxW - 24 });
        let ly = y + 55;
        doc.font('Helvetica').fontSize(8.3).fillColor(GRAY);
        lignesTxt.filter(Boolean).forEach(l => {
          doc.text(l, x + 12, ly, { width: boxW - 24 });
          ly += 13;
        });
      };

      drawInfoBox(40, 'ÉMETTEUR', NAVY, entreprise.nom, [
        entreprise.adresse ? `${entreprise.adresse}${entreprise.ville ? ', ' + entreprise.ville : ''}` : null,
        entreprise.telephone ? `Tél : ${entreprise.telephone}` : null,
        entreprise.email ? `Email : ${entreprise.email}` : null,
        entreprise.matricule_fiscal ? `MF : ${entreprise.matricule_fiscal}` : null
      ]);

      const labelTiers = donnees.type === 'achat' ? 'FOURNISSEUR' : 'DESTINATAIRE';
      const tc = donnees.tiers_contact || {};
      drawInfoBox(40 + boxW + gap, labelTiers, ORANGE, donnees.tiers, [
        tc.adresse ? `${tc.adresse}${tc.ville ? ', ' + tc.ville : ''}` : null,
        tc.telephone ? `Tél : ${tc.telephone}` : null,
        tc.email ? `Email : ${tc.email}` : null,
        tc.matricule_fiscal ? `MF : ${tc.matricule_fiscal}` : null
      ]);

      y += boxH + 18;

      // ---------- RÉFÉRENCES (facture issue d'une commande/devis) ----------
      if (donnees.reference_commande || donnees.reference_devis) {
        doc.roundedRect(40, y, PAGE_W - 80, 32, 6).fillAndStroke(LIGHT, BORDER);
        let rx = 56;
        if (donnees.reference_commande) {
          doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(7.5).text('N° COMMANDE', rx, y + 6);
          doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(donnees.reference_commande, rx, y + 17);
          rx += 180;
        }
        if (donnees.reference_devis) {
          doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(7.5).text('N° DEVIS', rx, y + 6);
          doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(donnees.reference_devis, rx, y + 17);
        }
        y += 32 + 14;
      }

      // ---------- TABLEAU DES LIGNES ----------
      const tableRight = PAGE_W - 40;
      const colX = { num: 40, desig: 70, qte: 300, pu: 355, tva: 425, total: 480 };

      const drawTableHeader = () => {
        doc.roundedRect(40, y, tableRight - 40, 26, 4).fill(NAVY);
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
        doc.text('#', colX.num + 6, y + 9);
        doc.text('DÉSIGNATION', colX.desig, y + 9);
        doc.text('QTÉ', colX.qte, y + 9, { width: 40, align: 'right' });
        doc.text('PRIX HT', colX.pu, y + 9, { width: 60, align: 'right' });
        doc.text('TVA', colX.tva, y + 9, { width: 45, align: 'right' });
        doc.text('TOTAL TTC', colX.total, y + 9, { width: tableRight - colX.total - 6, align: 'right' });
        y += 26;
      };
      drawTableHeader();

      const lignes = donnees.lignes && donnees.lignes.length > 0
        ? donnees.lignes
        : [{ designation: 'Prestation', quantite: '', prix_unitaire: '', tva: '', total: donnees.montant_ttc }];

      lignes.forEach((l, idx) => {
        if (y > 740) { doc.addPage(); y = 40; drawTableHeader(); }
        const rowH = 24;
        if (idx % 2 === 0) doc.rect(40, y, tableRight - 40, rowH).fill('#FAFBFC');
        doc.fillColor(NAVY).font('Helvetica').fontSize(8.3);
        doc.text(String(idx + 1), colX.num + 6, y + 7);
        doc.text(String(l.designation || ''), colX.desig, y + 7, { width: colX.qte - colX.desig - 6 });
        doc.text(l.quantite !== undefined && l.quantite !== '' ? String(l.quantite) : '', colX.qte, y + 7, { width: 40, align: 'right' });
        doc.text(l.prix_unitaire !== undefined && l.prix_unitaire !== '' ? fmt(l.prix_unitaire) : '', colX.pu, y + 7, { width: 60, align: 'right' });
        doc.text(l.tva !== undefined && l.tva !== '' ? `${l.tva}%` : '', colX.tva, y + 7, { width: 45, align: 'right' });
        doc.fillColor(ORANGE).font('Helvetica-Bold')
          .text(l.total !== undefined ? `${fmt(l.total)} DT` : '', colX.total, y + 7, { width: tableRight - colX.total - 6, align: 'right' });
        y += rowH;
      });
      doc.moveTo(40, y).lineTo(tableRight, y).strokeColor(BORDER).stroke();
      y += 18;

      // ---------- MONTANT EN LETTRES + TOTAUX ----------
      if (y > 690) { doc.addPage(); y = 40; }
      const leftW = 300, rightW = tableRight - 40 - leftW - 16;
      const boxH2 = 92;

      doc.roundedRect(40, y, leftW, boxH2, 8).fill(NAVY);
      doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(8.5)
        .text(MENTION_LETTRES[donnees.type] || MENTION_LETTRES.facture, 56, y + 14, { width: leftW - 32 });
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10.5)
        .text(libelleMontantLettres(donnees), 56, y + 34, { width: leftW - 32 });

      const totX = 40 + leftW + 16;
      doc.roundedRect(totX, y, rightW, boxH2, 8).fillAndStroke('#FFFFFF', BORDER);
      doc.fillColor(GRAY).font('Helvetica').fontSize(9).text('Total HT', totX + 14, y + 12);
      doc.fillColor(NAVY).font('Helvetica-Bold').text(`${fmt(donnees.montant_ht)} DT`, totX + 14, y + 12, { width: rightW - 28, align: 'right' });
      doc.fillColor(GRAY).font('Helvetica').text('Total TVA', totX + 14, y + 30);
      doc.fillColor(NAVY).font('Helvetica-Bold').text(`${fmt(donnees.montant_tva)} DT`, totX + 14, y + 30, { width: rightW - 28, align: 'right' });
      doc.moveTo(totX + 14, y + 52).lineTo(totX + rightW - 14, y + 52).strokeColor(BORDER).stroke();
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12).text('TOTAL TTC', totX + 14, y + 63);
      doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(16).text(`${fmt(donnees.montant_ttc)} DT`, totX + 14, y + 60, { width: rightW - 28, align: 'right' });

      y += boxH2 + 22;

      // ---------- PAIEMENT / BANQUE / SIGNATURE ----------
      if (y > 700) { doc.addPage(); y = 40; }
      const footBoxW = (tableRight - 40 - 16) / 2;
      doc.roundedRect(40, y, footBoxW, 66, 6).fillAndStroke('#FFFFFF', BORDER);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8.5).text('CONDITIONS DE PAIEMENT', 52, y + 10);
      doc.fillColor(GRAY).font('Helvetica').fontSize(8)
        .text(entreprise.conditions_paiement || 'Paiement à réception de facture', 52, y + 26, { width: footBoxW - 24 });

      if (entreprise.banque_rib || entreprise.banque_iban) {
        const bx = 40 + footBoxW + 16;
        doc.roundedRect(bx, y, footBoxW, 66, 6).fillAndStroke('#FFFFFF', BORDER);
        doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8.5).text('COORDONNÉES BANCAIRES', bx + 12, y + 10);
        doc.fillColor(GRAY).font('Helvetica').fontSize(7.6);
        let by = y + 25;
        if (entreprise.banque_nom) { doc.text(`Banque : ${entreprise.banque_nom}`, bx + 12, by, { width: footBoxW - 24 }); by += 11; }
        if (entreprise.banque_rib) { doc.text(`RIB : ${entreprise.banque_rib}`, bx + 12, by, { width: footBoxW - 24 }); by += 11; }
        if (entreprise.banque_iban) { doc.text(`IBAN : ${entreprise.banque_iban}`, bx + 12, by, { width: footBoxW - 24 }); by += 11; }
        if (entreprise.banque_swift) { doc.text(`SWIFT : ${entreprise.banque_swift}`, bx + 12, by, { width: footBoxW - 24 }); }
      }

      y += 66 + 24;
      if (y > 790) { doc.addPage(); y = 40; }
      doc.fillColor(GRAY).font('Helvetica-Oblique').fontSize(8)
        .text('Cachet & Signature', tableRight - 150, y, { width: 150, align: 'right' });

      // Bandeau final
      doc.rect(0, PAGE_H - 40, PAGE_W, 40).fill(NAVY);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10)
        .text('Merci pour votre confiance !', 0, PAGE_H - 28, { width: PAGE_W, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ---------- WORD (version stylée, cohérente avec le PDF) ----------
async function genererWord(donnees) {
  const entreprise = donnees.entreprise || {};
  const tc = donnees.tiers_contact || {};
  const labelTiers = donnees.type === 'achat' ? 'Fournisseur' : 'Destinataire';

  const cell = (text, opts = {}) => new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), bold: !!opts.bold, size: opts.size || 18, color: opts.color })], alignment: opts.align || AlignmentType.LEFT })],
    width: { size: opts.width || 20, type: WidthType.PERCENTAGE },
    shading: opts.bg ? { fill: opts.bg } : undefined
  });

  const children = [
    new Paragraph({
      children: [new TextRun({ text: (entreprise.nom || 'Mon Entreprise').toUpperCase(), bold: true, size: 30, color: '0F172A' })],
      spacing: { after: 40 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `${entreprise.adresse || ''}${entreprise.ville ? ', ' + entreprise.ville : ''} — MF: ${entreprise.matricule_fiscal || '-'}`, size: 18, color: '64748B' })],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [new TextRun({ text: donnees.titre, bold: true, size: 34, color: 'F97316' })],
      spacing: { after: 60 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `N° ${donnees.numero} — ${donnees.date ? new Date(donnees.date).toLocaleDateString('fr-FR') : ''}`, size: 20, color: '0F172A' })],
      spacing: { after: 240 }
    }),
    new Paragraph({ children: [new TextRun({ text: `${labelTiers} : `, bold: true, size: 20 }), new TextRun({ text: donnees.tiers || '-', size: 20 })], spacing: { after: 40 } }),
    new Paragraph({ children: [new TextRun({ text: [tc.adresse, tc.ville].filter(Boolean).join(', ') || '', size: 18, color: '64748B' })], spacing: { after: 20 } }),
    new Paragraph({ children: [new TextRun({ text: [tc.telephone ? `Tél: ${tc.telephone}` : '', tc.email ? `Email: ${tc.email}` : ''].filter(Boolean).join('  ·  '), size: 18, color: '64748B' })], spacing: { after: 240 } })
  ];

  const rows = [
    new TableRow({ children: [
      cell('Désignation', { bold: true, color: 'FFFFFF', bg: '0F172A', width: 40 }),
      cell('Qté', { bold: true, color: 'FFFFFF', bg: '0F172A', width: 12, align: AlignmentType.RIGHT }),
      cell('Prix HT', { bold: true, color: 'FFFFFF', bg: '0F172A', width: 16, align: AlignmentType.RIGHT }),
      cell('TVA', { bold: true, color: 'FFFFFF', bg: '0F172A', width: 12, align: AlignmentType.RIGHT }),
      cell('Total TTC', { bold: true, color: 'FFFFFF', bg: '0F172A', width: 20, align: AlignmentType.RIGHT })
    ]})
  ];

  (donnees.lignes || []).forEach(l => {
    rows.push(new TableRow({ children: [
      cell(l.designation, { width: 40 }),
      cell(l.quantite, { width: 12, align: AlignmentType.RIGHT }),
      cell(fmt(l.prix_unitaire), { width: 16, align: AlignmentType.RIGHT }),
      cell(l.tva ? `${l.tva}%` : '-', { width: 12, align: AlignmentType.RIGHT }),
      cell(`${fmt(l.total)} DT`, { width: 20, align: AlignmentType.RIGHT, bold: true, color: 'F97316' })
    ]}));
  });

  children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  children.push(
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({
      children: [new TextRun({ text: (MENTION_LETTRES[donnees.type] || MENTION_LETTRES.facture) + ' ', bold: true, size: 18, color: 'F97316' })],
    }),
    new Paragraph({
      children: [new TextRun({ text: libelleMontantLettres(donnees), size: 20, bold: true, color: '0F172A' })],
      spacing: { after: 200 }
    }),
    new Paragraph({ children: [new TextRun({ text: `Total HT : ${fmt(donnees.montant_ht)} DT`, size: 20 })], alignment: AlignmentType.RIGHT }),
    new Paragraph({ children: [new TextRun({ text: `Total TVA : ${fmt(donnees.montant_tva)} DT`, size: 20 })], alignment: AlignmentType.RIGHT }),
    new Paragraph({
      children: [new TextRun({ text: `TOTAL TTC : ${fmt(donnees.montant_ttc)} DT`, bold: true, size: 26, color: 'F97316' })],
      alignment: AlignmentType.RIGHT, spacing: { before: 100, after: 240 }
    }),
    new Paragraph({ children: [new TextRun({ text: `Conditions de paiement : ${entreprise.conditions_paiement || '-'}`, size: 16, color: '64748B' })] })
  );

  if (entreprise.banque_rib || entreprise.banque_iban) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Banque : ${entreprise.banque_nom || '-'}  ·  RIB : ${entreprise.banque_rib || '-'}  ·  IBAN : ${entreprise.banque_iban || '-'}`,
        size: 16, color: '64748B'
      })]
    }));
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

// ---------- EXCEL ----------
async function genererExcel(donnees) {
  const entreprise = donnees.entreprise || {};
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet((donnees.titre || 'Document').substring(0, 28));

  sheet.addRow([entreprise.nom || 'Mon Entreprise']);
  sheet.addRow([donnees.titre, `N° ${donnees.numero}`, donnees.date ? new Date(donnees.date).toLocaleDateString('fr-FR') : '']);
  sheet.addRow([(donnees.type === 'achat' ? 'Fournisseur' : 'Client'), donnees.tiers || '-']);
  sheet.addRow([]);
  sheet.addRow(['Désignation', 'Quantité', 'Prix HT', 'TVA (%)', 'Total TTC']);
  (donnees.lignes || []).forEach(l => {
    sheet.addRow([l.designation, l.quantite, l.prix_unitaire, l.tva || 0, l.total]);
  });
  sheet.addRow([]);
  sheet.addRow(['', '', '', 'Total HT', Number(donnees.montant_ht || 0)]);
  sheet.addRow(['', '', '', 'Total TVA', Number(donnees.montant_tva || 0)]);
  sheet.addRow(['', '', '', 'Total TTC', Number(donnees.montant_ttc || 0)]);
  sheet.columns.forEach(c => { c.width = 22; });

  return workbook.xlsx.writeBuffer();
}

// ---------- QR / étiquette ----------
async function genererEtiquetteQR(donnees) {
  const contenu = JSON.stringify({ numero: donnees.numero, titre: donnees.titre, montant: donnees.montant_ttc });
  const qrDataUrl = await QRCode.toDataURL(contenu, { width: 220, margin: 1 });
  return {
    qrDataUrl,
    html: `<div style="width:280px;padding:12px;border:1px solid #ccc;text-align:center;font-family:Arial">
             <strong>${donnees.titre}</strong><br/>
             N° ${donnees.numero}<br/>
             <img src="${qrDataUrl}" width="150" height="150"/><br/>
             <span style="font-size:11px">${donnees.tiers || ''}</span>
           </div>`
  };
}

// ---------- Sauvegarde disque ----------
function sauvegarderFichier(buffer, entrepriseId, nomFichier) {
  const dossier = path.join(__dirname, '..', 'uploads', 'documents_generes', String(entrepriseId));
  fs.mkdirSync(dossier, { recursive: true });
  const cheminFichier = path.join(dossier, nomFichier);
  fs.writeFileSync(cheminFichier, buffer);
  return cheminFichier;
}

// ---------- Signature électronique ----------
function signBuffer(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return hash;
}

// ---------- Pipeline complet ----------
async function traiterAction(db, { action, type, id, user, options = {} }) {
  const donnees = await resoudreDocument(db, type, id);
  const entrepriseId = user.entreprise_id;

  switch (action) {
    case 'pdf': {
      const buffer = await genererPDF(donnees);
      const signature = signBuffer(buffer);
      const nomFichier = `${type}_${donnees.numero}_${Date.now()}.pdf`;
      const chemin = sauvegarderFichier(buffer, entrepriseId, nomFichier);
      await enregistrerHistorique(db, type, id, 'export_pdf', { chemin }, user.id);
      return { buffer, signature, contentType: 'application/pdf', filename: nomFichier };
    }
    case 'word': {
      const buffer = await genererWord(donnees);
      const nomFichier = `${type}_${donnees.numero}_${Date.now()}.docx`;
      const chemin = sauvegarderFichier(buffer, entrepriseId, nomFichier);
      await enregistrerHistorique(db, type, id, 'export_word', { chemin }, user.id);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', filename: nomFichier };
    }
    case 'excel': {
      const buffer = await genererExcel(donnees);
      const nomFichier = `${type}_${donnees.numero}_${Date.now()}.xlsx`;
      const chemin = sauvegarderFichier(buffer, entrepriseId, nomFichier);
      await enregistrerHistorique(db, type, id, 'export_excel', { chemin }, user.id);
      return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: nomFichier };
    }
    case 'etiquette': {
      const etiquette = await genererEtiquetteQR(donnees);
      await enregistrerHistorique(db, type, id, 'generation_etiquette', {}, user.id);
      return etiquette;
    }
    case 'email': {
      const buffer = await genererPDF(donnees);
      const destinataire = options.email;
      if (!destinataire) throw new Error('Adresse e-mail destinataire requise');
      await notificationService.sendEmail({
        to: destinataire,
        subject: `${donnees.titre} N° ${donnees.numero}`,
        html: `<p>Veuillez trouver ci-joint votre document <strong>${donnees.titre} N° ${donnees.numero}</strong>.</p>`,
        text: `${donnees.titre} N° ${donnees.numero} en pièce jointe.`,
        attachments: [{ filename: `${type}_${donnees.numero}.pdf`, content: buffer.toString('base64'), contentType: 'application/pdf' }]
      });
      await enregistrerHistorique(db, type, id, 'envoi_email', { destinataire }, user.id);
      return { success: true };
    }
    case 'whatsapp': {
      const numero = options.telephone;
      if (!numero) throw new Error('Numéro de téléphone requis');
      const message = `${donnees.titre} N° ${donnees.numero}\nTiers: ${donnees.tiers || ''}\nTotal TTC: ${fmt(donnees.montant_ttc)} DT`;
      const resultat = await notificationService.sendWhatsApp({ to: numero, message });
      await enregistrerHistorique(db, type, id, 'partage_whatsapp', { numero }, user.id);
      return resultat;
    }
    case 'sign': {
      const buffer = await genererPDF(donnees);
      const signature = signBuffer(buffer);
      const nomFichier = `${type}_${donnees.numero}_signe_${Date.now()}.pdf`;
      sauvegarderFichier(buffer, entrepriseId, nomFichier);
      await enregistrerHistorique(db, type, id, 'signature_electronique', { signature }, user.id);
      return { signature, filename: nomFichier };
    }
    case 'archive': {
      const [existing] = await query(db, 'SELECT id FROM archives WHERE type_entite = ? AND entite_id = ?', [type, id]);
      if (!existing) {
        await db.promise().query(
          `INSERT INTO archives (type_entite, entite_id, donnees, motif, archived_by, company_id) VALUES (?,?,?,?,?,?)`,
          [type, id, JSON.stringify(donnees.raw || donnees), options.motif || 'Archivage automatique', user.id, entrepriseId]
        );
      }
      await enregistrerHistorique(db, type, id, 'archivage', {}, user.id);
      return { success: true };
    }
    case 'history': {
      const rows = await query(db,
        `SELECT dh.*, u.nom, u.prenom FROM documents_historique dh
         LEFT JOIN users u ON dh.performed_by = u.id
         WHERE dh.type_document = ? AND dh.document_id = ?
         ORDER BY dh.created_at DESC`,
        [type, id]
      );
      return { historique: rows };
    }
    default:
      throw new Error(`Action inconnue : ${action}`);
  }
}

module.exports = { traiterAction, genererPDF, genererWord, genererExcel, genererEtiquetteQR };