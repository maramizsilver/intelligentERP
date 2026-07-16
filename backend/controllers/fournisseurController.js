exports.getAllFournisseurs = (req, res) => {
  const db = req.db;
  db.query('SELECT * FROM fournisseurs ORDER BY id DESC', (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ fournisseurs: results });
  });
};

exports.getFournisseurById = (req, res) => {
  const db = req.db;
  db.query('SELECT * FROM fournisseurs WHERE id = ?', [req.params.id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (results.length === 0) return res.status(404).json({ message: 'Fournisseur introuvable' });
    res.json({ fournisseur: results[0] });
  });
};

exports.createFournisseur = (req, res) => {
  const db = req.db;
  const { nom, email, telephone, adresse } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du fournisseur est requis' });
  }
  const sql = 'INSERT INTO fournisseurs (nom, email, telephone, adresse) VALUES (?, ?, ?, ?)';
  db.query(sql, [nom.trim(), email || null, telephone || null, adresse || null], (err, result) => {
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
  const sql = 'UPDATE fournisseurs SET nom = ?, email = ?, telephone = ?, adresse = ? WHERE id = ?';
  db.query(sql, [nom.trim(), email || null, telephone || null, adresse || null, req.params.id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Fournisseur introuvable' });
    res.json({ message: 'Fournisseur mis à jour avec succès' });
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