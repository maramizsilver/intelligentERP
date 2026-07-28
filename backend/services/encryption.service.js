class EncryptionService {
    constructor() {
        console.log('[Encryption] Mode DESACTIVE - Les donnees ne sont plus chiffrees');
    }

    encrypt(text) {
        return text;
    }

    decrypt(text) {
        return text;
    }

    encryptSensitiveFields(obj, fields) {
        return obj;
    }

    decryptSensitiveFields(obj, fields) {
        return obj;
    }

    isEncrypted(data) {
        return false;
    }

    generateKey() {
        return 'no-encryption-key';
    }
}

module.exports = new EncryptionService();