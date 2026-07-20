const rateLimit = require('express-rate-limit');

// 1. LIMITEUR GLOBAL (toutes les routes)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par IP
    message: {
        message: 'Trop de requêtes, veuillez réessayer dans 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. LIMITEUR LOGIN (protection force brute)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives max
    message: {
        message: 'Trop de tentatives de connexion. Compte bloqué 15 minutes.'
    },
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
});

// 3. LIMITEUR INSCRIPTION
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // 3 inscriptions max par heure
    message: {
        message: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 4. LIMITEUR API (routes sensibles)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requêtes par minute
    message: {
        message: 'Trop de requêtes API, veuillez ralentir'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 5. LIMITEUR UPLOAD
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads par minute
    message: {
        message: 'Trop de téléchargements, réessayez dans 1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 6. LIMITEUR EXPORT
const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 exports par heure
    message: {
        message: 'Trop d\'exports, réessayez dans 1 heure'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 7. LIMITEUR MFA (10 tentatives / 15 minutes)
const mfaLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 tentatives max
    message: {
        success: false,
        message: 'Trop de tentatives MFA. Réessayez dans 15 minutes.'
    },
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false
});

// 8. LIMITEUR ACTIVATION MFA (3 activations / heure)
const mfaActivationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 3, // 3 activations max par heure
    message: {
        success: false,
        message: 'Trop de tentatives d\'activation MFA. Réessayez dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// EXPORTS
module.exports = {
    globalLimiter,
    loginLimiter,
    registerLimiter,
    apiLimiter,
    uploadLimiter,
    exportLimiter,
    mfaLimiter,
    mfaActivationLimiter
};