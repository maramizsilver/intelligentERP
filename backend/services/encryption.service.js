// backend/services/encryption.service.js
const crypto = require('crypto');

class EncryptionService {
    constructor(keyEnvVar = 'ENCRYPTION_KEY') {
        // Ne rien faire - désactivé
    }

    // ✅ COMPLÈTEMENT DÉSACTIVÉ - retourne le texte tel quel
    encrypt(text) {
        return text;
    }

    // ✅ COMPLÈTEMENT DÉSACTIVÉ - retourne le texte tel quel
    decrypt(encryptedData) {
        return encryptedData;
    }

    // ✅ COMPLÈTEMENT DÉSACTIVÉ - retourne l'objet tel quel
    encryptSensitiveFields(obj, fields = []) {
        return obj;
    }

    // ✅ COMPLÈTEMENT DÉSACTIVÉ - retourne l'objet tel quel
    decryptSensitiveFields(obj, fields = []) {
        return obj;
    }

    // ✅ Retourne une liste vide
    getEncryptedFieldNames() {
        return [];
    }

    // ✅ Toujours retourner false
    isEncrypted(data) {
        return false;
    }

    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
}

// ✅ Instance désactivée
const defaultInstance = new EncryptionService('ENCRYPTION_KEY');
module.exports = defaultInstance;