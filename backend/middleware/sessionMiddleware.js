const SessionService = require('../services/session.service');

module.exports = async (req, res, next) => {
    try {
        // Ne pas vérifier pour les routes publiques
        if (req.path.includes('/auth/login') || 
            req.path.includes('/auth/register') || 
            req.path.includes('/auth/mfa')) {
            return next();
        }

        const user = req.user;
        if (!user) {
            return next();
        }

        // EXCLURE LE SUPERADMIN DE LA VERIFICATION DES SESSIONS
        if (user.is_super_admin) {
            console.log('[SESSION] SuperAdmin - Pas de verification de session');
            return next();
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return next();
        }

        // Verifier si la session existe et est active (dans la MASTER)
        const hasSession = await SessionService.hasActiveSession(user.id, token);
        
        if (!hasSession) {
            console.log('[SESSION] Session invalide ou expiree pour user:', user.id);
            return res.status(401).json({
                message: 'Session invalide ou expiree. Veuillez vous reconnecter.',
                code: 'INVALID_SESSION'
            });
        }

        // Mettre à jour la derniere activite
        await SessionService.updateSessionActivity(user.id, token);

        next();
    } catch (err) {
        console.error('Erreur sessionMiddleware:', err);
        next();
    }
};