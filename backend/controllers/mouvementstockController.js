const db = require('../config/db');

// ============================================================
// GET TOUS LES MOUVEMENTS DE STOCK D'UN PRODUIT
// ============================================================
exports.getMouvementsByProduit = (req, res) => {
    const { produit_id } = req.params;

    const sql = `
        SELECT m.*, u.nom AS created_by_nom, u.prenom AS created_by_prenom
        FROM mouvements_stock m
        LEFT JOIN users u ON m.created_by = u.id
        WHERE m.produit_id = ? AND m.entreprise_id = ?
        ORDER BY m.created_at DESC
    `;
    db.query(sql, [produit_id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ mouvements: results });
    });
};

// ============================================================
// GET ALERTES RUPTURE DE STOCK
// ============================================================
exports.getAlertesRupture = (req, res) => {
    const seuil = 5; // Seuil configurable
    const sql = `
        SELECT id, nom, quantite_stock
        FROM produits
        WHERE entreprise_id = ? AND quantite_stock <= ?
        ORDER BY quantite_stock ASC
    `;
    db.query(sql, [req.user.entreprise_id, seuil], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ alertes: results });
    });
};

// ============================================================
// AJUSTER LE STOCK MANUELLEMENT
// ============================================================
exports.ajusterStock = (req, res) => {
    const { produit_id, quantite, motif } = req.body;

    if (!produit_id) return res.status(400).json({ message: 'Produit requis' });
    if (quantite === undefined || isNaN(quantite) || quantite === 0) {
        return res.status(400).json({ message: 'La quantité doit être un nombre non nul' });
    }

    db.query('SELECT * FROM produits WHERE id = ? AND entreprise_id = ?', [produit_id, req.user.entreprise_id], (err, produits) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (produits.length === 0) return res.status(404).json({ message: 'Produit introuvable' });

        const produit = produits[0];
        const ancienStock = produit.quantite_stock;
        const nouveauStock = ancienStock + Number(quantite);

        if (nouveauStock < 0) {
            return res.status(400).json({ message: 'Stock insuffisant' });
        }

        db.query('UPDATE produits SET quantite_stock = ? WHERE id = ?', [nouveauStock, produit_id], (err2) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

            const type = quantite > 0 ? 'entree' : 'sortie';
            db.query(
                `INSERT INTO mouvements_stock (entreprise_id, produit_id, type, quantite, reference_type, ancien_stock, nouveau_stock, motif, created_by)
                 VALUES (?, ?, ?, ?, 'ajustement', ?, ?, ?, ?)`,
                [req.user.entreprise_id, produit_id, type, Math.abs(quantite), ancienStock, nouveauStock, motif || 'Ajustement manuel', req.user.id],
                (err3) => {
                    if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }
                    res.json({ message: 'Stock ajusté avec succès', ancienStock, nouveauStock });
                }
            );
        });
    });
};