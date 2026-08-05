const encryptionService = require('../services/encryption.service');

// ============================================================
// ROUTES EXCLUES DU CHIFFREMENT
// ============================================================
const EXCLUDED_PATHS = [
    '/auth/login',
    '/auth/register',
    '/auth/mfa',
    '/roles',
    '/permissions',
    '/modules',
    '/csrf/token',
    '/auth/users',
    '/users',
    '/users/entreprise'
];

// ============================================================
// CHAMPS SENSIBLES UNIQUEMENT (nom et prenom RETIRÉS)
// ============================================================
const SENSITIVE_FIELDS = [
    'email',
    'telephone',
    'adresse',
    'description',
    'notes'
];

const encryptSensitiveData = (req, res, next) => {
    // Exclure les routes sensibles
    if (EXCLUDED_PATHS.some(path => req.path.includes(path))) {
        return next();
    }

    if (req.method === 'GET') {
        return next();
    }

    if (req.user && req.user.is_super_admin) {
        return next();
    }

    const fieldsToEncrypt = SENSITIVE_FIELDS;

    if (req.body && typeof req.body === 'object') {
        fieldsToEncrypt.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                if (!encryptionService.isEncrypted(req.body[field])) {
                    req.body[field] = encryptionService.encrypt(req.body[field]);
                }
            }
        });
    }

    next();
};

const decryptSensitiveResponse = (req, res, next) => {
    // Exclure les routes sensibles
    if (EXCLUDED_PATHS.some(path => req.path.includes(path))) {
        return next();
    }

    const originalSend = res.send;

    res.send = function(data) {
        try {
            if (data && typeof data === 'string') {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === 'object') {
                    const decryptRecursive = (obj) => {
                        if (!obj || typeof obj !== 'object') return obj;

                        if (Array.isArray(obj)) {
                            return obj.map(item => decryptRecursive(item));
                        }

                        const result = { ...obj };

                        SENSITIVE_FIELDS.forEach(field => {
                            if (result[field] !== undefined && result[field] !== null && typeof result[field] === 'string') {
                                if (encryptionService.isEncrypted(result[field])) {
                                    result[field] = encryptionService.decrypt(result[field]);
                                }
                            }
                        });

                        Object.keys(result).forEach(key => {
                            if (result[key] && typeof result[key] === 'object') {
                                result[key] = decryptRecursive(result[key]);
                            }
                        });

                        return result;
                    };

                    const decrypted = decryptRecursive(parsed);
                    return originalSend.call(this, JSON.stringify(decrypted));
                }
            }
        } catch (err) {
            console.error('[Encryption] Erreur dechiffrement reponse:', err.message);
        }
        return originalSend.call(this, data);
    };

    next();
};

module.exports = {
    encryptSensitiveData,
    decryptSensitiveResponse
};