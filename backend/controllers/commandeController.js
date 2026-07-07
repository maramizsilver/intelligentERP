const db = require('../config/db');

// GET toutes les commandes de l'entreprise connectée (avec nom du client)
// Un utilisateur EXTERNE (portail client) ne voit que ses propres commandes
exports.getAllCommandes = (req, res) => {
  let sql = `
    SELECT c.*, cl.nom AS client_nom
    FROM commandes c
    JOIN clients cl ON c.client_id = cl.id
    WHERE cl.entreprise_id = ?
  `;
  const params = [req.user.entreprise_id];

  if (req.user.is_external) {
    sql += ' AND c.client_id = ?';
    params.push(req.user.client_id);
  }
  sql += ' ORDER BY c.id DESC';

  db.query(sql, params, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    res.json({ commandes: results });
  });
};

// GET une commande + ses lignes
exports.getCommandeById = (req, res) => {
  const sqlCommande = `
    SELECT c.*, cl.nom AS client_nom, cl.entreprise_id
    FROM commandes c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.id = ?
  `;
  db.query(sqlCommande, [req.params.id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (results.length === 0) return res.status(404).json({ message: 'Commande introuvable' });

    const commande = results[0];

    // Isolation multi-tenant : la commande doit appartenir à l'entreprise connectée
    if (commande.entreprise_id !== req.user.entreprise_id) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }
    // Un utilisateur externe ne peut consulter que ses propres commandes
    if (req.user.is_external && commande.client_id !== req.user.client_id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const sqlLignes = `
      SELECT cp.*, p.nom AS produit_nom
      FROM commande_produits cp
      JOIN produits p ON cp.produit_id = p.id
      WHERE cp.commande_id = ?
    `;
    db.query(sqlLignes, [req.params.id], (err2, lignes) => {
      if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
      res.json({ commande: { ...commande, lignes } });
    });
  });
};

// CREATE commande + lignes
// body attendu : { client_id, lignes: [{ produit_id, quantite }] }
// Si l'utilisateur est externe (portail client), son client_id est imposé automatiquement
exports.createCommande = (req, res) => {
  const { lignes } = req.body;
  const client_id = req.user.is_external ? req.user.client_id : req.body.client_id;

  if (!client_id) {
    return res.status(400).json({ message: 'Le client est requis' });
  }
  if (!Array.isArray(lignes) || lignes.length === 0) {
    return res.status(400).json({ message: 'La commande doit contenir au moins un produit' });
  }

  for (const l of lignes) {
    const qte = Number(l.quantite);
    if (!l.produit_id || !Number.isInteger(qte) || qte <= 0) {
      return res.status(400).json({ message: 'Chaque ligne doit avoir un produit et une quantité entière positive' });
    }
  }

  // Vérifier que le client appartient bien à l'entreprise connectée
  db.query('SELECT id FROM clients WHERE id = ? AND entreprise_id = ?', [client_id, req.user.entreprise_id], (errClient, clients) => {
    if (errClient) { console.error(errClient); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (clients.length === 0) return res.status(400).json({ message: 'Client invalide pour votre entreprise' });

    const quantitesParProduit = {};
    lignes.forEach(l => {
      const id = l.produit_id;
      const qte = Number(l.quantite);
      quantitesParProduit[id] = (quantitesParProduit[id] || 0) + qte;
    });
    const produitIds = Object.keys(quantitesParProduit).map(Number);

    // Vérifier que les produits appartiennent bien à l'entreprise connectée
    const sqlPrix = 'SELECT id, prix FROM produits WHERE id IN (?) AND entreprise_id = ?';
    db.query(sqlPrix, [produitIds, req.user.entreprise_id], (err, produits) => {
      if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
      if (produits.length !== produitIds.length) {
        return res.status(400).json({ message: 'Un ou plusieurs produits sont introuvables pour votre entreprise' });
      }

      const prixMap = {};
      produits.forEach(p => { prixMap[p.id] = p.prix; });

      let total = 0;
      const lignesAvecPrix = produitIds.map(id => {
        const quantite = quantitesParProduit[id];
        const prix_unitaire = prixMap[id];
        total += prix_unitaire * quantite;
        return { produit_id: id, quantite, prix_unitaire };
      });

      const sqlInsertCommande = 'INSERT INTO commandes (client_id, total) VALUES (?, ?)';
      db.query(sqlInsertCommande, [client_id, total], (err2, result) => {
        if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

        const commandeId = result.insertId;
        const sqlInsertLignes = 'INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire) VALUES ?';
        const values = lignesAvecPrix.map(l => [commandeId, l.produit_id, l.quantite, l.prix_unitaire]);
        db.query(sqlInsertLignes, [values], (err3) => {
          if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }
          res.status(201).json({ message: 'Commande créée avec succès', id: commandeId, total });
        });
      });
    });
  });
};

// UPDATE statut (protégé par permission module "Ventes" action "validation", cf. routes)
exports.updateCommandeStatut = (req, res) => {
  const { statut } = req.body;
  const statutsValides = ['en_attente', 'confirmee', 'annulee', 'livree'];

  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

  const sql = `
    UPDATE commandes c
    JOIN clients cl ON c.client_id = cl.id
    SET c.statut = ?
    WHERE c.id = ? AND cl.entreprise_id = ?
  `;
  db.query(sql, [statut, req.params.id, req.user.entreprise_id], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Commande introuvable' });
    res.json({ message: 'Statut mis à jour avec succès' });
  });
};

// DELETE commande
// - utilisateur externe : peut annuler UNIQUEMENT sa propre commande, si encore "en_attente"
// - utilisateur interne : doit avoir la permission "suppression" sur le module Ventes (cf. routes)
exports.deleteCommande = (req, res) => {
  const { id } = req.params;

  const sqlFind = `
    SELECT c.client_id, c.statut, cl.entreprise_id
    FROM commandes c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.id = ?
  `;
  db.query(sqlFind, [id], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
    if (results.length === 0) return res.status(404).json({ message: 'Commande introuvable' });

    const commande = results[0];
    if (commande.entreprise_id !== req.user.entreprise_id) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    if (req.user.is_external) {
      if (commande.client_id !== req.user.client_id) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      if (commande.statut !== 'en_attente') {
        return res.status(400).json({ message: "Impossible d'annuler une commande déjà confirmée, livrée ou annulée" });
      }
    }

    db.query('DELETE FROM commandes WHERE id = ?', [id], (err2, result) => {
      if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
      res.json({ message: 'Commande supprimée avec succès' });
    });
  });
};
