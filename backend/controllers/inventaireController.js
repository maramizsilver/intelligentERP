exports.getAllInventaires = (req, res) => {
    const db = req.db;
    
    const sql = `
        SELECT i.*, e.nom AS entrepot_nom,
               (SELECT COUNT(*) FROM inventaire_lignes il WHERE il.inventaire_id = i.id) AS nb_lignes
        FROM inventaires i
        LEFT JOIN entrepots e ON i.entrepot_id = e.id
        ORDER BY i.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erreur getAllInventaires:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ inventaires: results });
    });
};

exports.getInventaireById = (req, res) => {
    const db = req.db;
    
    const sqlInv = `
        SELECT i.*, e.nom AS entrepot_nom
        FROM inventaires i
        LEFT JOIN entrepots e ON i.entrepot_id = e.id
        WHERE i.id = ?
    `;
    db.query(sqlInv, [req.params.id], (err, results) => {
        if (err) {
            console.error('Erreur getInventaireById - inv:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Inventaire introuvable' });
        }

        const inventaire = results[0];
        const sqlLignes = `
            SELECT il.*, p.nom AS produit_nom
            FROM inventaire_lignes il
            JOIN produits p ON il.produit_id = p.id
            WHERE il.inventaire_id = ?
            ORDER BY p.nom
        `;
        db.query(sqlLignes, [req.params.id], (err2, lignes) => {
            if (err2) {
                console.error('Erreur getInventaireById - lignes:', err2);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.json({ inventaire: { ...inventaire, lignes } });
        });
    });
};

exports.createInventaire = (req, res) => {
    const db = req.db;
    
    const { entrepot_id, notes } = req.body;

    const finaliserCreation = (entrepotId) => {
        const sqlInsert = 'INSERT INTO inventaires (entrepot_id, notes, created_by) VALUES (?, ?, ?)';
        db.query(sqlInsert, [entrepotId || null, notes || null, req.user.id], (err, result) => {
            if (err) {
                console.error('Erreur createInventaire - insert:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            const inventaireId = result.insertId;

            const sqlSnapshot = entrepotId
                ? `SELECT produit_id, quantite AS quantite_theorique FROM stock_entrepot WHERE entrepot_id = ?`
                : `SELECT id AS produit_id, quantite_stock AS quantite_theorique FROM produits`;
            const params = entrepotId ? [entrepotId] : [];

            db.query(sqlSnapshot, params, (errSnap, produits) => {
                if (errSnap) {
                    console.error('Erreur createInventaire - snapshot:', errSnap);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                if (produits.length === 0) {
                    return res.status(201).json({ 
                        message: 'Inventaire cree (aucun produit a compter)', 
                        id: inventaireId 
                    });
                }

                const sqlLignes = 'INSERT INTO inventaire_lignes (inventaire_id, produit_id, quantite_theorique) VALUES ?';
                const values = produits.map(p => [inventaireId, p.produit_id, p.quantite_theorique]);
                db.query(sqlLignes, [values], (errLignes) => {
                    if (errLignes) {
                        console.error('Erreur createInventaire - lignes:', errLignes);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }
                    res.status(201).json({ 
                        message: 'Inventaire cree avec succes', 
                        id: inventaireId, 
                        nb_produits: produits.length 
                    });
                });
            });
        });
    };

    if (entrepot_id) {
        db.query(
            'SELECT id FROM entrepots WHERE id = ?',
            [entrepot_id],
            (errCheck, rows) => {
                if (errCheck) {
                    console.error('Erreur createInventaire - check entrepot:', errCheck);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                if (rows.length === 0) {
                    return res.status(400).json({ message: 'Entrepot invalide' });
                }
                finaliserCreation(entrepot_id);
            }
        );
    } else {
        finaliserCreation(null);
    }
};

exports.saisirComptage = (req, res) => {
    const db = req.db;
    
    const { id } = req.params;
    const { comptages } = req.body;

    if (!Array.isArray(comptages) || comptages.length === 0) {
        return res.status(400).json({ message: 'Au moins une ligne de comptage est requise' });
    }

    db.query(
        'SELECT id, statut FROM inventaires WHERE id = ?',
        [id],
        (errCheck, rows) => {
            if (errCheck) {
                console.error('Erreur saisirComptage - check:', errCheck);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Inventaire introuvable' });
            }
            if (rows[0].statut !== 'en_cours') {
                return res.status(400).json({ message: 'Cet inventaire est deja cloture ou annule' });
            }

            let restantes = comptages.length;
            let erreur = null;

            comptages.forEach(c => {
                const qteComptee = Number(c.quantite_comptee);
                db.query(
                    `UPDATE inventaire_lignes
                     SET quantite_comptee = ?, ecart = ? - quantite_theorique
                     WHERE id = ? AND inventaire_id = ?`,
                    [qteComptee, qteComptee, c.ligne_id, id],
                    (err) => {
                        if (err) erreur = err;
                        restantes -= 1;
                        if (restantes === 0) {
                            if (erreur) {
                                console.error('Erreur saisirComptage - update:', erreur);
                                return res.status(500).json({ message: 'Erreur serveur' });
                            }
                            res.json({ message: 'Comptage enregistre avec succes' });
                        }
                    }
                );
            });
        }
    );
};

exports.cloturerInventaire = (req, res) => {
    const db = req.db;
    
    const { id } = req.params;

    db.query(
        'SELECT * FROM inventaires WHERE id = ?',
        [id],
        (errInv, invs) => {
            if (errInv) {
                console.error('Erreur cloturerInventaire - inv:', errInv);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (invs.length === 0) {
                return res.status(404).json({ message: 'Inventaire introuvable' });
            }
            const inventaire = invs[0];
            if (inventaire.statut !== 'en_cours') {
                return res.status(400).json({ message: 'Cet inventaire est deja cloture ou annule' });
            }

            db.query(
                'SELECT * FROM inventaire_lignes WHERE inventaire_id = ?',
                [id],
                (errLignes, lignes) => {
                    if (errLignes) {
                        console.error('Erreur cloturerInventaire - lignes:', errLignes);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }

                    const lignesAvecEcart = lignes.filter(l => l.quantite_comptee !== null && l.ecart !== 0);

                    if (lignesAvecEcart.length === 0) {
                        return db.query(
                            "UPDATE inventaires SET statut = 'termine', date_cloture = NOW() WHERE id = ?",
                            [id],
                            (errUpd) => {
                                if (errUpd) {
                                    console.error('Erreur cloturerInventaire - update statut:', errUpd);
                                    return res.status(500).json({ message: 'Erreur serveur' });
                                }
                                res.json({ message: 'Inventaire cloture sans ecart a appliquer' });
                            }
                        );
                    }

                    let restantes = lignesAvecEcart.length;
                    let erreur = null;

                    lignesAvecEcart.forEach(ligne => {
                        const appliquerAjustementGlobal = () => {
                            db.query(
                                `UPDATE produits SET quantite_stock = ? WHERE id = ?`,
                                [ligne.quantite_comptee, ligne.produit_id],
                                (errProd) => {
                                    if (errProd) erreur = errProd;
                                    db.query(
                                        `INSERT INTO mouvements_stock (produit_id, type, quantite, reference_id, reference_type, ancien_stock, nouveau_stock, motif, created_by)
                                         VALUES (?, ?, ?, ?, 'inventaire', ?, ?, ?, ?)`,
                                        [
                                            ligne.produit_id,
                                            ligne.ecart > 0 ? 'entree' : 'sortie',
                                            Math.abs(ligne.ecart), id,
                                            ligne.quantite_theorique, ligne.quantite_comptee,
                                            `Ajustement inventaire #${id}`, req.user.id
                                        ],
                                        (errMvt) => {
                                            if (errMvt) erreur = errMvt;
                                            restantes -= 1;
                                            if (restantes === 0) finaliser();
                                        }
                                    );
                                }
                            );
                        };

                        if (inventaire.entrepot_id) {
                            db.query(
                                `INSERT INTO stock_entrepot (entrepot_id, produit_id, quantite) VALUES (?, ?, ?)
                                 ON DUPLICATE KEY UPDATE quantite = VALUES(quantite)`,
                                [inventaire.entrepot_id, ligne.produit_id, ligne.quantite_comptee],
                                (errStockEnt) => {
                                    if (errStockEnt) erreur = errStockEnt;
                                    appliquerAjustementGlobal();
                                }
                            );
                        } else {
                            appliquerAjustementGlobal();
                        }
                    });

                    function finaliser() {
                        if (erreur) {
                            console.error('Erreur cloturerInventaire - final:', erreur);
                            return res.status(500).json({ message: "Erreur serveur lors de l'application des ecarts" });
                        }
                        db.query(
                            "UPDATE inventaires SET statut = 'termine', date_cloture = NOW() WHERE id = ?",
                            [id],
                            (errUpd) => {
                                if (errUpd) {
                                    console.error('Erreur cloturerInventaire - final update:', errUpd);
                                    return res.status(500).json({ message: 'Erreur serveur' });
                                }
                                res.json({ 
                                    message: 'Inventaire cloture, ecarts appliques au stock', 
                                    nb_ajustements: lignesAvecEcart.length 
                                });
                            }
                        );
                    }
                }
            );
        }
    );
};

exports.annulerInventaire = (req, res) => {
    const db = req.db;
    
    const sql = "UPDATE inventaires SET statut = 'annule' WHERE id = ? AND statut = 'en_cours'";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Erreur annulerInventaire:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Inventaire introuvable ou deja cloture' });
        }
        res.json({ message: 'Inventaire annule avec succes' });
    });
};