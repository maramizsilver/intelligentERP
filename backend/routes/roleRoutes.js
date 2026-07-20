const express = require('express');
const router = express.Router();
const {
  getRoles, createRole, deleteRole,
  getModules, getPermissionsForRole, setPermission
} = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

// Appliquer les middlewares
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(checkEssaiActif);

// Routes
router.get('/', checkPermission('Utilisateurs', 'consultation'), getRoles);
router.post('/', checkPermission('Utilisateurs', 'creation'), createRole);
router.delete('/:id', checkPermission('Utilisateurs', 'suppression'), deleteRole);

router.get('/modules/liste', checkPermission('Utilisateurs', 'consultation'), getModules);
router.get('/:role_id/permissions', checkPermission('Utilisateurs', 'consultation'), getPermissionsForRole);
router.put('/:role_id/permissions', checkPermission('Utilisateurs', 'modification'), setPermission);

module.exports = router;