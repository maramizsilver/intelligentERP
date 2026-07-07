const db = require('../config/db');

// ============================================================
// GET TOUS LES ENTREPÔTS DE L'ENTREPRISE
// ============================================================
exports.getAllEntrepots = (req, res) => {
    const sql = 'SELECT * FROM entrepots WHERE entreprise_id = ? ORDER BY id DESC';
    db.query(sql, [req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ entrepots: results });
    });
};

// ============================================================
// GET UN ENTREPÔT + son détail de stock (par produit)
// ============================================================
exports.getEntrepotById = (req, res) => {
    const sqlEntrepot = 'SELECT * FROM entrepots WHERE id = ? AND entreprise_id = ?';
    db.query(sqlEntrepot, [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Entrepôt introuvable' });

        const entrepot = results[0];
        const sqlStock = `
            SELECT se.produit_id, se.quantite, p.nom AS produit_nom, p.prix
            FROM stock_entrepot se
            JOIN produits p ON se.produit_id = p.id
            WHERE se.entrepot_id = ?
            ORDER BY p.nom
        `;
        db.query(sqlStock, [req.params.id], (err2, stock) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ entrepot: { ...entrepot, stock } });
        });
    });
};

// ============================================================
// CRÉER UN ENTREPÔT
// ============================================================
exports.createEntrepot = (req, res) => {
    const { nom, adresse, responsable } = req.body;
    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: "Le nom de l'entrepôt est requis" });
    }
    const sql = 'INSERT INTO entrepots (entreprise_id, nom, adresse, responsable) VALUES (?, ?, ?, ?)';
    db.query(sql, [req.user.entreprise_id, nom.trim(), adresse || null, responsable || null], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.status(201).json({ message: 'Entrepôt créé avec succès', id: result.insertId });
    });
};

// ============================================================
// METTRE À JOUR UN ENTREPÔT
// ============================================================
exports.updateEntrepot = (req, res) => {
    const { nom, adresse, responsable, actif } = req.body;
    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: "Le nom de l'entrepôt est requis" });
    }
    const sql = 'UPDATE entrepots SET nom = ?, adresse = ?, responsable = ?, actif = ? WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [nom.trim(), adresse || null, responsable || null, actif !== undefined ? !!actif : true, req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Entrepôt introuvable' });
        res.json({ message: 'Entrepôt mis à jour avec succès' });
    });
};

// ============================================================
// SUPPRIMER UN ENTREPÔT (refusé si du stock y est encore affecté)
// ============================================================
exports.deleteEntrepot = (req, res) => {
    db.query('SELECT id FROM entrepots WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (errCheck, entrepots) => {
        if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (entrepots.length === 0) return res.status(404).json({ message: 'Entrepôt introuvable' });

        db.query('SELECT COUNT(*) AS total FROM stock_entrepot WHERE entrepot_id = ? AND quantite > 0', [req.params.id], (errStock, rows) => {
            if (errStock) { console.error(errStock); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (rows[0].total > 0) {
                return res.status(400).json({ message: 'Impossible de supprimer : cet entrepôt contient encore du stock. Transférez le stock avant suppression.' });
            }

            db.query('DELETE FROM entrepots WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, result) => {
                if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
                res.json({ message: 'Entrepôt supprimé avec succès' });
            });
        });
    });
};

