const express = require('express');
const router = express.Router();
const { executerAction } = require('../controllers/documentActionsController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

// POST /api/documents-actions/:type/:id/:action
// action ∈ pdf | word | excel | etiquette | email | whatsapp | sign | archive | history
router.post('/:type/:id/:action', checkPermission('Documents', 'consultation'), executerAction);

module.exports = router;