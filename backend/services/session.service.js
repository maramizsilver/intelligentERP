const crypto = require('crypto');
const db = require('../config/db');


class SessionService {
    
    static generateDeviceFingerprint(req) {
        const data = {
            userAgent: req.headers['user-agent'] || '',
            acceptLanguage: req.headers['accept-language'] || '',
            acceptEncoding: req.headers['accept-encoding'] || '',
            ip: req.ip || req.connection.remoteAddress || '',
            platform: req.headers['sec-ch-ua-platform'] || 'unknown',
            mobile: req.headers['sec-ch-ua-mobile'] || '?0'
        };
        const jsonString = JSON.stringify(data);
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    static extractDeviceInfo(req) {
        const userAgent = req.headers['user-agent'] || '';
        
        let deviceType = 'ordinateur';
        let os = 'Inconnu';
        let browser = 'Inconnu';

        if (/mobile/i.test(userAgent) || /android/i.test(userAgent) || /iphone/i.test(userAgent)) {
            deviceType = 'smartphone';
        }
        if (/ipad/i.test(userAgent) || /tablet/i.test(userAgent)) {
            deviceType = 'tablette';
        }

        if (/windows/i.test(userAgent)) os = 'Windows';
        else if (/mac os/i.test(userAgent)) os = 'macOS';
        else if (/linux/i.test(userAgent)) os = 'Linux';
        else if (/android/i.test(userAgent)) os = 'Android';
        else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';

        if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) browser = 'Chrome';
        else if (/firefox/i.test(userAgent)) browser = 'Firefox';
        else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
        else if (/edg/i.test(userAgent)) browser = 'Edge';
        else if (/opera/i.test(userAgent)) browser = 'Opera';

        return {
            device_type: deviceType,
            os: os,
            browser: browser,
            user_agent: userAgent
        };
    }

    static async getLocationFromIP(ip) {
        try {
            return {
                country: 'Tunisie',
                region: 'Tunis',
                city: 'Tunis',
                latitude: 36.8065,
                longitude: 10.1815,
                isp: 'TopNet'
            };
        } catch (err) {
            return {
                country: 'Inconnu',
                region: 'Inconnu',
                city: 'Inconnu',
                latitude: null,
                longitude: null,
                isp: 'Inconnu'
            };
        }
    }

