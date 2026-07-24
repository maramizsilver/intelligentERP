// ============================================================
// FICHIER: backend/routes/authRoutes.js
// VERSION COMPLETE AVEC MFA ET LOGOUT
// ============================================================

const express = require('express');
const router = express.Router();


// IMPORTS CONTROLEURS
const {
  registerEntreprise,
  login,
  logout,
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

// ROUTE LOGOUT (protégée)
router.post('/logout', authMiddleware, logout);

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

router.get('/mfa/status',
  authMiddleware,
  tenantMiddleware,
  getMFAStatus
);

router.post('/mfa/initiate',
  authMiddleware,
  tenantMiddleware,
  mfaActivationLimiter,
  initiateMFA
);

router.post('/mfa/activate',
  authMiddleware,
  tenantMiddleware,
  mfaActivationLimiter,
  activateMFA
);

router.post('/mfa/deactivate',
  authMiddleware,
  tenantMiddleware,
  mfaLimiter,
  deactivateMFA
);

router.post('/mfa/verify-login',
  mfaLimiter,
  verifyMFALogin
);

router.post('/mfa/verify-backup',
  authMiddleware,
  tenantMiddleware,
  mfaLimiter,
  verifyBackupCode
);

router.post('/mfa/regenerate-backup',
  authMiddleware,
  tenantMiddleware,
  mfaActivationLimiter,
  regenerateBackupCodes
);

module.exports = router;