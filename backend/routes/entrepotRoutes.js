const express = require('express');
const router = express.Router();
const {
    getAllEntrepots, getEntrepotById, createEntrepot, updateEntrepot,
    deleteEntrepot, definirStockEntrepot, transfererStock
} = require('../controllers/entrepotController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

router.post('/transfert', checkPermission('Stock', 'modification'), transfererStock);

router.get('/', checkPermission('Stock', 'consultation'), getAllEntrepots);
router.get('/:id', checkPermission('Stock', 'consultation'), getEntrepotById);
router.post('/', checkPermission('Stock', 'creation'), createEntrepot);
router.put('/:id', checkPermission('Stock', 'modification'), updateEntrepot);
router.delete('/:id', checkPermission('Stock', 'suppression'), deleteEntrepot);
router.put('/:id/stock', checkPermission('Stock', 'modification'), definirStockEntrepot);

module.exports = router;