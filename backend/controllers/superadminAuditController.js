const db = require('../config/db');

exports.getGlobalAuditLogs = async (req, res) => {
    try {
        const { limit = 50, offset = 0, entreprise_id, action, module, date_debut, date_fin } = req.query;

        let sql = `
            SELECT al.*, u.nom, u.prenom, u.email, e.nom AS entreprise_nom
            FROM audit_logs al
            LEFT JOIN users u ON al.utilisateur_id = u.id
            LEFT JOIN entreprises e ON al.entreprise_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (entreprise_id) {
            sql += ' AND al.entreprise_id = ?';
            params.push(entreprise_id);
        }
        if (action) {
            sql += ' AND al.action LIKE ?';
            params.push(`%${action}%`);
        }
        if (module) {
            sql += ' AND al.module = ?';
            params.push(module);
        }
        if (date_debut) {
            sql += ' AND al.created_at >= ?';
            params.push(date_debut);
        }
        if (date_fin) {
            sql += ' AND al.created_at <= ?';
            params.push(date_fin);
        }

        sql += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [logs] = await db.promisePoolMaster.query(sql, params);

        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM audit_logs'
        );

        res.json({
            logs,
            total: total[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Erreur getGlobalAuditLogs:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getGlobalConnectionLogs = async (req, res) => {
    try {
        const { limit = 50, offset = 0, entreprise_id, status, email } = req.query;

        let sql = `
            SELECT ac.*, u.nom, u.prenom, u.email, e.nom AS entreprise_nom
            FROM audit_connexions ac
            LEFT JOIN users u ON ac.utilisateur_id = u.id
            LEFT JOIN entreprises e ON u.entreprise_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (entreprise_id) {
            sql += ' AND u.entreprise_id = ?';
            params.push(entreprise_id);
        }
        if (status) {
            sql += ' AND ac.status = ?';
            params.push(status);
        }
        if (email) {
            sql += ' AND ac.email LIKE ?';
            params.push(`%${email}%`);
        }

        sql += ' ORDER BY ac.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [logs] = await db.promisePoolMaster.query(sql, params);

        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM audit_connexions'
        );

        res.json({
            logs,
            total: total[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Erreur getGlobalConnectionLogs:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getGlobalAuditStats = async (req, res) => {
    try {
        const [logsByEntreprise] = await db.promisePoolMaster.query(
            `SELECT e.nom AS entreprise_nom, COUNT(al.id) AS total_logs
             FROM audit_logs al
             JOIN entreprises e ON al.entreprise_id = e.id
             GROUP BY al.entreprise_id
             ORDER BY total_logs DESC
             LIMIT 10`
        );

        const [topActions] = await db.promisePoolMaster.query(
            `SELECT action, COUNT(*) as total
             FROM audit_logs
             GROUP BY action
             ORDER BY total DESC
             LIMIT 10`
        );

        const [topModules] = await db.promisePoolMaster.query(
            `SELECT module, COUNT(*) as total
             FROM audit_logs
             WHERE module IS NOT NULL
             GROUP BY module
             ORDER BY total DESC`
        );

        const [dailyConnexions] = await db.promisePoolMaster.query(
            `SELECT DATE(created_at) as date, COUNT(*) as total
             FROM audit_connexions
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        res.json({
            logs_by_entreprise: logsByEntreprise,
            top_actions: topActions,
            top_modules: topModules,
            daily_connexions: dailyConnexions
        });
    } catch (err) {
        console.error('Erreur getGlobalAuditStats:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};