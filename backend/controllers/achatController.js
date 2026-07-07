const db = require('../config/db');

function genererNumeroBC(entrepriseId) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT COUNT(*) AS count FROM achats WHERE entreprise_id = ?";
        db.query(sql, [entrepriseId], (err, results) => {
            if (err) return reject(err);
            const count = (results[0]?.count || 0) + 1;
            const annee = new Date().getFullYear();
            const mois = String(new Date().getMonth() + 1).padStart(2, '0');
            resolve(`BC-${annee}${mois}-${String(count).padStart(4, '0')}`);
        });
    });
}

// ============================================================
// GET TOUS LES BONS DE COMMANDE FOURNISSEURS
// ============================================================
exports.getAllAchats = (req, res) => {
    const sql = `
        SELECT a.*, f.nom AS fournisseur_nom
        FROM achats a
        JOIN fournisseurs f ON a.fournisseur_id = f.id
        WHERE a.entreprise_id = ?
        ORDER BY a.id DESC
    `;
    db.query(sql, [req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ achats: results });
    });
};

// ============================================================
// GET UN ACHAT AVEC SES LIGNES
// ============================================================
exports.getAchatById = (req, res) => {
    const sqlAchat = `
        SELECT a.*, f.nom AS fournisseur_nom
        FROM achats a
        JOIN fournisseurs f ON a.fournisseur_id = f.id
        WHERE a.id = ? AND a.entreprise_id = ?
    `;
    db.query(sqlAchat, [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Achat introuvable' });

        const achat = results[0];
        const sqlLignes = `
            SELECT ap.*, p.nom AS produit_nom
            FROM achat_produits ap
            JOIN produits p ON ap.produit_id = p.id
            WHERE ap.achat_id = ?
        `;
        db.query(sqlLignes, [req.params.id], (err2, lignes) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ achat: { ...achat, lignes } });
        });
    });
};

// ============================================================
// CREER UN ACHAT
// ============================================================
exports.createAchat = async (req, res) => {
    const { fournisseur_id, lignes, date_livraison_prevue, notes } = req.body;

    if (!fournisseur_id) return res.status(400).json({ message: 'Le fournisseur est requis' });
    if (!Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ message: 'L\'achat doit contenir au moins un produit' });
    }

    db.query('SELECT id FROM fournisseurs WHERE id = ? AND entreprise_id = ?', [fournisseur_id, req.user.entreprise_id], async (errCheck, fournisseurs) => {
        if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (fournisseurs.length === 0) return res.status(400).json({ message: 'Fournisseur invalide' });

        try {
            const numero_bc = await genererNumeroBC(req.user.entreprise_id);

            const produitsIds = lignes.map(l => l.produit_id);
            const sqlPrix = 'SELECT id, prix FROM produits WHERE id IN (?) AND entreprise_id = ?';
            db.query(sqlPrix, [produitsIds, req.user.entreprise_id], (err, produits) => {
                if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
                if (produits.length !== produitsIds.length) {
                    return res.status(400).json({ message: 'Un ou plusieurs produits sont introuvables' });
                }

                const prixMap = {};
                produits.forEach(p => { prixMap[p.id] = p.prix; });

                let total_ht = 0;
                const lignesAvecPrix = lignes.map(l => {
                    const quantite = Number(l.quantite) || 1;
                    const prix_unitaire = Number(l.prix_unitaire) || prixMap[l.produit_id] || 0;
                    const total_ligne = prix_unitaire * quantite;
                    total_ht += total_ligne;
                    return { produit_id: l.produit_id, quantite, prix_unitaire, total_ligne };
                });

                const total_ttc = total_ht;

                const sqlAchat = `
                    INSERT INTO achats (entreprise_id, fournisseur_id, numero_bc, date_livraison_prevue, total_ht, total_ttc, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(sqlAchat, [req.user.entreprise_id, fournisseur_id, numero_bc, date_livraison_prevue || null, total_ht, total_ttc, notes || null], (err2, result) => {
                    if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

                    const achatId = result.insertId;
                    const sqlLignes = 'INSERT INTO achat_produits (achat_id, produit_id, quantite, prix_unitaire, total_ligne) VALUES ?';
                    const values = lignesAvecPrix.map(l => [achatId, l.produit_id, l.quantite, l.prix_unitaire, l.total_ligne]);
                    db.query(sqlLignes, [values], (err3) => {
                        if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }
                        res.status(201).json({ message: 'Bon de commande créé avec succès', id: achatId, numero: numero_bc });
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
// RECEVOIR UNE COMMANDE (mise à jour du stock)
// ============================================================
exports.recevoirAchat = (req, res) => {
    const { id } = req.params;
    const { quantites_recues } = req.body; // { produit_id: quantite_recue }

    db.query('SELECT * FROM achats WHERE id = ? AND entreprise_id = ?', [id, req.user.entreprise_id], (err, achats) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (achats.length === 0) return res.status(404).json({ message: 'Achat introuvable' });

        const achat = achats[0];
        if (achat.statut === 'recu_total') {
            return res.status(400).json({ message: 'Cette commande est déjà totalement reçue' });
        }

        // Récupérer les lignes
        db.query('SELECT * FROM achat_produits WHERE achat_id = ?', [id], (err2, lignes) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

            let toutRecu = true;
            const updates = lignes.map(ligne => {
                const qteRecue = quantites_recues[ligne.produit_id] || 0;
                const nouvelleQteRecue = (ligne.quantite_recue || 0) + qteRecue;

                if (nouvelleQteRecue < ligne.quantite) toutRecu = false;

                // Mettre à jour la quantité reçue
                db.query('UPDATE achat_produits SET quantite_recue = ? WHERE id = ?', [nouvelleQteRecue, ligne.id], () => {});

                // Mettre à jour le stock du produit
                db.query(
                    'UPDATE produits SET quantite_stock = quantite_stock + ? WHERE id = ? AND entreprise_id = ?',
                    [qteRecue, ligne.produit_id, req.user.entreprise_id],
                    () => {}
                );

                // Ajouter un mouvement de stock
                db.query(
                    `INSERT INTO mouvements_stock (entreprise_id, produit_id, type, quantite, reference_id, reference_type, ancien_stock, nouveau_stock, motif, created_by)
                     SELECT ?, ?, 'achat_fournisseur', ?, ?, 'achat', quantite_stock - ?, quantite_stock, ?, ? FROM produits WHERE id = ? AND entreprise_id = ?`,
                    [
                        req.user.entreprise_id,
                        ligne.produit_id,
                        qteRecue,
                        id,
                        qteRecue,
                        `Réception commande fournisseur #${achat.numero_bc}`,
                        req.user.id,
                        ligne.produit_id,
                        req.user.entreprise_id
                    ],
                    () => {}
                );

                return { produit_id: ligne.produit_id, qteRecue };
            });

            const nouveauStatut = toutRecu ? 'recu_total' : 'recu_partiel';
            db.query('UPDATE achats SET statut = ? WHERE id = ?', [nouveauStatut, id], (err3) => {
                if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }
                res.json({ message: 'Réception enregistrée', statut: nouveauStatut });
            });
        });
    });
};

// ============================================================
// SUPPRIMER UN ACHAT
// ============================================================
exports.deleteAchat = (req, res) => {
    const sql = 'DELETE FROM achats WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Achat introuvable' });
        res.json({ message: 'Bon de commande supprimé avec succès' });
    });
};