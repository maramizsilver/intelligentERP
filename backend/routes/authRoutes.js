// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerEntreprise, login, getMe, updateMe, getMesPermissions, getUsersEntreprise,
  updateUserRole, createUserByAdmin, createExternalUser,
  deleteUser, getUserStats
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkPermission = require('../middleware/permissionMiddleware');

// Routes publiques
router.post('/register-entreprise', registerEntreprise);
router.post('/login', login);

// Route protégee : utilisateur courant
router.get('/me', authMiddleware, tenantMiddleware, getMe);
router.put('/me', authMiddleware, tenantMiddleware, updateMe);

router.get('/mes-permissions', authMiddleware, tenantMiddleware, getMesPermissions);

// Admin Entreprise uniquement (module "Utilisateurs")
router.get('/users/stats', authMiddleware, tenantMiddleware, checkPermission('Utilisateurs', 'consultation'), getUserStats);
router.get('/users', authMiddleware, tenantMiddleware, checkPermission('Utilisateurs', 'consultation'), getUsersEntreprise);
router.post('/users', authMiddleware, tenantMiddleware, checkPermission('Utilisateurs', 'creation'), createUserByAdmin);
router.post('/users/externes', authMiddleware, tenantMiddleware, checkPermission('Utilisateurs', 'creation'), createExternalUser);
router.put('/users/:id/role', authMiddleware, tenantMiddleware, checkPermission('Utilisateurs', 'modification'), updateUserRole);
router.delete('/users/:id', authMiddleware, tenantMiddleware, checkPermission('Utilisateurs', 'suppression'), deleteUser);

module.exports = router;