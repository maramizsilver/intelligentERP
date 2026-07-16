
const SequenceService = require('../services/sequence.service');

// ============================================================
// PLUS de la fonction genererNumeroTransaction() ici !!
// Utilise désormais SequenceService.genererNumeroTransaction()
// ============================================================

const CATEGORIES_DEPENSE = ['fournisseur', 'salaire', 'loyer', 'electricite', 'transport', 'marketing', 'impot', 'autre'];
const MODES_PAIEMENT = ['especes', 'cheque', 'virement', 'carte', 'stripe', 'paypal', 'flouci', 'konnect'];

// ============================================================
// DÉPENSES
// ============================================================

exports.getAllDepenses = (req, res) => {
    const db = req.db;
    const { categorie, date_debut, date_fin } = req.query;
    let sql = 'SELECT d.*, f.nom AS fournisseur_nom FROM depenses d LEFT JOIN fournisseurs f ON d.fournisseur_id = f.id WHERE 1=1';
    const params = [];

    if (categorie) { sql += ' AND d.categorie = ?'; params.push(categorie); }
    if (date_debut) { sql += ' AND d.date_depense >= ?'; params.push(date_debut); }
    if (date_fin) { sql += ' AND d.date_depense <= ?'; params.push(date_fin); }
    sql += ' ORDER BY d.date_depense DESC';

    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ depenses: results });
    });
};

exports.getDepenseById = (req, res) => {
    const db = req.db;
    const sql = 'SELECT d.*, f.nom AS fournisseur_nom FROM depenses d LEFT JOIN fournisseurs f ON d.fournisseur_id = f.id WHERE d.id = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Dépense introuvable' });
        res.json({ depense: results[0] });
    });
};

exports.createDepense = (req, res) => {
    const db = req.db;
    const { categorie, montant, description, date_depense, fournisseur_id, mode_paiement, justificatif_document_id } = req.body;

    if (!categorie || !CATEGORIES_DEPENSE.includes(categorie)) {
        return res.status(400).json({ message: `Catégorie invalide. Valeurs autorisées : ${CATEGORIES_DEPENSE.join(', ')}` });
    }
    if (montant === undefined || isNaN(montant) || Number(montant) <= 0) {
        return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
    }
    if (!date_depense) return res.status(400).json({ message: 'La date de dépense est requise' });
    if (mode_paiement && !MODES_PAIEMENT.includes(mode_paiement)) {
        return res.status(400).json({ message: 'Mode de paiement invalide' });
    }

    const finaliserInsertion = () => {
        // PLUS de entreprise_id dans l'insertion !
        const sql = `
            INSERT INTO depenses (categorie, montant, description, date_depense, fournisseur_id, mode_paiement, justificatif_document_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            categorie, Number(montant), description || null, date_depense,
            fournisseur_id || null, mode_paiement || null, justificatif_document_id || null, req.user.id
        ], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.status(201).json({ message: 'Dépense enregistrée avec succès', id: result.insertId });
        });
    };

    if (fournisseur_id) {
        db.query('SELECT id FROM fournisseurs WHERE id = ?', [fournisseur_id], (errCheck, rows) => {
            if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (rows.length === 0) return res.status(400).json({ message: 'Fournisseur invalide' });
            finaliserInsertion();
        });
    } else {
        finaliserInsertion();
    }
};

exports.updateDepense = (req, res) => {
    const db = req.db;
    const { categorie, montant, description, date_depense, fournisseur_id, mode_paiement } = req.body;

    if (!categorie || !CATEGORIES_DEPENSE.includes(categorie)) {
        return res.status(400).json({ message: `Catégorie invalide. Valeurs autorisées : ${CATEGORIES_DEPENSE.join(', ')}` });
    }
    if (montant === undefined || isNaN(montant) || Number(montant) <= 0) {
        return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
    }

    const sql = `
        UPDATE depenses SET categorie = ?, montant = ?, description = ?, date_depense = ?, fournisseur_id = ?, mode_paiement = ?
        WHERE id = ?
    `;
    db.query(sql, [categorie, Number(montant), description || null, date_depense, fournisseur_id || null, mode_paiement || null, req.params.id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Dépense introuvable' });
        res.json({ message: 'Dépense mise à jour avec succès' });
    });
};

exports.deleteDepense = (req, res) => {
    const db = req.db;
    db.query('DELETE FROM depenses WHERE id = ?', [req.params.id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Dépense introuvable' });
        res.json({ message: 'Dépense supprimée avec succès' });
    });
};

// ============================================================
// RECETTES
// ============================================================

exports.getAllRecettes = (req, res) => {
    const db = req.db;
    const { date_debut, date_fin } = req.query;
    let sql = 'SELECT r.*, c.nom AS client_nom FROM recettes r LEFT JOIN clients c ON r.client_id = c.id WHERE 1=1';
    const params = [];

    if (date_debut) { sql += ' AND r.date_recette >= ?'; params.push(date_debut); }
    if (date_fin) { sql += ' AND r.date_recette <= ?'; params.push(date_fin); }
    sql += ' ORDER BY r.date_recette DESC';

    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ recettes: results });
    });
};

exports.createRecette = (req, res) => {
    const db = req.db;
    const { source, montant, description, date_recette, client_id, mode_paiement } = req.body;

    if (!source || source.trim().length < 2) return res.status(400).json({ message: 'La source de la recette est requise' });
    if (montant === undefined || isNaN(montant) || Number(montant) <= 0) {
        return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
    }
    if (!date_recette) return res.status(400).json({ message: 'La date de recette est requise' });
    if (mode_paiement && !MODES_PAIEMENT.includes(mode_paiement)) {
        return res.status(400).json({ message: 'Mode de paiement invalide' });
    }

    const finaliserInsertion = () => {
        // PLUS de entreprise_id dans l'insertion !
        const sql = `
            INSERT INTO recettes (source, montant, description, date_recette, client_id, mode_paiement, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [source.trim(), Number(montant), description || null, date_recette, client_id || null, mode_paiement || null, req.user.id], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.status(201).json({ message: 'Recette enregistrée avec succès', id: result.insertId });
        });
    };

    if (client_id) {
        db.query('SELECT id FROM clients WHERE id = ?', [client_id], (errCheck, rows) => {
            if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (rows.length === 0) return res.status(400).json({ message: 'Client invalide' });
            finaliserInsertion();
        });
    } else {
        finaliserInsertion();
    }
};

