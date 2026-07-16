const express = require('express');
const router = express.Router();
const {
    getAllAchats, getAchatById, createAchat, recevoirAchat, deleteAchat
} = require('../controllers/achatController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

router.get('/', checkPermission('Achats', 'consultation'), getAllAchats);
router.get('/:id', checkPermission('Achats', 'consultation'), getAchatById);
router.post('/', checkPermission('Achats', 'creation'), createAchat);
router.put('/:id/recevoir', checkPermission('Achats', 'modification'), recevoirAchat);
router.delete('/:id', checkPermission('Achats', 'suppression'), deleteAchat);

module.exports = router;