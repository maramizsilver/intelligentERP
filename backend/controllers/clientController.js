
exports.getAllClients = (req, res) => {
  const db = req.db; 
  db.query('SELECT * FROM clients ORDER BY id DESC', (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ clients: results });
  });
};

exports.getClientById = (req, res) => {
  const db = req.db;
  db.query('SELECT * FROM clients WHERE id = ?', [req.params.id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (results.length === 0) return res.status(404).json({ message: 'Client introuvable' });
    res.json({ client: results[0] });
  });
};

exports.createClient = (req, res) => {
  const db = req.db;
  const { nom, email, telephone, adresse } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du client est requis' });
  }
  const sql = 'INSERT INTO clients (nom, email, telephone, adresse) VALUES (?, ?, ?, ?)';
  db.query(sql, [nom.trim(), email || null, telephone || null, adresse || null], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.status(201).json({ message: 'Client créé avec succès', id: result.insertId });
  });
};

exports.updateClient = (req, res) => {
  const db = req.db;
  const { nom, email, telephone, adresse } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du client est requis' });
  }
  const sql = 'UPDATE clients SET nom = ?, email = ?, telephone = ?, adresse = ? WHERE id = ?';
  db.query(sql, [nom.trim(), email || null, telephone || null, adresse || null, req.params.id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Client introuvable' });
    res.json({ message: 'Client mis à jour avec succès' });
  });
};

exports.deleteClient = (req, res) => {
  const db = req.db;
  db.query('DELETE FROM clients WHERE id = ?', [req.params.id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Client introuvable' });
    res.json({ message: 'Client supprimé avec succès' });
  });
};