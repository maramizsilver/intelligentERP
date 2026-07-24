const db = require('../config/db');

exports.getAllowedInterventions = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const [interventions] = await db.promisePoolMaster.query(
            `SELECT i.*, u.nom, u.prenom, u.email, e.nom AS entreprise_nom
             FROM interventions i
             LEFT JOIN users u ON i.superadmin_id = u.id
             LEFT JOIN entreprises e ON i.entreprise_id = e.id
             ORDER BY i.created_at DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM interventions'
        );

        res.json({ interventions, total: total[0].total });
    } catch (err) {
        console.error('Erreur getAllowedInterventions:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createIntervention = async (req, res) => {
    try {
        const { entreprise_id, motif, action, details } = req.body;

        if (!entreprise_id || !motif || !action) {
            return res.status(400).json({ message: 'entreprise_id, motif et action sont requis' });
        }

        const [entreprise] = await db.promisePoolMaster.query(
            'SELECT id, nom FROM entreprises WHERE id = ?',
            [entreprise_id]
        );

        if (entreprise.length === 0) {
            return res.status(404).json({ message: 'Entreprise introuvable' });
        }

        await db.promisePoolMaster.query(
            `INSERT INTO interventions 
             (entreprise_id, superadmin_id, motif, action, details, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [entreprise_id, req.user.id, motif, action, details || null]
        );

        res.status(201).json({ message: 'Intervention enregistree avec succes' });
    } catch (err) {
        console.error('Erreur createIntervention:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.resolveIntervention = async (req, res) => {
    try {
        const { id } = req.params;

        await db.promisePoolMaster.query(
            'UPDATE interventions SET resolved_at = NOW(), resolved_by = ? WHERE id = ?',
            [req.user.id, id]
        );

        res.json({ message: 'Intervention resolue avec succes' });
    } catch (err) {
        console.error('Erreur resolveIntervention:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};