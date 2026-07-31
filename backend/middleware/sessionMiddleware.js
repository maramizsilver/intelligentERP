const SessionService = require('../services/session.service');

module.exports = async (req, res, next) => {
    try {
        if (req.path.includes('/auth/login') || 
            req.path.includes('/auth/register') || 
            req.path.includes('/auth/mfa')) {
            return next();
        }

        const user = req.user;
        if (!user) {
            return next();
        }

        if (user.is_super_admin) {
            console.log('[SESSION] SuperAdmin - Pas de verification de session');
            return next();
        }

        const accountLock = await SessionService.isAccountLocked(user.id);
        if (accountLock.locked) {
            return res.status(423).json({
                message: 'Compte verrouille - contactez le support',
                code: 'ACCOUNT_LOCKED',
                reason: accountLock.reason,
                expires_at: accountLock.expires_at
            });
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return next();
        }

        const hasSession = await SessionService.hasActiveSession(user.id, token);
        
        if (!hasSession) {
            console.log('[SESSION] Session invalide ou expiree pour user:', user.id);
            return res.status(401).json({
                message: 'Session invalide ou expiree. Veuillez vous reconnecter.',
                code: 'INVALID_SESSION'
            });
        }

        await SessionService.updateSessionActivity(user.id, token);

        next();
    } catch (err) {
        console.error('Erreur sessionMiddleware:', err);
        next();
    }
};