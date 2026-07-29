const encryptionService = require('../services/encryption.service');

const encryptSensitiveData = (req, res, next) => {
    // Exclure le login, register, mfa du chiffrement
    if (req.path.includes('/auth/login') || 
        req.path.includes('/auth/register') ||
        req.path.includes('/auth/mfa')) {
        return next();
    }

    const sensitiveFields = [
        'email', 'telephone', 'adresse', 'description', 
        'notes', 'nom', 'prenom'
    ];

    const fieldsToEncrypt = sensitiveFields.filter(f => f !== 'password');

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
    const originalSend = res.send;
    
    res.send = function(data) {
        try {
            if (data && typeof data === 'string') {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === 'object') {
                    const sensitiveFields = ['email', 'telephone', 'adresse', 'description', 'notes', 'nom', 'prenom'];
                    
                    const decryptRecursive = (obj) => {
                        if (!obj || typeof obj !== 'object') return obj;
                        
                        if (Array.isArray(obj)) {
                            return obj.map(item => decryptRecursive(item));
                        }
                        
                        const result = { ...obj };
                        sensitiveFields.forEach(field => {
                            if (result[field] !== undefined && result[field] !== null) {
                                result[field] = encryptionService.decrypt(result[field]);
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