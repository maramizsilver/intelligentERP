const AuditService = require('../services/audit.service');

/**
 * Middleware qui journalise automatiquement les requêtes
 * À placer après tenantMiddleware
 */
module.exports = function auditMiddleware(req, res, next) {
    // On ne logge pas les requêtes GET (trop de bruit)
    // et on ne logge pas /auth/login (déjà loggé)
    if (req.method === 'GET' || req.path === '/auth/login') {
        return next();
    }

    // Sauvegarder le body original pour comparaison
    const originalBody = { ...req.body };

    // Intercepter la réponse
    const originalSend = res.send;
    res.send = function(data) {
        // Journaliser après l'envoi de la réponse
        try {
            const db = req.db;
            if (!db) return originalSend.call(this, data);

            const userId = req.user?.id || null;
            const entrepriseId = req.user?.entreprise_id || null;
            const action = `${req.method} ${req.path}`;
            const module = req.path.split('/')[1] || 'unknown';

            // Détails
            const details = {
                path: req.path,
                method: req.method,
                body: originalBody,
                query: req.query,
                params: req.params,
                statusCode: res.statusCode
            };

            // Status
            const status = res.statusCode < 400 ? 'success' : 'error';

            AuditService.logAction(db, {
                utilisateur_id: userId,
                entreprise_id: entrepriseId,
                action,
                module,
                details,
                ip: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent'],
                status
            }).catch(err => console.error(' Erreur audit:', err));

        } catch (err) {
            console.error('Erreur audit middleware:', err);
        }

        originalSend.call(this, data);
    };

    next();
};