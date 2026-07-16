const express = require('express');
const router = express.Router();
const {
    getMouvementsByProduit, getAlertesRupture, ajusterStock
} = require('../controllers/mouvementstockController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);
router.get('/produit/:produit_id', checkPermission('Stock', 'consultation'), getMouvementsByProduit);
router.get('/alertes/rupture', checkPermission('Stock', 'consultation'), getAlertesRupture);
router.post('/ajuster', checkPermission('Stock', 'modification'), ajusterStock);

module.exports = router;