const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const superAdminMiddleware = require('../middleware/superAdminMiddleware');
const superAdminController = require('../controllers/superAdminController');

// Toutes les routes nécessitent auth + superAdmin
router.use(authMiddleware);
router.use(superAdminMiddleware);

// SESSIONS
router.get('/sessions/active', superAdminController.getActiveSessions);
router.post('/sessions/:sessionId/revoke', superAdminController.revokeSession);

// CONNEXIONS
router.get('/connections/history', superAdminController.getConnectionHistory);


// APPAREILS
// 
router.post('/devices/:deviceId/block', superAdminController.blockDevice);

// ALERTES
router.get('/alerts', superAdminController.getSecurityAlerts);
router.post('/alerts/:alertId/read', superAdminController.markAlertRead);
router.post('/alerts/:alertId/resolve', superAdminController.resolveAlert);

// STATISTIQUES
router.get('/stats/security', superAdminController.getSecurityStats);

module.exports = router;