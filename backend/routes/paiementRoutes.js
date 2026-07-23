const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.post(
  '/create',
  authMiddleware,
  tenantMiddleware,
  paiementController.createPaiement
);

router.get(
  '/verify/:sessionId',
  authMiddleware,
  tenantMiddleware,
  paiementController.verifierPaiement
);

router.post(
  '/fournisseur/create',
  authMiddleware,
  tenantMiddleware,
  paiementController.createPaiementFournisseur
);

router.post(
  '/fournisseur/confirmer',
  authMiddleware,
  tenantMiddleware,
  paiementController.confirmerPaiementFournisseur
);

router.post('/create-abonnement', paiementController.createAbonnement);
router.post('/confirmer-abonnement', paiementController.confirmerAbonnement);

module.exports = router;