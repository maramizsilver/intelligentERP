const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class MFAService {
  static generateSecret(email, issuer = 'ERP') {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${issuer} - ${email}`
    });
    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url
    };
  }
  static async generateQRCode(otpauth_url, width = 300) {
    const qrCode = await QRCode.toDataURL(otpauth_url, {
      width: width,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    });
    return qrCode;
  }
  static verifyToken(secret, token, window = 1) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''),
      window: window
    });
  }

  static generateBackupCodes(count = 10, length = 8) {
    const codes = [];
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < length; j++) {
        code += charset[crypto.randomInt(0, charset.length)];
      }
      codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
    }
    return codes;
  }

  static verifyAndConsumeBackupCode(code, backupCodes) {
    const cleanCode = code.replace(/[-\s]/g, '');
    const index = backupCodes.findIndex(c => c.replace(/[-\s]/g, '') === cleanCode);
    if (index === -1) return { valid: false, newList: backupCodes };
    const newList = [...backupCodes];
    newList.splice(index, 1);
    return { valid: true, newList };
  }

  static isMFALocked(user) {
    if (!user.mfa_locked_until) return { locked: false, remainingMinutes: 0 };
    const lockedUntil = new Date(user.mfa_locked_until);
    const now = new Date();
    if (lockedUntil > now) {
      return { locked: true, remainingMinutes: Math.ceil((lockedUntil - now) / 60000) };
    }
    return { locked: false, remainingMinutes: 0 };
  }
}

module.exports = MFAService;