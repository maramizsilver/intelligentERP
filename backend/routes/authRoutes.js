const express = require('express');
const router = express.Router();

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

const {
  initiateMFA,
  activateMFA,
  deactivateMFA,
  verifyMFALogin,
  verifyBackupCode,
  regenerateBackupCodes,
  getMFAStatus,
  dismissMFABanner
} = require('../controllers/mfaController');

const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkPermission = require('../middleware/permissionMiddleware');
const {
  loginLimiter,
  registerLimiter,
  mfaLimiter,
  mfaActivationLimiter
} = require('../middleware/rateLimit.middleware');
const { csrfProtection } = require('../middleware/security.middleware');

router.post('/register-entreprise', registerLimiter, csrfProtection, registerEntreprise);
router.post('/login', loginLimiter, csrfProtection, login);

router.post('/logout', authMiddleware, logout);

router.get('/me', authMiddleware, tenantMiddleware, getMe);
router.put('/me', authMiddleware, tenantMiddleware, updateMe);
router.get('/mes-permissions', authMiddleware, tenantMiddleware, getMesPermissions);

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
  csrfProtection,
  activateMFA
);

router.post('/mfa/deactivate',
  authMiddleware,
  tenantMiddleware,
  mfaLimiter,
  csrfProtection,
  deactivateMFA
);

router.post('/mfa/verify-login',
  mfaLimiter,
  csrfProtection,
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

router.post('/mfa/dismiss-banner',
  authMiddleware,
  tenantMiddleware,
  dismissMFABanner
);

module.exports = router;