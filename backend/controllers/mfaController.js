const MFAService = require('../services/mfa.service');
const mfaConfig = require('../config/mfa.config');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const masterPool = db.promisePoolMaster;
// 1. INITIER L'ACTIVATION MFA
exports.initiateMFA = async (req, res) => {
  try {
    const clientPool = req.db; // Base TENANT
    const userId = req.user.id;
    const email = req.user.email;

    // Vérifier si la MFA est déjà active (dans tenant)
    const [existing] = await clientPool.promise().query(
      'SELECT mfa_enabled FROM users WHERE id = ?',
      [userId]
    );

    if (existing.length && existing[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'La MFA est deja activee pour ce compte'
      });
    }

    // 1. Générer le secret
    const { secret, otpauth_url } = MFAService.generateSecret(email, mfaConfig.totp.issuer);

    // 2. Générer le QR Code
    const qrCode = await MFAService.generateQRCode(otpauth_url, mfaConfig.qr.width);

    // 3. Générer les codes de sauvegarde
    const backupCodes = MFAService.generateBackupCodes(
      mfaConfig.backup.count,
      mfaConfig.backup.length
    );

    // 4. Stocker le secret dans la base TENANT
    await clientPool.promise().query(
      `UPDATE users 
       SET mfa_secret = ?, 
           mfa_backup_codes = ? 
       WHERE id = ?`,
      [secret, JSON.stringify(backupCodes), userId]
    );

    await masterPool.query(
      `UPDATE users 
       SET mfa_secret = ?,
           mfa_backup_codes = ?,
           mfa_temp_secret = ?
       WHERE id = ?`,
      [secret, JSON.stringify(backupCodes), secret, userId]
    );

    res.status(200).json({
      success: true,
      message: 'MFA initialisee avec succes',
      data: {
        secret,
        qrCode,
        backupCodes,
        otpauth_url
      }
    });

  } catch (error) {
    console.error('[MFA] Erreur initiation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initialisation de la MFA'
    });
  }
};

// 2. ACTIVER LA MFA
exports.activateMFA = async (req, res) => {
  try {
    const clientPool = req.db; // Base TENANT
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Le code de verification est requis'
      });
    }

    // Lire depuis la base TENANT
    const [rows] = await clientPool.promise().query(
      'SELECT mfa_secret FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length || !rows[0].mfa_secret) {
      return res.status(400).json({
        success: false,
        message: 'MFA non initialisee'
      });
    }

    const secret = rows[0].mfa_secret;
    const isValid = MFAService.verifyToken(secret, token, mfaConfig.totp.window);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Code de verification invalide'
      });
    }

    await clientPool.promise().query(
      `UPDATE users 
       SET mfa_enabled = TRUE, 
           mfa_verified = TRUE,
           mfa_attempts = 0
       WHERE id = ?`,
      [userId]
    );

    await masterPool.query(
      `UPDATE users 
       SET mfa_enabled = TRUE,
           mfa_secret = ?,
           mfa_attempts = 0,
           mfa_temp_secret = NULL
       WHERE id = ?`,
      [secret, userId]
    );

    res.status(200).json({
      success: true,
      message: 'MFA activee avec succes'
    });

  } catch (error) {
    console.error('[MFA] Erreur activation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation de la MFA'
    });
  }
};

