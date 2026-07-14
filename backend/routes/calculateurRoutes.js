
const express = require('express');
const router = express.Router();
const {
  calculTauxUnique,
  calculTauxVariables,
  calculSimple
} = require('../controllers/calculateurController');
const authMiddleware = require('../middleware/authMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');

router.use(authMiddleware);
router.use(checkEssaiActif);

router.post('/taux-unique', calculTauxUnique);
router.post('/taux-variables', calculTauxVariables);
router.post('/calcul-simple', calculSimple);

module.exports = router;