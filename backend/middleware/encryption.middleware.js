const encryptionService = require('../services/encryption.service');
// ROUTES EXCLUES DU CHIFFREMENT — correspondance exacte de segment
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

// Vérifie que le chemin correspond à un SEGMENT complet, pas juste une
// sous-chaîne (évite par ex. qu'une future route "/roleshistory" soit
// exclue par erreur à cause de "/roles").
function estCheminExclu(reqPath) {
    return EXCLUDED_PATHS.some(exclu => {
        return reqPath === exclu
            || reqPath.startsWith(exclu + '/')
            || reqPath.includes('/api' + exclu)
            || reqPath.includes('/api' + exclu + '/');
    });
}


// CHAMPS SENSIBLES UNIQUEMENT (nom et prenom RETIRÉS)
const SENSITIVE_FIELDS = [
    'email',
    'telephone',
    'adresse',
    'description',
    'notes'
];

const encryptSensitiveData = (req, res, next) => {
    if (estCheminExclu(req.path)) {
        return next();
    }
    if (req.method === 'GET') {
        return next();
    }
    if (req.user && req.user.is_super_admin) {
        return next();
    }

    if (req.body && typeof req.body === 'object') {
        SENSITIVE_FIELDS.forEach(field => {
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
    if (estCheminExclu(req.path)) {
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