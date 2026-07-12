const db = require('../config/db');

const CATEGORIES_DEPENSE = ['fournisseur', 'salaire', 'loyer', 'electricite', 'transport', 'marketing', 'impot', 'autre'];
const MODES_PAIEMENT = ['especes', 'cheque', 'virement', 'carte', 'stripe', 'paypal', 'flouci', 'konnect'];

// ============================================================
// FIX même pattern que achatController/devisController : compteur
// atomique via transaction + verrouillage de ligne, pour éviter les
// doublons de numéro de transaction/facture en cas de concurrence.
// ============================================================
function genererNumeroTransaction(entrepriseId) {
    return new Promise((resolve, reject) => {
        db.getConnection((errConn, connection) => {
            if (errConn) return reject(errConn);

            connection.beginTransaction((errTx) => {
                if (errTx) { connection.release(); return reject(errTx); }

                connection.query(
                    'SELECT dernier_numero_transaction FROM entreprises WHERE id = ? FOR UPDATE',
                    [entrepriseId],
                    (errSel, rows) => {
                        if (errSel) {
                            return connection.rollback(() => { connection.release(); reject(errSel); });
                        }

                        const numero = (rows[0]?.dernier_numero_transaction || 0) + 1;

                        connection.query(
                            'UPDATE entreprises SET dernier_numero_transaction = ? WHERE id = ?',
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
                                    resolve(`TR-${annee}${mois}-${String(numero).padStart(5, '0')}`);
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
// DÉPENSES
// ============================================================

exports.getAllDepenses = (req, res) => {
    const { categorie, date_debut, date_fin } = req.query;
    let sql = 'SELECT d.*, f.nom AS fournisseur_nom FROM depenses d LEFT JOIN fournisseurs f ON d.fournisseur_id = f.id WHERE d.entreprise_id = ?';
    const params = [req.user.entreprise_id];

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
    const sql = 'SELECT d.*, f.nom AS fournisseur_nom FROM depenses d LEFT JOIN fournisseurs f ON d.fournisseur_id = f.id WHERE d.id = ? AND d.entreprise_id = ?';
    db.query(sql, [req.params.id, req.user.entreprise_id], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (results.length === 0) return res.status(404).json({ message: 'Dépense introuvable' });
        res.json({ depense: results[0] });
    });
};

exports.createDepense = (req, res) => {
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
        const sql = `
            INSERT INTO depenses (entreprise_id, categorie, montant, description, date_depense, fournisseur_id, mode_paiement, justificatif_document_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            req.user.entreprise_id, categorie, Number(montant), description || null, date_depense,
            fournisseur_id || null, mode_paiement || null, justificatif_document_id || null, req.user.id
        ], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.status(201).json({ message: 'Dépense enregistrée avec succès', id: result.insertId });
        });
    };

    if (fournisseur_id) {
        db.query('SELECT id FROM fournisseurs WHERE id = ? AND entreprise_id = ?', [fournisseur_id, req.user.entreprise_id], (errCheck, rows) => {
            if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (rows.length === 0) return res.status(400).json({ message: 'Fournisseur invalide pour votre entreprise' });
            finaliserInsertion();
        });
    } else {
        finaliserInsertion();
    }
};

exports.updateDepense = (req, res) => {
    const { categorie, montant, description, date_depense, fournisseur_id, mode_paiement } = req.body;

    if (!categorie || !CATEGORIES_DEPENSE.includes(categorie)) {
        return res.status(400).json({ message: `Catégorie invalide. Valeurs autorisées : ${CATEGORIES_DEPENSE.join(', ')}` });
    }
    if (montant === undefined || isNaN(montant) || Number(montant) <= 0) {
        return res.status(400).json({ message: 'Le montant doit être un nombre positif' });
    }

    const sql = `
        UPDATE depenses SET categorie = ?, montant = ?, description = ?, date_depense = ?, fournisseur_id = ?, mode_paiement = ?
        WHERE id = ? AND entreprise_id = ?
    `;
    db.query(sql, [categorie, Number(montant), description || null, date_depense, fournisseur_id || null, mode_paiement || null, req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Dépense introuvable' });
        res.json({ message: 'Dépense mise à jour avec succès' });
    });
};

exports.deleteDepense = (req, res) => {
    db.query('DELETE FROM depenses WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Dépense introuvable' });
        res.json({ message: 'Dépense supprimée avec succès' });
    });
};

// ============================================================
// RECETTES (entrées d'argent hors commandes, ex: subventions, autres revenus)
// Les recettes issues des commandes clients sont calculées automatiquement
// dans getRapportFinancier via la table commandes existante — pas dupliquées ici.
// ============================================================

exports.getAllRecettes = (req, res) => {
    const { date_debut, date_fin } = req.query;
    let sql = 'SELECT r.*, c.nom AS client_nom FROM recettes r LEFT JOIN clients c ON r.client_id = c.id WHERE r.entreprise_id = ?';
    const params = [req.user.entreprise_id];

    if (date_debut) { sql += ' AND r.date_recette >= ?'; params.push(date_debut); }
    if (date_fin) { sql += ' AND r.date_recette <= ?'; params.push(date_fin); }
    sql += ' ORDER BY r.date_recette DESC';

    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ recettes: results });
    });
};

exports.createRecette = (req, res) => {
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
        const sql = `
            INSERT INTO recettes (entreprise_id, source, montant, description, date_recette, client_id, mode_paiement, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [req.user.entreprise_id, source.trim(), Number(montant), description || null, date_recette, client_id || null, mode_paiement || null, req.user.id], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
            res.status(201).json({ message: 'Recette enregistrée avec succès', id: result.insertId });
        });
    };

    if (client_id) {
        db.query('SELECT id FROM clients WHERE id = ? AND entreprise_id = ?', [client_id, req.user.entreprise_id], (errCheck, rows) => {
            if (errCheck) { console.error(errCheck); return res.status(500).json({ message: 'Erreur serveur' }); }
            if (rows.length === 0) return res.status(400).json({ message: 'Client invalide pour votre entreprise' });
            finaliserInsertion();
        });
    } else {
        finaliserInsertion();
    }
};

exports.deleteRecette = (req, res) => {
    db.query('DELETE FROM recettes WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.entreprise_id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Recette introuvable' });
        res.json({ message: 'Recette supprimée avec succès' });
    });
};

// ============================================================
// PAIEMENTS — encaisser une commande client ou régler un achat fournisseur
// body: { reference_type: 'commande'|'achat', reference_id, montant, mode_paiement, provider_ref? }
// provider_ref = identifiant de transaction renvoyé par Stripe/PayPal/Flouci/Konnect
// (le webhook du provider viendra confirmer via updatePaiementStatut, cf. plus bas)
// ============================================================
exports.getAllPaiements = (req, res) => {
    const { reference_type, statut } = req.query;
    let sql = 'SELECT * FROM paiements WHERE entreprise_id = ?';
    const params = [req.user.entreprise_id];

    if (reference_type) { sql += ' AND reference_type = ?'; params.push(reference_type); }
    if (statut) { sql += ' AND statut = ?'; params.push(statut); }
    sql += ' ORDER BY id DESC';

    db.query(sql, params, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        res.json({ paiements: results });
    });
};

exports.createPaiement = async (req, res) => {
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

    // Vérifier que la référence (commande ou achat) appartient bien à l'entreprise
    const sqlVerif = reference_type === 'commande'
        ? `SELECT c.id FROM commandes c JOIN clients cl ON c.client_id = cl.id WHERE c.id = ? AND cl.entreprise_id = ?`
        : `SELECT id FROM achats WHERE id = ? AND entreprise_id = ?`;

    db.query(sqlVerif, [reference_id, req.user.entreprise_id], async (errVerif, rows) => {
        if (errVerif) { console.error(errVerif); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (rows.length === 0) return res.status(400).json({ message: 'Référence introuvable pour votre entreprise' });

        try {
            const numero_transaction = await genererNumeroTransaction(req.user.entreprise_id);
            // Un mode en ligne (stripe/paypal/flouci/konnect) démarre "en_attente"
            // jusqu'à confirmation webhook ; les modes hors-ligne sont "valide" direct.
            const modesEnLigne = ['stripe', 'paypal', 'flouci', 'konnect'];
            const statutInitial = modesEnLigne.includes(mode_paiement) ? 'en_attente' : 'valide';

            const sql = `
                INSERT INTO paiements (entreprise_id, numero_transaction, reference_type, reference_id, montant, mode_paiement, provider_ref, statut, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(sql, [
                req.user.entreprise_id, numero_transaction, reference_type, reference_id,
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

// ============================================================
// Confirmer/échouer un paiement en ligne (appelé par le webhook du
// provider, ou manuellement par un admin en cas de litige)
// ============================================================
exports.updatePaiementStatut = (req, res) => {
    const { statut, provider_ref } = req.body;
    const STATUTS_VALIDES = ['valide', 'echoue', 'rembourse'];

    if (!STATUTS_VALIDES.includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
    }

    const sql = provider_ref
        ? 'UPDATE paiements SET statut = ?, provider_ref = ? WHERE id = ? AND entreprise_id = ?'
        : 'UPDATE paiements SET statut = ? WHERE id = ? AND entreprise_id = ?';
    const params = provider_ref
        ? [statut, provider_ref, req.params.id, req.user.entreprise_id]
        : [statut, req.params.id, req.user.entreprise_id];

    db.query(sql, params, (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: 'Erreur serveur' }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Paiement introuvable' });
        res.json({ message: 'Statut du paiement mis à jour avec succès' });
    });
};

// ============================================================
// RAPPORTS FINANCIERS
// Agrège recettes (commandes livrées + table recettes) et dépenses
// (table depenses) sur une période, pour donner un résumé comptable.
// ============================================================
exports.getRapportFinancier = (req, res) => {
    const { date_debut, date_fin } = req.query;
    const debut = date_debut || '1970-01-01';
    const fin = date_fin || new Date().toISOString().slice(0, 10);

    const sqlCommandes = `
        SELECT COALESCE(SUM(c.total), 0) AS total
        FROM commandes c
        JOIN clients cl ON c.client_id = cl.id
        WHERE cl.entreprise_id = ? AND c.statut = 'livree' AND c.date_commande BETWEEN ? AND ?
    `;
    const sqlRecettesManuelles = `SELECT COALESCE(SUM(montant), 0) AS total FROM recettes WHERE entreprise_id = ? AND date_recette BETWEEN ? AND ?`;
    const sqlDepenses = `SELECT COALESCE(SUM(montant), 0) AS total FROM depenses WHERE entreprise_id = ? AND date_depense BETWEEN ? AND ?`;
    const sqlDepensesParCategorie = `
        SELECT categorie, COALESCE(SUM(montant), 0) AS total
        FROM depenses WHERE entreprise_id = ? AND date_depense BETWEEN ? AND ?
        GROUP BY categorie ORDER BY total DESC
    `;

    db.query(sqlCommandes, [req.user.entreprise_id, debut, fin], (err1, rowsCmd) => {
        if (err1) { console.error(err1); return res.status(500).json({ message: 'Erreur serveur' }); }

        db.query(sqlRecettesManuelles, [req.user.entreprise_id, debut, fin], (err2, rowsRec) => {
            if (err2) { console.error(err2); return res.status(500).json({ message: 'Erreur serveur' }); }

            db.query(sqlDepenses, [req.user.entreprise_id, debut, fin], (err3, rowsDep) => {
                if (err3) { console.error(err3); return res.status(500).json({ message: 'Erreur serveur' }); }

                db.query(sqlDepensesParCategorie, [req.user.entreprise_id, debut, fin], (err4, rowsDepCat) => {
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