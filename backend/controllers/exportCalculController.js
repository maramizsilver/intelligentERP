const { AppError } = require('../middleware/errorHandler.middleware');
const ExportService = require('../services/export.service');

// EXPORTER UN CALCUL EN COURS (body reçu)
exports.exporterCalculPDF = async (req, res, next) => {
    const { data, type_rapport = 'detaille' } = req.body;

    if (!data) {
        return next(new AppError('Données de calcul manquantes', 400));
    }

    try {
        console.log(' Export PDF demandé...');
        const buffer = await ExportService.exportPDF(data, {
            type: type_rapport,
            title: 'Rapport de calcul'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=calcul-${Date.now()}.pdf`);
        res.send(buffer);

    } catch (err) {
        console.error(' Erreur export PDF:', err);
        return next(new AppError('Erreur lors de la génération du PDF: ' + err.message, 500));
    }
};

// EXPORTER UN CALCUL EN WORD

exports.exporterCalculWord = async (req, res, next) => {
    const { data, type_rapport = 'detaille' } = req.body;

    if (!data) {
        return next(new AppError('Données de calcul manquantes', 400));
    }

    try {
        console.log(' Export Word demandé...');
        console.log('Data reçue:', JSON.stringify(data, null, 2));

        const buffer = await ExportService.exportWord(data, {
            type: type_rapport,
            title: 'Rapport de calcul'
        });

        console.log('Word généré, taille:', buffer.length);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=calcul-${Date.now()}.docx`);
        res.send(buffer);

    } catch (err) {
        console.error(' Erreur export Word:', err);
        console.error('Stack:', err.stack);
        return next(new AppError('Erreur lors de la génération du document Word: ' + err.message, 500));
    }
};

// EXPORTER UNE ENTRÉE D'HISTORIQUE EN PDF
exports.exporterHistoriquePDF = async (req, res, next) => {
    const db = req.db;
    
    const { id } = req.params;
    const { type_rapport = 'detaille' } = req.query;

    db.query(
        'SELECT * FROM logs_calculs WHERE id = ? AND entreprise_id = ?',
        [id, req.user.entreprise_id],
        async (err, results) => {
            if (err) {
                console.error(' Erreur exporterHistoriquePDF:', err);
                return next(new AppError('Erreur lors du chargement de l\'historique', 500));
            }
            if (results.length === 0) {
                return next(new AppError('Entrée d\'historique introuvable', 404));
            }

            const log = results[0];
            let data = {
                montant: log.montant,
                taux: log.taux,
                resultat: log.resultat,
                nbJours: log.nb_jours
            };

            if (log.type_calcul !== 'taux_unique') {
                try {
                    const details = JSON.parse(log.details);
                    data.details = details;
                    data.total = log.resultat;
                } catch (e) {
                    // Silencieux
                }
            }

            try {
                const buffer = await ExportService.exportPDF(data, {
                    type: type_rapport,
                    title: `Rapport de calcul - ${log.type_calcul}`
                });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=historique-${id}-${Date.now()}.pdf`);
                res.send(buffer);

            } catch (err) {
                console.error(' Erreur export PDF:', err);
                return next(new AppError('Erreur lors de la génération du PDF', 500));
            }
        }
    );
};

// EXPORTER UNE ENTRÉE D'HISTORIQUE EN WORD

exports.exporterHistoriqueWord = async (req, res, next) => {
    const db = req.db;
    
    const { id } = req.params;
    const { type_rapport = 'detaille' } = req.query;

    db.query(
        'SELECT * FROM logs_calculs WHERE id = ? AND entreprise_id = ?',
        [id, req.user.entreprise_id],
        async (err, results) => {
            if (err) {
                console.error(' Erreur exporterHistoriqueWord:', err);
                return next(new AppError('Erreur lors du chargement de l\'historique', 500));
            }
            if (results.length === 0) {
                return next(new AppError('Entrée d\'historique introuvable', 404));
            }

            const log = results[0];
            let data = {
                montant: log.montant,
                taux: log.taux,
                resultat: log.resultat,
                nbJours: log.nb_jours
            };

            if (log.type_calcul !== 'taux_unique') {
                try {
                    const details = JSON.parse(log.details);
                    data.details = details;
                    data.total = log.resultat;
                } catch (e) {
                    // Silencieux
                }
            }

            try {
                const buffer = await ExportService.exportWord(data, {
                    type: type_rapport,
                    title: `Rapport de calcul - ${log.type_calcul}`
                });

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename=historique-${id}-${Date.now()}.docx`);
                res.send(buffer);

            } catch (err) {
                console.error(' Erreur export Word:', err);
                return next(new AppError('Erreur lors de la génération du document Word', 500));
            }
        }
    );
};