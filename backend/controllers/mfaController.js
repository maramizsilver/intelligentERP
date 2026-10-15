const MFAService = require('../services/mfa.service');
const mfaConfig = require('../config/mfa.config');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const SessionService = require('../services/session.service');

const masterPool = db.promisePoolMaster;

// 1. INITIER L'ACTIVATION MFA
exports.initiateMFA = async (req, res) => {
  try {
    const clientPool = req.db;
    const userId = req.user.id;
    const email = req.user.email;

    // Verifier si la colonne existe
    const [check] = await clientPool.promise().query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'mfa_enabled'`
    );

    if (check[0].count === 0) {
      return res.status(400).json({
        success: false,
        message: 'MFA non disponible sur cette installation'
      });
    }

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

    const { secret, otpauth_url } = MFAService.generateSecret(email, mfaConfig.totp.issuer);
    const qrCode = await MFAService.generateQRCode(otpauth_url, mfaConfig.qr.width);
    const backupCodes = MFAService.generateBackupCodes(
      mfaConfig.backup.count,
      mfaConfig.backup.length
    );

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
    const clientPool = req.db;
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Le code de verification est requis'
      });
    }

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
    const clientPool = req.db;
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

exports.verifyMFALogin = async (req, res) => {
  try {
    const { token, backupCode, tempToken } = req.body;
    if (!token && !backupCode) {
      return res.status(400).json({ success: false, message: 'Le code de vérification est requis' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (!decoded.mfa_pending) throw new Error('not pending');
    } catch {
      return res.status(401).json({ success: false, message: 'Session MFA expirée, veuillez vous reconnecter' });
    }
    const userId = decoded.id;

    const [rows] = await masterPool.query(
      `SELECT u.*, e.nom AS entreprise_nom, e.statut AS entreprise_statut, e.plan_type,
              e.connexions_utilisees, e.limite_connexions_essai, e.db_name
       FROM users u LEFT JOIN entreprises e ON u.entreprise_id = e.id WHERE u.id = ?`, [userId]);
    if (!rows.length || !rows[0].mfa_enabled) {
      return res.status(400).json({ success: false, message: 'MFA non active pour ce compte' });
    }
    const user = rows[0];

    const lockStatus = MFAService.isMFALocked(user);
    if (lockStatus.locked) {
      return res.status(403).json({ success: false, message: `Compte verrouillé. Réessayez dans ${lockStatus.remainingMinutes} minute(s).` });
    }

    // --- Vérification du code (TOTP ou code de secours) ---
    let valide = false;
    let nouveauxCodes = null;
    if (token) {
      valide = MFAService.verifyToken(user.mfa_secret, token, mfaConfig.totp.window);
    } else {
      const brut = user.mfa_backup_codes;
      const codes = typeof brut === 'string' ? JSON.parse(brut) : (brut || []);
      const r = MFAService.verifyAndConsumeBackupCode(backupCode, codes);
      valide = r.valid;
      if (valide) nouveauxCodes = JSON.stringify(r.newList);
    }

    if (!valide) {
      const attempts = (user.mfa_attempts || 0) + 1;
      const max = mfaConfig.security.maxAttempts;
      const lockedUntil = attempts >= max ? new Date(Date.now() + mfaConfig.security.lockDuration * 60000) : null;
      await masterPool.query('UPDATE users SET mfa_attempts = ?, mfa_locked_until = ? WHERE id = ?',
        [attempts, lockedUntil, userId]);
      return res.status(401).json({
        success: false, message: 'Code de vérification invalide',
        attempts_remaining: Math.max(0, max - attempts), locked: !!lockedUntil, locked_until: lockedUntil
      });
    }

    await masterPool.query('UPDATE users SET mfa_attempts = 0, mfa_locked_until = NULL, last_login = NOW() WHERE id = ?', [userId]);
    const clientPool = db.getClientPool(user.entreprise_id, user.db_name);
    if (nouveauxCodes) {
      await masterPool.query('UPDATE users SET mfa_backup_codes = ? WHERE id = ?', [nouveauxCodes, userId]);
      await clientPool.promise().query('UPDATE users SET mfa_backup_codes = ? WHERE id = ?', [nouveauxCodes, userId]);
    }

    // --- Mêmes contrôles que login : statut entreprise + essai gratuit ---
    if (user.entreprise_statut !== 'actif') {
      return res.status(403).json({
        message: user.entreprise_statut === 'en_attente' ? 'Votre entreprise est en attente de validation' : 'Votre entreprise est suspendue'
      });
    }
    let essaiExpire = false, connexionsRestantes = null;
    if (user.plan_type === 'essai') {
      if (user.connexions_utilisees >= user.limite_connexions_essai) {
        essaiExpire = true; connexionsRestantes = 0;
      } else {
        const n = user.connexions_utilisees + 1;
        await masterPool.query('UPDATE entreprises SET connexions_utilisees = ? WHERE id = ?', [n, user.entreprise_id]);
        connexionsRestantes = user.limite_connexions_essai - n;
        essaiExpire = connexionsRestantes <= 0;
      }
    }

    let roleNom = 'Utilisateur';
    if (user.role_id) {
      const [r] = await clientPool.promise().query('SELECT nom FROM roles WHERE id = ?', [user.role_id]);
      if (r.length) roleNom = r[0].nom;
    }

    const finalToken = jwt.sign({
      id: user.id,
      entreprise_id: user.entreprise_id,
      role_id: user.role_id,
      is_super_admin: false,
      is_entreprise_admin: user.is_entreprise_admin || false,
      is_external: user.is_external || false,
      client_id: user.client_id || null,
      essai_expire: essaiExpire,
      db_name: user.db_name,
      mfa_verified: true
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    try {
      await SessionService.recordConnection(
        clientPool,
        { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, entreprise_nom: user.entreprise_nom },
        finalToken, req, req.body.device_info || {});
    } catch (err) {
      if (err.message === 'DEVICE_BLOCKED') {
        return res.status(403).json({ success: false, message: 'Appareil bloqué. Contactez votre administrateur.', code: 'DEVICE_BLOCKED' });
      }
      console.error('[MFA] Erreur enregistrement session:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Vérification MFA réussie',
      token: finalToken,
      user: {
        id: user.id, nom: user.nom || '', prenom: user.prenom || '', email: user.email,
        role: roleNom, entreprise: user.entreprise_nom || null,
        is_super_admin: false, is_entreprise_admin: user.is_entreprise_admin || false,
        is_external: user.is_external || false, plan_type: user.plan_type || null,
        essai_expire: essaiExpire, connexions_restantes: connexionsRestantes, mfa_enabled: true
      }
    });
  } catch (error) {
    console.error('[MFA] Erreur verification login:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la vérification MFA' });
  }
};

// 5. VERIFIER UN CODE DE SAUVEGARDE
exports.verifyBackupCode = async (req, res) => {
  try {
    const clientPool = req.db;
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

    // CORRECTION : inclure entreprise_id et db_name dans le tempToken
    const tempToken = jwt.sign(
      {
        id: userId,
        mfa_pending: true,
        backup_used: true,
        entreprise_id: req.user?.entreprise_id || null,
        db_name: req.user?.db_name || null
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
    const clientPool = req.db;
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

// 7. OBTENIR LE STATUT MFA (OPTIONNEL - NE RETOURNE JAMAIS 500)
exports.getMFAStatus = async (req, res) => {
  try {
    if (req.user?.is_super_admin) {
      return res.status(200).json({
        success: true,
        data: { enabled: false }
      });
    }

    const clientPool = req.db;
    
    if (!clientPool) {
      return res.status(200).json({
        success: true,
        data: { enabled: false }
      });
    }

    const userId = req.user.id;

    try {
      const [rows] = await clientPool.promise().query(
        'SELECT mfa_enabled FROM users WHERE id = ?',
        [userId]
      );

      res.status(200).json({
        success: true,
        data: {
          enabled: rows.length > 0 && rows[0].mfa_enabled === 1
        }
      });
    } catch (err) {
      console.warn('[MFA] Erreur requete, MFA desactive:', err.message);
      res.status(200).json({
        success: true,
        data: { enabled: false }
      });
    }

  } catch (error) {
    console.warn('[MFA] Erreur statut:', error.message);
    res.status(200).json({
      success: true,
      data: { enabled: false }
    });
  }
};

// 8. FERMER LE BANNER MFA
exports.dismissMFABanner = async (req, res) => {
  try {
    const clientPool = req.db;
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