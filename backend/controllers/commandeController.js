exports.getAllCommandes = (req, res) => {
    const db = req.db;
    
    let sql = `
        SELECT c.*, cl.nom AS client_nom
        FROM commandes c
        JOIN clients cl ON c.client_id = cl.id
    `;
    const params = [];

    if (req.user.is_external) {
        sql += ' WHERE c.client_id = ?';
        params.push(req.user.client_id);
    }
    sql += ' ORDER BY c.id DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Erreur getAllCommandes:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json({ commandes: results });
    });
};

exports.getCommandeById = (req, res) => {
    const db = req.db;
    
    const sqlCommande = `
        SELECT c.*, cl.nom AS client_nom
        FROM commandes c
        JOIN clients cl ON c.client_id = cl.id
        WHERE c.id = ?
    `;
    db.query(sqlCommande, [req.params.id], (err, results) => {
        if (err) {
            console.error('Erreur getCommandeById:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        const commande = results[0];

        if (req.user.is_external && commande.client_id !== req.user.client_id) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        const sqlLignes = `
            SELECT cp.*, p.nom AS produit_nom
            FROM commande_produits cp
            JOIN produits p ON cp.produit_id = p.id
            WHERE cp.commande_id = ?
        `;
        db.query(sqlLignes, [req.params.id], (err2, lignes) => {
            if (err2) {
                console.error('Erreur getLignes:', err2);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.json({ commande: { ...commande, lignes } });
        });
    });
};

exports.createCommande = (req, res) => {
    const db = req.db;
    
    const { lignes } = req.body;
    const client_id = req.user.is_external ? req.user.client_id : req.body.client_id;

    if (!client_id) {
        return res.status(400).json({ message: 'Le client est requis' });
    }
    if (!Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ message: 'La commande doit contenir au moins un produit' });
    }

    for (const l of lignes) {
        const qte = Number(l.quantite);
        if (!l.produit_id || !Number.isInteger(qte) || qte <= 0) {
            return res.status(400).json({ message: 'Chaque ligne doit avoir un produit et une quantite entiere positive' });
        }
    }

    db.query(
        'SELECT id FROM clients WHERE id = ?',
        [client_id],
        (errClient, clients) => {
            if (errClient) {
                console.error('Erreur verification client:', errClient);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            if (clients.length === 0) {
                return res.status(400).json({ message: 'Client invalide' });
            }

            const quantitesParProduit = {};
            lignes.forEach(l => {
                const id = l.produit_id;
                const qte = Number(l.quantite);
                quantitesParProduit[id] = (quantitesParProduit[id] || 0) + qte;
            });
            const produitIds = Object.keys(quantitesParProduit).map(Number);

            const sqlPrix = 'SELECT id, prix FROM produits WHERE id IN (?)';
            db.query(sqlPrix, [produitIds], (err, produits) => {
                if (err) {
                    console.error('Erreur verification produits:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                if (produits.length !== produitIds.length) {
                    return res.status(400).json({ message: 'Un ou plusieurs produits sont introuvables' });
                }

                const prixMap = {};
                produits.forEach(p => { prixMap[p.id] = p.prix; });

                let total = 0;
                const lignesAvecPrix = produitIds.map(id => {
                    const quantite = quantitesParProduit[id];
                    const prix_unitaire = prixMap[id];
                    total += prix_unitaire * quantite;
                    return { produit_id: id, quantite, prix_unitaire };
                });

                const sqlInsertCommande = 'INSERT INTO commandes (client_id, total) VALUES (?, ?)';
                db.query(sqlInsertCommande, [client_id, total], (err2, result) => {
                    if (err2) {
                        console.error('Erreur insert commande:', err2);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }

                    const commandeId = result.insertId;
                    const sqlInsertLignes = 'INSERT INTO commande_produits (commande_id, produit_id, quantite, prix_unitaire) VALUES ?';
                    const values = lignesAvecPrix.map(l => [commandeId, l.produit_id, l.quantite, l.prix_unitaire]);
                    db.query(sqlInsertLignes, [values], (err3) => {
                        if (err3) {
                            console.error('Erreur insert lignes:', err3);
                            return res.status(500).json({ message: 'Erreur serveur' });
                        }
                        res.status(201).json({ 
                            message: 'Commande cree avec succes', 
                            id: commandeId, 
                            total 
                        });
                    });
                });
            });
        }
    );
};

exports.updateCommandeStatut = (req, res) => {
    const db = req.db;
    
    const { statut } = req.body;
    const statutsValides = ['en_attente', 'confirmee', 'annulee', 'livree'];

    if (!statutsValides.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    const sql = 'UPDATE commandes SET statut = ? WHERE id = ?';
    db.query(sql, [statut, req.params.id], (err, result) => {
        if (err) {
            console.error('Erreur updateCommandeStatut:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }
        res.json({ message: 'Statut mis a jour avec succes' });
    });
};

exports.deleteCommande = (req, res) => {
    const db = req.db;
    
    const { id } = req.params;

    const sqlFind = `
        SELECT c.client_id, c.statut
        FROM commandes c
        WHERE c.id = ?
    `;
    db.query(sqlFind, [id], (err, results) => {
        if (err) {
            console.error('Erreur deleteCommande - find:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        const commande = results[0];

        if (req.user.is_external) {
            if (commande.client_id !== req.user.client_id) {
                return res.status(403).json({ message: 'Acces refuse' });
            }
            if (commande.statut !== 'en_attente') {
                return res.status(400).json({ 
                    message: "Impossible d'annuler une commande deja confirmee, livree ou annulee" 
                });
            }
        }

        db.query('DELETE FROM commandes WHERE id = ?', [id], (err2, result) => {
            if (err2) {
                console.error('Erreur deleteCommande - delete:', err2);
                return res.status(500).json({ message: 'Erreur serveur' });
            }
            res.json({ message: 'Commande supprimee avec succes' });
        });
    });
};