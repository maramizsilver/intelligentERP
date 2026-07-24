const db = require('../config/db');

exports.getAllAbonnements = async (req, res) => {
    try {
        const { statut, date_debut, date_fin } = req.query;

        let sql = `
            SELECT pa.*, e.nom AS entreprise_nom, e.statut AS entreprise_statut
            FROM paiements_abonnement pa
            LEFT JOIN entreprises e ON pa.email = e.email
            WHERE 1=1
        `;
        const params = [];

        if (statut) {
            sql += ' AND pa.statut = ?';
            params.push(statut);
        }
        if (date_debut) {
            sql += ' AND pa.created_at >= ?';
            params.push(date_debut);
        }
        if (date_fin) {
            sql += ' AND pa.created_at <= ?';
            params.push(date_fin);
        }

        sql += ' ORDER BY pa.created_at DESC';

        const [abonnements] = await db.promisePoolMaster.query(sql, params);

        const [stats] = await db.promisePoolMaster.query(
            `SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'paye' THEN montant ELSE 0 END) AS total_paye,
                SUM(CASE WHEN statut = 'en_attente' THEN montant ELSE 0 END) AS total_attente,
                SUM(CASE WHEN statut = 'echoue' THEN montant ELSE 0 END) AS total_echoue,
                COUNT(CASE WHEN statut = 'paye' THEN 1 END) AS count_paye,
                COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) AS count_attente
            FROM paiements_abonnement`
        );

        res.json({
            abonnements,
            stats: stats[0]
        });
    } catch (err) {
        console.error('Erreur getAllAbonnements:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getAbonnementStats = async (req, res) => {
    try {
        const [revenueByMonth] = await db.promisePoolMaster.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(montant) as total
             FROM paiements_abonnement
             WHERE statut = 'paye'
             AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month DESC`
        );

        const [plans] = await db.promisePoolMaster.query(
            `SELECT 
                plan_type,
                COUNT(*) as total
             FROM entreprises
             GROUP BY plan_type`
        );

        res.json({
            revenue_by_month: revenueByMonth,
            plans: plans
        });
    } catch (err) {
        console.error('Erreur getAbonnementStats:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};