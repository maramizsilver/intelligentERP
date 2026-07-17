exports.getAllEntrepots = (req, res) => {
    const db = req.db;
    
    const sql = 'SELECT * FROM entrepots ORDER BY id DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur getAllEntrepots:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ entrepots: results });
    });
};

exports.getEntrepotById = (req, res) => {
    const db = req.db;
    
    const sqlEntrepot = 'SELECT * FROM entrepots WHERE id = ?';
    db.query(sqlEntrepot, [req.params.id], (err, results) => {
        if (err) {
            console.error('Erreur getEntrepotById - entrepot:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Entrepot introuvable' });
        }

        const entrepot = results[0];
        const sqlStock = `
            SELECT se.produit_id, se.quantite, p.nom AS produit_nom, p.prix
            FROM stock_entrepot se
            JOIN produits p ON se.produit_id = p.id
            WHERE se.entrepot_id = ?
            ORDER BY p.nom
        `;
        db.query(sqlStock, [req.params.id], (err2, stock) => {
            if (err2) {
                console.error('Erreur getEntrepotById - stock:', err2);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.json({ entrepot: { ...entrepot, stock } });
        });
    });
};

exports.createEntrepot = (req, res) => {
    const db = req.db;
    
    const { nom, adresse, responsable } = req.body;
    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: "Le nom de l'entrepot est requis" });
    }
    const sql = 'INSERT INTO entrepots (nom, adresse, responsable) VALUES (?, ?, ?)';
    db.query(sql, [nom.trim(), adresse || null, responsable || null], (err, result) => {
        if (err) {
            console.error('Erreur createEntrepot:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.status(201).json({ message: 'Entrepot cree avec succes', id: result.insertId });
    });
};

exports.updateEntrepot = (req, res) => {
    const db = req.db;
    
    const { nom, adresse, responsable, actif } = req.body;
    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: "Le nom de l'entrepot est requis" });
    }
    const sql = `
        UPDATE entrepots 
        SET nom = ?, adresse = ?, responsable = ?, actif = ? 
        WHERE id = ?
    `;
    db.query(sql, [
        nom.trim(), 
        adresse || null, 
        responsable || null, 
        actif !== undefined ? !!actif : true, 
        req.params.id
    ], (err, result) => {
        if (err) {
            console.error('Erreur updateEntrepot:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entrepot introuvable' });
        }
        res.json({ message: 'Entrepot mis a jour avec succes' });
    });
};

