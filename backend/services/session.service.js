// backend/services/session.service.js
const crypto = require('crypto');
const db = require('../config/db');
const NotificationService = require('./notification.service');

class SessionService {
    
    static generateDeviceFingerprint(req, clientInfo = {}) {
        const data = {
            userAgent: req.headers['user-agent'] || '',
            acceptLanguage: req.headers['accept-language'] || '',
            acceptEncoding: req.headers['accept-encoding'] || '',
            ip: req.ip || req.connection.remoteAddress || '',
            platform: req.headers['sec-ch-ua-platform'] || 'unknown',
            mobile: req.headers['sec-ch-ua-mobile'] || '?0',
            clientId: clientInfo.client_id || '',
            screenResolution: clientInfo.screen_resolution || '',
            timezone: clientInfo.timezone || '',
            language: clientInfo.language || '',
            hardwareConcurrency: clientInfo.hardware_concurrency || '',
            deviceMemory: clientInfo.device_memory || '',
            touchSupport: clientInfo.touch_support || false,
            colorDepth: clientInfo.color_depth || ''
        };
        const jsonString = JSON.stringify(data);
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    static extractDeviceInfo(req, clientInfo = {}) {
        const userAgent = req.headers['user-agent'] || '';
        
        let deviceType = 'desktop';
        if (/mobile/i.test(userAgent) || /android/i.test(userAgent) || /iphone/i.test(userAgent)) {
            deviceType = 'mobile';
        }
        if (/ipad/i.test(userAgent) || /tablet/i.test(userAgent)) {
            deviceType = 'tablet';
        }
        if (clientInfo.device_type) {
            deviceType = clientInfo.device_type;
        }

        let os = 'Unknown';
        let osVersion = null;
        if (/windows nt 10/i.test(userAgent)) { os = 'Windows'; osVersion = '10'; }
        else if (/windows nt 6.3/i.test(userAgent)) { os = 'Windows'; osVersion = '8.1'; }
        else if (/windows nt 6.2/i.test(userAgent)) { os = 'Windows'; osVersion = '8'; }
        else if (/windows nt 6.1/i.test(userAgent)) { os = 'Windows'; osVersion = '7'; }
        else if (/mac os x/i.test(userAgent)) { os = 'macOS'; 
            const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
            if (match) osVersion = match[1].replace(/_/g, '.');
        }
        else if (/linux/i.test(userAgent)) { os = 'Linux'; }
        else if (/android/i.test(userAgent)) { os = 'Android'; 
            const match = userAgent.match(/Android (\d+\.\d+)/);
            if (match) osVersion = match[1];
        }
        else if (/iphone|ipad/i.test(userAgent)) { os = 'iOS'; 
            const match = userAgent.match(/OS (\d+[._]\d+[._]\d+)/);
            if (match) osVersion = match[1].replace(/_/g, '.');
        }
        if (clientInfo.os) os = clientInfo.os;
        if (clientInfo.os_version) osVersion = clientInfo.os_version;

        let browser = 'Unknown';
        let browserVersion = null;
        if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
            browser = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
            if (match) browserVersion = match[1];
        }
        else if (/firefox/i.test(userAgent)) {
            browser = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
            if (match) browserVersion = match[1];
        }
        else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
            browser = 'Safari';
            const match = userAgent.match(/Safari\/(\d+\.\d+)/);
            if (match) browserVersion = match[1];
        }
        else if (/edg/i.test(userAgent)) {
            browser = 'Edge';
            const match = userAgent.match(/Edg\/(\d+\.\d+)/);
            if (match) browserVersion = match[1];
        }
        else if (/opera/i.test(userAgent)) {
            browser = 'Opera';
            const match = userAgent.match(/OPR\/(\d+\.\d+)/);
            if (match) browserVersion = match[1];
        }
        if (clientInfo.browser) browser = clientInfo.browser;
        if (clientInfo.browser_version) browserVersion = clientInfo.browser_version;