    static async recordConnection(clientPool, user, token, req) {
        try {
            console.log('[SESSION] recordConnection - Debut');
            const fingerprint = this.generateDeviceFingerprint(req);
            const deviceInfo = this.extractDeviceInfo(req);
            const location = await this.getLocationFromIP(req.ip);

            console.log('[SESSION] Fingerprint:', fingerprint.substring(0, 20) + '...');
            console.log('[SESSION] User ID:', user.id);

            // 1. Verifier si l'appareil est bloque (dans la MASTER)
            const [blocked] = await db.promisePoolMaster.query(
                'SELECT id FROM user_devices WHERE user_id = ? AND device_fingerprint = ? AND is_blocked = TRUE',
                [user.id, fingerprint]
            );

            if (blocked.length > 0) {
                await db.promisePoolMaster.query(
                    `INSERT INTO user_connections 
                     (user_id, status, ip_address, device_fingerprint, device_type, os, browser)
                     VALUES (?, 'blocked', ?, ?, ?, ?, ?)`,
                    [user.id, req.ip, fingerprint, deviceInfo.device_type, deviceInfo.os, deviceInfo.browser]
                );
                throw new Error('DEVICE_BLOCKED');
            }

            await db.promisePoolMaster.query(
                `INSERT INTO user_devices 
                 (user_id, device_fingerprint, device_type, os, browser, last_used)
                 VALUES (?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                 last_used = NOW(), 
                 device_type = VALUES(device_type),
                 os = VALUES(os),
                 browser = VALUES(browser)`,
                [user.id, fingerprint, deviceInfo.device_type, deviceInfo.os, deviceInfo.browser]
            );

            const [sessions] = await db.promisePoolMaster.query(
                'SELECT id, token FROM sessions WHERE user_id = ? AND is_active = TRUE',
                [user.id]
            );

            let previousSessionCount = 0;
            for (const session of sessions) {
                if (session.token !== token) {
                    await db.promisePoolMaster.query(
                        'UPDATE sessions SET is_active = FALSE WHERE id = ?',
                        [session.id]
                    );
                    previousSessionCount++;
                }
            }

            if (previousSessionCount > 0) {
                console.log('[SESSION] Anciennes sessions deconnectees:', previousSessionCount);
            }

            // 4. Enregistrer la connexion (dans la MASTER)
            await db.promisePoolMaster.query(
                `INSERT INTO user_connections 
                 (user_id, ip_address, country, region, city, latitude, longitude, 
                  device_fingerprint, device_type, os, browser, status, risk_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', 'low')`,
                [user.id, req.ip, location.country, location.region, location.city,
                 location.latitude, location.longitude, fingerprint, 
                 deviceInfo.device_type, deviceInfo.os, deviceInfo.browser]
            );

            // 5. Enregistrer la session (dans la MASTER)
            await db.promisePoolMaster.query(
                `INSERT INTO sessions 
                 (user_id, token, device_fingerprint, device_type, os, browser, 
                  ip_address, country, city, latitude, longitude, is_active, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
                [user.id, token, fingerprint, deviceInfo.device_type, deviceInfo.os,
                 deviceInfo.browser, req.ip, location.country, location.city,
                 location.latitude, location.longitude]
            );

            console.log('[SESSION] Session enregistree avec succes');

            // 6. Verifier les activites suspectes
            await this.checkSuspiciousActivity(user.id, fingerprint, location, req, previousSessionCount);

            return { success: true, previousSessionCount };
        } catch (err) {
            console.error('Erreur recordConnection:', err);
            throw err;
        }
    }

    static async checkSuspiciousActivity(userId, fingerprint, location, req, previousSessionCount) {
        // Verifier les connexions depuis un pays inhabituel (dans la MASTER)
        const [previous] = await db.promisePoolMaster.query(
            'SELECT country FROM user_connections WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        if (previous.length > 0) {
            const countries = previous.map(p => p.country);
            if (!countries.includes(location.country) && location.country !== 'Inconnu') {
                await db.promisePoolMaster.query(
                    `INSERT INTO security_alerts 
                     (user_id, alert_type, severity, message, details)
                     VALUES (?, 'new_country', 'medium', 
                             'Connexion depuis un pays non reconnu', ?)`,
                    [userId, JSON.stringify({ 
                        ip: req.ip, 
                        country: location.country,
                        city: location.city,
                        time: new Date().toISOString()
                    })]
                );
                console.log('[SESSION] Alerte: nouveau pays -', location.country);
            }
        }

        // Verifier les connexions simultanees
        if (previousSessionCount > 1) {
            await db.promisePoolMaster.query(
                `INSERT INTO security_alerts 
                 (user_id, alert_type, severity, message, details)
                 VALUES (?, 'multiple_sessions', 'high', 
                         'Connexions simultanees detectees', ?)`,
                [userId, JSON.stringify({ 
                    sessions_count: previousSessionCount,
                    time: new Date().toISOString()
                })]
            );
            console.log('[SESSION] Alerte: connexions simultanees -', previousSessionCount);
        }
    }

    static async hasActiveSession(userId, token) {
        const [rows] = await db.promisePoolMaster.query(
            'SELECT id FROM sessions WHERE user_id = ? AND token = ? AND is_active = TRUE',
            [userId, token]
        );
        return rows.length > 0;
    }

    static async updateSessionActivity(userId, token) {
        await db.promisePoolMaster.query(
            'UPDATE sessions SET last_activity = NOW() WHERE user_id = ? AND token = ?',
            [userId, token]
        );
    }

    static async logoutAllSessions(userId) {
        await db.promisePoolMaster.query(
            'UPDATE sessions SET is_active = FALSE WHERE user_id = ?',
            [userId]
        );
        console.log('[SESSION] Toutes les sessions deconnectees pour l\'utilisateur:', userId);
    }

    static async getActiveSessions(userId) {
        const [rows] = await db.promisePoolMaster.query(
            'SELECT * FROM sessions WHERE user_id = ? AND is_active = TRUE ORDER BY last_activity DESC',
            [userId]
        );
        return rows;
    }

    static async getActiveSessionsAll() {
        const [rows] = await db.promisePoolMaster.query(
            `SELECT s.*, u.nom, u.prenom, u.email, e.nom AS entreprise_nom,
                    (SELECT COUNT(*) FROM sessions WHERE user_id = s.user_id AND is_active = TRUE) as user_session_count
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             JOIN entreprises e ON u.entreprise_id = e.id
             WHERE s.is_active = TRUE
             ORDER BY s.last_activity DESC`
        );
        return rows;
    }

    static async revokeSession(sessionId) {
        await db.promisePoolMaster.query(
            'UPDATE sessions SET is_active = FALSE WHERE id = ?',
            [sessionId]
        );
        console.log('[SESSION] Session revoquee:', sessionId);
    }

    static async blockDevice(deviceId, reason) {
        const [device] = await db.promisePoolMaster.query(
            'SELECT device_fingerprint, user_id FROM user_devices WHERE id = ?',
            [deviceId]
        );

        if (device.length === 0) {
            throw new Error('Appareil introuvable');
        }

        await db.promisePoolMaster.query(
            'UPDATE user_devices SET is_blocked = TRUE WHERE id = ?',
            [deviceId]
        );

        await db.promisePoolMaster.query(
            `UPDATE sessions SET is_active = FALSE 
             WHERE device_fingerprint = ? AND user_id = ?`,
            [device[0].device_fingerprint, device[0].user_id]
        );

        console.log('[SESSION] Appareil bloque:', deviceId, '- Raison:', reason || 'Non specifiee');
        return device[0];
    }

    static async getSecurityAlerts(filters = {}) {
        const { limit = 50, offset = 0, severity, is_read } = filters;

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

        return { alerts, total: total[0].total };
    }

    static async resolveAlert(alertId) {
        await db.promisePoolMaster.query(
            'UPDATE security_alerts SET is_resolved = TRUE, resolved_at = NOW() WHERE id = ?',
            [alertId]
        );
        console.log('[SESSION] Alerte resolue:', alertId);
    }

    static async getSecurityStats() {
        const [bySeverity] = await db.promisePoolMaster.query(
            `SELECT severity, COUNT(*) as total 
             FROM security_alerts 
             GROUP BY severity`
        );

        const [activeSessions] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM sessions WHERE is_active = TRUE'
        );

        const [blockedDevices] = await db.promisePoolMaster.query(
            'SELECT COUNT(*) as total FROM user_devices WHERE is_blocked = TRUE'
        );

        const [dailyConnections] = await db.promisePoolMaster.query(
            `SELECT DATE(created_at) as date, COUNT(*) as total 
             FROM user_connections 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        return {
            alerts_by_severity: bySeverity,
            active_sessions: activeSessions[0].total,
            blocked_devices: blockedDevices[0].total,
            total_alerts: bySeverity.reduce((sum, s) => sum + s.total, 0),
            daily_connections: dailyConnections
        };
    }
}

module.exports = SessionService;