// 3. DESACTIVER LA MFA
exports.deactivateMFA = async (req, res) => {
  try {
    const clientPool = req.db; // Base TENANT
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Le code de verification est requis'
      });
    }

    const [rows] = await clientPool.promise().query(
      'SELECT mfa_secret, mfa_enabled FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length || !rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'La MFA n\'est pas active'
      });
    }

    const secret = rows[0].mfa_secret;
    const isValid = MFAService.verifyToken(secret, token, mfaConfig.totp.window);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Code de verification invalide'
      });
    }

    await clientPool.promise().query(
      `UPDATE users 
       SET mfa_enabled = FALSE, 
           mfa_secret = NULL, 
           mfa_backup_codes = NULL, 
           mfa_verified = FALSE,
           mfa_attempts = 0,
           mfa_locked_until = NULL
       WHERE id = ?`,
      [userId]
    );

    await masterPool.query(
      `UPDATE users 
       SET mfa_enabled = FALSE, 
           mfa_secret = NULL, 
           mfa_backup_codes = NULL, 
           mfa_attempts = 0,
           mfa_locked_until = NULL,
           mfa_temp_secret = NULL
       WHERE id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'MFA desactivee avec succes'
    });

  } catch (error) {
    console.error('[MFA] Erreur desactivation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la desactivation de la MFA'
    });
  }
};

// 4. VERIFICATION LORS DU LOGIN (2eme facteur)
exports.verifyMFALogin = async (req, res) => {
  try {
    const { token, userId, tempToken } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Le code de verification est requis'
      });
    }

    // Vérifier le token temporaire
    try {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (!decoded.mfa_pending || decoded.id !== userId) {
        return res.status(401).json({
          success: false,
          message: 'Session MFA invalide'
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Session MFA expiree, veuillez vous reconnecter'
      });
    }

    const [rows] = await masterPool.query(
      'SELECT id, mfa_secret, mfa_enabled, mfa_attempts, mfa_locked_until FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length || !rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA non active pour ce compte'
      });
    }

    const user = rows[0];
    const lockStatus = MFAService.isMFALocked(user);
    
    if (lockStatus.locked) {
      return res.status(403).json({
        success: false,
        message: `Compte verrouille. Reessayez dans ${lockStatus.remainingMinutes} minute(s).`,
        locked_until: user.mfa_locked_until
      });
    }

    const secret = user.mfa_secret;
    let attempts = user.mfa_attempts || 0;
    const isValid = MFAService.verifyToken(secret, token, mfaConfig.totp.window);

    if (!isValid) {
      attempts += 1;
      const maxAttempts = mfaConfig.security.maxAttempts;
      const lockDuration = mfaConfig.security.lockDuration;

      let lockedUntil = null;
      if (attempts >= maxAttempts) {
        lockedUntil = new Date(Date.now() + lockDuration * 60 * 1000);
        await masterPool.query(
          'UPDATE users SET mfa_attempts = ?, mfa_locked_until = ? WHERE id = ?',
          [attempts, lockedUntil, userId]
        );
      } else {
        await masterPool.query(
          'UPDATE users SET mfa_attempts = ? WHERE id = ?',
          [attempts, userId]
        );
      }

      return res.status(401).json({
        success: false,
        message: 'Code de verification invalide',
        attempts_remaining: maxAttempts - attempts,
        locked: lockedUntil !== null,
        locked_until: lockedUntil
      });
    }

    await masterPool.query(
      'UPDATE users SET mfa_attempts = 0, mfa_locked_until = NULL WHERE id = ?',
      [userId]
    );

    await masterPool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [userId]
    );

    const finalToken = jwt.sign(
      {
        id: userId,
        entreprise_id: decoded.entreprise_id,
        db_name: decoded.db_name,
        mfa_verified: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Verification MFA reussie',
      token: finalToken
    });

  } catch (error) {
    console.error('[MFA] Erreur verification login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la verification MFA'
    });
  }
};

// 5. VERIFIER UN CODE DE SAUVEGARDE
exports.verifyBackupCode = async (req, res) => {
  try {
    const clientPool = req.db; // Base TENANT
    const userId = req.user.id;
    const { backupCode } = req.body;

    if (!backupCode) {
      return res.status(400).json({
        success: false,
        message: 'Le code de sauvegarde est requis'
      });
    }

    const [rows] = await clientPool.promise().query(
      'SELECT mfa_backup_codes FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length || !rows[0].mfa_backup_codes) {
      return res.status(400).json({
        success: false,
        message: 'Aucun code de sauvegarde disponible'
      });
    }

    const backupCodes = JSON.parse(rows[0].mfa_backup_codes);

    if (!backupCodes || backupCodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun code de sauvegarde disponible'
      });
    }

    const result = MFAService.verifyAndConsumeBackupCode(backupCode, backupCodes);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: 'Code de sauvegarde invalide'
      });
    }

    await clientPool.promise().query(
      'UPDATE users SET mfa_backup_codes = ? WHERE id = ?',
      [JSON.stringify(result.newList), userId]
    );

    await masterPool.query(
      'UPDATE users SET mfa_backup_codes = ? WHERE id = ?',
      [JSON.stringify(result.newList), userId]
    );

    const tempToken = jwt.sign(
      {
        id: userId,
        mfa_pending: true,
        backup_used: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.status(200).json({
      success: true,
      message: 'Code de sauvegarde valide',
      data: {
        temp_token: tempToken,
        remaining_codes: result.newList.length
      }
    });

  } catch (error) {
    console.error('[MFA] Erreur verification backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la verification du code de sauvegarde'
    });
  }
};

// 6. REGENERER LES CODES DE SAUVEGARDE
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const clientPool = req.db; // Base TENANT
    const userId = req.user.id;

    const [rows] = await clientPool.promise().query(
      'SELECT mfa_enabled FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length || !rows[0].mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'La MFA n\'est pas active'
      });
    }

    const newBackupCodes = MFAService.generateBackupCodes(
      mfaConfig.backup.count,
      mfaConfig.backup.length
    );

    await clientPool.promise().query(
      'UPDATE users SET mfa_backup_codes = ? WHERE id = ?',
      [JSON.stringify(newBackupCodes), userId]
    );

    await masterPool.query(
      'UPDATE users SET mfa_backup_codes = ? WHERE id = ?',
      [JSON.stringify(newBackupCodes), userId]
    );

    res.status(200).json({
      success: true,
      message: 'Codes de sauvegarde regeneres avec succes',
      data: {
        backup_codes: newBackupCodes
      }
    });

  } catch (error) {
    console.error('[MFA] Erreur regeneration backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la regeneration des codes de sauvegarde'
    });
  }
};

// 7. OBTENIR LE STATUT MFA
exports.getMFAStatus = async (req, res) => {
  try {
    const clientPool = req.db; // Base TENANT
    const userId = req.user.id;

    const [rows] = await clientPool.promise().query(
      'SELECT mfa_enabled FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouve'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enabled: rows[0].mfa_enabled === 1
      }
    });

  } catch (error) {
    console.error('[MFA] Erreur statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation du statut MFA'
    });
  }
};

// 8. FERMER LE BANNER MFA
exports.dismissMFABanner = async (req, res) => {
  try {
    const clientPool = req.db; // Base TENANT
    const userId = req.user.id;

    await clientPool.promise().query(
      'UPDATE users SET mfa_banner_dismissed = TRUE WHERE id = ?',
      [userId]
    );

    await masterPool.query(
      'UPDATE users SET mfa_banner_dismissed = TRUE WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Banner MFA masque'
    });

  } catch (error) {
    console.error('[MFA] Erreur dismiss banner:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du masquage du banner'
    });
  }
};