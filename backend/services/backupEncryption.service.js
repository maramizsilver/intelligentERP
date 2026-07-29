const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class BackupEncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = this._getKey();
    }

    _getKey() {
        let key = process.env.BACKUP_ENCRYPTION_KEY;
        
        if (!key || key.length < 32) {
            key = crypto.randomBytes(32).toString('hex');
            console.warn('[BackupEncryption] Nouvelle cle generee: ' + key.substring(0, 20) + '...');
            console.warn('[BackupEncryption] AJOUTER DANS .env: BACKUP_ENCRYPTION_KEY=' + key);
        }
        
        return Buffer.from(key, 'hex');
    }

    encryptFile(inputPath, outputPath) {
        try {
            const data = fs.readFileSync(inputPath);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            
            let encrypted = cipher.update(data);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            const tag = cipher.getAuthTag();
            
            const result = Buffer.concat([iv, tag, encrypted]);
            fs.writeFileSync(outputPath, result);
            
            return {
                success: true,
                outputPath: outputPath,
                size: result.length,
                originalSize: data.length
            };
        } catch (err) {
            console.error('[BackupEncryption] Erreur chiffrement:', err.message);
            return { success: false, error: err.message };
        }
    }

    decryptFile(inputPath, outputPath) {
        try {
            const data = fs.readFileSync(inputPath);
            
            const iv = data.slice(0, 16);
            const tag = data.slice(16, 32);
            const encrypted = data.slice(32);
            
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            fs.writeFileSync(outputPath, decrypted);
            
            return {
                success: true,
                outputPath: outputPath,
                size: decrypted.length
            };
        } catch (err) {
            console.error('[BackupEncryption] Erreur dechiffrement:', err.message);
            return { success: false, error: err.message };
        }
    }

    encryptBackup(dbName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = process.env.BACKUP_DIR || './backups';
        const encryptedDir = process.env.ENCRYPTED_BACKUP_DIR || './backups/encrypted';
        
        if (!fs.existsSync(encryptedDir)) {
            fs.mkdirSync(encryptedDir, { recursive: true });
        }
        
        const sqlPath = path.join(backupDir, dbName + '_' + timestamp + '.sql');
        const encryptedPath = path.join(encryptedDir, dbName + '_' + timestamp + '.enc');
        
        if (!fs.existsSync(sqlPath)) {
            return { success: false, error: 'Fichier backup introuvable' };
        }
        
        return this.encryptFile(sqlPath, encryptedPath);
    }

    decryptBackup(encryptedPath, outputPath) {
        return this.decryptFile(encryptedPath, outputPath);
    }

    generateChecksum(filePath) {
        try {
            const data = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(data).digest('hex');
            return hash;
        } catch (err) {
            console.error('[BackupEncryption] Erreur checksum:', err.message);
            return null;
        }
    }

    verifyChecksum(filePath, expectedChecksum) {
        const actual = this.generateChecksum(filePath);
        return actual === expectedChecksum;
    }

    signBackup(filePath) {
        try {
            const data = fs.readFileSync(filePath);
            const signature = crypto.createSign('RSA-SHA256');
            signature.update(data);
            signature.end();
            
            const privateKey = process.env.BACKUP_PRIVATE_KEY;
            if (!privateKey) {
                return { success: false, error: 'Cle privee non configuree' };
            }
            
            const signed = signature.sign(privateKey, 'hex');
            
            const signaturePath = filePath + '.sig';
            fs.writeFileSync(signaturePath, signed);
            
            return {
                success: true,
                signaturePath: signaturePath,
                signature: signed
            };
        } catch (err) {
            console.error('[BackupEncryption] Erreur signature:', err.message);
            return { success: false, error: err.message };
        }
    }

    verifySignature(filePath, signaturePath) {
        try {
            const data = fs.readFileSync(filePath);
            const signature = fs.readFileSync(signaturePath, 'utf8');
            
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(data);
            verify.end();
            
            const publicKey = process.env.BACKUP_PUBLIC_KEY;
            if (!publicKey) {
                return { success: false, error: 'Cle publique non configuree' };
            }
            
            const isValid = verify.verify(publicKey, signature, 'hex');
            
            return {
                success: true,
                isValid: isValid
            };
        } catch (err) {
            console.error('[BackupEncryption] Erreur verification:', err.message);
            return { success: false, error: err.message };
        }
    }
}

module.exports = new BackupEncryptionService();