// ============================================================
// AFFECTER / AJUSTER LE STOCK D'UN PRODUIT DANS UN ENTREPÔT
// body: { produit_id, quantite } -> quantite = valeur ABSOLUE souhaitée
// Recalcule automatiquement produits.quantite_stock (somme sur tous
// les entrepôts) pour rester cohérent avec l'existant.
// ============================================================
exports.definirStockEntrepot = (req, res) => {
    const { id: entrepotId } = req.params;
    const { produit_id, quantite } = req.body;

    if (!produit_id) return res.status(400).json({ message: 'Produit requis' });
    if (quantite === undefined || isNaN(quantite) || Number(quantite) < 0) {
        return res.status(400).json({ message: 'La quantité doit être un nombre positif ou nul' });
    }

    db.query('SELECT id FROM entrepots WHERE id = ? AND entreprise_id = ?', [entrepotId, req.user.entreprise_id], (errEnt, entrepots) => {
        if (errEnt) { console.error(errEnt); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (entrepots.length === 0) return res.status(404).json({ message: 'Entrepôt introuvable' });

        db.query('SELECT id FROM produits WHERE id = ? AND entreprise_id = ?', [produit_id, req.user.entreprise_id], (errProd, produits) => {
            if (errProd) { console.error(errProd); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (produits.length === 0) return res.status(404).json({ message: 'Produit introuvable' });

            const sqlUpsert = `
                INSERT INTO stock_entrepot (entrepot_id, produit_id, quantite)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)
            `;
            db.query(sqlUpsert, [entrepotId, produit_id, Number(quantite)], (err) => {
                if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }

                // Resynchroniser le total agrégé sur produits.quantite_stock
                db.query(
                    'SELECT COALESCE(SUM(quantite), 0) AS total FROM stock_entrepot WHERE produit_id = ?',
                    [produit_id],
                    (errSum, rows) => {
                        if (errSum) { console.error(errSum); return res.status(500).json({ message: 'Erreur serveur' }); }
                        db.query('UPDATE produits SET quantite_stock = ? WHERE id = ?', [rows[0].total, produit_id], (errUpd) => {
                            if (errUpd) { console.error(errUpd); return res.status(500).json({ message: 'Erreur serveur' }); }
                            res.json({ message: 'Stock entrepôt mis à jour avec succès', total_produit: rows[0].total });
                        });
                    }
                );
            });
        });
    });
};

// ============================================================
// TRANSFÉRER DU STOCK D'UN ENTREPÔT VERS UN AUTRE
// body: { produit_id, entrepot_source_id, entrepot_destination_id, quantite }
// ============================================================
exports.transfererStock = (req, res) => {
    const { produit_id, entrepot_source_id, entrepot_destination_id, quantite } = req.body;
    const qte = Number(quantite);

    if (!produit_id || !entrepot_source_id || !entrepot_destination_id) {
        return res.status(400).json({ message: 'Produit, entrepôt source et entrepôt destination requis' });
    }
    if (entrepot_source_id === entrepot_destination_id) {
        return res.status(400).json({ message: 'Les entrepôts source et destination doivent être différents' });
    }
    if (!qte || qte <= 0) {
        return res.status(400).json({ message: 'La quantité doit être un nombre positif' });
    }

    db.query(
        'SELECT quantite FROM stock_entrepot WHERE entrepot_id = ? AND produit_id = ?',
        [entrepot_source_id, produit_id],
        (errSrc, rowsSrc) => {
            if (errSrc) { console.error(errSrc); return res.status(500).json({ message: 'Erreur serveur' }); }
            const stockSource = rowsSrc[0]?.quantite || 0;
            if (stockSource < qte) {
                return res.status(400).json({ message: `Stock insuffisant dans l'entrepôt source (disponible: ${stockSource})` });
            }

            db.query(
                'UPDATE stock_entrepot SET quantite = quantite - ? WHERE entrepot_id = ? AND produit_id = ?',
                [qte, entrepot_source_id, produit_id],
                (errUpdSrc) => {
                    if (errUpdSrc) { console.error(errUpdSrc); return res.status(500).json({ message: 'Erreur serveur' }); }

                    const sqlUpsertDest = `
                        INSERT INTO stock_entrepot (entrepot_id, produit_id, quantite)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite)
                    `;
                    db.query(sqlUpsertDest, [entrepot_destination_id, produit_id, qte], (errUpdDest) => {
                        if (errUpdDest) { console.error(errUpdDest); return res.status(500).json({ message: 'Erreur serveur' }); }
                        res.json({ message: 'Transfert de stock effectué avec succès' });
                    });
                }
            );
        }
    );
};
