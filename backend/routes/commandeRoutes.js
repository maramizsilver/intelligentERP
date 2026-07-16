const express = require('express');
const router = express.Router();
const {
  getAllCommandes, getCommandeById, createCommande, updateCommandeStatut, deleteCommande
} = require('../controllers/commandeController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermission = require('../middleware/permissionMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

// Les utilisateurs EXTERNES (portail client) n'ont pas de role_id/permissions :
// ils ont un accès direct mais restreint à LEURS PROPRES commandes (filtré dans le contrôleur).
// Les utilisateurs INTERNES doivent avoir la permission correspondante sur le module "Ventes".
function externeOuPermission(action) {
  const permissionCheck = checkPermission('Ventes', action);
  return (req, res, next) => {
    if (req.user.is_external) return next();
    return permissionCheck(req, res, next);
  };
}

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

router.get('/', externeOuPermission('consultation'), getAllCommandes);
router.get('/:id', externeOuPermission('consultation'), getCommandeById);
router.post('/', externeOuPermission('creation'), createCommande);
router.delete('/:id', externeOuPermission('suppression'), deleteCommande);

// Changer le statut (confirmer/livrer) : réservé aux utilisateurs internes avec permission "validation"
router.put('/:id/statut', checkPermission('Ventes', 'validation'), updateCommandeStatut);

module.exports = router;
