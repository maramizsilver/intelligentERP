
const AuditService = require('../services/audit.service');

module.exports = function auditMiddleware(req, res, next) {
    if (req.method === 'GET' && !req.path.includes('/auth/logout')) {
        return next();
    }

    const originalBody = { ...req.body };
    const originalSend = res.send;

    res.send = function(data) {
        try {
            const db = req.db;
            const isAuthRoute = req.path.includes('/auth/login') || req.path.includes('/auth/logout');
            
            let dbToUse = db;
            if (!dbToUse && isAuthRoute) {
                const masterDb = require('../config/db');
                dbToUse = masterDb;
            }

            if (!dbToUse) {
                return originalSend.call(this, data);
            }

            const userId = req.user?.id || null;
            const entrepriseId = req.user?.entreprise_id || null;
            
            let action = `${req.method} ${req.path}`;
            let module = 'Authentification';
            let status = res.statusCode < 400 ? 'success' : 'error';
            let email = req.body?.email || req.user?.email || null;

            if (req.path.includes('/auth/logout')) {
                action = 'Deconnexion';
                email = req.user?.email || null;
                
                AuditService.logConnexion(dbToUse, {
                    utilisateur_id: userId,
                    email: email,
                    ip: req.ip || req.connection.remoteAddress,
                    user_agent: req.headers['user-agent'],
                    status: 'deconnexion'
                }).catch(err => console.error('Erreur log deconnexion:', err));
            }

            if (req.path.includes('/auth/login')) {
                module = 'Authentification';
                try {
                    const responseData = JSON.parse(data);
                    if (responseData?.user?.email) {
                        email = responseData.user.email;
                    }
                } catch (e) {}
                
                const connexionStatus = status === 'success' ? 'success' : 'failed';
                const userEmail = email || req.body?.email || null;
                
                AuditService.logConnexion(dbToUse, {
                    utilisateur_id: userId,
                    email: userEmail,
                    ip: req.ip || req.connection.remoteAddress,
                    user_agent: req.headers['user-agent'],
                    status: connexionStatus
                }).catch(err => console.error('Erreur log connexion:', err));
            }

            if (req.method !== 'GET') {
                const details = {
                    path: req.path,
                    method: req.method,
                    body: originalBody,
                    query: req.query,
                    params: req.params,
                    statusCode: res.statusCode,
                    email: email
                };

                AuditService.logAction(dbToUse, {
                    utilisateur_id: userId,
                    entreprise_id: entrepriseId || null,
                    action: action,
                    module: module,
                    details: details,
                    ip: req.ip || req.connection.remoteAddress,
                    user_agent: req.headers['user-agent'],
                    status: status
                }).catch(err => console.error('Erreur audit:', err));
            }

        } catch (err) {
            console.error('Erreur audit middleware:', err);
        }

        originalSend.call(this, data);
    };

    next();
};