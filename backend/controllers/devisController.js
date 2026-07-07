const db = require('../config/db');

// ============================================================
// FIX BUG #2 : même correctif que achatController (compteur atomique)
// ============================================================
function genererNumeroDevis(entrepriseId) {
    return new Promise((resolve, reject) => {
        db.getConnection((errConn, connection) => {
            if (errConn) return reject(errConn);

            connection.beginTransaction((errTx) => {
                if (errTx) { connection.release(); return reject(errTx); }

                connection.query(
                    'SELECT dernier_numero_devis FROM entreprises WHERE id = ? FOR UPDATE',
                    [entrepriseId],
                    (errSel, rows) => {
                        if (errSel) {
                            return connection.rollback(() => { connection.release(); reject(errSel); });
                        }

                        const numero = (rows[0]?.dernier_numero_devis || 0) + 1;

                        connection.query(
                            'UPDATE entreprises SET dernier_numero_devis = ? WHERE id = ?',
                            [numero, entrepriseId],
                            (errUpd) => {
                                if (errUpd) {
                                    return connection.rollback(() => { connection.release(); reject(errUpd); });
                                }
                                connection.commit((errCommit) => {
                                    connection.release();
                                    if (errCommit) return reject(errCommit);

                                    const annee = new Date().getFullYear();
                                    const mois = String(new Date().getMonth() + 1).padStart(2, '0');
                                    resolve(`DEV-${annee}${mois}-${String(numero).padStart(4, '0')}`);
                                });
                            }
                        );
                    }
                );
            });
        });
    });
}

// ============================================================
// GET TOUS LES DEVIS
// ============================================================
exports.getAllDevis = (req, res) => {
    const sql = `
        SELECT d.*, c.nom AS client_nom
        FROM devis d
        JOIN clients c ON d.client_id = c.id
        WHERE d.entreprise_id = ?
        ORDER BY d.id DESC
    `;
    db.query(sql, [req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ devis: results });
    });
};

// ============================================================
// GET UN DEVIS AVEC SES LIGNES
// ============================================================
exports.getDevisById = (req, res) => {
    const sqlDevis = `
        SELECT d.*, c.nom AS client_nom
        FROM devis d
        JOIN clients c ON d.client_id = c.id
        WHERE d.id = ? AND d.entreprise_id = ?
    `;
    db.query(sqlDevis, [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Devis introuvable' });

        const devis = results[0];
        const sqlLignes = `
            SELECT dp.*, p.nom AS produit_nom
            FROM devis_produits dp
            JOIN produits p ON dp.produit_id = p.id
            WHERE dp.devis_id = ?
        `;
        db.query(sqlLignes, [req.params.id], (err2, lignes) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ devis: { ...devis, lignes } });
        });
    });
};

