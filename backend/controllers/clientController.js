const db = require('../config/db');

exports.getAllClients = (req, res) => {
  db.query(
    'SELECT * FROM clients WHERE entreprise_id = ? ORDER BY id DESC',
    [req.user.entreprise_id],
    (err, results) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      res.json({ clients: results });
    }
  );
};

exports.getClientById = (req, res) => {
  db.query(
    'SELECT * FROM clients WHERE id = ? AND entreprise_id = ?',
    [req.params.id, req.user.entreprise_id],
    (err, results) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (results.length === 0) return res.status(404).json({ message: 'Client introuvable' });
      res.json({ client: results[0] });
    }
  );
};

exports.createClient = (req, res) => {
  const { nom, email, telephone, adresse } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du client est requis' });
  }
  const sql = 'INSERT INTO clients (entreprise_id, nom, email, telephone, adresse) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [req.user.entreprise_id, nom.trim(), email || null, telephone || null, adresse || null], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.status(201).json({ message: 'Client créé avec succès', id: result.insertId });
  });
};

exports.updateClient = (req, res) => {
  const { nom, email, telephone, adresse } = req.body;
  if (!nom || nom.trim().length < 2) {
    return res.status(400).json({ message: 'Le nom du client est requis' });
  }
  const sql = 'UPDATE clients SET nom = ?, email = ?, telephone = ?, adresse = ? WHERE id = ? AND entreprise_id = ?';
  db.query(sql, [nom.trim(), email || null, telephone || null, adresse || null, req.params.id, req.user.entreprise_id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Client introuvable' });
    res.json({ message: 'Client mis à jour avec succès' });
  });
};

exports.deleteClient = (req, res) => {
  db.query(
    'DELETE FROM clients WHERE id = ? AND entreprise_id = ?',
    [req.params.id, req.user.entreprise_id],
    (err, result) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Client introuvable' });
      res.json({ message: 'Client supprimé avec succès' });
    }
  );
};
