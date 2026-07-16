const express = require('express');
const router = express.Router();
const {
    getAllDepenses, getDepenseById, createDepense, updateDepense, deleteDepense,
    getAllRecettes, createRecette, deleteRecette,
    getAllPaiements, createPaiement, updatePaiementStatut,
    getRapportFinancier
} = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);
// IMPORTANT : routes statiques /rapport, /depenses, /recettes, /paiements
// déclarées avant toute route paramétrée /:id du même préfixe, même
// principe déjà appliqué dans authRoutes/commandeRoutes/entrepotRoutes.
router.get('/rapport', checkPermission('Finance', 'consultation'), getRapportFinancier);

// Dépenses
router.get('/depenses', checkPermission('Finance', 'consultation'), getAllDepenses);
router.get('/depenses/:id', checkPermission('Finance', 'consultation'), getDepenseById);
router.post('/depenses', checkPermission('Finance', 'creation'), createDepense);
router.put('/depenses/:id', checkPermission('Finance', 'modification'), updateDepense);
router.delete('/depenses/:id', checkPermission('Finance', 'suppression'), deleteDepense);

// Recettes
router.get('/recettes', checkPermission('Finance', 'consultation'), getAllRecettes);
router.post('/recettes', checkPermission('Finance', 'creation'), createRecette);
router.delete('/recettes/:id', checkPermission('Finance', 'suppression'), deleteRecette);

// Paiements
router.get('/paiements', checkPermission('Finance', 'consultation'), getAllPaiements);
router.post('/paiements', checkPermission('Finance', 'creation'), createPaiement);
router.put('/paiements/:id/statut', checkPermission('Finance', 'validation'), updatePaiementStatut);

module.exports = router;