const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentsMetierController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

router.get('/', checkPermission('Documents', 'consultation'), ctrl.getAll);
router.get('/:id', checkPermission('Documents', 'consultation'), ctrl.getById);
router.post('/', checkPermission('Documents', 'creation'), ctrl.create);
router.put('/:id/statut', checkPermission('Documents', 'modification'), ctrl.updateStatut);

module.exports = router;