//
const AuditService = require('../services/audit.service');

// ============================================================
// RÉCUPÉRER LES LOGS
// ============================================================
exports.getLogs = async (req, res) => {
    const db = req.db;
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
        const logs = await AuditService.getLogs(db, {
            utilisateur_id,
            module,
            action,
            date_debut,
            date_fin,
            limit,
            offset
        });

        res.json({ logs, total: logs.length });
    } catch (err) {
        console.error('❌ Erreur getLogs:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ============================================================
// RÉCUPÉRER LES LOGS DE CONNEXION
// ============================================================
exports.getConnexions = async (req, res) => {
    const db = req.db;
    const {
        email,
        status,
        date_debut,
        date_fin,
        limit = 50,
        offset = 0
    } = req.query;

    try {
        const logs = await AuditService.getConnexions(db, {
            email,
            status,
            date_debut,
            date_fin,
            limit,
            offset
        });

        res.json({ logs, total: logs.length });
    } catch (err) {
        console.error('❌ Erreur getConnexions:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ============================================================
// RÉCUPÉRER LES OPÉRATIONS CRUD
// ============================================================
exports.getOperations = async (req, res) => {
    const db = req.db;
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
        const logs = await AuditService.getOperations(db, {
            utilisateur_id,
            operation,
            table_name,
            date_debut,
            date_fin,
            limit,
            offset
        });

        res.json({ logs, total: logs.length });
    } catch (err) {
        console.error('❌ Erreur getOperations:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ============================================================
// STATISTIQUES D'AUDIT
// ============================================================
exports.getAuditStats = async (req, res) => {
    const db = req.db;

    try {
        // Nombre total de logs
        const [totalLogs] = await db.promise().query('SELECT COUNT(*) as total FROM audit_logs');
        
        // Logs par module
        const [logsByModule] = await db.promise().query(
            'SELECT module, COUNT(*) as total FROM audit_logs GROUP BY module ORDER BY total DESC'
        );

        // Connexions par statut
        const [connexionsByStatus] = await db.promise().query(
            'SELECT status, COUNT(*) as total FROM audit_connexions GROUP BY status'
        );

        // Dernières activités
        const [recentLogs] = await db.promise().query(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10'
        );

        res.json({
            total_logs: totalLogs[0]?.total || 0,
            logs_by_module: logsByModule,
            connexions_by_status: connexionsByStatus,
            recent_activities: recentLogs
        });
    } catch (err) {
        console.error('❌ Erreur getAuditStats:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};