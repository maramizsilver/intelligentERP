
exports.getMouvementsByProduit = (req, res) => {
    const db = req.db;
    
    const { produit_id } = req.params;

    const sql = `
        SELECT m.*, u.nom AS created_by_nom, u.prenom AS created_by_prenom
        FROM mouvements_stock m
        LEFT JOIN users u ON m.created_by = u.id
        WHERE m.produit_id = ?
        ORDER BY m.created_at DESC
    `;
    db.query(sql, [produit_id], (err, results) => {
        if (err) {
            console.error('Erreur getMouvementsByProduit:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ mouvements: results });
    });
};

exports.getAlertesRupture = (req, res) => {
    const db = req.db;
    
    const seuil = 5;
    const sql = `
        SELECT id, nom, quantite_stock
        FROM produits
        WHERE quantite_stock <= ?
        ORDER BY quantite_stock ASC
    `;
    db.query(sql, [seuil], (err, results) => {
        if (err) {
            console.error('Erreur getAlertesRupture:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ alertes: results });
    });
};

exports.ajusterStock = (req, res) => {
    const db = req.db;
    
    const { produit_id, quantite, motif } = req.body;

    if (!produit_id) {
        return res.status(400).json({ message: 'Produit requis' });
    }
    if (quantite === undefined || isNaN(quantite) || quantite === 0) {
        return res.status(400).json({ message: 'La quantite doit etre un nombre non nul' });
    }

    db.query(
        'SELECT * FROM produits WHERE id = ?',
        [produit_id],
        (err, produits) => {
            if (err) {
                console.error('Erreur ajusterStock - select:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (produits.length === 0) {
                return res.status(404).json({ message: 'Produit introuvable' });
            }

            const produit = produits[0];
            const ancienStock = produit.quantite_stock;
            const nouveauStock = ancienStock + Number(quantite);

            if (nouveauStock < 0) {
                return res.status(400).json({ message: 'Stock insuffisant' });
            }

            db.query(
                'UPDATE produits SET quantite_stock = ? WHERE id = ?',
                [nouveauStock, produit_id],
                (err2) => {
                    if (err2) {
                        console.error('Erreur ajusterStock - update:', err2);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }

                    const type = quantite > 0 ? 'entree' : 'sortie';
                    db.query(
                        `INSERT INTO mouvements_stock (produit_id, type, quantite, reference_type, ancien_stock, nouveau_stock, motif, created_by)
                         VALUES (?, ?, ?, 'ajustement', ?, ?, ?, ?)`,
                        [
                            produit_id, 
                            type, 
                            Math.abs(quantite), 
                            ancienStock, 
                            nouveauStock, 
                            motif || 'Ajustement manuel', 
                            req.user.id
                        ],
                        (err3) => {
                            if (err3) {
                                console.error('Erreur ajusterStock - insert mouvement:', err3);
                                return res.status(500).json({ message: 'Erreur serveur' });
                            }
                            res.json({ 
                                message: 'Stock ajuste avec succes', 
                                ancienStock, 
                                nouveauStock 
                            });
                        }
                    );
                }
            );
        }
    );
};