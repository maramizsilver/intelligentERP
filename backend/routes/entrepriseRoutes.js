const express = require('express');
const router = express.Router();
const {
  getAllEntreprises, validerEntreprise, suspendreEntreprise, passerEnPayant
} = require('../controllers/entrepriseController');
const authMiddleware = require('../middleware/authMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');

router.use(authMiddleware, superAdminMiddleware);

router.get('/', getAllEntreprises);
router.put('/:id/valider', validerEntreprise);
router.put('/:id/suspendre', suspendreEntreprise);
router.put('/:id/passer-payant', passerEnPayant);

module.exports = router;
