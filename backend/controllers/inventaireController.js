const db = require('../config/db');

// ============================================================
// GET TOUS LES INVENTAIRES
// ============================================================
exports.getAllInventaires = (req, res) => {
    const sql = `
        SELECT i.*, e.nom AS entrepot_nom,
               (SELECT COUNT(*) FROM inventaire_lignes il WHERE il.inventaire_id = i.id) AS nb_lignes
        FROM inventaires i
        LEFT JOIN entrepots e ON i.entrepot_id = e.id
        WHERE i.entreprise_id = ?
        ORDER BY i.id DESC
    `;
    db.query(sql, [req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ inventaires: results });
    });
};

// ============================================================
// GET UN INVENTAIRE + ses lignes de comptage
// ============================================================
exports.getInventaireById = (req, res) => {
    const sqlInv = `
        SELECT i.*, e.nom AS entrepot_nom
        FROM inventaires i
        LEFT JOIN entrepots e ON i.entrepot_id = e.id
        WHERE i.id = ? AND i.entreprise_id = ?
    `;
    db.query(sqlInv, [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Inventaire introuvable' });

        const inventaire = results[0];
        const sqlLignes = `
            SELECT il.*, p.nom AS produit_nom
            FROM inventaire_lignes il
            JOIN produits p ON il.produit_id = p.id
            WHERE il.inventaire_id = ?
            ORDER BY p.nom
        `;
        db.query(sqlLignes, [req.params.id], (err2, lignes) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ inventaire: { ...inventaire, lignes } });
        });
    });
};

// ============================================================
// CRÉER UN INVENTAIRE (prend un instantané des quantités théoriques)
// body: { entrepot_id?, notes? }
// - si entrepot_id fourni : snapshot depuis stock_entrepot
// - sinon : snapshot depuis produits.quantite_stock (inventaire global)
// ============================================================
exports.createInventaire = (req, res) => {
    const { entrepot_id, notes } = req.body;

    const finaliserCreation = (entrepotId) => {
        const sqlInsert = 'INSERT INTO inventaires (entreprise_id, entrepot_id, notes, created_by) VALUES (?, ?, ?, ?)';
        db.query(sqlInsert, [req.user.entreprise_id, entrepotId || null, notes || null, req.user.id], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
            const inventaireId = result.insertId;

            const sqlSnapshot = entrepotId
                ? `SELECT produit_id, quantite AS quantite_theorique FROM stock_entrepot WHERE entrepot_id = ?`
                : `SELECT id AS produit_id, quantite_stock AS quantite_theorique FROM produits WHERE entreprise_id = ?`;
            const params = entrepotId ? [entrepotId] : [req.user.entreprise_id];

            db.query(sqlSnapshot, params, (errSnap, produits) => {
                if (errSnap) { console.error(errSnap); return res.status(500).json({ message: 'Erreur serveur' }); }
                if (produits.length === 0) {
                    return res.status(201).json({ message: 'Inventaire créé (aucun produit à compter)', id: inventaireId });
                }

                const sqlLignes = 'INSERT INTO inventaire_lignes (inventaire_id, produit_id, quantite_theorique) VALUES ?';
                const values = produits.map(p => [inventaireId, p.produit_id, p.quantite_theorique]);
                db.query(sqlLignes, [values], (errLignes) => {
                    if (errLignes) { console.error(errLignes); return res.status(500).json({ message: 'Erreur serveur' }); }
                    res.status(201).json({ message: 'Inventaire créé avec succès', id: inventaireId, nb_produits: produits.length });
                });
            });
        });
    };

    if (entrepot_id) {
        db.query('SELECT id FROM entrepots WHERE id = ? AND entreprise_id = ?', [entrepot_id, req.user.entreprise_id], (errCheck, rows) => {
            if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (rows.length === 0) return res.status(400).json({ message: 'Entrepôt invalide pour votre entreprise' });
            finaliserCreation(entrepot_id);
        });
    } else {
        finaliserCreation(null);
    }
};

