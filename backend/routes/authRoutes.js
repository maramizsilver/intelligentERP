const express = require('express');
const router = express.Router();
const {
  registerEntreprise, login, getMe, updateMe, getMesPermissions, getUsersEntreprise,
  updateUserRole, createUserByAdmin, createExternalUser
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

// Routes publiques
router.post('/register-entreprise', registerEntreprise); // inscription d'une nouvelle entreprise (SaaS)
router.post('/login', login);                             // login unique email + mot de passe

// Route protégée : utilisateur courant
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.get('/mes-permissions', authMiddleware, getMesPermissions);

// Admin Entreprise uniquement (module "Utilisateurs")
router.get('/users', authMiddleware, checkPermission('Utilisateurs', 'consultation'), getUsersEntreprise);
router.post('/users', authMiddleware, checkPermission('Utilisateurs', 'creation'), createUserByAdmin);
router.post('/users/externes', authMiddleware, checkPermission('Utilisateurs', 'creation'), createExternalUser);
router.put('/users/:id/role', authMiddleware, checkPermission('Utilisateurs', 'modification'), updateUserRole);

module.exports = router;
