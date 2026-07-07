const db = require('../config/db');

// ============================================================
// GÉNÉRER UN NUMÉRO DE DEVIS UNIQUE
// ============================================================
function genererNumeroDevis(entrepriseId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT COUNT(*) AS count FROM devis WHERE entreprise_id = ?";
        db.query(sql, [entrepriseId], (err, results) => {
            if (err) return reject(err);
            const count = (results[0]?.count || 0) + 1;
            const annee = new Date().getFullYear();
            const mois = String(new Date().getMonth() + 1).padStart(2, '0');
            resolve(`DEV-${annee}${mois}-${String(count).padStart(4, '0')}`);
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

    // Vérifier que le client appartient à l'entreprise
    db.query('SELECT id FROM clients WHERE id = ? AND entreprise_id = ?', [client_id, req.user.entreprise_id], async (errClient, clients) => {
        if (errClient) { console.error(errClient); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (clients.length === 0) return res.status(400).json({ message: 'Client invalide pour votre entreprise' });

        try {
            const numero_devis = await genererNumeroDevis(req.user.entreprise_id);

            // Calculer les totaux
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

                // Insérer le devis
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
// ============================================================
exports.devisToCommande = (req, res) => {
    const { id } = req.params;

    // Récupérer le devis avec ses lignes
    const sqlDevis = `
        SELECT d.*, dp.produit_id, dp.quantite, dp.prix_unitaire
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
        const lignes = results.map(r => ({ produit_id: r.produit_id, quantite: r.quantite }));

        // Créer une commande à partir du devis
        const sqlInsertCommande = 'INSERT INTO commandes (client_id, total) VALUES (?, ?)';
        db.query(sqlInsertCommande, [devis.client_id, devis.total_ttc], (err2, result) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

            const commandeId = result.insertId;
            const sqlLignes = 'INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire) VALUES ?';
            const values = lignes.map(l => [commandeId, l.produit_id, l.quantite, devis.prix_unitaire]);
            db.query(sqlLignes, [values], (err3) => {
                if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }

                // Mettre à jour le statut du devis
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