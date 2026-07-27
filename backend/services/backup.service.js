const fs = require('fs');
const crypto = require('crypto');
const encryptionService = require('./encryption.service');

class BackupService {
    static async encryptBackup(filePath, outputPath) {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const encrypted = encryptionService.encrypt(fileBuffer.toString('base64'));
            fs.writeFileSync(outputPath, encrypted);
            return outputPath;
        } catch (err) {
            console.error('[Backup] Erreur chiffrement:', err);
            throw err;
        }
    }

    static async decryptBackup(filePath, outputPath) {
        try {
            const encryptedData = fs.readFileSync(filePath, 'utf8');
            const decrypted = encryptionService.decrypt(encryptedData);
            const buffer = Buffer.from(decrypted, 'base64');
            fs.writeFileSync(outputPath, buffer);
            return outputPath;
        } catch (err) {
            console.error('[Backup] Erreur dechiffrement:', err);
            throw err;
        }
    }

    static generateChecksum(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        return hash;
    }

    static verifyChecksum(filePath, expectedChecksum) {
        const actualChecksum = this.generateChecksum(filePath);
        return actualChecksum === expectedChecksum;
    }
}

module.exports = BackupService;