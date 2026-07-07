const express = require('express');
const router = express.Router();
const {
  registerEntreprise, login, getMe, updateMe, getMesPermissions, getUsersEntreprise,
  updateUserRole, createUserByAdmin, createExternalUser,
  deleteUser, getUserStats // <-- nouveaux exports (voir authController_ajouts.js)
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');

// Routes publiques
router.post('/register-entreprise', registerEntreprise);
router.post('/login', login);

// Route protégée : utilisateur courant
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.get('/mes-permissions', authMiddleware, getMesPermissions);

// Admin Entreprise uniquement (module "Utilisateurs")
// IMPORTANT : /users/stats déclarée AVANT /users/:id (même principe déjà
// appliqué à /commandes/stats) pour qu'Express ne capture pas "stats"
// comme un :id.
router.get('/users/stats', authMiddleware, checkPermission('Utilisateurs', 'consultation'), getUserStats);

router.get('/users', authMiddleware, checkPermission('Utilisateurs', 'consultation'), getUsersEntreprise);
router.post('/users', authMiddleware, checkPermission('Utilisateurs', 'creation'), createUserByAdmin);
router.post('/users/externes', authMiddleware, checkPermission('Utilisateurs', 'creation'), createExternalUser);
router.put('/users/:id/role', authMiddleware, checkPermission('Utilisateurs', 'modification'), updateUserRole);
router.delete('/users/:id', authMiddleware, checkPermission('Utilisateurs', 'suppression'), deleteUser);

module.exports = router;
