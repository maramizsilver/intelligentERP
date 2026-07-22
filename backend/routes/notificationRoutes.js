const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const tenantMiddleware = require('../middleware/tenant.middleware');

// ============================================================
// MIDDLEWARES
// ============================================================
router.use(authMiddleware);
router.use(tenantMiddleware);

// ROUTES

// Test notification
router.post('/test', notificationController.testNotification);

// Alerte de connexion
router.post('/login-alert', notificationController.sendLoginAlert);

// Preferences utilisateur
router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

// Test par canal (Email / WhatsApp)
router.post('/test-canal', notificationController.testCanal);

module.exports = router;