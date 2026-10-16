const mysql = require('mysql2');
require('dotenv').config();
// En production, on refuse de démarrer sans identifiants explicites (pas de repli sur root)
if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.DB_USER || !process.env.DB_PASSWORD)
) {
    throw new Error('DB_USER et DB_PASSWORD doivent etre definis en production.');
}

const masterPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_MASTER_NAME || 'erp_db',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_MASTER_POOL_LIMIT || '10', 10),
    queueLimit: 0
});


const promisePoolMaster = masterPool.promise();

// ============================================================
// CACHE DES POOLS TENANT
// ============================================================
const tenantPools = new Map();
const MAX_TENANT_POOLS = parseInt(process.env.DB_MAX_TENANT_POOLS || '50', 10);

function evictOldestIfNeeded() {
    if (tenantPools.size < MAX_TENANT_POOLS) return;
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, entry] of tenantPools.entries()) {
        if (entry.lastUsed < oldestTime) {
            oldestTime = entry.lastUsed;
            oldestKey = key;
        }
    }
    if (oldestKey !== null) {
        const entry = tenantPools.get(oldestKey);
        entry.pool.end(() => {});
        tenantPools.delete(oldestKey);
    }
}

function getClientPool(entrepriseId, dbName) {
    if (!entrepriseId || !dbName) {
        throw new Error('getClientPool: entrepriseId et dbName sont requis');
    }

    const cached = tenantPools.get(entrepriseId);
    if (cached && cached.dbName === dbName) {
        cached.lastUsed = Date.now();
        return cached.pool;
    }

    if (cached) {
        cached.pool.end(() => {});
        tenantPools.delete(entrepriseId);
    }

    evictOldestIfNeeded();

    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: dbName,
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_TENANT_POOL_LIMIT || '5', 10),
        queueLimit: 0
    });

    tenantPools.set(entrepriseId, { pool, dbName, lastUsed: Date.now() });
    return pool;
}

function invalidateClientPool(entrepriseId) {
    const cached = tenantPools.get(entrepriseId);
    if (cached) {
        cached.pool.end(() => {});
        tenantPools.delete(entrepriseId);
    }
}
async function closeAllPools() {
  for (const [, e] of tenantPools) await new Promise((r) => e.pool.end(() => r()));
  tenantPools.clear();
  await masterPool.promise().end();
}
// EXPORTS
module.exports.closeAllPools = closeAllPools;
module.exports = masterPool;
module.exports.masterPool = masterPool;
module.exports.promisePoolMaster = promisePoolMaster; 
module.exports.getClientPool = getClientPool;
module.exports.invalidateClientPool = invalidateClientPool;