const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const { staffEntrepriseSeulement, adminEntrepriseSeulement } = require('../middleware/accessGuards.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

router.use(authMiddleware);
router.use(staffEntrepriseSeulement);
router.use(tenantMiddleware);

// Outils de test : admin uniquement + limités (sinon relais de spam/phishing depuis votre domaine)
router.post('/test', adminEntrepriseSeulement, apiLimiter, notificationController.testNotification);
router.post('/login-alert', adminEntrepriseSeulement, apiLimiter, notificationController.sendLoginAlert);
router.post('/test-canal', adminEntrepriseSeulement, apiLimiter, notificationController.testCanal);

router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;