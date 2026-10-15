const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const checkPermission = require('../middleware/permissionMiddleware');
const { staffEntrepriseSeulement } = require('../middleware/accessGuards.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

// Paiement d'une commande : clients externes ET staff (propriété vérifiée dans le contrôleur)
router.post('/create', authMiddleware, tenantMiddleware, apiLimiter, paiementController.createPaiement);
router.get('/verify/:sessionId', authMiddleware, tenantMiddleware, paiementController.verifierPaiement);

// Paiement fournisseur : staff avec droit Finance
router.post('/fournisseur/create', authMiddleware, staffEntrepriseSeulement, tenantMiddleware,
  checkPermission('Finance', 'creation'), paiementController.createPaiementFournisseur);
router.post('/fournisseur/confirmer', authMiddleware, staffEntrepriseSeulement, tenantMiddleware,
  checkPermission('Finance', 'creation'), paiementController.confirmerPaiementFournisseur);

// Abonnement : public (inscription), limité. La confirmation passe par le webhook Stripe signé (server.js).
router.post('/create-abonnement', apiLimiter, paiementController.createAbonnement);

module.exports = router;