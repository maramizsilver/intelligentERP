// backend/routes/calculateurRoutes.js
const express = require('express');
const router = express.Router();
const {
  calculTauxUnique,
  calculTauxVariables,
  calculTauxVariablesAuto,
  getTauxReference,
  createTauxReference,
  updateTauxReference,
  deleteTauxReference,
  getHistoriqueCalculs,
  calculSimple
} = require('../controllers/calculateurController');
const authMiddleware = require('../middleware/authMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const checkPermission = require('../middleware/permissionMiddleware');

// TOUTES LES ROUTES NÉCESSITENT AUTH + ESSAI ACTIF
router.use(authMiddleware);
router.use(checkEssaiActif);

// ROUTES DE CALCUL


// Cas n°1 : Taux unique
router.post('/taux-unique', checkPermission('Finance', 'consultation'), calculTauxUnique);

// Cas n°2 : Taux variables (manuel)
router.post('/taux-variables', checkPermission('Finance', 'consultation'), calculTauxVariables);

// Cas n°3 : Taux variables (auto depuis BDD)
router.post('/taux-variables-auto', checkPermission('Finance', 'consultation'), calculTauxVariablesAuto);

// Calcul simple (composant réutilisable)
router.post('/calcul-simple', checkPermission('Finance', 'consultation'), calculSimple);


// GESTION DES TAUX DE RÉFÉRENCE (CRUD)

// Liste des taux
router.get('/taux-reference', checkPermission('Finance', 'consultation'), getTauxReference);

// Créer un taux
router.post('/taux-reference', checkPermission('Finance', 'creation'), createTauxReference);

// Modifier un taux
router.put('/taux-reference/:id', checkPermission('Finance', 'modification'), updateTauxReference);

// Supprimer un taux
router.delete('/taux-reference/:id', checkPermission('Finance', 'suppression'), deleteTauxReference);

// HISTORIQUE

router.get('/historique', checkPermission('Finance', 'consultation'), getHistoriqueCalculs);

module.exports = router;