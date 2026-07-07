const db = require('../config/db');

// ============================================================
// GET TOUTES LES PROMOTIONS
// ============================================================
exports.getAllPromotions = (req, res) => {
    const sql = 'SELECT * FROM promotions WHERE entreprise_id = ? ORDER BY id DESC';
    db.query(sql, [req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ promotions: results });
    });
};

// ============================================================
// GET UNE PROMOTION PAR ID
// ============================================================
exports.getPromotionById = (req, res) => {
    const sql = 'SELECT * FROM promotions WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Promotion introuvable' });
        res.json({ promotion: results[0] });
    });
};

// ============================================================
// CRÉER UNE PROMOTION
// ============================================================
exports.createPromotion = (req, res) => {
    const {
        code, nom, description, type, valeur,
        date_debut, date_fin, utilisation_max,
        produits_concernes, clients_concernes
    } = req.body;

    if (!code || code.trim().length < 2) return res.status(400).json({ message: 'Le code est requis' });
    if (!nom || nom.trim().length < 2) return res.status(400).json({ message: 'Le nom est requis' });
    if (!type || !['pourcentage', 'fixe', 'livraison_offerte'].includes(type)) {
        return res.status(400).json({ message: 'Type invalide' });
    }
    if (valeur === undefined || isNaN(valeur) || valeur <= 0) {
        return res.status(400).json({ message: 'La valeur doit être un nombre positif' });
    }
    if (!date_debut || !date_fin) return res.status(400).json({ message: 'Les dates sont requises' });

    const sql = `
        INSERT INTO promotions (
            entreprise_id, code, nom, description, type, valeur,
            date_debut, date_fin, utilisation_max,
            produits_concernes, clients_concernes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [
        req.user.entreprise_id,
        code.trim().toUpperCase(),
        nom.trim(),
        description || null,
        type,
        valeur,
        date_debut,
        date_fin,
        utilisation_max || null,
        produits_concernes ? JSON.stringify(produits_concernes) : null,
        clients_concernes ? JSON.stringify(clients_concernes) : null
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Ce code promotionnel existe déjà' });
            }
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.status(201).json({ message: 'Promotion créée avec succès', id: result.insertId });
    });
};

// ============================================================
// METTRE À JOUR UNE PROMOTION
// ============================================================
exports.updatePromotion = (req, res) => {
    const {
        code, nom, description, type, valeur,
        date_debut, date_fin, utilisation_max, actif,
        produits_concernes, clients_concernes
    } = req.body;

    const sql = `
        UPDATE promotions SET
            code = ?, nom = ?, description = ?, type = ?, valeur = ?,
            date_debut = ?, date_fin = ?, utilisation_max = ?, actif = ?,
            produits_concernes = ?, clients_concernes = ?
        WHERE id = ? AND entreprise_id = ?
    `;
    db.query(sql, [
        code.trim().toUpperCase(),
        nom.trim(),
        description || null,
        type,
        valeur,
        date_debut,
        date_fin,
        utilisation_max || null,
        actif !== undefined ? actif : true,
        produits_concernes ? JSON.stringify(produits_concernes) : null,
        clients_concernes ? JSON.stringify(clients_concernes) : null,
        req.params.id,
        req.user.entreprise_id
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Ce code promotionnel existe déjà' });
            }
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Promotion introuvable' });
        res.json({ message: 'Promotion mise à jour avec succès' });
    });
};

// ============================================================
// SUPPRIMER UNE PROMOTION
// ============================================================
exports.deletePromotion = (req, res) => {
    const sql = 'DELETE FROM promotions WHERE id = ? AND entreprise_id = ?';
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Promotion introuvable' });
        res.json({ message: 'Promotion supprimée avec succès' });
    });
};

// ============================================================
// VALIDER UN CODE PROMOTIONNEL
// ============================================================
exports.validerCodePromo = (req, res) => {
    const { code, produit_id, client_id } = req.body;

    if (!code) return res.status(400).json({ message: 'Code requis' });

    const sql = `
        SELECT * FROM promotions
        WHERE entreprise_id = ?
        AND code = ?
        AND actif = TRUE
        AND date_debut <= NOW()
        AND date_fin >= NOW()
        AND (utilisation_max IS NULL OR utilisation_count < utilisation_max)
    `;
    db.query(sql, [req.user.entreprise_id, code.trim().toUpperCase()], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Code promotionnel invalide ou expiré' });
        }

        const promo = results[0];

        // Vérifier si le client est concerné
        if (promo.clients_concernes) {
            const clients = JSON.parse(promo.clients_concernes);
            if (client_id && !clients.includes(client_id)) {
                return res.status(400).json({ message: 'Cette promotion ne s\'applique pas à ce client' });
            }
        }

        // Vérifier si le produit est concerné
        if (promo.produits_concernes) {
            const produits = JSON.parse(promo.produits_concernes);
            if (produit_id && !produits.includes(produit_id)) {
                return res.status(400).json({ message: 'Cette promotion ne s\'applique pas à ce produit' });
            }
        }

        // Incrémenter le compteur d'utilisation
        db.query('UPDATE promotions SET utilisation_count = utilisation_count + 1 WHERE id = ?', [promo.id], () => {});

        res.json({
            valid: true,
            promotion: promo,
            message: `Code valide : ${promo.nom}`
        });
    });
};