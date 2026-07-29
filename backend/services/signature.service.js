const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

class SignatureService {
    constructor() {
        this.secretKey = process.env.EXPORT_SECRET_KEY || 'erp_export_secret_2026';
        console.log('[Signature] Service initialise avec cle secrete');
    }

    signData(data) {
        try {
            const hash = crypto.createHash('sha256');
            hash.update(data);
            hash.update(this.secretKey);
            const signature = hash.digest('base64');
            return signature;
        } catch (err) {
            console.error('[Signature] Erreur signature:', err.message);
            return null;
        }
    }

    verifySignature(data, signature) {
        try {
            const hash = crypto.createHash('sha256');
            hash.update(data);
            hash.update(this.secretKey);
            const expectedSignature = hash.digest('base64');
            return expectedSignature === signature;
        } catch (err) {
            console.error('[Signature] Erreur verification:', err.message);
            return false;
        }
    }

    signFile(filePath) {
        try {
            const data = fs.readFileSync(filePath);
            const signature = this.signData(data);
            
            if (signature) {
                const signaturePath = filePath + '.sig';
                fs.writeFileSync(signaturePath, signature);
                return {
                    success: true,
                    signaturePath: signaturePath,
                    signature: signature
                };
            }
            
            return { success: false, error: 'Erreur signature' };
        } catch (err) {
            console.error('[Signature] Erreur signFile:', err.message);
            return { success: false, error: err.message };
        }
    }

    verifyFile(filePath, signaturePath) {
        try {
            const data = fs.readFileSync(filePath);
            const signature = fs.readFileSync(signaturePath, 'utf8');
            return this.verifySignature(data, signature);
        } catch (err) {
            console.error('[Signature] Erreur verifyFile:', err.message);
            return false;
        }
    }

    signBuffer(buffer) {
        return this.signData(buffer);
    }

    verifyBuffer(buffer, signature) {
        return this.verifySignature(buffer, signature);
    }
}

module.exports = new SignatureService();