// ============================================================
// SAISIR LE COMPTAGE (une ou plusieurs lignes à la fois)
// body: { comptages: [{ ligne_id, quantite_comptee }] }
// ============================================================
exports.saisirComptage = (req, res) => {
    const { id } = req.params;
    const { comptages } = req.body;

    if (!Array.isArray(comptages) || comptages.length === 0) {
        return res.status(400).json({ message: 'Au moins une ligne de comptage est requise' });
    }

    db.query('SELECT id, statut FROM inventaires WHERE id = ? AND entreprise_id = ?', [id, req.user.entreprise_id], (errCheck, rows) => {
        if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (rows.length === 0) return res.status(404).json({ message: 'Inventaire introuvable' });
        if (rows[0].statut !== 'en_cours') {
            return res.status(400).json({ message: 'Cet inventaire est déjà clôturé ou annulé' });
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
                        if (erreur) { console.error(erreur); return res.status(500).json({ message: 'Erreur serveur' }); }
                        res.json({ message: 'Comptage enregistré avec succès' });
                    }
                }
            );
        });
    });
};

// ============================================================
// CLÔTURER UN INVENTAIRE
// Applique les écarts constatés au stock réel (produits.quantite_stock
// et, le cas échéant, stock_entrepot) et journalise chaque écart dans
// mouvements_stock (type 'ajustement').
// ============================================================
exports.cloturerInventaire = (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM inventaires WHERE id = ? AND entreprise_id = ?', [id, req.user.entreprise_id], (errInv, invs) => {
        if (errInv) { console.error(errInv); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (invs.length === 0) return res.status(404).json({ message: 'Inventaire introuvable' });
        const inventaire = invs[0];
        if (inventaire.statut !== 'en_cours') {
            return res.status(400).json({ message: 'Cet inventaire est déjà clôturé ou annulé' });
        }

        db.query('SELECT * FROM inventaire_lignes WHERE inventaire_id = ?', [id], (errLignes, lignes) => {
            if (errLignes) { console.error(errLignes); return res.status(500).json({ message: 'Erreur serveur' }); }

            const lignesAvecEcart = lignes.filter(l => l.quantite_comptee !== null && l.ecart !== 0);

            if (lignesAvecEcart.length === 0) {
                return db.query('UPDATE inventaires SET statut = ?, date_cloture = NOW() WHERE id = ?', ['termine', id], (errUpd) => {
                    if (errUpd) { console.error(errUpd); return res.status(500).json({ message: 'Erreur serveur' }); }
                    res.json({ message: 'Inventaire clôturé sans écart à appliquer' });
                });
            }

            let restantes = lignesAvecEcart.length;
            let erreur = null;

            lignesAvecEcart.forEach(ligne => {
                const appliquerAjustementGlobal = () => {
                    db.query(
                        `UPDATE produits SET quantite_stock = ? WHERE id = ? AND entreprise_id = ?`,
                        [ligne.quantite_comptee, ligne.produit_id, req.user.entreprise_id],
                        (errProd) => {
                            if (errProd) { erreur = errProd; }
                            db.query(
                                `INSERT INTO mouvements_stock (entreprise_id, produit_id, type, quantite, reference_id, reference_type, ancien_stock, nouveau_stock, motif, created_by)
                                 VALUES (?, ?, ?, ?, ?, 'inventaire', ?, ?, ?, ?)`,
                                [
                                    req.user.entreprise_id, ligne.produit_id,
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
                if (erreur) { console.error(erreur); return res.status(500).json({ message: 'Erreur serveur lors de l\'application des écarts' }); }
                db.query('UPDATE inventaires SET statut = ?, date_cloture = NOW() WHERE id = ?', ['termine', id], (errUpd) => {
                    if (errUpd) { console.error(errUpd); return res.status(500).json({ message: 'Erreur serveur' }); }
                    res.json({ message: 'Inventaire clôturé, écarts appliqués au stock', nb_ajustements: lignesAvecEcart.length });
                });
            }
        });
    });
};

// ============================================================
// ANNULER UN INVENTAIRE (uniquement si encore en cours)
// ============================================================
exports.annulerInventaire = (req, res) => {
    const sql = "UPDATE inventaires SET statut = 'annule' WHERE id = ? AND entreprise_id = ? AND statut = 'en_cours'";
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Inventaire introuvable ou déjà clôturé' });
        res.json({ message: 'Inventaire annulé avec succès' });
    });
};
