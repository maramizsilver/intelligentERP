const AuditService = require('../services/audit.service');

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
  const { 
    nom, reference, code_barre, description, prix, prix_achat, prix_vente,
    prix_unitaire_ht, tva, unite, categorie, fournisseur_id, seuil_alerte,
    actif, quantite_stock
  } = req.body;

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

  const sql = `INSERT INTO produits 
    (nom, reference, code_barre, description, prix, prix_achat, prix_vente,
     prix_unitaire_ht, tva, unite, categorie, fournisseur_id, seuil_alerte, actif, quantite_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [
    nom.trim(), reference || null, code_barre || null, description || null, Number(prix),
    prix_achat || null, prix_vente || null, prix_unitaire_ht || null,
    tva || 0, unite || 'unité', categorie || null, fournisseur_id || null,
    seuil_alerte || 5, actif !== undefined ? (actif ? 1 : 0) : 1, stock
  ], (err, result) => {
    if (err) { 
      console.error(err); 
      return res.status(500).json({ message: 'Erreur serveur' }); 
    }
    
    AuditService.logOperation(db, {
      utilisateur_id: req.user.id,
      entreprise_id: req.user.entreprise_id,
      operation: 'CREATE',
      table_name: 'produits',
      record_id: result.insertId,
      nouvelles_valeurs: { nom, reference, code_barre, description, prix, prix_achat, prix_vente, prix_unitaire_ht, tva, unite, categorie, fournisseur_id, seuil_alerte, actif, quantite_stock },
      ip: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    }).catch(err => console.error('Erreur audit operation:', err));

    res.status(201).json({ message: 'Produit créé avec succès', id: result.insertId });
  });
};

exports.updateProduit = (req, res) => {
  const db = req.db;
  const { 
    nom, reference, code_barre, description, prix, prix_achat, prix_vente,
    prix_unitaire_ht, tva, unite, categorie, fournisseur_id, seuil_alerte,
    actif, quantite_stock
  } = req.body;

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

  db.query('SELECT * FROM produits WHERE id = ?', [req.params.id], (errSelect, oldData) => {
    if (errSelect) { 
      console.error(errSelect); 
      return res.status(500).json({ message: 'Erreur serveur' }); 
    }
    
    const sql = `UPDATE produits SET 
      nom = ?, reference = ?, code_barre = ?, description = ?, prix = ?,
      prix_achat = ?, prix_vente = ?, prix_unitaire_ht = ?, tva = ?,
      unite = ?, categorie = ?, fournisseur_id = ?, seuil_alerte = ?,
      actif = ?, quantite_stock = ?
      WHERE id = ?`;

    db.query(sql, [
      nom.trim(), reference || null, code_barre || null, description || null, Number(prix),
      prix_achat || null, prix_vente || null, prix_unitaire_ht || null,
      tva || 0, unite || 'unité', categorie || null, fournisseur_id || null,
      seuil_alerte || 5, actif !== undefined ? (actif ? 1 : 0) : 1, stock,
      req.params.id
    ], (err, result) => {
      if (err) { 
        console.error(err); 
        return res.status(500).json({ message: 'Erreur serveur' }); 
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
      
      AuditService.logOperation(db, {
        utilisateur_id: req.user.id,
        entreprise_id: req.user.entreprise_id,
        operation: 'UPDATE',
        table_name: 'produits',
        record_id: req.params.id,
        anciennes_valeurs: oldData[0] || null,
        nouvelles_valeurs: { nom, reference, code_barre, description, prix, prix_achat, prix_vente, prix_unitaire_ht, tva, unite, categorie, fournisseur_id, seuil_alerte, actif, quantite_stock },
        ip: req.ip || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
      }).catch(err => console.error('Erreur audit operation:', err));

      res.json({ message: 'Produit mis à jour avec succès' });
    });
  });
};

exports.deleteProduit = (req, res) => {
  const db = req.db;
  
  db.query('SELECT * FROM produits WHERE id = ?', [req.params.id], (errSelect, oldData) => {
    if (errSelect) { 
      console.error(errSelect); 
      return res.status(500).json({ message: 'Erreur serveur' }); 
    }
    
    db.query('DELETE FROM produits WHERE id = ?', [req.params.id], (err, result) => {
      if (err) { 
        console.error(err); 
        return res.status(500).json({ message: 'Erreur serveur' }); 
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Produit introuvable' });
      
      AuditService.logOperation(db, {
        utilisateur_id: req.user.id,
        entreprise_id: req.user.entreprise_id,
        operation: 'DELETE',
        table_name: 'produits',
        record_id: req.params.id,
        anciennes_valeurs: oldData[0] || null,
        ip: req.ip || req.connection.remoteAddress,
        user_agent: req.headers['user-agent']
      }).catch(err => console.error('Erreur audit operation:', err));

      res.json({ message: 'Produit supprimé avec succès' });
    });
  });
};