const { AppError } = require('../middleware/errorHandler.middleware');
const ExportService = require('../services/export.service');

function calculerNbJours(dateDebut, dateFin) {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
}

function arrondir(valeur) {
    return Math.round(valeur * 100) / 100;
}

exports.getTauxReference = (req, res, next) => {
    const db = req.db;
    
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
            console.error('Erreur getTauxReference:', err);
            return next(new AppError('Erreur lors du chargement des taux', 500));
        }
        res.json({ taux: results });
    });
};

exports.calculTauxUnique = (req, res, next) => {
    const db = req.db;
    
    const { montant, date_debut, date_fin, taux } = req.body;

    if (!montant || isNaN(montant) || montant <= 0) {
        return next(new AppError('Le montant doit etre un nombre positif', 400));
    }
    if (!date_debut || !date_fin) {
        return next(new AppError('Les dates de debut et fin sont requises', 400));
    }
    if (!taux || isNaN(taux) || taux < 0) {
        return next(new AppError('Le taux doit etre un nombre positif ou nul', 400));
    }

    try {
        const nbJours = calculerNbJours(date_debut, date_fin);
        const resultat = Number(montant) * (Number(taux) / 100) * (nbJours / 365);
        const arrondi = arrondir(resultat);

        const sqlLog = `
            INSERT INTO logs_calculs 
            (utilisateur_id, type_calcul, type_calcul_detaille, 
             montant, taux, nb_jours, resultat, details)
            VALUES (?, 'taux_unique', 'taux_unique', ?, ?, ?, ?, ?)
        `;
        db.query(sqlLog, [
            req.user.id,
            Number(montant),
            Number(taux),
            nbJours,
            arrondi,
            JSON.stringify({ date_debut, date_fin })
        ], (err) => {
            if (err) console.error('Erreur log calcul:', err);
        });

        res.json({
            cas: 'taux_unique',
            montant: Number(montant),
            date_debut: formatDate(date_debut),
            date_fin: formatDate(date_fin),
            date_debut_raw: date_debut,
            date_fin_raw: date_fin,
            taux: Number(taux),
            nbJours,
            resultat_brut: resultat,
            resultat: arrondi,
            base_jours: 365
        });

    } catch (err) {
        console.error('Erreur calculTauxUnique:', err);
        return next(new AppError('Erreur lors du calcul', 500));
    }
};

exports.calculTauxVariables = (req, res, next) => {
    const db = req.db;
    
    const { montant, periodes } = req.body;

    if (!montant || isNaN(montant) || montant <= 0) {
        return next(new AppError('Le montant doit etre un nombre positif', 400));
    }
    if (!Array.isArray(periodes) || periodes.length === 0) {
        return next(new AppError('Au moins une periode est requise', 400));
    }

    try {
        const details = periodes.map((p, index) => {
            const nbJours = calculerNbJours(p.date_debut, p.date_fin);
            const resultat = Number(montant) * (Number(p.taux) / 100) * (nbJours / 365);
            return {
                periode: index + 1,
                date_debut: formatDate(p.date_debut),
                date_fin: formatDate(p.date_fin),
                date_debut_raw: p.date_debut,
                date_fin_raw: p.date_fin,
                nbJours,
                taux: Number(p.taux),
                resultat_brut: resultat,
                resultat: arrondir(resultat)
            };
        });

        const total = details.reduce((sum, d) => sum + d.resultat, 0);

        const sqlLog = `
            INSERT INTO logs_calculs 
            (utilisateur_id, type_calcul, type_calcul_detaille,
             montant, nb_jours, resultat, details)
            VALUES (?, 'taux_variables_manuel', 'taux_variable', ?, ?, ?, ?)
        `;
        db.query(sqlLog, [
            req.user.id,
            Number(montant),
            details.reduce((sum, d) => sum + d.nbJours, 0),
            arrondir(total),
            JSON.stringify(details)
        ], (err) => {
            if (err) console.error('Erreur log calcul:', err);
        });

        res.json({
            cas: 'taux_variables_manuel',
            montant: Number(montant),
            base_jours: 365,
            details,
            total_brut: total,
            total: arrondir(total)
        });

    } catch (err) {
        console.error('Erreur calculTauxVariables:', err);
        return next(new AppError('Erreur lors du calcul', 500));
    }
};

