const SequenceService = require('./sequence.service');

const PREFIXES = {
  bon_livraison: 'BL',
  bon_preparation: 'BP',
  bon_reception: 'BR',
  bon_entree: 'BE',
  bon_sortie: 'BS',
  bon_transfert: 'BT',
  demande_achat: 'DA',
  recu: 'REC',
  facture_proforma: 'PROF',
  facture_avoir: 'AV',
  facture_electronique: 'FELEC'
};

async function creerDocumentMetier(db, entrepriseId, { type_document, tiers_nom, donnees, montant_ht = 0, montant_ttc = 0, reference_type = null, reference_id = null, created_by }) {
  if (!PREFIXES[type_document]) {
    throw new Error(`Type de document metier inconnu : ${type_document}`);
  }
  const numero = await SequenceService.genererNumeroGenerique(db, entrepriseId, PREFIXES[type_document]);
  const [result] = await db.promise().query(
    `INSERT INTO documents_metier
     (type_document, numero, reference_type, reference_id, tiers_nom, donnees, montant_ht, montant_ttc, statut, created_by, company_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'brouillon', ?, ?)`,
    [type_document, numero, reference_type, reference_id, tiers_nom || null, JSON.stringify(donnees || {}), montant_ht, montant_ttc, created_by || null, entrepriseId]
  );
  return { id: result.insertId, numero };
}

function getDocumentMetierById(db, id) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM documents_metier WHERE id = ?', [id], (err, rows) => {
      if (err) return reject(err);
      if (rows.length === 0) return reject(new Error('Document introuvable'));
      const d = rows[0];
      d.donnees = typeof d.donnees === 'string' ? JSON.parse(d.donnees) : d.donnees;
      resolve(d);
    });
  });
}

function getAllDocumentsMetier(db, type_document, entrepriseId) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM documents_metier WHERE company_id = ?';
    const params = [entrepriseId];
    if (type_document) { 
      sql += ' AND type_document = ?'; 
      params.push(type_document); 
    }
    sql += ' ORDER BY id DESC';
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => ({ ...r, donnees: typeof r.donnees === 'string' ? JSON.parse(r.donnees) : r.donnees })));
    });
  });
}

function updateDocumentMetierStatut(db, id, statut) {
  return new Promise((resolve, reject) => {
    db.query('UPDATE documents_metier SET statut = ? WHERE id = ?', [statut, id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

module.exports = { creerDocumentMetier, getDocumentMetierById, getAllDocumentsMetier, updateDocumentMetierStatut, PREFIXES };