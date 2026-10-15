const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController');
const { convertirFacture } = require('../controllers/factureConversionController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { staffEntrepriseSeulement } = require('../middleware/accessGuards.middleware');

router.use(authMiddleware);
router.use(staffEntrepriseSeulement);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

router.get('/', checkPermission('Ventes', 'consultation'), factureController.getAllFactures);
router.get('/:id', checkPermission('Ventes', 'consultation'), factureController.getFactureById);
router.post('/from-devis', checkPermission('Ventes', 'creation'), factureController.createFactureFromDevis);
router.post('/from-commande', checkPermission('Ventes', 'creation'), factureController.createFactureFromCommande);
router.put('/:id/statut', checkPermission('Ventes', 'validation'), factureController.updateFactureStatut);
router.delete('/:id', checkPermission('Ventes', 'suppression'), factureController.deleteFacture);
router.post('/:id/convertir', checkPermission('Ventes', 'creation'), convertirFacture);

module.exports = router;