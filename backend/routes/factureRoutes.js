const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController');
const { convertirFacture } = require('../controllers/factureConversionController');

router.get('/', factureController.getAllFactures);
router.get('/:id', factureController.getFactureById);
router.post('/from-devis', factureController.createFactureFromDevis);
router.post('/from-commande', factureController.createFactureFromCommande);
router.put('/:id/statut', factureController.updateFactureStatut);
router.delete('/:id', factureController.deleteFacture);

router.post('/:id/convertir', convertirFacture);

module.exports = router;