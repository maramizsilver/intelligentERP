const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = Buffer.from(process.env.ENCRYPTION_KEY || this.generateKey(), 'hex');
        this.ivLength = 16;
    }

    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    encrypt(text) {
        if (!text) return null;
        if (typeof text !== 'string') return text;
        
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag().toString('hex');
            return iv.toString('hex') + ':' + authTag + ':' + encrypted;
        } catch (err) {
            console.error('[Encryption] Erreur chiffrement:', err);
            return text;
        }
    }

    decrypt(encryptedData) {
        if (!encryptedData) return null;
        if (typeof encryptedData !== 'string') return encryptedData;
        if (!encryptedData.includes(':')) return encryptedData;

        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) return encryptedData;
            
            const [ivHex, authTag, encryptedText] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (err) {
            console.error('[Encryption] Erreur dechiffrement:', err);
            return encryptedData;
        }
    }

    encryptSensitiveFields(obj, fields) {
        if (!obj || typeof obj !== 'object') return obj;
        const result = { ...obj };
        fields.forEach(field => {
            if (result[field] && typeof result[field] === 'string') {
                result[field] = this.encrypt(result[field]);
            }
        });
        return result;
    }

    decryptSensitiveFields(obj, fields) {
        if (!obj || typeof obj !== 'object') return obj;
        const result = { ...obj };
        fields.forEach(field => {
            if (result[field]) {
                result[field] = this.decrypt(result[field]);
            }
        });
        return result;
    }
}

module.exports = new EncryptionService();
