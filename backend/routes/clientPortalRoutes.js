// backend/routes/clientPortalRoutes.js
const express = require('express');
const router = express.Router();

const {
    getMesCommandes,
    getCommandeDetail,
    getMesProduits,
    getMesFactures,
    getMonProfil,
    updateMonProfil
} = require('../controllers/clientPortalController');

const authMiddleware = require('../middleware/authMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);
router.use(tenantMiddleware);

// Réservé strictement aux comptes externes (portail client)
router.use((req, res, next) => {
    if (!req.user.is_external) {
        return res.status(403).json({ message: "Cet espace est réservé aux comptes clients externes" });
    }
    next();
});

router.get('/commandes', getMesCommandes);
router.get('/commandes/:id', getCommandeDetail);
router.get('/produits', getMesProduits);
router.get('/factures', getMesFactures);
router.get('/profil', getMonProfil);
router.put('/profil', updateMonProfil);

module.exports = router;