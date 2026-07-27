const encryptionService = require('../services/encryption.service');
const AuditService = require('../services/audit.service');

exports.getAllFournisseurs = (req, res) => {
  const db = req.db;
  db.query('SELECT * FROM fournisseurs ORDER BY id DESC', (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    
    const fournisseurs = results.map(fournisseur => ({
      ...fournisseur,
      email: encryptionService.decrypt(fournisseur.email),
      telephone: encryptionService.decrypt(fournisseur.telephone),
      adresse: encryptionService.decrypt(fournisseur.adresse)
    }));
    
    res.json({ fournisseurs });
  });
};

exports.getFournisseurById = (req, res) => {
  const db = req.db;
  db.query('SELECT * FROM fournisseurs WHERE id = ?', [req.params.id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (results.length === 0) return res.status(404).json({ message: 'Fournisseur introuvable' });
    
    const fournisseur = results[0];
    fournisseur.email = encryptionService.decrypt(fournisseur.email);
    fournisseur.telephone = encryptionService.decrypt(fournisseur.telephone);
    fournisseur.adresse = encryptionService.decrypt(fournisseur.adresse);
    
    res.json({ fournisseur });
  });
};

exports.createFournisseur = (req, res) => {
  const db = req.db;
  const { nom, email, telephone, adresse } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du fournisseur est requis' });
  }
  
  const encryptedEmail = encryptionService.encrypt(email);
  const encryptedTelephone = encryptionService.encrypt(telephone);
  const encryptedAdresse = encryptionService.encrypt(adresse);
  
  const sql = 'INSERT INTO fournisseurs (nom, email, telephone, adresse) VALUES (?, ?, ?, ?)';
  db.query(sql, [nom.trim(), encryptedEmail, encryptedTelephone, encryptedAdresse], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.status(201).json({ message: 'Fournisseur créé avec succès', id: result.insertId });
  });
};

exports.updateFournisseur = (req, res) => {
  const db = req.db;
  const { nom, email, telephone, adresse } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du fournisseur est requis' });
  }
  
  db.query('SELECT * FROM fournisseurs WHERE id = ?', [req.params.id], (errSelect, oldData) => {
    if (errSelect) { console.error(errSelect); return res.status(500).json({ message: 'Erreur serveur' }); }
    
    const encryptedEmail = encryptionService.encrypt(email);
    const encryptedTelephone = encryptionService.encrypt(telephone);
    const encryptedAdresse = encryptionService.encrypt(adresse);
    
    const sql = 'UPDATE fournisseurs SET nom = ?, email = ?, telephone = ?, adresse = ? WHERE id = ?';
    db.query(sql, [nom.trim(), encryptedEmail, encryptedTelephone, encryptedAdresse, req.params.id], (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Fournisseur introuvable' });
      res.json({ message: 'Fournisseur mis à jour avec succès' });
    });
  });
};

exports.deleteFournisseur = (req, res) => {
  const db = req.db;
  db.query('DELETE FROM fournisseurs WHERE id = ?', [req.params.id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Fournisseur introuvable' });
    res.json({ message: 'Fournisseur supprimé avec succès' });
  });
};