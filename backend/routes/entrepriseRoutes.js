const express = require('express');
const router = express.Router();
const {
  getAllEntreprises,
  getEntrepriseById,
  validerEntreprise,
  suspendreEntreprise,
  passerEnPayant,
  deleteEntreprise
} = require('../controllers/entrepriseController');
const authMiddleware = require('../middleware/authMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');

router.use(authMiddleware, superAdminMiddleware);

router.get('/', getAllEntreprises);
router.get('/:id', getEntrepriseById);
router.put('/:id/valider', validerEntreprise);
router.put('/:id/suspendre', suspendreEntreprise);
router.put('/:id/passer-payant', passerEnPayant);
router.delete('/:id', deleteEntreprise);

module.exports = router;