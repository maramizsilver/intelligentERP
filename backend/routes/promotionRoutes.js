const express = require('express');
const router = express.Router();
const {
    getAllPromotions, getPromotionById, createPromotion, updatePromotion, deletePromotion, validerCodePromo
} = require('../controllers/promotionController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

router.use(authMiddleware);
router.use(checkEssaiActif);

router.get('/', checkPermission('Ventes', 'consultation'), getAllPromotions);
router.get('/:id', checkPermission('Ventes', 'consultation'), getPromotionById);
router.post('/', checkPermission('Ventes', 'creation'), createPromotion);
router.put('/:id', checkPermission('Ventes', 'modification'), updatePromotion);
router.delete('/:id', checkPermission('Ventes', 'suppression'), deletePromotion);

// Route publique pour valider un code (peut être appelée depuis le frontend sans permission spécifique)
router.post('/valider', checkPermission('Ventes', 'consultation'), validerCodePromo);

module.exports = router;