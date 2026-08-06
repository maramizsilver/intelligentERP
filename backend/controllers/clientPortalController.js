// Portail espace client (comptes externes) : commandes, produits, factures, profil.
// Toutes les routes ici sont filtrées par req.user.client_id (jamais fourni par le front).
exports.getMesCommandes = (req, res) => {
    const db = req.db;
    if (!req.user.client_id) {
        return res.status(400).json({ message: 'Aucun client associé à ce compte' });
    }
    db.query(
        `SELECT c.*, cl.nom AS client_nom
         FROM commandes c
         JOIN clients cl ON c.client_id = cl.id
         WHERE c.client_id = ?
         ORDER BY c.date_commande DESC`,
        [req.user.client_id],
        (err, results) => {
            if (err) { console.error('Erreur getMesCommandes:', err); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ commandes: results });
        }
    );
};

exports.getCommandeDetail = (req, res) => {
    const db = req.db;
    const { id } = req.params;
    if (!req.user.client_id) {
        return res.status(400).json({ message: 'Aucun client associé à ce compte' });
    }
    db.query(
        'SELECT * FROM commandes WHERE id = ? AND client_id = ?',
        [id, req.user.client_id],
        (err, results) => {
            if (err) { console.error('Erreur getCommandeDetail:', err); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (results.length === 0) return res.status(404).json({ message: 'Commande introuvable' });

            const commande = results[0];
            db.query(
                `SELECT cp.*, p.nom AS produit_nom
                 FROM commande_produits cp
                 JOIN produits p ON cp.produit_id = p.id
                 WHERE cp.commande_id = ?`,
                [id],
                (err2, lignes) => {
                    if (err2) { console.error('Erreur lignes commande:', err2); return res.status(500).json({ message: 'Erreur serveur' }); }
                    res.json({ ...commande, produits: lignes, lignes });
                }
            );
        }
    );
};

exports.getMesProduits = (req, res) => {
    const db = req.db;
    db.query(
        'SELECT * FROM produits WHERE actif = 1 ORDER BY nom ASC',
        (err, results) => {
            if (err) { console.error('Erreur getMesProduits:', err); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ produits: results });
        }
    );
};

exports.getMesFactures = (req, res) => {
    const db = req.db;
    if (!req.user.client_id) {
        return res.status(400).json({ message: 'Aucun client associé à ce compte' });
    }
    db.query(
        'SELECT * FROM factures WHERE client_id = ? ORDER BY date_facture DESC',
        [req.user.client_id],
        (err, results) => {
            if (err) { console.error('Erreur getMesFactures:', err); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ factures: results });
        }
    );
};

exports.getMonProfil = (req, res) => {
    const db = req.db;
    if (!req.user.client_id) {
        return res.status(400).json({ message: 'Aucun client associé à ce compte' });
    }
    db.query('SELECT * FROM clients WHERE id = ?', [req.user.client_id], (err, results) => {
        if (err) { console.error('Erreur getMonProfil:', err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Client introuvable' });
        res.json({ user: results[0] });
    });
};

exports.updateMonProfil = (req, res) => {
    const db = req.db;
    const { nom, prenom, telephone, adresse, ville, code_postal, pays } = req.body;

    if (!req.user.client_id) {
        return res.status(400).json({ message: 'Aucun client associé à ce compte' });
    }
    if (!nom || nom.trim().length < 2) {
        return res.status(400).json({ message: 'Le nom est requis' });
    }

    const sql = `UPDATE clients SET
        nom = ?, prenom = ?, telephone = ?, adresse = ?, ville = ?, code_postal = ?, pays = ?
        WHERE id = ?`;

    db.query(sql, [
        nom.trim(),
        prenom || null,
        telephone || null,
        adresse || null,
        ville || null,
        code_postal || null,
        pays || 'Tunisie',
        req.user.client_id
    ], (err) => {
        if (err) { console.error('Erreur updateMonProfil:', err); return res.status(500).json({ message: 'Erreur serveur' }); }

        db.query('SELECT * FROM clients WHERE id = ?', [req.user.client_id], (err2, rows) => {
            if (err2) { console.error('Erreur relecture profil:', err2); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.json({ message: 'Profil mis à jour avec succès', user: rows[0] });
        });
    });
};