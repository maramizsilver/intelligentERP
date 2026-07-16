const express = require('express');
const router = express.Router();
const {
    getAllPromotions, getPromotionById, createPromotion, updatePromotion, deletePromotion, validerCodePromo
} = require('../controllers/promotionController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

// ============================================================
// FIX BUG #3 : /valider était protégée par checkPermission('Ventes', 'consultation'),
// qui renvoie systématiquement 403 pour un utilisateur EXTERNE (portail client),
// car ce type de compte n'a pas de role_id/permissions (cf. permissionMiddleware :
// "Aucun rôle assigné à ce compte"). Or valider un code promo est une action
// typique du client au moment de commander. On reprend ici le même pattern
// que commandeRoutes.js (externeOuPermission) pour laisser passer les externes.
// ============================================================
function externeOuPermission(action) {
  const permissionCheck = checkPermission('Ventes', action);
  return (req, res, next) => {
    if (req.user.is_external) return next();
    return permissionCheck(req, res, next);
  };
}

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);
router.get('/', checkPermission('Ventes', 'consultation'), getAllPromotions);
router.get('/:id', checkPermission('Ventes', 'consultation'), getPromotionById);
router.post('/', checkPermission('Ventes', 'creation'), createPromotion);
router.put('/:id', checkPermission('Ventes', 'modification'), updatePromotion);
router.delete('/:id', checkPermission('Ventes', 'suppression'), deletePromotion);

// Route de validation de code : accessible aux internes avec permission
// "consultation" ET aux comptes externes (client final qui saisit un code promo)
router.post('/valider', externeOuPermission('consultation'), validerCodePromo);

module.exports = router;
