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
            console.error('[SESSION] Erreur geolocalisation:', err);
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
        try {
            const [rows] = await pool.query(
                'SELECT * FROM user_devices WHERE user_id = ? AND device_fingerprint = ? AND is_blocked = 0',
                [userId, fingerprint]
            );
            console.log('[SESSION] findDeviceByFingerprint - rows trouvees:', rows.length);
            return rows[0] || null;
        } catch (err) {
            console.error('[SESSION] Erreur findDeviceByFingerprint:', err);
            return null;
        }
    }

    static async createDevice(pool, userId, deviceInfo, fingerprint) {
        try {
            console.log('[SESSION] createDevice - Creation nouvel appareil pour user:', userId);
            
            const [result] = await pool.query(
                `INSERT INTO user_devices 
                 (user_id, device_fingerprint, device_name, device_type, os, os_version, browser, browser_version,
                  screen_resolution, language, timezone, client_id, last_ip, 
                  first_seen_at, last_seen_at, is_trusted, is_blocked)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, 0)`,
                [
                    userId, 
                    fingerprint, 
                    deviceInfo.user_agent || 'Appareil inconnu',
                    deviceInfo.device_type, 
                    deviceInfo.os, 
                    deviceInfo.os_version,
                    deviceInfo.browser, 
                    deviceInfo.browser_version,
                    deviceInfo.screen_resolution,
                    deviceInfo.language, 
                    deviceInfo.timezone, 
                    deviceInfo.client_id,
                    deviceInfo.ip_address
                ]
            );
            
            console.log('[SESSION] createDevice - Appareil cree avec ID:', result.insertId);
            
            const [device] = await pool.query('SELECT * FROM user_devices WHERE id = ?', [result.insertId]);
            return device[0];
        } catch (err) {
            console.error('[SESSION] Erreur createDevice:', err);
            console.error('[SESSION] SQL Error:', err.sql);
            throw err;
        }
    }

    static async checkSuspiciousActivity(pool, user, device, req, clientInfo = {}) {
        try {
            console.log('[SESSION] checkSuspiciousActivity - Debut pour user:', user.id);
            
            const [previousDevices] = await pool.query(
                'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND id != ? AND is_blocked = 0',
                [user.id, device.id]
            );
            
            const isNewDevice = previousDevices[0].count === 0;
            console.log('[SESSION] checkSuspiciousActivity - isNewDevice:', isNewDevice);
            
            const [previousConnections] = await pool.query(
                'SELECT COUNT(*) as count FROM user_connections WHERE user_id = ? AND device_id = ?',
                [user.id, device.id]
            );
            
            const isFirstConnection = previousConnections[0].count === 0;
            console.log('[SESSION] checkSuspiciousActivity - isFirstConnection:', isFirstConnection);
            
            if (isNewDevice || isFirstConnection) {
                console.log('[SESSION] checkSuspiciousActivity - Activite suspecte detectee!');
                
                const location = await this.getLocationFromIP(req.ip);
                
                await this.sendSecurityAlert(user, device, req, location, clientInfo);
                
                await pool.query(
                    `INSERT INTO security_alerts 
                     (user_id, alert_type, severity, description, ip_address, created_at)
                     VALUES (?, 'NEW_DEVICE', 'MEDIUM', ?, ?, NOW())`,
                    [
                        user.id, 
                        `Nouvel appareil detecte : ${device.device_type} - ${device.os} - ${device.browser}`,
                        req.ip || '0.0.0.0'
                    ]
                );
                console.log('[SESSION] checkSuspiciousActivity - Alerte de securite creee avec succes');
            }
        } catch (err) {
            console.error('[SESSION] Erreur checkSuspiciousActivity:', err);
        }
    }

    static async sendSecurityAlert(user, device, req, location, clientInfo = {}) {
        try {
            console.log('[SESSION] sendSecurityAlert - Debut');
            console.log('[SESSION] sendSecurityAlert - User email:', user.email);
            
            const userEmail = user.email;
            if (!userEmail) {
                console.error('[SESSION] sendSecurityAlert - Aucun email pour l\'utilisateur');
                return;
            }
            
            const data = {
                name: user.nom || user.prenom || 'Utilisateur',
                device_type: device.device_type || 'Inconnu',
                os: device.os || 'Inconnu',
                browser: device.browser || 'Inconnu',
                browser_version: device.browser_version || 'N/A',
                ip: req.ip || '0.0.0.0',
                location: location ? `${location.city || ''} ${location.country || ''}`.trim() || 'Localisation inconnue' : 'Localisation inconnue',
                time: new Date().toISOString(),
                screen_resolution: device.screen_resolution || 'N/A',
                language: device.language || 'N/A'
            };
            
            console.log('[SESSION] sendSecurityAlert - Data:', JSON.stringify(data, null, 2));
            
            const result = await NotificationService.sendLoginAlert({
                user: user,
                entreprise: { nom: user.entreprise_nom || 'ERP' },
                device: device,
                location: location,
                ip: req.ip,
                userEmail: userEmail,
                userPhone: null,
                customData: data
            });
            
            console.log('[SESSION] sendSecurityAlert - Resultat envoi:', result);
            console.log('[SESSION] Alerte email envoyee a:', userEmail);
        } catch (error) {
            console.error('[SESSION] Erreur lors de l\'envoi de l\'alerte email:', error);
        }
    }

    static async recordConnection(clientPool, user, token, req, clientInfo = {}) {
        try {
            console.log('[SESSION] ====================================');
            console.log('[SESSION] recordConnection - Debut');
            console.log('[SESSION] ====================================');
            
            const deviceInfo = this.extractDeviceInfo(req, clientInfo);
            deviceInfo.ip_address = req.ip || req.connection.remoteAddress || '0.0.0.0';
            const fingerprint = this.generateDeviceFingerprint(req, clientInfo);

            console.log('[SESSION] Fingerprint:', fingerprint.substring(0, 30) + '...');
            console.log('[SESSION] User ID:', user.id);
            console.log('[SESSION] Token:', token.substring(0, 30) + '...');
            console.log('[SESSION] Device Type:', deviceInfo.device_type);
            console.log('[SESSION] OS:', deviceInfo.os);
            console.log('[SESSION] Browser:', deviceInfo.browser);

            const [blocked] = await db.promisePoolMaster.query(
                'SELECT id FROM user_devices WHERE user_id = ? AND device_fingerprint = ? AND is_blocked = TRUE',
                [user.id, fingerprint]
            );

            if (blocked.length > 0) {
                console.log('[SESSION] ERREUR: Appareil bloque pour user:', user.id);
                await db.promisePoolMaster.query(
                    `INSERT INTO user_connections 
                     (user_id, status, ip_address, device_fingerprint, device_type, os, browser)
                     VALUES (?, 'blocked', ?, ?, ?, ?, ?)`,
                    [user.id, req.ip, fingerprint, deviceInfo.device_type, deviceInfo.os, deviceInfo.browser]
                );
                throw new Error('DEVICE_BLOCKED');
            }

            console.log('[SESSION] Recherche de l\'appareil...');
            let device = await this.findDeviceByFingerprint(db.promisePoolMaster, user.id, fingerprint);
            
            if (!device) {
                console.log('[SESSION] Appareil non trouve, creation...');
                device = await this.createDevice(db.promisePoolMaster, user.id, deviceInfo, fingerprint);
                console.log('[SESSION] Nouvel appareil cree ID:', device.id);
            } else {
                console.log('[SESSION] Appareil existant trouve ID:', device.id);
                await db.promisePoolMaster.query(
                    'UPDATE user_devices SET last_seen_at = NOW(), last_ip = ? WHERE id = ?',
                    [deviceInfo.ip_address, device.id]
                );
                console.log('[SESSION] Appareil mis a jour');
            }

            await this.checkSuspiciousActivity(db.promisePoolMaster, user, device, req, clientInfo);

            console.log('[SESSION] Desactivation de TOUTES les anciennes sessions...');
            const [sessions] = await db.promisePoolMaster.query(
                'SELECT id, token FROM sessions WHERE user_id = ? AND is_active = TRUE',
                [user.id]
            );
            console.log('[SESSION] Sessions actives trouvees:', sessions.length);

            let previousSessionCount = 0;
            for (const session of sessions) {
                console.log('[SESSION] Desactivation session ID:', session.id);
                await db.promisePoolMaster.query(
                    'UPDATE sessions SET is_active = FALSE WHERE id = ?',
                    [session.id]
                );
                previousSessionCount++;
            }

            if (previousSessionCount > 0) {
                console.log('[SESSION] Anciennes sessions deconnectees:', previousSessionCount);
            }

            console.log('[SESSION] Creation de la NOUVELLE session...');
            const location = await this.getLocationFromIP(req.ip);

            const [connectionResult] = await db.promisePoolMaster.query(
                `INSERT INTO user_connections 
                 (user_id, ip_address, country, region, city, latitude, longitude, 
                  device_fingerprint, device_type, os, browser, status, risk_level, device_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success', 'low', ?)`,
                [user.id, req.ip, location.country, location.region, location.city,
                 location.latitude, location.longitude, fingerprint, 
                 deviceInfo.device_type, deviceInfo.os, deviceInfo.browser, device.id]
            );
            console.log('[SESSION] Connexion enregistree ID:', connectionResult.insertId);

            const [sessionResult] = await db.promisePoolMaster.query(
                `INSERT INTO sessions 
                 (user_id, token, device_fingerprint, device_type, os, browser, browser_version,
                  ip_address, country, city, latitude, longitude, is_active, created_at, device_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)`,
                [user.id, token, fingerprint, deviceInfo.device_type, deviceInfo.os,
                 deviceInfo.browser, deviceInfo.browser_version, req.ip, location.country, 
                 location.city, location.latitude, location.longitude, device.id]
            );

            console.log('[SESSION] NOUVELLE SESSION CREE AVEC ID:', sessionResult.insertId);
            console.log('[SESSION] is_active = 1');
            
            const [verify] = await db.promisePoolMaster.query(
                'SELECT id, is_active FROM sessions WHERE id = ?',
                [sessionResult.insertId]
            );
            console.log('[SESSION] VERIFICATION - is_active =', verify[0].is_active);

            console.log('[SESSION] ====================================');

            return { 
                success: true, 
                previousSessionCount, 
                deviceId: device.id,
                sessionId: sessionResult.insertId,
                connectionId: connectionResult.insertId
            };
        } catch (err) {
            console.error('[SESSION] ERREUR recordConnection:', err);
            console.error('[SESSION] Stack:', err.stack);
            throw err;
        }
    }

    static async hasActiveSession(userId, token) {
        try {
            console.log('[SESSION] hasActiveSession - User ID:', userId);
            console.log('[SESSION] hasActiveSession - Token:', token.substring(0, 30) + '...');
            
            const [rows] = await db.promisePoolMaster.query(
                'SELECT id, is_active FROM sessions WHERE user_id = ? AND token = ?',
                [userId, token]
            );
            
            console.log('[SESSION] hasActiveSession - Resultat:', rows.length > 0 ? 'TROUVEE (is_active=' + rows[0].is_active + ')' : 'NON TROUVEE');
            return rows.length > 0 && rows[0].is_active === 1;
        } catch (err) {
            console.error('[SESSION] Erreur hasActiveSession:', err);
            return false;
        }
    }

    static async updateSessionActivity(userId, token) {
        try {
            await db.promisePoolMaster.query(
                'UPDATE sessions SET last_activity = NOW() WHERE user_id = ? AND token = ?',
                [userId, token]
            );
            console.log('[SESSION] updateSessionActivity - OK pour user:', userId);
        } catch (err) {
            console.error('[SESSION] Erreur updateSessionActivity:', err);
        }
    }

    static async logoutAllSessions(userId) {
        try {
            await db.promisePoolMaster.query(
                'UPDATE sessions SET is_active = FALSE WHERE user_id = ?',
                [userId]
            );
            console.log('[SESSION] Toutes les sessions deconnectees pour l\'utilisateur:', userId);
        } catch (err) {
            console.error('[SESSION] Erreur logoutAllSessions:', err);
        }
    }

    static async getActiveSessions(userId) {
        try {
            const [rows] = await db.promisePoolMaster.query(
                `SELECT s.*, d.device_type, d.os, d.browser, d.screen_resolution, d.language
                 FROM sessions s
                 LEFT JOIN user_devices d ON s.device_id = d.id
                 WHERE s.user_id = ? AND s.is_active = TRUE 
                 ORDER BY s.last_activity DESC`,
                [userId]
            );
            return rows;
        } catch (err) {
            console.error('[SESSION] Erreur getActiveSessions:', err);
            return [];
        }
    }

    static async getUserSessionsWithCurrent(userId, currentToken) {
        try {
            console.log('[SESSION] getUserSessionsWithCurrent - User ID:', userId);
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
            
            console.log('[SESSION] getUserSessionsWithCurrent - Sessions trouvees:', sessions.length);
            
            return sessions.map(session => ({
                ...session,
                is_current: session.token === currentToken
            }));
        } catch (err) {
            console.error('[SESSION] Erreur getUserSessionsWithCurrent:', err);
            return [];
        }
    }

    static async revokeOtherSessions(userId, currentToken) {
        try {
            console.log('[SESSION] revokeOtherSessions - User ID:', userId);
            const [result] = await db.promisePoolMaster.query(
                'UPDATE sessions SET is_active = 0 WHERE user_id = ? AND token != ? AND is_active = 1',
                [userId, currentToken]
            );
            console.log('[SESSION] revokeOtherSessions - Sessions revoquees:', result.affectedRows);
            return result.affectedRows;
        } catch (err) {
            console.error('[SESSION] Erreur revokeOtherSessions:', err);
            return 0;
        }
    }

    static async reportUnknownSession(userId, sessionId, reason = 'Connexion suspecte', lockAccount = true) {
        const connection = await db.promisePoolMaster.getConnection();
        
        try {
            console.log('[SESSION] reportUnknownSession - User ID:', userId, 'Session ID:', sessionId);
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
                console.log('[SESSION] Appareil bloque ID:', session[0].device_id);
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
                console.log('[SESSION] Compte verrouille:', userId);
            }
            
            await connection.query(
                `INSERT INTO security_alerts 
                 (user_id, alert_type, severity, description, created_at)
                 VALUES (?, 'SUSPICIOUS_SESSION', 'HIGH', ?, NOW())`,
                [userId, `Session suspecte signalee : ${reason}`]
            );
            
            await connection.commit();
            console.log('[SESSION] reportUnknownSession - Termine avec succes');
            
            return {
                locked: accountLocked,
                deviceBlocked: deviceBlocked,
                sessionRevoked: true
            };
        } catch (error) {
            await connection.rollback();
            console.error('[SESSION] Erreur reportUnknownSession:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async lockAccount(userId, reason = 'Verrouillage par l\'utilisateur') {
        try {
            console.log('[SESSION] lockAccount - User ID:', userId, 'Reason:', reason);
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
            console.log('[SESSION] Compte verrouille avec succes:', userId);
        } catch (err) {
            console.error('[SESSION] Erreur lockAccount:', err);
        }
    }

    static async unlockAccount(userId) {
        try {
            console.log('[SESSION] unlockAccount - User ID:', userId);
            await db.promisePoolMaster.query(
                `UPDATE users 
                 SET is_account_locked = 0, 
                     account_lock_reason = NULL, 
                     lock_expires_at = NULL
                 WHERE id = ?`,
                [userId]
            );
            console.log('[SESSION] Compte deverrouille avec succes:', userId);
        } catch (err) {
            console.error('[SESSION] Erreur unlockAccount:', err);
        }
    }

    static async isAccountLocked(userId) {
        try {
            console.log('[SESSION] isAccountLocked - User ID:', userId);
            const [rows] = await db.promisePoolMaster.query(
                `SELECT is_account_locked, account_lock_reason, lock_expires_at 
                 FROM users WHERE id = ?`,
                [userId]
            );
            
            if (rows.length === 0) {
                console.log('[SESSION] isAccountLocked - Utilisateur non trouve');
                return { locked: false };
            }
            
            const user = rows[0];
            console.log('[SESSION] isAccountLocked - is_account_locked:', user.is_account_locked);
            
            if (user.is_account_locked && user.lock_expires_at) {
                const now = new Date();
                const expiresAt = new Date(user.lock_expires_at);
                
                if (now > expiresAt) {
                    console.log('[SESSION] isAccountLocked - Verrouillage expire, deverrouillage automatique');
                    await this.unlockAccount(userId);
                    return { locked: false };
                }
            }
            
            return {
                locked: !!user.is_account_locked,
                reason: user.account_lock_reason,
                expires_at: user.lock_expires_at
            };
        } catch (err) {
            console.error('[SESSION] Erreur isAccountLocked:', err);
            return { locked: false };
        }
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