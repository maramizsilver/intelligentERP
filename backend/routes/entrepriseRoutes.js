const express = require('express');
const router = express.Router();
const {
  getAllEntreprises, getEntrepriseById, validerEntreprise, suspendreEntreprise,
  passerEnPayant, deleteEntreprise, reparerPermissions
} = require('../controllers/entrepriseController');
const authMiddleware = require('../middleware/authMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');

router.use(authMiddleware);
router.use(superAdminMiddleware);   //: sinon tout utilisateur connecté pouvait supprimer une entreprise

router.get('/', getAllEntreprises);
router.get('/:id', getEntrepriseById);
router.put('/:id/valider', validerEntreprise);
router.put('/:id/suspendre', suspendreEntreprise);
router.put('/:id/passer-payant', passerEnPayant);
router.delete('/:id', deleteEntreprise);
router.post('/:id/reparer-permissions', reparerPermissions);

module.exports = router;