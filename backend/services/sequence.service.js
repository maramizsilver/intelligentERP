// backend/services/sequence.service.js
const CHAMPS_AUTORISES = [
  'dernier_numero_bc', 'dernier_numero_devis', 'dernier_numero_transaction',
  'dernier_numero_facture', 'dernier_numero_generique'
];

class SequenceService {
  static genererNumeroBC(db, eid)          { return this._generer(db, 'dernier_numero_bc', 'BC', eid, 4); }
  static genererNumeroDevis(db, eid)       { return this._generer(db, 'dernier_numero_devis', 'DEV', eid, 4); }
  static genererNumeroTransaction(db, eid) { return this._generer(db, 'dernier_numero_transaction', 'TR', eid, 5); }
  static genererNumeroFacture(db, eid)     { return this._generer(db, 'dernier_numero_facture', 'FAC', eid, 4); }
  static genererNumeroGenerique(db, eid, prefixe) {
    return this._generer(db, 'dernier_numero_generique', prefixe, eid, 5);
  }

  // Incrément ATOMIQUE : LAST_INSERT_ID(col + 1) renvoie la valeur sans course entre deux requêtes
  static async _generer(db, champ, prefix, entrepriseId, largeur) {
    if (!CHAMPS_AUTORISES.includes(champ)) throw new Error('Champ de séquence invalide');
    const conn = await db.promise().getConnection();
    try {
      await conn.query('INSERT IGNORE INTO sequences (entreprise_id) VALUES (?)', [entrepriseId]);
      await conn.query(
        `UPDATE sequences SET ${champ} = LAST_INSERT_ID(${champ} + 1) WHERE entreprise_id = ?`, [entrepriseId]);
      const [[{ n }]] = await conn.query('SELECT LAST_INSERT_ID() AS n');

      const maintenant = new Date();
      const periode = `${maintenant.getFullYear()}${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
      return `${prefix}-${periode}-${String(n).padStart(largeur, '0')}`;
    } finally {
      conn.release();
    }
  }
}

module.exports = SequenceService;