exports.deleteRecette = (req, res) => {
    const db = req.db;
    db.query('DELETE FROM recettes WHERE id = ?', [req.params.id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Recette introuvable' });
        res.json({ message: 'Recette supprimée avec succès' });
    });
};

// ============================================================
// PAIEMENTS (MIGRÉ AVEC SEQUENCE SERVICE)
// ============================================================

exports.getAllPaiements = (req, res) => {
    const db = req.db;
    const { reference_type, statut } = req.query;
    let sql = 'SELECT * FROM paiements WHERE 1=1';
    const params = [];

    if (reference_type) { sql += ' AND reference_type = ?'; params.push(reference_type); }
    if (statut) { sql += ' AND statut = ?'; params.push(statut); }
    sql += ' ORDER BY id DESC';

    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ paiements: results });
    });
};

exports.createPaiement = async (req, res) => {
    const db = req.db;
    const { reference_type, reference_id, montant, mode_paiement, provider_ref } = req.body;
    const TYPES_VALIDES = ['commande', 'achat'];

    if (!TYPES_VALIDES.includes(reference_type)) {
        return res.status(400).json({ message: "reference_type doit être 'commande' ou 'achat'" });
    }
    if (!reference_id) return res.status(400).json({ message: 'reference_id est requis' });
    if (montant === undefined || isNaN(montant) || Number(montant) <= 0) {
        return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
    }
    if (!mode_paiement || !MODES_PAIEMENT.includes(mode_paiement)) {
        return res.status(400).json({ message: `Mode de paiement invalide. Valeurs autorisées : ${MODES_PAIEMENT.join(', ')}` });
    }

    // Vérifier que la référence (commande ou achat) existe
    const sqlVerif = reference_type === 'commande'
        ? 'SELECT id FROM commandes WHERE id = ?'
        : 'SELECT id FROM achats WHERE id = ?';

    db.query(sqlVerif, [reference_id], async (errVerif, rows) => {
        if (errVerif) { console.error(errVerif); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (rows.length === 0) return res.status(400).json({ message: 'Référence introuvable' });

        try {
            // 🆕 Utiliser SequenceService au lieu de genererNumeroTransaction()
            const numero_transaction = await SequenceService.genererNumeroTransaction(db, req.user.entreprise_id);
            
            const modesEnLigne = ['stripe', 'paypal', 'flouci', 'konnect'];
            const statutInitial = modesEnLigne.includes(mode_paiement) ? 'en_attente' : 'valide';

            // PLUS de entreprise_id dans l'insertion !
            const sql = `
                INSERT INTO paiements (numero_transaction, reference_type, reference_id, montant, mode_paiement, provider_ref, statut, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(sql, [
                numero_transaction, reference_type, reference_id,
                Number(montant), mode_paiement, provider_ref || null, statutInitial, req.user.id
            ], (err, result) => {
                if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
                res.status(201).json({
                    message: statutInitial === 'valide' ? 'Paiement enregistré avec succès' : 'Paiement initié, en attente de confirmation',
                    id: result.insertId,
                    numero_transaction,
                    statut: statutInitial
                });
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    });
};

exports.updatePaiementStatut = (req, res) => {
    const db = req.db;
    const { statut, provider_ref } = req.body;
    const STATUTS_VALIDES = ['valide', 'echoue', 'rembourse'];

    if (!STATUTS_VALIDES.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    const sql = provider_ref
        ? 'UPDATE paiements SET statut = ?, provider_ref = ? WHERE id = ?'
        : 'UPDATE paiements SET statut = ? WHERE id = ?';
    const params = provider_ref
        ? [statut, provider_ref, req.params.id]
        : [statut, req.params.id];

    db.query(sql, params, (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Paiement introuvable' });
        res.json({ message: 'Statut du paiement mis à jour avec succès' });
    });
};

// ============================================================
// RAPPORTS FINANCIERS
// ============================================================

exports.getRapportFinancier = (req, res) => {
    const db = req.db;
    const { date_debut, date_fin } = req.query;
    const debut = date_debut || '1970-01-01';
    const fin = date_fin || new Date().toISOString().slice(0, 10);

    const sqlCommandes = `
        SELECT COALESCE(SUM(c.total), 0) AS total
        FROM commandes c
        WHERE c.statut = 'livree' AND c.date_commande BETWEEN ? AND ?
    `;
    const sqlRecettesManuelles = `SELECT COALESCE(SUM(montant), 0) AS total FROM recettes WHERE date_recette BETWEEN ? AND ?`;
    const sqlDepenses = `SELECT COALESCE(SUM(montant), 0) AS total FROM depenses WHERE date_depense BETWEEN ? AND ?`;
    const sqlDepensesParCategorie = `
        SELECT categorie, COALESCE(SUM(montant), 0) AS total
        FROM depenses WHERE date_depense BETWEEN ? AND ?
        GROUP BY categorie ORDER BY total DESC
    `;

    db.query(sqlCommandes, [debut, fin], (err1, rowsCmd) => {
        if (err1) { console.error(err1); return res.status(500).json({ message: 'Erreur serveur' }); }

        db.query(sqlRecettesManuelles, [debut, fin], (err2, rowsRec) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

            db.query(sqlDepenses, [debut, fin], (err3, rowsDep) => {
                if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }

                db.query(sqlDepensesParCategorie, [debut, fin], (err4, rowsDepCat) => {
                    if (err4) { console.error(err4); return res.status(500).json({ message: 'Erreur serveur' }); }

                    const recettesCommandes = Number(rowsCmd[0].total);
                    const recettesManuelles = Number(rowsRec[0].total);
                    const totalDepenses = Number(rowsDep[0].total);
                    const totalRecettes = recettesCommandes + recettesManuelles;

                    res.json({
                        periode: { date_debut: debut, date_fin: fin },
                        recettes: {
                            commandes_livrees: recettesCommandes,
                            recettes_manuelles: recettesManuelles,
                            total: totalRecettes
                        },
                        depenses: {
                            total: totalDepenses,
                            par_categorie: rowsDepCat
                        },
                        resultat_net: totalRecettes - totalDepenses
                    });
                });
            });
        });
    });
};