exports.calculTauxVariablesAuto = (req, res, next) => {
    const db = req.db;
    
    const { montant, date_debut, date_fin, categorie, sous_categorie } = req.body;

    if (!montant || isNaN(montant) || montant <= 0) {
        return next(new AppError('Le montant doit etre un nombre positif', 400));
    }
    if (!date_debut || !date_fin) {
        return next(new AppError('Les dates de debut et fin sont requises', 400));
    }
    if (!categorie) {
        return next(new AppError('La categorie est requise', 400));
    }

    let sql = `
        SELECT * FROM taux_reference_central
        WHERE categorie = ? AND actif = TRUE
    `;
    const params = [categorie];

    if (sous_categorie) {
        sql += ' AND sous_categorie = ?';
        params.push(sous_categorie);
    }

    sql += ' ORDER BY date_debut ASC';

    db.query(sql, params, (err, tauxRefs) => {
        if (err) {
            console.error('Erreur recuperation taux:', err);
            return next(new AppError('Erreur lors de la recuperation des taux', 500));
        }

        if (tauxRefs.length === 0) {
            return next(new AppError(
                `Aucun taux de reference trouve pour la categorie "${categorie}"`,
                404
            ));
        }

        try {
            const dateDebut = new Date(date_debut);
            const dateFin = new Date(date_fin);

            const tauxApplicables = tauxRefs.filter(t => {
                const tDebut = new Date(t.date_debut);
                const tFin = new Date(t.date_fin);
                return tDebut <= dateFin && tFin >= dateDebut;
            });

            if (tauxApplicables.length === 0) {
                return next(new AppError(
                    'Aucun taux applicable sur la periode demandee',
                    404
                ));
            }

            const details = tauxApplicables.map((t, index) => {
                const debut = new Date(Math.max(new Date(date_debut), new Date(t.date_debut)));
                const fin = new Date(Math.min(new Date(date_fin), new Date(t.date_fin)));
                const nbJours = calculerNbJours(
                    debut.toISOString().slice(0, 10),
                    fin.toISOString().slice(0, 10)
                );
                const resultat = Number(montant) * (Number(t.taux) / 100) * (nbJours / 365);

                return {
                    periode: index + 1,
                    date_debut: formatDate(t.date_debut),
                    date_fin: formatDate(t.date_fin),
                    date_debut_raw: t.date_debut,
                    date_fin_raw: t.date_fin,
                    nbJours,
                    taux: Number(t.taux),
                    reference: t.nom || `Taux #${t.id}`,
                    resultat_brut: resultat,
                    resultat: arrondir(resultat)
                };
            });

            const total = details.reduce((sum, d) => sum + d.resultat, 0);

            const sqlLog = `
                INSERT INTO logs_calculs 
                (utilisateur_id, type_calcul, type_calcul_detaille,
                 montant, nb_jours, resultat, details, taux_reference_used)
                VALUES (?, 'taux_variables_auto', 'taux_variable', ?, ?, ?, ?, ?)
            `;
            db.query(sqlLog, [
                req.user.id,
                Number(montant),
                details.reduce((sum, d) => sum + d.nbJours, 0),
                arrondir(total),
                JSON.stringify({ categorie, sous_categorie, details }),
                JSON.stringify(tauxRefs.map(t => ({ id: t.id, nom: t.nom, taux: t.taux })))
            ], (err) => {
                if (err) console.error('Erreur log calcul:', err);
            });

            res.json({
                cas: 'taux_variables_auto',
                montant: Number(montant),
                base_jours: 365,
                categorie,
                sous_categorie: sous_categorie || null,
                details,
                total_brut: total,
                total: arrondir(total)
            });

        } catch (err) {
            console.error('Erreur calculTauxVariablesAuto:', err);
            return next(new AppError('Erreur lors du calcul', 500));
        }
    });
};

exports.getHistoriqueTauxUnique = (req, res, next) => {
    const db = req.db;
    
    const { limit = 50, offset = 0 } = req.query;

    const sql = `
        SELECT l.*, u.nom, u.prenom
        FROM logs_calculs l
        LEFT JOIN users u ON l.utilisateur_id = u.id
        WHERE l.type_calcul_detaille = 'taux_unique'
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
    `;
    db.query(sql, [parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) {
            console.error('Erreur getHistoriqueTauxUnique:', err);
            return next(new AppError('Erreur lors du chargement de l\'historique', 500));
        }

        db.query(
            'SELECT COUNT(*) AS total FROM logs_calculs WHERE type_calcul_detaille = ?',
            ['taux_unique'],
            (err2, countResult) => {
                if (err2) {
                    console.error('Erreur comptage historique:', err2);
                    return next(new AppError('Erreur lors du comptage', 500));
                }
                res.json({
                    historique: results,
                    total: countResult[0].total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                });
            }
        );
    });
};

exports.getHistoriqueTauxVariable = (req, res, next) => {
    const db = req.db;
    
    const { limit = 50, offset = 0 } = req.query;

    const sql = `
        SELECT l.*, u.nom, u.prenom
        FROM logs_calculs l
        LEFT JOIN users u ON l.utilisateur_id = u.id
        WHERE l.type_calcul_detaille = 'taux_variable'
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
    `;
    db.query(sql, [parseInt(limit), parseInt(offset)], (err, results) => {
        if (err) {
            console.error('Erreur getHistoriqueTauxVariable:', err);
            return next(new AppError('Erreur lors du chargement de l\'historique', 500));
        }

        db.query(
            'SELECT COUNT(*) AS total FROM logs_calculs WHERE type_calcul_detaille = ?',
            ['taux_variable'],
            (err2, countResult) => {
                if (err2) {
                    console.error('Erreur comptage historique:', err2);
                    return next(new AppError('Erreur lors du comptage', 500));
                }
                res.json({
                    historique: results,
                    total: countResult[0].total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                });
            }
        );
    });
};

exports.calculSimple = (req, res, next) => {
    const db = req.db;
    
    const { montant, taux, nb_jours } = req.body;

    if (!montant || isNaN(montant) || montant <= 0) {
        return next(new AppError('Montant invalide', 400));
    }
    if (!taux || isNaN(taux) || taux < 0) {
        return next(new AppError('Taux invalide', 400));
    }
    if (!nb_jours || isNaN(nb_jours) || nb_jours <= 0) {
        return next(new AppError('Nombre de jours invalide', 400));
    }

    const resultat = Number(montant) * (Number(taux) / 100) * (Number(nb_jours) / 365);
    res.json({
        resultat: arrondir(resultat),
        base_jours: 365,
        nb_jours: Number(nb_jours)
    });
};