// ============================================================
// CREER UN DEVIS
// ============================================================
exports.createDevis = async (req, res) => {
    const { client_id, lignes, date_validite, remise, notes } = req.body;

    if (!client_id) return res.status(400).json({ message: 'Le client est requis' });
    if (!Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ message: 'Le devis doit contenir au moins un produit' });
    }
    if (!date_validite) return res.status(400).json({ message: 'La date de validité est requise' });

    db.query('SELECT id FROM clients WHERE id = ? AND entreprise_id = ?', [client_id, req.user.entreprise_id], async (errClient, clients) => {
        if (errClient) { console.error(errClient); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (clients.length === 0) return res.status(400).json({ message: 'Client invalide pour votre entreprise' });

        try {
            const numero_devis = await genererNumeroDevis(req.user.entreprise_id);

            let total_ht = 0;
            const produitsIds = lignes.map(l => l.produit_id);
            const sqlPrix = 'SELECT id, prix FROM produits WHERE id IN (?) AND entreprise_id = ?';
            db.query(sqlPrix, [produitsIds, req.user.entreprise_id], (err, produits) => {
                if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
                if (produits.length !== produitsIds.length) {
                    return res.status(400).json({ message: 'Un ou plusieurs produits sont introuvables' });
                }

                const prixMap = {};
                produits.forEach(p => { prixMap[p.id] = p.prix; });

                const lignesAvecPrix = lignes.map(l => {
                    const quantite = Number(l.quantite) || 1;
                    const prix_unitaire = prixMap[l.produit_id] || 0;
                    const remise_ligne = Number(l.remise_ligne) || 0;
                    const total_ligne = prix_unitaire * quantite * (1 - remise_ligne / 100);
                    total_ht += total_ligne;
                    return { produit_id: l.produit_id, quantite, prix_unitaire, remise_ligne, total_ligne };
                });

                const remiseTotale = Number(remise) || 0;
                const total_ttc = total_ht * (1 - remiseTotale / 100);

                const sqlDevis = `
                    INSERT INTO devis (entreprise_id, client_id, numero_devis, date_validite, total_ht, total_ttc, remise, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(sqlDevis, [req.user.entreprise_id, client_id, numero_devis, date_validite, total_ht, total_ttc, remiseTotale, notes || null], (err2, result) => {
                    if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

                    const devisId = result.insertId;
                    const sqlLignes = 'INSERT INTO devis_produits (devis_id, produit_id, quantite, prix_unitaire, remise_ligne, total_ligne) VALUES ?';
                    const values = lignesAvecPrix.map(l => [devisId, l.produit_id, l.quantite, l.prix_unitaire, l.remise_ligne || 0, l.total_ligne]);
                    db.query(sqlLignes, [values], (err3) => {
                        if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }
                        res.status(201).json({ message: 'Devis créé avec succès', id: devisId, numero: numero_devis });
                    });
                });
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    });
};

// ============================================================
// METTRE À JOUR LE STATUT D'UN DEVIS
// ============================================================
exports.updateDevisStatut = (req, res) => {
    const { statut } = req.body;
    const statutsValides = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];

    if (!statutsValides.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    const sql = 'UPDATE devis SET statut = ? WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [statut, req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Devis introuvable' });
        res.json({ message: 'Statut mis à jour avec succès' });
    });
};

// ============================================================
// TRANSFORMER UN DEVIS EN COMMANDE
//
// FIX BUG #1 : chaque ligne de la commande générée utilisait
// `devis.prix_unitaire`, qui correspond en réalité au prix de la
// PREMIÈRE ligne du devis (results[0], à cause du LEFT JOIN + d.*).
// Toutes les lignes héritaient donc du même prix, faussant le total
// de la commande générée. Correctif : on utilise le prix propre à
// chaque ligne (r.prix_unitaire), alias explicitement pour éviter
// toute ambiguïté avec un futur champ du même nom sur `devis`.
// ============================================================
exports.devisToCommande = (req, res) => {
    const { id } = req.params;

    const sqlDevis = `
        SELECT d.*, dp.produit_id, dp.quantite, dp.prix_unitaire AS ligne_prix_unitaire
        FROM devis d
        LEFT JOIN devis_produits dp ON d.id = dp.devis_id
        WHERE d.id = ? AND d.entreprise_id = ? AND d.statut = 'accepte'
    `;
    db.query(sqlDevis, [id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Devis introuvable ou non accepté' });
        }

        const devis = results[0];
        // Chaque ligne conserve désormais SON PROPRE prix unitaire
        const lignes = results.map(r => ({
            produit_id: r.produit_id,
            quantite: r.quantite,
            prix_unitaire: r.ligne_prix_unitaire
        }));

        const sqlInsertCommande = 'INSERT INTO commandes (client_id, total) VALUES (?, ?)';
        db.query(sqlInsertCommande, [devis.client_id, devis.total_ttc], (err2, result) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

            const commandeId = result.insertId;
            const sqlLignes = 'INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire) VALUES ?';
            // Chaque ligne utilise maintenant l.prix_unitaire (propre à la ligne), plus devis.prix_unitaire
            const values = lignes.map(l => [commandeId, l.produit_id, l.quantite, l.prix_unitaire]);
            db.query(sqlLignes, [values], (err3) => {
                if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }

                db.query('UPDATE devis SET statut = ? WHERE id = ?', ['accepte', id], () => {});

                res.status(201).json({
                    message: 'Commande créée à partir du devis',
                    commande_id: commandeId,
                    devis_id: id
                });
            });
        });
    });
};

// ============================================================
// SUPPRIMER UN DEVIS
// ============================================================
exports.deleteDevis = (req, res) => {
    const sql = 'DELETE FROM devis WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Devis introuvable' });
        res.json({ message: 'Devis supprimé avec succès' });
    });
};
