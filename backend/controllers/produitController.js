exports.getAllProduits = (req, res) => {
  const db = req.db;
  db.query('SELECT * FROM produits ORDER BY id DESC', (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ produits: results });
  });
};

exports.getProduitById = (req, res) => {
  const db = req.db;
  db.query('SELECT * FROM produits WHERE id = ?', [req.params.id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (results.length === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ produit: results[0] });
  });
};

exports.createProduit = (req, res) => {
  const db = req.db;
  const { nom, description, prix, quantite_stock } = req.body;

  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du produit est requis' });
  }
  if (prix === undefined || isNaN(prix) || Number(prix) < 0) {
    return res.status(400).json({ message: 'Le prix doit être un nombre positif' });
  }
  const stock = quantite_stock === undefined || quantite_stock === '' ? 0 : Number(quantite_stock);
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ message: 'La quantité en stock doit être un nombre positif' });
  }

  const sql = 'INSERT INTO produits (nom, description, prix, quantite_stock) VALUES (?, ?, ?, ?)';
  db.query(sql, [nom.trim(), description || null, Number(prix), stock], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.status(201).json({ message: 'Produit créé avec succès', id: result.insertId });
  });
};

exports.updateProduit = (req, res) => {
  const db = req.db;
  const { nom, description, prix, quantite_stock } = req.body;

  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du produit est requis' });
  }
  if (prix === undefined || isNaN(prix) || Number(prix) < 0) {
    return res.status(400).json({ message: 'Le prix doit être un nombre positif' });
  }
  const stock = quantite_stock === undefined || quantite_stock === '' ? 0 : Number(quantite_stock);
  if (isNaN(stock) || stock < 0) {
    return res.status(400).json({ message: 'La quantité en stock doit être un nombre positif' });
  }

  const sql = 'UPDATE produits SET nom = ?, description = ?, prix = ?, quantite_stock = ? WHERE id = ?';
  db.query(sql, [nom.trim(), description || null, Number(prix), stock, req.params.id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ message: 'Produit mis à jour avec succès' });
  });
};

exports.deleteProduit = (req, res) => {
  const db = req.db;
  db.query('DELETE FROM produits WHERE id = ?', [req.params.id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
    res.json({ message: 'Produit supprimé avec succès' });
  });
};