// backend/routes/chatbotRoutes.js
const express = require('express');
const router = express.Router();

const {
    envoyerMessage,
    getHistorique,
    viderHistorique
} = require('../controllers/chatbotController');

const authMiddleware = require('../middleware/authMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);

// Les outils du chatbot interrogent des données transversales à l'entreprise
// (tous les clients, toutes les commandes...) : réservé au staff interne.
// Le SuperAdmin (pas de base tenant) et le portail client externe (qui ne
// doit voir que ses propres données) n'y ont pas accès.
router.use((req, res, next) => {
    if (req.user.is_super_admin || req.user.is_external) {
        return res.status(403).json({ message: "L'assistant IA n'est pas disponible pour ce type de compte" });
    }
    next();
});

router.use(tenantMiddleware);

// Le chatbot lui-même n'a pas de permission de module dédiée : tout
// utilisateur interne authentifié peut lui parler. En revanche, chaque outil
// qu'il appelle (chatbotTools.service.js) vérifie désormais la permission
// RBAC "consultation" du module correspondant (Stock, Ventes, Finance...)
// avant de renvoyer la moindre donnée — un utilisateur ne peut donc jamais
// voir via le chatbot une donnée qu'il n'aurait pas pu consulter via
// l'interface normale.
router.post('/message', apiLimiter, envoyerMessage);
router.get('/historique', getHistorique);
router.delete('/historique', viderHistorique);

module.exports = router;
