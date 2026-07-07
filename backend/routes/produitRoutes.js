const express = require('express');
const router = express.Router();
const {
  getAllProduits, getProduitById, createProduit, updateProduit, deleteProduit
} = require('../controllers/produitController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

router.use(authMiddleware);
router.use(checkEssaiActif);

router.get('/', checkPermission('Stock', 'consultation'), getAllProduits);
router.get('/:id', checkPermission('Stock', 'consultation'), getProduitById);
router.post('/', checkPermission('Stock', 'creation'), createProduit);
router.put('/:id', checkPermission('Stock', 'modification'), updateProduit);
router.delete('/:id', checkPermission('Stock', 'suppression'), deleteProduit);

module.exports = router;
