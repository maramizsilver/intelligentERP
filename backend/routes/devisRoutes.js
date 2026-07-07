const express = require('express');
const router = express.Router();
const {
    getAllDevis, getDevisById, createDevis, updateDevisStatut, devisToCommande, deleteDevis
} = require('../controllers/devisController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

router.use(authMiddleware);
router.use(checkEssaiActif);

router.get('/', checkPermission('Ventes', 'consultation'), getAllDevis);
router.get('/:id', checkPermission('Ventes', 'consultation'), getDevisById);
router.post('/', checkPermission('Ventes', 'creation'), createDevis);
router.put('/:id/statut', checkPermission('Ventes', 'validation'), updateDevisStatut);
router.post('/:id/convertir-commande', checkPermission('Ventes', 'creation'), devisToCommande);
router.delete('/:id', checkPermission('Ventes', 'suppression'), deleteDevis);

module.exports = router;