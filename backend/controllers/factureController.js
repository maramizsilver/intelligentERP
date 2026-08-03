// backend/controllers/factureController.js
const SequenceService = require('../services/sequence.service');

// ============================================================
// LISTER TOUTES LES FACTURES
// ============================================================
exports.getAllFactures = (req, res) => {
    const db = req.db;
    const sql = `
        SELECT f.*, c.nom AS client_nom, c.prenom AS client_prenom
        FROM factures f
        JOIN clients c ON f.client_id = c.id
        WHERE f.entreprise_id = ?
        ORDER BY f.id DESC
    `;
    db.query(sql, [req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ factures: results });
    });
};

// ============================================================
// GET FACTURE PAR ID
// ============================================================
exports.getFactureById = (req, res) => {
    const db = req.db;
    const sql = `
        SELECT f.*, c.nom AS client_nom, c.prenom AS client_prenom,
               c.email AS client_email, c.telephone AS client_telephone,
               c.adresse AS client_adresse, c.ville AS client_ville,
               d.numero_devis, d.date_devis,
               co.numero_commande, co.date_commande
        FROM factures f
        JOIN clients c ON f.client_id = c.id
        LEFT JOIN devis d ON f.devis_id = d.id
        LEFT JOIN commandes co ON f.commande_id = co.id
        WHERE f.id = ? AND f.entreprise_id = ?
    `;
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Facture introuvable' });
        res.json({ facture: results[0] });
    });
};

// ============================================================
// CREER UNE FACTURE DEPUIS UN DEVIS
// ============================================================
exports.createFactureFromDevis = async (req, res) => {
    const db = req.db;
    const { devis_id } = req.body;
    const entrepriseId = req.user.entreprise_id;

    if (!devis_id) {
        return res.status(400).json({ message: 'devis_id est requis' });
    }

    // Récupérer le devis avec le client
    const sqlDevis = `
        SELECT d.*, c.id AS client_id
        FROM devis d
        JOIN clients c ON d.client_id = c.id
        WHERE d.id = ? AND d.entreprise_id = ?
    `;
    db.query(sqlDevis, [devis_id, entrepriseId], async (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Devis introuvable' });
        }

        const devis = results[0];
        
        try {
            const numero_facture = await SequenceService.genererNumeroFacture(db, entrepriseId);

            const sqlInsert = `
                INSERT INTO factures 
                (numero_facture, client_id, devis_id, total_ht, montant_tva, total_ttc, statut, entreprise_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?, 'emise', ?, ?)
            `;
            db.query(sqlInsert, [
                numero_facture,
                devis.client_id,
                devis_id,
                devis.total_ht,
                devis.montant_tva,
                devis.total_ttc,
                entrepriseId,
                req.user.id
            ], (err2, result) => {
                if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
                res.status(201).json({
                    message: 'Facture créée avec succès',
                    facture_id: result.insertId,
                    numero_facture
                });
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    });
};

// ============================================================
// CREER UNE FACTURE DEPUIS UNE COMMANDE
// ============================================================
exports.createFactureFromCommande = async (req, res) => {
    const db = req.db;
    const { commande_id } = req.body;
    const entrepriseId = req.user.entreprise_id;

    if (!commande_id) {
        return res.status(400).json({ message: 'commande_id est requis' });
    }

    const sqlCommande = `
        SELECT co.*, c.id AS client_id
        FROM commandes co
        JOIN clients c ON co.client_id = c.id
        WHERE co.id = ? AND co.entreprise_id = ?
    `;
    db.query(sqlCommande, [commande_id, entrepriseId], async (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Commande introuvable' });
        }

        const commande = results[0];
        
        try {
            const numero_facture = await SequenceService.genererNumeroFacture(db, entrepriseId);

            const sqlInsert = `
                INSERT INTO factures 
                (numero_facture, client_id, commande_id, total_ht, montant_tva, total_ttc, statut, entreprise_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?, 'emise', ?, ?)
            `;
            db.query(sqlInsert, [
                numero_facture,
                commande.client_id,
                commande_id,
                commande.montant_ht || commande.total,
                commande.montant_tva || 0,
                commande.total_ttc || commande.total,
                entrepriseId,
                req.user.id
            ], (err2, result) => {
                if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }
                res.status(201).json({
                    message: 'Facture créée avec succès',
                    facture_id: result.insertId,
                    numero_facture
                });
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    });
};

// ============================================================
// METTRE À JOUR LE STATUT D'UNE FACTURE
// ============================================================
exports.updateFactureStatut = (req, res) => {
    const db = req.db;
    const { statut } = req.body;
    const statutsValides = ['brouillon', 'emise', 'payee', 'annulee'];

    if (!statutsValides.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    const sql = 'UPDATE factures SET statut = ? WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [statut, req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Facture introuvable' });
        res.json({ message: 'Statut mis à jour avec succès' });
    });
};

// ============================================================
// SUPPRIMER UNE FACTURE
// ============================================================
exports.deleteFacture = (req, res) => {
    const db = req.db;
    const sql = 'DELETE FROM factures WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Facture introuvable' });
        res.json({ message: 'Facture supprimée avec succès' });
    });
};