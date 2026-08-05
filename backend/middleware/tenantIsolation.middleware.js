// Middleware de vérification d'isolation multi-tenant
const { getClientPool } = require('../config/db');

/**
 * Vérifie que l'utilisateur a accès à la base tenant
 */
const ensureTenantAccess = async (req, res, next) => {
    try {
        const companyId = req.user?.company_id || req.user?.entreprise_id;
        const dbName = req.tenant?.dbName;

        if (!companyId || !dbName) {
            return res.status(401).json({ 
                message: 'Accès non autorisé : informations tenant manquantes' 
            });
        }

        // Tenter de se connecter à la base tenant
        try {
            const pool = getClientPool(companyId, dbName);
            await pool.promise().query('SELECT 1');
        } catch (dbError) {
            console.error('Erreur connexion tenant:', dbError);
            return res.status(500).json({ 
                message: 'Erreur de connexion à la base de données' 
            });
        }

        next();
    } catch (error) {
        console.error('Erreur ensureTenantAccess:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = ensureTenantAccess;