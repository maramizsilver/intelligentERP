// backend/controllers/tauxReferenceAdminController.js
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler.middleware');
// GET - Tous les taux de référence (SuperAdmin)
exports.getAllTauxAdmin = (req, res, next) => {
    const { categorie, actif } = req.query;
    let sql = 'SELECT * FROM taux_reference_central WHERE 1=1';
    const params = [];

    if (categorie) {
        sql += ' AND categorie = ?';
        params.push(categorie);
    }
    if (actif !== undefined) {
        sql += ' AND actif = ?';
        params.push(actif === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY categorie, date_debut DESC';

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return next(new AppError('Erreur lors du chargement des taux', 500));
        }
        res.json({ taux: results });
    });
};
// GET - Un taux par ID (SuperAdmin)
exports.getTauxAdminById = (req, res, next) => {
    const { id } = req.params;
    db.query(
        'SELECT * FROM taux_reference_central WHERE id = ?',
        [id],
        (err, results) => {
            if (err) {
                console.error(err);
                return next(new AppError('Erreur lors du chargement du taux', 500));
            }
            if (results.length === 0) {
                return next(new AppError('Taux de référence introuvable', 404));
            }
            res.json({ taux: results[0] });
        }
    );
};
// POST - Créer un taux de référence (SuperAdmin)
exports.createTauxAdmin = (req, res, next) => {
    const { 
        categorie, sous_categorie, nom, description, 
        taux, date_debut, date_fin, actif 
    } = req.body;
    if (!categorie) {
        return next(new AppError('La catégorie est requise', 400));
    }
    if (!date_debut || !date_fin) {
        return next(new AppError('Les dates de début et fin sont requises', 400));
    }
    if (taux === undefined || taux === null || isNaN(taux) || taux < 0) {
        return next(new AppError('Le taux doit être un nombre positif', 400));
    }
    if (new Date(date_debut) >= new Date(date_fin)) {
        return next(new AppError('La date de début doit être antérieure à la date de fin', 400));
    }

    // Vérifier les chevauchements
    const checkSql = `
        SELECT * FROM taux_reference_central 
        WHERE categorie = ? 
        AND actif = TRUE 
        AND date_debut <= ? 
        AND date_fin >= ?
    `;
    db.query(checkSql, [categorie, date_fin, date_debut], (errCheck, overlapping) => {
        if (errCheck) {
            console.error(errCheck);
            return next(new AppError('Erreur lors de la vérification des chevauchements', 500));
        }
        if (overlapping.length > 0) {
            return next(new AppError(
                `Une période chevauche déjà cette catégorie (${overlapping[0].nom || 'sans nom'})`,
                400
            ));
        }

        const sql = `
            INSERT INTO taux_reference_central 
            (categorie, sous_categorie, nom, description, taux, date_debut, date_fin, actif, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [
            categorie,
            sous_categorie || null,
            nom || null,
            description || null,
            parseFloat(taux),
            date_debut,
            date_fin,
            actif !== undefined ? (actif ? 1 : 0) : 1,
            req.user.id
        ], (err, result) => {
            if (err) {
                console.error(err);
                return next(new AppError('Erreur lors de la création du taux', 500));
            }

            // Audit
            db.query(
                `INSERT INTO taux_reference_audit (taux_id, action, nouvelles_valeurs, modified_by)
                 VALUES (?, 'CREATE', ?, ?)`,
                [result.insertId, JSON.stringify(req.body), req.user.id],
                () => {}
            );

            res.status(201).json({ 
                message: 'Taux de référence créé avec succès', 
                id: result.insertId 
            });
        });
    });
};
// PUT - Mettre à jour un taux (SuperAdmin)
exports.updateTauxAdmin = (req, res, next) => {
    const { id } = req.params;
    const { 
        categorie, sous_categorie, nom, description, 
        taux, date_debut, date_fin, actif 
    } = req.body;

    // Récupérer l'ancien taux pour l'audit
    db.query(
        'SELECT * FROM taux_reference_central WHERE id = ?',
        [id],
        (errSel, ancien) => {
            if (errSel) {
                console.error(errSel);
                return next(new AppError('Erreur lors du chargement du taux', 500));
            }
            if (ancien.length === 0) {
                return next(new AppError('Taux de référence introuvable', 404));
            }

            // Validation
            if (categorie && new Date(date_debut) >= new Date(date_fin)) {
                return next(new AppError('La date de début doit être antérieure à la date de fin', 400));
            }

            const sql = `
                UPDATE taux_reference_central SET
                    categorie = COALESCE(?, categorie),
                    sous_categorie = ?,
                    nom = ?,
                    description = ?,
                    taux = COALESCE(?, taux),
                    date_debut = COALESCE(?, date_debut),
                    date_fin = COALESCE(?, date_fin),
                    actif = COALESCE(?, actif),
                    updated_by = ?,
                    version = version + 1
                WHERE id = ?
            `;
            db.query(sql, [
                categorie,
                sous_categorie || null,
                nom || null,
                description || null,
                taux !== undefined ? parseFloat(taux) : null,
                date_debut,
                date_fin,
                actif !== undefined ? (actif ? 1 : 0) : null,
                req.user.id,
                id
            ], (err, result) => {
                if (err) {
                    console.error(err);
                    return next(new AppError('Erreur lors de la mise à jour du taux', 500));
                }
                if (result.affectedRows === 0) {
                    return next(new AppError('Taux de référence introuvable', 404));
                }

                // Audit
                const nouvellesValeurs = { categorie, sous_categorie, nom, description, taux, date_debut, date_fin, actif };
                db.query(
                    `INSERT INTO taux_reference_audit (taux_id, action, anciennes_valeurs, nouvelles_valeurs, modified_by)
                     VALUES (?, 'UPDATE', ?, ?, ?)`,
                    [id, JSON.stringify(ancien[0]), JSON.stringify(nouvellesValeurs), req.user.id],
                    () => {}
                );

                res.json({ message: 'Taux de référence mis à jour avec succès' });
            });
        }
    );
};
// DELETE - Supprimer un taux (SuperAdmin)
exports.deleteTauxAdmin = (req, res, next) => {
    const { id } = req.params;

    // Récupérer le taux pour l'audit
    db.query(
        'SELECT * FROM taux_reference_central WHERE id = ?',
        [id],
        (errSel, taux) => {
            if (errSel) {
                console.error(errSel);
                return next(new AppError('Erreur lors du chargement du taux', 500));
            }
            if (taux.length === 0) {
                return next(new AppError('Taux de référence introuvable', 404));
            }

            db.query(
                'DELETE FROM taux_reference_central WHERE id = ?',
                [id],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return next(new AppError('Erreur lors de la suppression du taux', 500));
                    }

                    // Audit
                    db.query(
                        `INSERT INTO taux_reference_audit (taux_id, action, anciennes_valeurs, modified_by)
                         VALUES (?, 'DELETE', ?, ?)`,
                        [id, JSON.stringify(taux[0]), req.user.id],
                        () => {}
                    );

                    res.json({ message: 'Taux de référence supprimé avec succès' });
                }
            );
        }
    );
};

// PUT - Activer/Désactiver un taux (SuperAdmin)
exports.toggleTauxAdmin = (req, res, next) => {
    const { id } = req.params;
    const { actif } = req.body;

    if (actif === undefined) {
        return next(new AppError('Le paramètre actif est requis', 400));
    }

    // Récupérer l'ancien taux pour l'audit
    db.query(
        'SELECT * FROM taux_reference_central WHERE id = ?',
        [id],
        (errSel, taux) => {
            if (errSel) {
                console.error(errSel);
                return next(new AppError('Erreur lors du chargement du taux', 500));
            }
            if (taux.length === 0) {
                return next(new AppError('Taux de référence introuvable', 404));
            }

            db.query(
                'UPDATE taux_reference_central SET actif = ?, updated_by = ? WHERE id = ?',
                [actif ? 1 : 0, req.user.id, id],
                (err) => {
                    if (err) {
                        console.error(err);
                        return next(new AppError('Erreur lors de la mise à jour du taux', 500));
                    }

                    const action = actif ? 'ACTIVATE' : 'DEACTIVATE';
                    db.query(
                        `INSERT INTO taux_reference_audit (taux_id, action, anciennes_valeurs, nouvelles_valeurs, modified_by)
                         VALUES (?, ?, ?, ?, ?)`,
                        [id, action, JSON.stringify({ actif: taux[0].actif }), JSON.stringify({ actif }), req.user.id],
                        () => {}
                    );

                    res.json({ 
                        message: `Taux ${actif ? 'activé' : 'désactivé'} avec succès` 
                    });
                }
            );
        }
    );
};