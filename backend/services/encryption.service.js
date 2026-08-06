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
        return ['email', 'telephone', 'adresse', 'description', 'notes'];
    }

    // Une valeur chiffrée par ce service a toujours la forme "ivHex:tagHex:cipherHex"
    isEncrypted(data) {
        if (!data || typeof data !== 'string') return false;
        const parts = data.split(':');
        if (parts.length !== 3) return false;
        const [ivHex, tagHex] = parts;
        return (
            ivHex.length === IV_LENGTH * 2 &&
            tagHex.length === 32 &&
            /^[0-9a-f]+$/i.test(ivHex) &&
            /^[0-9a-f]+$/i.test(tagHex)
        );
    }

    encrypt(text) {
        if (text === null || text === undefined || text === '') return text;
        if (typeof text !== 'string') text = String(text);

        // Evite de re-chiffrer une valeur déjà chiffrée (double chiffrement = perte de données)
        if (this.isEncrypted(text)) return text;

        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag().toString('hex');
            return iv.toString('hex') + ':' + authTag + ':' + encrypted;
        } catch (err) {
            console.error('[Encryption] Erreur chiffrement:', err.message);
            throw err;
        }
    }

    decrypt(encryptedData) {
        if (encryptedData === null || encryptedData === undefined || encryptedData === '') {
            return encryptedData;
        }
        if (typeof encryptedData !== 'string') return encryptedData;

        // Si ce n'est pas dans notre format chiffré, on renvoie tel quel
        // (ex: anciennes données en clair pas encore migrées)
        if (!this.isEncrypted(encryptedData)) return encryptedData;

        try {
            const [ivHex, authTagHex, cipherHex] = encryptedData.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
            let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (err) {
            console.error('[Encryption] Erreur dechiffrement:', err.message);
            // On ne casse pas l'affichage : on renvoie la valeur brute plutôt qu'une exception
            return encryptedData;
        }
    }

    decryptUserFields(user) {
        if (!user) return user;
        return this.decryptSensitiveFields(user, this.getEncryptedFieldNames());
    }

    decryptUserList(users) {
        if (!Array.isArray(users)) return users;
        return users.map(u => this.decryptUserFields(u));
    }

    decryptSafe(encryptedData) {
        try {
            return this.decrypt(encryptedData);
        } catch (err) {
            return encryptedData;
        }
    }

    encryptSensitiveFields(obj, fields = []) {
        if (!obj || typeof obj !== 'object') return obj;
        const result = { ...obj };
        fields.forEach(field => {
            if (result[field] !== undefined && result[field] !== null && result[field] !== '') {
                result[field] = this.encrypt(result[field]);
            }
        });
        return result;
    }

    decryptSensitiveFields(obj, fields = []) {
        if (!obj || typeof obj !== 'object') return obj;
        const result = { ...obj };
        fields.forEach(field => {
            if (result[field] !== undefined && result[field] !== null) {
                result[field] = this.decrypt(result[field]);
            }
        });
        return result;
    }
}

const defaultInstance = new EncryptionService('ENCRYPTION_KEY');
module.exports = defaultInstance;