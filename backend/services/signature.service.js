const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

class SignatureService {
    constructor() {
        this.secretKey = process.env.EXPORT_SECRET_KEY ;
        console.log('[SignatureService] Initialise avec cle secrete');
        if (!this.secretKey) {
            if (process.env.NODE_ENV === 'production') {
            throw new Error('EXPORT_SECRET_KEY doit etre definie en production.');
           } 
           this.secretKey = crypto.randomBytes(32).toString('hex');
           console.warn('[Signature] EXPORT_SECRET_KEY absente : cle temporaire generee (dev uniquement)'); {
    
             }
        }
            else{
                const secret = process.env.EXPORT_SECRET_KEY;
                this.secretKey = secret;
        }}

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