const express = require('express');
const router = express.Router();
const {
  getRoles, createRole, deleteRole, getModules, getPermissionsForRole, setPermission
} = require('../controllers/roleController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { adminEntrepriseSeulement } = require('../middleware/accessGuards.middleware');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(checkEssaiActif);

router.get('/', checkPermission('Utilisateurs', 'consultation'), getRoles);
router.get('/modules/liste', checkPermission('Utilisateurs', 'consultation'), getModules);
router.get('/:role_id/permissions', checkPermission('Utilisateurs', 'consultation'), getPermissionsForRole);

// Gérer les rôles et la matrice de permissions = admin entreprise seulement
// (sinon quelqu'un avec "Utilisateurs/modification" peut se donner tous les droits)
router.post('/', adminEntrepriseSeulement, createRole);
router.delete('/:id', adminEntrepriseSeulement, deleteRole);
router.put('/:role_id/permissions', adminEntrepriseSeulement, setPermission);

module.exports = router;