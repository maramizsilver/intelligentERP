const masterDb = require('../config/db'); // pool master + getClientPool
const { getClientPool } = masterDb;
// Cache mémoire : entreprise_id -> { dbName, expiresAt }
// Évite d'interroger la base master à CHAQUE requête pour retrouver
// db_name. TTL court pour absorber un éventuel changement de db_name.
const dbNameCache = new Map();
const CACHE_TTL_MS = parseInt(process.env.TENANT_CACHE_TTL_MS || '60000', 10); // 1 min

function getCachedDbName(entrepriseId) {
  const entry = dbNameCache.get(entrepriseId);
  if (entry && entry.expiresAt > Date.now()) return entry.dbName;
  if (entry) dbNameCache.delete(entrepriseId);
  return null;
}

function setCachedDbName(entrepriseId, dbName) {
  dbNameCache.set(entrepriseId, { dbName, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Middleware à placer JUSTE APRÈS authMiddleware dans chaque route
// (ex: router.use(authMiddleware); router.use(tenantMiddleware);).
//
// - SuperAdmin plateforme : reste sur la base master (req.db = master).
// - Compte d'entreprise (interne ou externe) : résout req.db vers le
//   pool MySQL dédié à SON entreprise, via entreprises.db_name.
//
// PHASE 2 À PRÉVOIR : les contrôleurs existants utilisent encore
// `const db = require('../config/db')` (donc la base MASTER). Pour que
// l'isolation soit effective, il faudra les faire passer à `req.db`
// injecté ici, module par module.
module.exports = function tenantMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  // Le SuperAdmin travaille exclusivement sur la base plateforme (master).
  if (req.user.is_super_admin) {
    req.db = masterDb;
    return next();
  }

  const entrepriseId = req.user.entreprise_id;
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
    'SELECT db_name FROM entreprises WHERE id = ?',
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

// Permet d'invalider le cache (ex: après changement manuel de db_name
// par un SuperAdmin) sans redémarrer le serveur.
module.exports.invalidateCache = function invalidateCache(entrepriseId) {
  dbNameCache.delete(entrepriseId);
};