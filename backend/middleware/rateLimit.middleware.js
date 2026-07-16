const rateLimit = require('express-rate-limit');

// ============================================================
// LIMITEUR GLOBAL (toutes les routes)
// ============================================================
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par IP
    message: {
        message: 'Trop de requêtes, veuillez réessayer dans 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================================
// LIMITEUR SPÉCIFIQUE LOGIN (protection force brute)
// ============================================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: {
        message: 'Trop de tentatives de connexion. Compte bloqué 15 minutes.'
    },
    skipSuccessfulRequests: true, // Ne compte pas les succès
    standardHeaders: true,
    legacyHeaders: false,
});

// ============================================================
// LIMITEUR API (routes sensibles)
// ============================================================
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requêtes par minute
    message: {
        message: 'Trop de requêtes API, veuillez ralentir'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    loginLimiter,
    apiLimiter
};