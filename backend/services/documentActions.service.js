const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const ExcelJS = require('exceljs');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { resoudreDocument } = require('./documentResolvers.service');
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

// ---------- PDF ----------
async function genererPDF(donnees) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(18).font('Helvetica-Bold').fillColor('#0EA5E9').text(donnees.titre, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#64748B')
         .text(`N° ${donnees.numero}  —  ${donnees.date ? new Date(donnees.date).toLocaleDateString('fr-FR') : ''}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).fillColor('#0F172A').text(`Tiers : ${donnees.tiers || '-'}`);
      doc.moveDown();

      if (donnees.lignes && donnees.lignes.length > 0) {
        doc.font('Helvetica-Bold').fontSize(10);
        let y = doc.y;
        doc.text('Désignation', 50, y, { width: 220 });
        doc.text('Qté', 280, y, { width: 60 });
        doc.text('P.U.', 350, y, { width: 80 });
        doc.text('Total', 450, y, { width: 90 });
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10);
        donnees.lignes.forEach(l => {
          y = doc.y;
          doc.text(String(l.designation || ''), 50, y, { width: 220 });
          doc.text(String(l.quantite || ''), 280, y, { width: 60 });
          doc.text(String(l.prix_unitaire || ''), 350, y, { width: 80 });
          doc.text(String(l.total || ''), 450, y, { width: 90 });
          doc.moveDown(0.3);
        });
        doc.moveDown();
      }

      doc.font('Helvetica-Bold').fontSize(12)
         .text(`Total HT : ${donnees.montant_ht ?? 0} DT`, { align: 'right' })
         .text(`Total TTC : ${donnees.montant_ttc ?? 0} DT`, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#94A3B8').text('Document généré automatiquement — ERP', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ---------- WORD ----------
async function genererWord(donnees) {
  const children = [
    new Paragraph({ children: [new TextRun({ text: donnees.titre, bold: true, size: 32, color: '0EA5E9' })], alignment: AlignmentType.CENTER, spacing: { after: 150 } }),
    new Paragraph({ children: [new TextRun({ text: `N° ${donnees.numero} — ${donnees.date ? new Date(donnees.date).toLocaleDateString('fr-FR') : ''}`, size: 20, color: '64748B' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: `Tiers : ${donnees.tiers || '-'}`, size: 22 })], spacing: { after: 200 } })
  ];

  (donnees.lignes || []).forEach(l => {
    children.push(new Paragraph({
      children: [new TextRun({ text: `${l.designation}  —  Qté: ${l.quantite}  —  P.U.: ${l.prix_unitaire}  —  Total: ${l.total}`, size: 20 })],
      spacing: { after: 80 }
    }));
  });

  children.push(new Paragraph({
    children: [new TextRun({ text: `TOTAL TTC : ${donnees.montant_ttc ?? 0} DT`, bold: true, size: 26, color: '0EA5E9' })],
    alignment: AlignmentType.RIGHT, spacing: { before: 200 }
  }));

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

// ---------- EXCEL ----------
async function genererExcel(donnees) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(donnees.titre.substring(0, 28) || 'Document');

  sheet.addRow([donnees.titre]);
  sheet.addRow([`N° ${donnees.numero}`, donnees.date ? new Date(donnees.date).toLocaleDateString('fr-FR') : '']);
  sheet.addRow([`Tiers`, donnees.tiers || '-']);
  sheet.addRow([]);
  sheet.addRow(['Désignation', 'Quantité', 'Prix unitaire', 'Total']);
  (donnees.lignes || []).forEach(l => {
    sheet.addRow([l.designation, l.quantite, l.prix_unitaire, l.total]);
  });
  sheet.addRow([]);
  sheet.addRow(['', '', 'Total HT', donnees.montant_ht ?? 0]);
  sheet.addRow(['', '', 'Total TTC', donnees.montant_ttc ?? 0]);
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
      const message = `${donnees.titre} N° ${donnees.numero}\nTiers: ${donnees.tiers || ''}\nTotal TTC: ${donnees.montant_ttc ?? 0} DT`;
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