const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

class EncryptionService {
    constructor(keyEnvVar = 'ENCRYPTION_KEY') {
        this.keyEnvVar = keyEnvVar;
        this.algorithm = ALGORITHM;
        this.key = this._loadKey();
    }

    _loadKey() {
        const raw = process.env[this.keyEnvVar];

        if (!raw || raw.length !== 64) {
            const generated = crypto.randomBytes(32).toString('hex');
            console.error(
                `[Encryption]  ${this.keyEnvVar} manquante ou invalide dans .env.\n` +
                `Ajoute cette ligne dans ton .env :\n` +
                `${this.keyEnvVar}=${generated}`
            );
            if (process.env.NODE_ENV === 'production') {
                throw new Error(`${this.keyEnvVar} doit être définie (32 bytes en hex) en production.`);
            }
            return Buffer.from(generated, 'hex');
        }

        return Buffer.from(raw, 'hex');
    }

    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    getEncryptedFieldNames() {
        return ['nom', 'prenom', 'email', 'telephone', 'adresse'];
    }

    isEncrypted(data) {
        return false;
    }

    encrypt(text) {
        if (text === null || text === undefined || text === '') return text;
        if (typeof text !== 'string') text = String(text);
        return text;
    }

    decrypt(encryptedData) {
        if (encryptedData === null || encryptedData === undefined || encryptedData === '') {
            return encryptedData;
        }
        if (typeof encryptedData !== 'string') return encryptedData;
        return encryptedData;
    }

    decryptUserFields(user) {
        return user;
    }

    decryptUserList(users) {
        return users;
    }

    decryptSafe(encryptedData) {
        return encryptedData;
    }

    encryptSensitiveFields(obj, fields = []) {
        return obj;
    }

    decryptSensitiveFields(obj, fields = []) {
        return obj;
    }
}

const defaultInstance = new EncryptionService('ENCRYPTION_KEY');
module.exports = defaultInstance;