        return {
            device_type: deviceType,
            os: os,
            os_version: osVersion,
            browser: browser,
            browser_version: browserVersion,
            user_agent: userAgent,
            screen_resolution: clientInfo.screen_resolution || null,
            language: clientInfo.language || req.headers['accept-language']?.split(',')[0] || null,
            timezone: clientInfo.timezone || null,
            client_id: clientInfo.client_id || null,
            hardware_concurrency: clientInfo.hardware_concurrency || null,
            device_memory: clientInfo.device_memory || null,
            touch_support: clientInfo.touch_support || false,
            color_depth: clientInfo.color_depth || null
        };
    }

    static async getLocationFromIP(ip) {
        try {
            return {
                country: 'Inconnu',
                region: 'Inconnu',
                city: 'Inconnu',
                latitude: null,
                longitude: null,
                isp: 'Inconnu'
            };
        } catch (err) {
            console.error('Erreur geolocalisation:', err);
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

    static async findDeviceByFingerprint(pool, userId, fingerprint) {
        const [rows] = await pool.query(
            'SELECT * FROM user_devices WHERE user_id = ? AND device_fingerprint = ? AND is_blocked = 0',
            [userId, fingerprint]
        );
        return rows[0] || null;
    }

    static async createDevice(pool, userId, deviceInfo, fingerprint) {
        const [result] = await pool.query(
            `INSERT INTO user_devices 
             (user_id, device_fingerprint, device_type, os, os_version, browser, browser_version,
              screen_resolution, language, timezone, client_id, user_agent, last_ip, 
              first_seen_at, last_seen_at, is_trusted, is_blocked)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, 0)`,
            [
                userId, fingerprint, deviceInfo.device_type, deviceInfo.os, deviceInfo.os_version,
                deviceInfo.browser, deviceInfo.browser_version, deviceInfo.screen_resolution,
                deviceInfo.language, deviceInfo.timezone, deviceInfo.client_id,
                deviceInfo.user_agent, deviceInfo.ip_address
            ]
        );
        
        const [device] = await pool.query('SELECT * FROM user_devices WHERE id = ?', [result.insertId]);
        return device[0];
    }

    static async checkSuspiciousActivity(pool, user, device, req, clientInfo = {}) {
        const [previousDevices] = await pool.query(
            'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND id != ? AND is_blocked = 0',
            [user.id, device.id]
        );
        
        const isNewDevice = previousDevices[0].count === 0;
        
        const [previousConnections] = await pool.query(
            'SELECT COUNT(*) as count FROM user_connections WHERE user_id = ? AND device_id = ?',
            [user.id, device.id]
        );
        
        const isFirstConnection = previousConnections[0].count === 0;
        
        if (isNewDevice || isFirstConnection) {
            const location = await this.getLocationFromIP(req.ip);
            
            await this.sendSecurityAlert(user, device, req, location, clientInfo);
            
            await pool.query(
                `INSERT INTO security_alerts 
                 (user_id, device_id, alert_type, severity, description, ip_address, created_at)
                 VALUES (?, ?, 'NEW_DEVICE', 'MEDIUM', ?, ?, NOW())`,
                [
                    user.id, 
                    device.id, 
                    `Nouvel appareil detecte : ${device.device_type} - ${device.os} - ${device.browser}`,
                    req.ip || '0.0.0.0'
                ]
            );
        }
    }

    static async sendSecurityAlert(user, device, req, location, clientInfo = {}) {
        try {
            const userEmail = user.email;
            
            const data = {
                name: user.nom || user.prenom || 'Utilisateur',
                device_type: device.device_type,
                os: device.os,
                browser: device.browser,
                browser_version: device.browser_version,
                ip: req.ip || '0.0.0.0',
                location: location ? `${location.city || ''} ${location.country || ''}`.trim() || 'Localisation inconnue' : 'Localisation inconnue',
                time: new Date().toISOString(),
                screen_resolution: device.screen_resolution,
                language: device.language
            };
            
            await NotificationService.sendLoginAlert({
                user: user,
                entreprise: { nom: user.entreprise_nom || 'ERP' },
                device: device,
                location: location,
                ip: req.ip,
                userEmail: userEmail,
                userPhone: null,
                customData: data
            });
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'alerte email:', error);
        }
    }

    static async recordConnection(clientPool, user, token, req, clientInfo = {}) {
        try {
            console.log('[SESSION] recordConnection - Debut');
            
            const deviceInfo = this.extractDeviceInfo(req, clientInfo);
            deviceInfo.ip_address = req.ip || req.connection.remoteAddress || '0.0.0.0';
            const fingerprint = this.generateDeviceFingerprint(req, clientInfo);

            console.log('[SESSION] Fingerprint:', fingerprint.substring(0, 20) + '...');
            console.log('[SESSION] User ID:', user.id);

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

            let device = await this.findDeviceByFingerprint(db.promisePoolMaster, user.id, fingerprint);
            
            if (!device) {
                device = await this.createDevice(db.promisePoolMaster, user.id, deviceInfo, fingerprint);
            } else {
                await db.promisePoolMaster.query(
                    'UPDATE user_devices SET last_seen_at = NOW(), last_ip = ? WHERE id = ?',
                    [deviceInfo.ip_address, device.id]
                );
            }

            await this.checkSuspiciousActivity(db.promisePoolMaster, user, device, req, clientInfo);

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

            const location = await this.getLocationFromIP(req.ip);

            await db.promisePoolMaster.query(
                `INSERT INTO user_connections 
                 (user_id, ip_address, country, region, city, latitude, longitude, 
                  device_fingerprint, device_type, os, browser, status, risk_level, device_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', 'low', ?)`,
                [user.id, req.ip, location.country, location.region, location.city,
                 location.latitude, location.longitude, fingerprint, 
                 deviceInfo.device_type, deviceInfo.os, deviceInfo.browser, device.id]
            );

            await db.promisePoolMaster.query(
                `INSERT INTO sessions 
                 (user_id, token, device_fingerprint, device_type, os, browser, browser_version,
                  ip_address, country, city, latitude, longitude, is_active, created_at, device_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), ?)`,
                [user.id, token, fingerprint, deviceInfo.device_type, deviceInfo.os,
                 deviceInfo.browser, deviceInfo.browser_version, req.ip, location.country, 
                 location.city, location.latitude, location.longitude, device.id]
            );

            console.log('[SESSION] Session enregistree avec succes');

            return { success: true, previousSessionCount, deviceId: device.id };
        } catch (err) {
            console.error('Erreur recordConnection:', err);
            throw err;
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
            `SELECT s.*, d.device_type, d.os, d.browser, d.screen_resolution, d.language
             FROM sessions s
             LEFT JOIN user_devices d ON s.device_id = d.id
             WHERE s.user_id = ? AND s.is_active = TRUE 
             ORDER BY s.last_activity DESC`,
            [userId]
        );
        return rows;
    }

    static async getUserSessionsWithCurrent(userId, currentToken) {
        const [sessions] = await db.promisePoolMaster.query(
            `SELECT s.*, 
                    d.device_type, d.os, d.browser, d.screen_resolution, d.language,
                    u.nom as user_name, u.email
             FROM sessions s
             LEFT JOIN user_devices d ON s.device_id = d.id
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ? AND s.is_active = 1
             ORDER BY s.created_at DESC`,
            [userId]
        );
        
        return sessions.map(session => ({
            ...session,
            is_current: session.token === currentToken
        }));
    }

    static async revokeOtherSessions(userId, currentToken) {
        const [result] = await db.promisePoolMaster.query(
            'UPDATE sessions SET is_active = 0 WHERE user_id = ? AND token != ? AND is_active = 1',
            [userId, currentToken]
        );
        return result.affectedRows;
    }

    static async reportUnknownSession(userId, sessionId, reason = 'Connexion suspecte', lockAccount = true) {
        const connection = await db.promisePoolMaster.getConnection();
        
        try {
            await connection.beginTransaction();
            
            await connection.query(
                `UPDATE sessions 
                 SET is_reported = 1, reported_at = NOW(), report_reason = ? 
                 WHERE id = ? AND user_id = ?`,
                [reason, sessionId, userId]
            );
            
            await connection.query(
                `UPDATE user_connections 
                 SET is_reported = 1, reported_at = NOW() 
                 WHERE session_id = ? AND user_id = ?`,
                [sessionId, userId]
            );
            
            const [session] = await connection.query(
                'SELECT device_id FROM sessions WHERE id = ?',
                [sessionId]
            );
            
            let deviceBlocked = false;
            if (session[0]?.device_id) {
                await connection.query(
                    'UPDATE user_devices SET is_blocked = 1 WHERE id = ?',
                    [session[0].device_id]
                );
                deviceBlocked = true;
            }
            
            await connection.query(
                'UPDATE sessions SET is_active = 0 WHERE id = ?',
                [sessionId]
            );
            
            let accountLocked = false;
            if (lockAccount) {
                await connection.query(
                    `UPDATE users 
                     SET is_account_locked = 1, 
                         account_lock_reason = ?, 
                         lock_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)
                     WHERE id = ?`,
                    [reason, userId]
                );
                accountLocked = true;
            }
            
            await connection.query(
                `INSERT INTO security_alerts 
                 (user_id, alert_type, severity, description, created_at)
                 VALUES (?, 'SUSPICIOUS_SESSION', 'HIGH', ?, NOW())`,
                [userId, `Session suspecte signalee : ${reason}`]
            );
            
            await connection.commit();
            
            return {
                locked: accountLocked,
                deviceBlocked: deviceBlocked,
                sessionRevoked: true
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async lockAccount(userId, reason = 'Verrouillage par l\'utilisateur') {
        await db.promisePoolMaster.query(
            `UPDATE users 
             SET is_account_locked = 1, 
                 account_lock_reason = ?, 
                 lock_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)
             WHERE id = ?`,
            [reason, userId]
        );
        
        await db.promisePoolMaster.query(
            'UPDATE sessions SET is_active = 0 WHERE user_id = ?',
            [userId]
        );
    }

    static async unlockAccount(userId) {
        await db.promisePoolMaster.query(
            `UPDATE users 
             SET is_account_locked = 0, 
                 account_lock_reason = NULL, 
                 lock_expires_at = NULL
             WHERE id = ?`,
            [userId]
        );
    }

    static async isAccountLocked(userId) {
        const [rows] = await db.promisePoolMaster.query(
            `SELECT is_account_locked, account_lock_reason, lock_expires_at 
             FROM users WHERE id = ?`,
            [userId]
        );
        
        if (rows.length === 0) {
            return { locked: false };
        }
        
        const user = rows[0];
        
        if (user.is_account_locked && user.lock_expires_at) {
            const now = new Date();
            const expiresAt = new Date(user.lock_expires_at);
            
            if (now > expiresAt) {
                await this.unlockAccount(userId);
                return { locked: false };
            }
        }
        
        return {
            locked: !!user.is_account_locked,
            reason: user.account_lock_reason,
            expires_at: user.lock_expires_at
        };
    }

    static async cleanupExpiredSessions() {
        try {
            const [result] = await db.promisePoolMaster.query(
                'UPDATE sessions SET is_active = FALSE WHERE last_activity < DATE_SUB(NOW(), INTERVAL 1 HOUR)'
            );
            if (result.affectedRows > 0) {
                console.log(`[SESSION] ${result.affectedRows} sessions expirees nettoyees`);
            }
            return result.affectedRows;
        } catch (err) {
            console.error('[SESSION] Erreur nettoyage sessions expirees:', err);
            return 0;
        }
    }
}

module.exports = SessionService;