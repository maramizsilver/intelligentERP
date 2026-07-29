const crypto = require('crypto');
require('dotenv').config();

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = this._getKey();
        this.encoding = 'base64';
        
        console.log('[Encryption] Service initialise avec AES-256-GCM');
    }

    _getKey() {
        let key = process.env.ENCRYPTION_KEY;
        
        if (!key || key.length < 32) {
            key = crypto.randomBytes(32).toString('hex');
            console.warn('[Encryption] Nouvelle cle generee: ' + key.substring(0, 20) + '...');
            console.warn('[Encryption] AJOUTER DANS .env: ENCRYPTION_KEY=' + key);
        }
        
        return Buffer.from(key, 'hex');
    }

    encrypt(text) {
        if (!text) return null;
        if (typeof text !== 'string') text = String(text);

        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();
            
            return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
        } catch (err) {
            console.error('[Encryption] Erreur chiffrement:', err.message);
            return text;
        }
    }

    decrypt(encryptedText) {
        if (!encryptedText) return null;
        
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            return encryptedText;
        }

        try {
            const [ivHex, tagHex, encrypted] = parts;
            
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (err) {
            console.error('[Encryption] Erreur dechiffrement:', err.message);
            return encryptedText;
        }
    }

    encryptFields(obj, fields) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const result = Array.isArray(obj) ? [...obj] : { ...obj };
        
        fields.forEach(field => {
            const value = result[field];
            if (value !== undefined && value !== null && value !== '') {
                result[field] = this.encrypt(value);
            }
        });
        
        return result;
    }

    decryptFields(obj, fields) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const result = Array.isArray(obj) ? [...obj] : { ...obj };
        
        fields.forEach(field => {
            const value = result[field];
            if (value !== undefined && value !== null) {
                result[field] = this.decrypt(value);
            }
        });
        
        return result;
    }

    isEncrypted(text) {
        if (!text || typeof text !== 'string') return false;
        return text.split(':').length === 3 && /^[a-f0-9]+$/.test(text.split(':')[0]);
    }
}

module.exports = new EncryptionService();