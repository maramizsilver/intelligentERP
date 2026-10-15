const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { staffEntrepriseSeulement } = require('../middleware/accessGuards.middleware');

router.use(authMiddleware);
router.use(staffEntrepriseSeulement);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

router.get('/', checkPermission('Finance', 'consultation'), analyticsController.getAnalytics);

module.exports = router;