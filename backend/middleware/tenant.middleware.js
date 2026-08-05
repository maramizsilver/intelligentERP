// backend/middleware/tenant.middleware.js
const masterDb = require('../config/db');
const { getClientPool } = masterDb;

const dbNameCache = new Map();
const CACHE_TTL_MS = parseInt(process.env.TENANT_CACHE_TTL_MS || '60000', 10);

function getCachedDbName(entrepriseId) {
  const entry = dbNameCache.get(entrepriseId);
  if (entry && entry.expiresAt > Date.now()) return entry.dbName;
  if (entry) dbNameCache.delete(entrepriseId);
  return null;
}

function setCachedDbName(entrepriseId, dbName) {
  dbNameCache.set(entrepriseId, { dbName, expiresAt: Date.now() + CACHE_TTL_MS });
}

module.exports = function tenantMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  if (req.user.is_super_admin) {
    req.db = masterDb;
    return next();
  }

  const entrepriseId = req.user.entreprise_id || req.user.company_id;
  if (!entrepriseId) {
    return res.status(400).json({ message: 'Aucune entreprise associée à ce compte' });
  }

  const cachedDbName = getCachedDbName(entrepriseId);
  if (cachedDbName) {
    try {
      req.db = getClientPool(entrepriseId, cachedDbName);
      return next();
    } catch (err) {
      console.error('[tenantMiddleware] Erreur pool tenant (cache):', err);
      return res.status(500).json({ message: 'Erreur serveur (connexion base entreprise)' });
    }
  }

  masterDb.query(
    'SELECT db_name, statut FROM entreprises WHERE id = ?',
    [entrepriseId],
    (err, rows) => {
      if (err) {
        console.error('[tenantMiddleware] Erreur lecture db_name:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (rows.length === 0 || !rows[0].db_name) {
        return res.status(500).json({
          message: "Configuration de la base de l'entreprise introuvable. Contactez le support."
        });
      }

      if (rows[0].statut !== 'actif' && req.path !== '/essai-expire') {
        return res.status(403).json({
          message: rows[0].statut === 'en_attente'
            ? 'Votre entreprise est en attente de validation'
            : 'Votre entreprise est suspendue'
        });
      }

      const dbName = rows[0].db_name;
      setCachedDbName(entrepriseId, dbName);

      try {
        req.db = getClientPool(entrepriseId, dbName);
        next();
      } catch (poolErr) {
        console.error('[tenantMiddleware] Erreur pool tenant:', poolErr);
        res.status(500).json({ message: 'Erreur serveur (connexion base entreprise)' });
      }
    }
  );
};

module.exports.invalidateCache = function invalidateCache(entrepriseId) {
  dbNameCache.delete(entrepriseId);
};
// NOUVEAU - Vérifier l'isolation tenant
module.exports.ensureTenantIsolation = function ensureTenantIsolation(req, res, next) {
  const companyId = req.user?.company_id || req.user?.entreprise_id;
  const dbName = req.tenant?.dbName || req.user?.db_name;

  if (!companyId) {
    return res.status(401).json({ 
      message: 'Non authentifié : company_id manquant' 
    });
  }

  if (!dbName) {
    return res.status(500).json({ 
      message: 'Erreur de configuration : db_name manquant' 
    });
  }

  next();
};