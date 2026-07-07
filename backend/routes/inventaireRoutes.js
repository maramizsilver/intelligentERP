const express = require('express');
const router = express.Router();
const {
    getAllInventaires, getInventaireById, createInventaire,
    saisirComptage, cloturerInventaire, annulerInventaire
} = require('../controllers/inventaireController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

router.use(authMiddleware);
router.use(checkEssaiActif);

router.get('/', checkPermission('Stock', 'consultation'), getAllInventaires);
router.get('/:id', checkPermission('Stock', 'consultation'), getInventaireById);
router.post('/', checkPermission('Stock', 'creation'), createInventaire);
router.put('/:id/comptage', checkPermission('Stock', 'modification'), saisirComptage);
router.put('/:id/cloturer', checkPermission('Stock', 'validation'), cloturerInventaire);
router.put('/:id/annuler', checkPermission('Stock', 'modification'), annulerInventaire);

module.exports = router;
