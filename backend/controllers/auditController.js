const AuditService = require('../services/audit.service');

exports.getLogs = async (req, res) => {
    const {
        utilisateur_id,
        module,
        action,
        date_debut,
        date_fin,
        limit = 50,
        offset = 0
    } = req.query;

    try {
        const logs = await AuditService.getLogs({
            utilisateur_id,
            module,
            action,
            date_debut,
            date_fin,
            limit,
            offset
        });

        const db = require('../config/db');
        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM audit_logs'
        );

        res.json({ 
            logs, 
            total: total[0]?.total || 0 
        });
    } catch (err) {
        console.error('Erreur getLogs:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getConnexions = async (req, res) => {
    const {
        email,
        status,
        date_debut,
        date_fin,
        limit = 50,
        offset = 0
    } = req.query;

    try {
        const logs = await AuditService.getConnexions({
            email,
            status,
            date_debut,
            date_fin,
            limit,
            offset
        });

        const db = require('../config/db');
        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM audit_connexions'
        );

        res.json({ 
            logs, 
            total: total[0]?.total || 0 
        });
    } catch (err) {
        console.error('Erreur getConnexions:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getOperations = async (req, res) => {
    const {
        utilisateur_id,
        operation,
        table_name,
        date_debut,
        date_fin,
        limit = 50,
        offset = 0
    } = req.query;

    try {
        const logs = await AuditService.getOperations({
            utilisateur_id,
            operation,
            table_name,
            date_debut,
            date_fin,
            limit,
            offset
        });

        const db = require('../config/db');
        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM audit_operations'
        );

        res.json({ 
            logs, 
            total: total[0]?.total || 0 
        });
    } catch (err) {
        console.error('Erreur getOperations:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.getAuditStats = async (req, res) => {
    try {
        const db = require('../config/db');
        
        const [totalLogs] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM audit_logs'
        );
        
        const [logsByModule] = await db.promisePoolMaster.query(
            'SELECT module, COUNT(*) as total FROM audit_logs GROUP BY module ORDER BY total DESC'
        );

        const [connexionsByStatus] = await db.promisePoolMaster.query(
            'SELECT status, COUNT(*) as total FROM audit_connexions GROUP BY status'
        );

        const [recentLogs] = await db.promisePoolMaster.query(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10'
        );

        res.json({
            total_logs: totalLogs[0]?.total || 0,
            logs_by_module: logsByModule,
            connexions_by_status: connexionsByStatus,
            recent_activities: recentLogs
        });
    } catch (err) {
        console.error('Erreur getAuditStats:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};