const express = require('express');
const router = express.Router();
const {
  getAllFournisseurs, getFournisseurById, createFournisseur, updateFournisseur, deleteFournisseur
} = require('../controllers/fournisseurController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

router.use(authMiddleware);
router.use(checkEssaiActif);

router.get('/', checkPermission('Achats', 'consultation'), getAllFournisseurs);
router.get('/:id', checkPermission('Achats', 'consultation'), getFournisseurById);
router.post('/', checkPermission('Achats', 'creation'), createFournisseur);
router.put('/:id', checkPermission('Achats', 'modification'), updateFournisseur);
router.delete('/:id', checkPermission('Achats', 'suppression'), deleteFournisseur);

module.exports = router;
