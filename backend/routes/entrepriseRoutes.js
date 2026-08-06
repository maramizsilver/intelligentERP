// backend/routes/entrepriseRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllEntreprises,
  getEntrepriseById,
  validerEntreprise,
  suspendreEntreprise,
  passerEnPayant,
  deleteEntreprise,
  reparerPermissions 
} = require('../controllers/entrepriseController');
const authMiddleware = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes CRUD
router.get('/', getAllEntreprises);
router.get('/:id', getEntrepriseById);
router.put('/:id/valider', validerEntreprise);
router.put('/:id/suspendre', suspendreEntreprise);
router.put('/:id/passer-payant', passerEnPayant);
router.delete('/:id', deleteEntreprise);

//  Réparer les permissions d'une entreprise
router.post('/:id/reparer-permissions', reparerPermissions);

module.exports = router;