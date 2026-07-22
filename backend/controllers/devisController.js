
const SequenceService = require('../services/sequence.service');

exports.getAllDevis = (req, res) => {
    const db = req.db;
    const sql = `
        SELECT d.*, c.nom AS client_nom
        FROM devis d
        JOIN clients c ON d.client_id = c.id
        ORDER BY d.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ devis: results });
    });
};

// ============================================================
// GET UN DEVIS AVEC SES LIGNES
// ============================================================
exports.getDevisById = (req, res) => {
    const db = req.db;
    const sqlDevis = `
        SELECT d.*, c.nom AS client_nom
        FROM devis d
        JOIN clients c ON d.client_id = c.id
        WHERE d.id = ?
    `;
    db.query(sqlDevis, [req.params.id], (err, results) => {
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
// CREER UN DEVIS (MIGRÉ)
// ============================================================
exports.createDevis = async (req, res) => {
    const db = req.db;
    const { client_id, lignes, date_validite, remise, notes } = req.body;

    if (!client_id) return res.status(400).json({ message: 'Le client est requis' });
    if (!Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ message: 'Le devis doit contenir au moins un produit' });
    }
    if (!date_validite) return res.status(400).json({ message: 'La date de validité est requise' });

    db.query('SELECT id FROM clients WHERE id = ?', [client_id], async (errClient, clients) => {
        if (errClient) { console.error(errClient); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (clients.length === 0) return res.status(400).json({ message: 'Client invalide pour votre entreprise' });

        try {
            // 🆕 Utiliser SequenceService au lieu de genererNumeroDevis()
            const numero_devis = await SequenceService.genererNumeroDevis(db, req.user.entreprise_id);

            let total_ht = 0;
            const produitsIds = lignes.map(l => l.produit_id);
            const sqlPrix = 'SELECT id, prix FROM produits WHERE id IN (?)';
            db.query(sqlPrix, [produitsIds], (err, produits) => {
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

                // PLUS de entreprise_id dans l'insertion !
                const sqlDevis = `
                    INSERT INTO devis (client_id, numero_devis, date_validite, total_ht, total_ttc, remise, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(sqlDevis, [client_id, numero_devis, date_validite, total_ht, total_ttc, remiseTotale, notes || null], (err2, result) => {
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
    const db = req.db;
    const { statut } = req.body;
    const statutsValides = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'];

    if (!statutsValides.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    const sql = 'UPDATE devis SET statut = ? WHERE id = ?';
    db.query(sql, [statut, req.params.id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Devis introuvable' });
        res.json({ message: 'Statut mis à jour avec succès' });
    });
};

// ============================================================
// TRANSFORMER UN DEVIS EN COMMANDE
// ============================================================
exports.devisToCommande = (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const sqlDevis = `
        SELECT d.*, dp.produit_id, dp.quantite, dp.prix_unitaire AS ligne_prix_unitaire
        FROM devis d
        LEFT JOIN devis_produits dp ON d.id = dp.devis_id
        WHERE d.id = ? AND d.statut = 'accepte'
    `;
    db.query(sqlDevis, [id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Devis introuvable ou non accepté' });
        }

        const devis = results[0];
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
            const values = lignes.map(l => [commandeId, l.produit_id, l.quantite, l.prix_unitaire]);
            db.query(sqlLignes, [values], (err3) => {
                if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }
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
    const db = req.db;
    const sql = 'DELETE FROM devis WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Devis introuvable' });
        res.json({ message: 'Devis supprimé avec succès' });
    });
};