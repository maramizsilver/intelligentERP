// ============================================================
// FICHIER: backend/routes/authRoutes.js
// VERSION COMPLETE AVEC MFA
// ============================================================

const express = require('express');
const router = express.Router();


// IMPORTS CONTROLEURS
const {
  registerEntreprise,
  login,
  getMe,
  updateMe,
  getMesPermissions,
  getUsersEntreprise,
  updateUserRole,
  createUserByAdmin,
  createExternalUser,
  deleteUser,
  getUserStats
} = require('../controllers/authController');

// IMPORTS MFA
const {
  initiateMFA,
  activateMFA,
  deactivateMFA,
  verifyMFALogin,
  verifyBackupCode,
  regenerateBackupCodes,
  getMFAStatus
} = require('../controllers/mfaController');

// IMPORTS MIDDLEWARES
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkPermission = require('../middleware/permissionMiddleware');
const {
  mfaLimiter,
  mfaActivationLimiter
} = require('../middleware/rateLimit.middleware');

// ROUTES PUBLIQUES
router.post('/register-entreprise', registerEntreprise);
router.post('/login', login);

// ROUTES UTILISATEUR (protégées)

router.get('/me', authMiddleware, tenantMiddleware, getMe);
router.put('/me', authMiddleware, tenantMiddleware, updateMe);
router.get('/mes-permissions', authMiddleware, tenantMiddleware, getMesPermissions);

// ROUTES ADMIN ENTREPRISE (module "Utilisateurs")
router.get('/users/stats',
  authMiddleware,
  tenantMiddleware,
  checkPermission('Utilisateurs', 'consultation'),
  getUserStats
);

router.get('/users',
  authMiddleware,
  tenantMiddleware,
  checkPermission('Utilisateurs', 'consultation'),
  getUsersEntreprise
);

router.post('/users',
  authMiddleware,
  tenantMiddleware,
  checkPermission('Utilisateurs', 'creation'),
  createUserByAdmin
);

router.post('/users/externes',
  authMiddleware,
  tenantMiddleware,
  checkPermission('Utilisateurs', 'creation'),
  createExternalUser
);

router.put('/users/:id/role',
  authMiddleware,
  tenantMiddleware,
  checkPermission('Utilisateurs', 'modification'),
  updateUserRole
);

router.delete('/users/:id',
  authMiddleware,
  tenantMiddleware,
  checkPermission('Utilisateurs', 'suppression'),
  deleteUser
);

// ============================================================
// ROUTES MFA
// ============================================================

// 1. Obtenir le statut MFA
router.get('/mfa/status',
  authMiddleware,
  tenantMiddleware,
  getMFAStatus
);

// 2. Initier l'activation MFA (générer secret + QR Code)
router.post('/mfa/initiate',
  authMiddleware,
  tenantMiddleware,
  mfaActivationLimiter,  // 3 tentatives / heure
  initiateMFA
);

// 3. Activer MFA (vérification du code TOTP)
router.post('/mfa/activate',
  authMiddleware,
  tenantMiddleware,
  mfaActivationLimiter,  // 3 tentatives / heure
  activateMFA
);

// 4. Désactiver MFA
router.post('/mfa/deactivate',
  authMiddleware,
  tenantMiddleware,
  mfaLimiter,            // 10 tentatives / 15 minutes
  deactivateMFA
);

// 5. Vérification MFA lors du login (route publique)
router.post('/mfa/verify-login',
  mfaLimiter,            // 10 tentatives / 15 minutes
  verifyMFALogin
);

// 6. Vérifier un code de sauvegarde
router.post('/mfa/verify-backup',
  authMiddleware,
  tenantMiddleware,
  mfaLimiter,            // 10 tentatives / 15 minutes
  verifyBackupCode
);

// 7. Régénérer les codes de sauvegarde
router.post('/mfa/regenerate-backup',
  authMiddleware,
  tenantMiddleware,
  mfaActivationLimiter,  // 3 tentatives / heure
  regenerateBackupCodes
);

module.exports = router;