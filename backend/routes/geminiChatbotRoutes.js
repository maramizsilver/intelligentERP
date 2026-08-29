// backend/routes/geminiChatbotRoutes.js
const express = require('express');
const router = express.Router();

const { envoyerMessage, getHistorique, viderHistorique } = require('../controllers/geminiChatbotController');
const authMiddleware = require('../middleware/authMiddleware');
const checkEssaiActif = require('../middleware/checkEssaiActif');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

router.use(authMiddleware);
router.use(checkEssaiActif);

// Réservé au staff interne (mêmes règles que le chatbot OpenAI existant)
router.use((req, res, next) => {
    if (req.user.is_super_admin || req.user.is_external) {
        return res.status(403).json({ message: "L'agent IA n'est pas disponible pour ce type de compte" });
    }
    next();
});

router.use(tenantMiddleware);

router.post('/message', apiLimiter, envoyerMessage);
router.get('/historique', getHistorique);
router.delete('/historique', viderHistorique);

module.exports = router;