exports.deleteEntrepot = (req, res) => {
    const db = req.db;
    
    db.query(
        'SELECT id FROM entrepots WHERE id = ?',
        [req.params.id],
        (errCheck, entrepots) => {
            if (errCheck) {
                console.error('Erreur deleteEntrepot - check:', errCheck);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (entrepots.length === 0) {
                return res.status(404).json({ message: 'Entrepot introuvable' });
            }

            db.query(
                'SELECT COUNT(*) AS total FROM stock_entrepot WHERE entrepot_id = ? AND quantite > 0',
                [req.params.id],
                (errStock, rows) => {
                    if (errStock) {
                        console.error('Erreur deleteEntrepot - stock:', errStock);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }
                    if (rows[0].total > 0) {
                        return res.status(400).json({ 
                            message: 'Impossible de supprimer : cet entrepot contient encore du stock. Transferez le stock avant suppression.' 
                        });
                    }

                    db.query(
                        'DELETE FROM entrepots WHERE id = ?',
                        [req.params.id],
                        (err, result) => {
                            if (err) {
                                console.error('Erreur deleteEntrepot - delete:', err);
                                return res.status(500).json({ message: 'Erreur serveur' });
                            }
                            res.json({ message: 'Entrepot supprime avec succes' });
                        }
                    );
                }
            );
        }
    );
};

exports.definirStockEntrepot = (req, res) => {
    const db = req.db;
    
    const { id: entrepotId } = req.params;
    const { produit_id, quantite } = req.body;

    if (!produit_id) {
        return res.status(400).json({ message: 'Produit requis' });
    }
    if (quantite === undefined || isNaN(quantite) || Number(quantite) < 0) {
        return res.status(400).json({ message: 'La quantite doit etre un nombre positif ou nul' });
    }

    db.query(
        'SELECT id FROM entrepots WHERE id = ?',
        [entrepotId],
        (errEnt, entrepots) => {
            if (errEnt) {
                console.error('Erreur definirStockEntrepot - entrepot:', errEnt);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (entrepots.length === 0) {
                return res.status(404).json({ message: 'Entrepot introuvable' });
            }

            db.query(
                'SELECT id FROM produits WHERE id = ?',
                [produit_id],
                (errProd, produits) => {
                    if (errProd) {
                        console.error('Erreur definirStockEntrepot - produit:', errProd);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }
                    if (produits.length === 0) {
                        return res.status(404).json({ message: 'Produit introuvable' });
                    }

                    const sqlUpsert = `
                        INSERT INTO stock_entrepot (entrepot_id, produit_id, quantite)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)
                    `;
                    db.query(sqlUpsert, [entrepotId, produit_id, Number(quantite)], (err) => {
                        if (err) {
                            console.error('Erreur definirStockEntrepot - upsert:', err);
                            return res.status(500).json({ message: 'Erreur serveur' });
                        }

                        db.query(
                            'SELECT COALESCE(SUM(quantite), 0) AS total FROM stock_entrepot WHERE produit_id = ?',
                            [produit_id],
                            (errSum, rows) => {
                                if (errSum) {
                                    console.error('Erreur definirStockEntrepot - sum:', errSum);
                                    return res.status(500).json({ message: 'Erreur serveur' });
                                }
                                db.query(
                                    'UPDATE produits SET quantite_stock = ? WHERE id = ?',
                                    [rows[0].total, produit_id],
                                    (errUpd) => {
                                        if (errUpd) {
                                            console.error('Erreur definirStockEntrepot - update:', errUpd);
                                            return res.status(500).json({ message: 'Erreur serveur' });
                                        }
                                        res.json({ 
                                            message: 'Stock entrepot mis a jour avec succes', 
                                            total_produit: rows[0].total 
                                        });
                                    }
                                );
                            }
                        );
                    });
                }
            );
        }
    );
};

exports.transfererStock = (req, res) => {
    const db = req.db;
    
    const { produit_id, entrepot_source_id, entrepot_destination_id, quantite } = req.body;
    const qte = Number(quantite);

    if (!produit_id || !entrepot_source_id || !entrepot_destination_id) {
        return res.status(400).json({ message: 'Produit, entrepot source et entrepot destination requis' });
    }
    if (entrepot_source_id === entrepot_destination_id) {
        return res.status(400).json({ message: 'Les entrepots source et destination doivent etre differents' });
    }
    if (!qte || qte <= 0) {
        return res.status(400).json({ message: 'La quantite doit etre un nombre positif' });
    }

    db.query(
        'SELECT quantite FROM stock_entrepot WHERE entrepot_id = ? AND produit_id = ?',
        [entrepot_source_id, produit_id],
        (errSrc, rowsSrc) => {
            if (errSrc) {
                console.error('Erreur transfererStock - source:', errSrc);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            const stockSource = rowsSrc[0]?.quantite || 0;
            if (stockSource < qte) {
                return res.status(400).json({ 
                    message: `Stock insuffisant dans l'entrepot source (disponible: ${stockSource})` 
                });
            }

            db.query(
                'UPDATE stock_entrepot SET quantite = quantite - ? WHERE entrepot_id = ? AND produit_id = ?',
                [qte, entrepot_source_id, produit_id],
                (errUpdSrc) => {
                    if (errUpdSrc) {
                        console.error('Erreur transfererStock - update source:', errUpdSrc);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }

                    const sqlUpsertDest = `
                        INSERT INTO stock_entrepot (entrepot_id, produit_id, quantite)
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite)
                    `;
                    db.query(sqlUpsertDest, [entrepot_destination_id, produit_id, qte], (errUpdDest) => {
                        if (errUpdDest) {
                            console.error('Erreur transfererStock - update dest:', errUpdDest);
                            return res.status(500).json({ message: 'Erreur serveur' });
                        }
                        res.json({ message: 'Transfert de stock effectue avec succes' });
                    });
                }
            );
        }
    );
};