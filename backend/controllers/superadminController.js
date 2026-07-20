const db = require('../config/db');

/**
 * Récupérer toutes les sessions actives
 */
exports.getActiveSessions = async (req, res) => {
    try {
        const [sessions] = await db.promisePoolMaster.query(
            `SELECT s.*, u.nom, u.prenom, u.email, e.nom AS entreprise_nom,
                    (SELECT COUNT(*) FROM sessions WHERE user_id = s.user_id AND is_active = TRUE) as user_session_count
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             JOIN entreprises e ON u.entreprise_id = e.id
             WHERE s.is_active = TRUE
             ORDER BY s.last_activity DESC`
        );

        res.json({ sessions });
    } catch (err) {
        console.error('Erreur getActiveSessions:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Récupérer l'historique des connexions
 */
exports.getConnectionHistory = async (req, res) => {
    try {
        const { limit = 50, offset = 0, user_id, entreprise_id } = req.query;

        let sql = `
            SELECT c.*, u.nom, u.prenom, u.email, e.nom AS entreprise_nom
            FROM user_connections c
            JOIN users u ON c.user_id = u.id
            JOIN entreprises e ON u.entreprise_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (user_id) {
            sql += ' AND c.user_id = ?';
            params.push(user_id);
        }
        if (entreprise_id) {
            sql += ' AND u.entreprise_id = ?';
            params.push(entreprise_id);
        }

        sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [connections] = await db.promisePoolMaster.query(sql, params);

        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM user_connections'
        );

        res.json({
            connections,
            total: total[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Erreur getConnectionHistory:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Déconnecter un utilisateur à distance
 */
exports.revokeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Récupérer les infos de la session
        const [session] = await db.promisePoolMaster.query(
            'SELECT user_id FROM sessions WHERE id = ?',
            [sessionId]
        );

        if (session.length === 0) {
            return res.status(404).json({ message: 'Session introuvable' });
        }

        await db.promisePoolMaster.query(
            'UPDATE sessions SET is_active = FALSE WHERE id = ?',
            [sessionId]
        );

        // Journaliser l'action
        console.log(`[AUDIT] SuperAdmin ${req.user.id} a déconnecté la session ${sessionId} (utilisateur ${session[0].user_id})`);

        res.json({ message: 'Session révoquée avec succès' });
    } catch (err) {
        console.error('Erreur revokeSession:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Bloquer un appareil
 */
exports.blockDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { reason } = req.body;

        // Récupérer le fingerprint de l'appareil
        const [device] = await db.promisePoolMaster.query(
            'SELECT device_fingerprint, user_id FROM user_devices WHERE id = ?',
            [deviceId]
        );

        if (device.length === 0) {
            return res.status(404).json({ message: 'Appareil introuvable' });
        }

        // Bloquer l'appareil
        await db.promisePoolMaster.query(
            'UPDATE user_devices SET is_blocked = TRUE WHERE id = ?',
            [deviceId]
        );

        // Déconnecter toutes les sessions de cet appareil
        await db.promisePoolMaster.query(
            `UPDATE sessions SET is_active = FALSE 
             WHERE device_fingerprint = ? AND user_id = ?`,
            [device[0].device_fingerprint, device[0].user_id]
        );

        console.log(`[AUDIT] SuperAdmin ${req.user.id} a bloqué l'appareil ${deviceId} - Raison: ${reason || 'Non spécifiée'}`);

        res.json({ message: 'Appareil bloqué avec succès' });
    } catch (err) {
        console.error('Erreur blockDevice:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Récupérer les alertes de sécurité
 */
exports.getSecurityAlerts = async (req, res) => {
    try {
        const { limit = 50, offset = 0, severity, is_read } = req.query;

        let sql = `
            SELECT a.*, u.nom, u.prenom, u.email, e.nom AS entreprise_nom
            FROM security_alerts a
            JOIN users u ON a.user_id = u.id
            JOIN entreprises e ON u.entreprise_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (severity) {
            sql += ' AND a.severity = ?';
            params.push(severity);
        }
        if (is_read !== undefined) {
            sql += ' AND a.is_read = ?';
            params.push(is_read === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [alerts] = await db.promisePoolMaster.query(sql, params);

        const [total] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM security_alerts'
        );

        res.json({
            alerts,
            total: total[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Erreur getSecurityAlerts:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Marquer une alerte comme lue
 */
exports.markAlertRead = async (req, res) => {
    try {
        const { alertId } = req.params;

        await db.promisePoolMaster.query(
            'UPDATE security_alerts SET is_read = TRUE WHERE id = ?',
            [alertId]
        );

        res.json({ message: 'Alerte marquée comme lue' });
    } catch (err) {
        console.error('Erreur markAlertRead:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Résoudre une alerte
 */
exports.resolveAlert = async (req, res) => {
    try {
        const { alertId } = req.params;

        await db.promisePoolMaster.query(
            'UPDATE security_alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE id = ?',
            [alertId]
        );

        res.json({ message: 'Alerte résolue avec succès' });
    } catch (err) {
        console.error('Erreur resolveAlert:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * Statistiques de sécurité
 */
exports.getSecurityStats = async (req, res) => {
    try {
        // Nombre d'alertes par sévérité
        const [bySeverity] = await db.promisePoolMaster.query(
            `SELECT severity, COUNT(*) as total 
             FROM security_alerts 
             GROUP BY severity`
        );

        // Nombre de sessions actives
        const [activeSessions] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM sessions WHERE is_active = TRUE'
        );

        // Nombre d'appareils bloqués
        const [blockedDevices] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM user_devices WHERE is_blocked = TRUE'
        );

        // Nombre de connexions par jour (7 derniers jours)
        const [dailyConnections] = await db.promisePoolMaster.query(
            `SELECT DATE(created_at) as date, COUNT(*) as total 
             FROM user_connections 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        res.json({
            alerts_by_severity: bySeverity,
            active_sessions: activeSessions[0].total,
            blocked_devices: blockedDevices[0].total,
            total_alerts: bySeverity.reduce((sum, s) => sum + s.total, 0),
            daily_connections: dailyConnections
        });
    } catch (err) {
        console.error('Erreur getSecurityStats:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};